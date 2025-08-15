import { supabase, Database } from '../lib/supabase'
import { AuthUser, Project, MeetingMinutes } from '../types'

type Tables = Database['public']['Tables']

class SupabaseApiService {
  // Authentification
  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    console.log('🔐 Tentative de connexion avec:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Erreur auth Supabase:', error)
      throw new Error(error.message)
    }
    if (!data.user) throw new Error('Aucun utilisateur trouvé')

    console.log('✅ Authentification réussie, user ID:', data.user.id)

    // Vérifier si le profil existe dans la table custom users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    let profile = userData

    if (!profile) {
      console.log('⚠️ Profil non trouvé dans users, création automatique...')
      
      // Créer automatiquement le profil dans la table custom users
      const displayName: string = (data.user.user_metadata?.full_name as string) || ''
      const [maybePrenom = '', maybeNom = ''] = displayName.split(' ')
      const insertPayload: Partial<Tables['users']['Insert']> = {
        id: data.user.id as string,
        email: data.user.email as string,
        prenom: maybePrenom || (data.user.email?.split('@')[0] as string) || 'Utilisateur',
        nom: maybeNom || 'Supabase',
        role: 'USER',
      }
      
      console.log('📝 Tentative d\'insertion du profil:', insertPayload)
      
      const { data: created, error: insertError } = await supabase
        .from('users')
        .insert(insertPayload)
        .select('*')
        .maybeSingle()
        
      if (!insertError && created) {
        console.log('✅ Profil créé avec succès')
        profile = created
      } else {
        console.warn('⚠️ Échec création profil (policies RLS probablement):', insertError?.message)
        // Fallback: utiliser les données auth.users directement
        profile = {
          id: data.user.id as string,
          email: data.user.email as string,
          prenom: insertPayload.prenom as string,
          nom: insertPayload.nom as string,
          role: 'USER',
          departement_id: null,
          fonction: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as Tables['users']['Row']
      }
    } else {
      console.log('✅ Profil trouvé dans users')
    }

    if (userError && !profile) throw new Error(userError.message)

    const authUser: AuthUser = {
      id: profile.id as string,
      email: profile.email as string,
      nom: (profile as any).nom || '',
      prenom: (profile as any).prenom || '',
      role: ((profile as any).role || 'USER') as AuthUser['role'],
      fonction: (profile as any).fonction || undefined,
      departement_id: (profile as any).departement_id || undefined,
    }

    console.log('👤 Utilisateur final:', authUser)

    return {
      user: authUser,
      token: data.session?.access_token || '',
    }
  }

  // Créer un utilisateur dans auth.users ET dans la table custom users
  async createUser(userData: {
    email: string
    password: string
    nom: string
    prenom: string
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'
    fonction?: string
    departement_id?: number
  }): Promise<{ user: AuthUser; token: string }> {
    console.log('👤 Création d\'un nouvel utilisateur:', userData.email)

    // 1. Créer l'utilisateur dans auth.users avec toutes les métadonnées
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: `${userData.prenom} ${userData.nom}`,
          nom: userData.nom,
          prenom: userData.prenom,
          role: userData.role || 'USER',
          fonction: userData.fonction,
          departement_id: userData.departement_id,
        }
      }
    })

    if (authError) {
      console.error('❌ Erreur création auth.users:', authError)
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('Échec de la création de l\'utilisateur')
    }

    console.log('✅ Utilisateur créé dans auth.users, ID:', authData.user.id)
    console.log('📋 Métadonnées créées:', authData.user.user_metadata)

    // 2. Créer le profil dans la table custom users
    const profilePayload: Tables['users']['Insert'] = {
      id: authData.user.id,
      email: userData.email,
      nom: userData.nom,
      prenom: userData.prenom,
      role: userData.role || 'USER',
      fonction: userData.fonction,
      departement_id: userData.departement_id,
    }

    console.log('📝 Création du profil dans public.users:', profilePayload)

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert(profilePayload)
      .select()
      .single()

    if (profileError) {
      console.error('❌ Erreur création profil users:', profileError)
      // On continue même si le profil échoue, on utilisera auth.users
      console.log('⚠️ Le profil sera créé automatiquement par le trigger Supabase')
    } else {
      console.log('✅ Profil créé manuellement dans users:', profile)
    }

    // 3. Ne pas utiliser l'API admin côté navigateur (nécessite une clé service non exposable)
    // La synchronisation de métadonnées sera gérée côté serveur si besoin

    // 4. Retourner l'utilisateur
    const authUser: AuthUser = {
      id: authData.user.id,
      email: userData.email,
      nom: userData.nom,
      prenom: userData.prenom,
      role: userData.role || 'USER',
      fonction: userData.fonction,
      departement_id: userData.departement_id,
    }

    console.log('👤 Utilisateur final créé:', authUser)
    return {
      user: authUser,
      token: authData.session?.access_token || '',
    }
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    console.log('🔍 Récupération du profil pour user ID:', user.id)
    console.log('📋 Métadonnées auth.users:', user.user_metadata)

    // D'abord essayer de récupérer le profil depuis la table custom users
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur récupération profil:', error)
      throw new Error(error.message)
    }

    if (!profile) {
      console.log('⚠️ Profil non trouvé dans public.users, fallback auth.users')
      // Fallback: utiliser les données auth.users directement
      const authUser: AuthUser = {
        id: user.id,
        email: user.email ?? '',
        nom: user.user_metadata?.nom || user.user_metadata?.full_name?.split(' ')[1] || '',
        prenom: user.user_metadata?.prenom || user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur',
        role: (user.user_metadata?.role as AuthUser['role']) || 'USER',
        fonction: user.user_metadata?.fonction,
        departement_id: user.user_metadata?.departement_id,
      }
      
      console.log('👤 Utilisateur fallback depuis auth.users:', authUser)
      return authUser
    }

    console.log('✅ Profil trouvé dans public.users:', profile)

    // Vérifier si les métadonnées auth.users sont synchronisées
    const authMetadata = user.user_metadata || {}
    const needsSync = (
      authMetadata.nom !== profile.nom ||
      authMetadata.prenom !== profile.prenom ||
      authMetadata.role !== profile.role ||
      authMetadata.fonction !== profile.fonction ||
      authMetadata.departement_id !== profile.departement_id
    )

    if (needsSync) {
      console.log('⚠️ Métadonnées auth.users désynchronisées, synchronisation...')
      try {
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            nom: profile.nom,
            prenom: profile.prenom,
            role: profile.role,
            fonction: profile.fonction,
            departement_id: profile.departement_id,
          }
        })
        console.log('✅ Métadonnées auth.users synchronisées')
      } catch (syncError) {
        console.warn('⚠️ Erreur synchronisation métadonnées:', syncError)
      }
    }

    const authUser: AuthUser = {
      id: profile.id as string,
      email: (profile as any).email || '',
      nom: (profile as any).nom || '',
      prenom: (profile as any).prenom || '',
      role: ((profile as any).role || 'USER') as AuthUser['role'],
      fonction: (profile as any).fonction || undefined,
      departement_id: (profile as any).departement_id || undefined,
    }

    console.log('👤 Utilisateur final:', authUser)
    return authUser
  }

  // Projets
  async getProjects(): Promise<{ projects: Project[] }> {
    console.log('🔍 Récupération des projets depuis Supabase...');

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw new Error(error.message);
    }

    console.log('📊 Données brutes reçues:', data);

    const projects = data.map(project => ({
      id: project.id,
      nom: project.nom,
      description: project.description,
      statut: project.statut as Project['statut'],
      date_debut: project.date_debut,
      date_fin: project.date_fin,
      budget: project.budget,
      created_by: project.created_by,
      created_at: project.created_at,
      updated_at: project.updated_at,
    }))

    console.log('✅ Projets convertis:', projects.length);
    return { projects }
  }

  async createProject(projectData: Omit<Tables['projects']['Insert'], 'created_by'>): Promise<{ project: Project }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non authentifié')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return {
      project: {
        id: data.id,
        nom: data.nom,
        description: data.description,
        statut: data.statut as Project['statut'],
        date_debut: data.date_debut,
        date_fin: data.date_fin,
        budget: data.budget,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    }
  }

  async updateProject(id: number, updates: Tables['projects']['Update']): Promise<{ project: Project }> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return {
      project: {
        id: data.id,
        nom: data.nom,
        description: data.description,
        statut: data.statut as Project['statut'],
        date_debut: data.date_debut,
        date_fin: data.date_fin,
        budget: data.budget,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    }
  }

  // PV de Réunion
  async getMeetingMinutes(projectId?: string): Promise<{ meetingMinutes: MeetingMinutes[] }> {
    let query = supabase
      .from('meeting_minutes')
      .select(`
        *,
        created_by_user:users!meeting_minutes_created_by_fkey(nom, prenom),
        meeting_minutes_projects(
          project_id,
          projects(id, nom)
        )
      `)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('meeting_minutes_projects.project_id', projectId)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)

    const meetingMinutes = data.map(mm => ({
      id: mm.id,
      titre: mm.titre,
      date_reunion: mm.date_reunion,
      description: mm.description,
      file_name: mm.file_name,
      file_path: mm.file_path,
      taille_fichier: mm.taille_fichier,
      created_by: mm.created_by,
      created_at: mm.created_at,
      updated_at: mm.updated_at,
      uploaded_by_nom: mm.created_by_user?.nom,
      uploaded_by_prenom: mm.created_by_user?.prenom,
      projets: mm.meeting_minutes_projects?.map(mmp => ({
        id: mmp.projects?.id,
        nom: mmp.projects?.nom,
      })) || [],
    }))

    return { meetingMinutes }
  }

  async createMeetingMinutes(
    titre: string,
    date_reunion: string,
    description: string,
    projectIds: Array<string | number>
  ): Promise<{ meetingMinutes: MeetingMinutes }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non authentifié')

    // Créer le PV
    console.log('📝 Création PV: payload', { titre, date_reunion, description });
    const { data: mmData, error: mmError } = await supabase
      .from('meeting_minutes')
      .insert({
        titre,
        date_reunion,
        description,
        file_name: `PV_${titre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        taille_fichier: Math.floor(Math.random() * 100000) + 50000,
        created_by: user.id,
      })
      .select()
      .single()

    if (mmError) {
      console.error('❌ Erreur création meeting_minutes:', mmError);
      // Exposer plus d'infos pour debug
      // @ts-expect-error SupabaseError extra fields
      console.error('code:', mmError.code, 'details:', mmError.details, 'hint:', mmError.hint);
      throw new Error(mmError.message);
    }

    // Associer aux projets
    const normalizedProjectIds = (projectIds || [])
      .map((pid) => pid)
      .filter((pid) => pid !== undefined && pid !== null && String(pid).length > 0);

    if (normalizedProjectIds.length > 0) {
      console.log('🔗 Association projets → PV:', normalizedProjectIds);
      const { error: linkError } = await supabase
        .from('meeting_minutes_projects')
        .insert(
          normalizedProjectIds.map((projectId) => ({
            meeting_minute_id: mmData.id,
            project_id: projectId,
          }))
        )

      if (linkError) {
        console.error('❌ Erreur association meeting_minutes_projects:', linkError);
        // @ts-expect-error SupabaseError extra fields
        console.error('code:', linkError.code, 'details:', linkError.details, 'hint:', linkError.hint);
        throw new Error(linkError.message);
      }
    }

    // Récupérer le PV complet avec les projets
    const { data: fullData, error: fullError } = await supabase
      .from('meeting_minutes')
      .select(`
        *,
        created_by_user:users!meeting_minutes_created_by_fkey(nom, prenom),
        meeting_minutes_projects(
          project_id,
          projects(id, nom)
        )
      `)
      .eq('id', mmData.id)
      .single()

    if (fullError) throw new Error(fullError.message)

    return {
      meetingMinutes: {
        id: fullData.id,
        titre: fullData.titre,
        date_reunion: fullData.date_reunion,
        description: fullData.description,
        file_name: fullData.file_name,
        file_path: fullData.file_path,
        taille_fichier: fullData.taille_fichier,
        created_by: fullData.created_by,
        created_at: fullData.created_at,
        updated_at: fullData.updated_at,
        uploaded_by_nom: fullData.created_by_user?.nom,
        uploaded_by_prenom: fullData.created_by_user?.prenom,
        projets: fullData.meeting_minutes_projects?.map(mmp => ({
          id: mmp.projects?.id,
          nom: mmp.projects?.nom,
        })) || [],
      }
    }
  }

  async updateMeetingMinutes(
    id: number,
    updates: Tables['meeting_minutes']['Update'],
    projectIds?: number[]
  ): Promise<{ meetingMinutes: MeetingMinutes }> {
    // Mettre à jour le PV
    const { data, error } = await supabase
      .from('meeting_minutes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Mettre à jour les associations de projets si fourni
    if (projectIds !== undefined) {
      // Supprimer les anciennes associations
      await supabase
        .from('meeting_minutes_projects')
        .delete()
        .eq('meeting_minute_id', id)

      // Ajouter les nouvelles associations
      if (projectIds.length > 0) {
        const { error: linkError } = await supabase
          .from('meeting_minutes_projects')
          .insert(
            projectIds.map(projectId => ({
              meeting_minute_id: id,
              project_id: projectId,
            }))
          )

        if (linkError) throw new Error(linkError.message)
      }
    }

    // Récupérer le PV complet
    const { data: fullData, error: fullError } = await supabase
      .from('meeting_minutes')
      .select(`
        *,
        created_by_user:users!meeting_minutes_created_by_fkey(nom, prenom),
        meeting_minutes_projects(
          project_id,
          projects(id, nom)
        )
      `)
      .eq('id', id)
      .single()

    if (fullError) throw new Error(fullError.message)

    return {
      meetingMinutes: {
        id: fullData.id,
        titre: fullData.titre,
        date_reunion: fullData.date_reunion,
        description: fullData.description,
        file_name: fullData.file_name,
        file_path: fullData.file_path,
        taille_fichier: fullData.taille_fichier,
        created_by: fullData.created_by,
        created_at: fullData.created_at,
        updated_at: fullData.updated_at,
        uploaded_by_nom: fullData.created_by_user?.nom,
        uploaded_by_prenom: fullData.created_by_user?.prenom,
        projets: fullData.meeting_minutes_projects?.map(mmp => ({
          id: mmp.projects?.id,
          nom: mmp.projects?.nom,
        })) || [],
      }
    }
  }

  async deleteMeetingMinutes(id: number): Promise<void> {
    const { error } = await supabase
      .from('meeting_minutes')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  // Notifications en temps réel
  async createNotification(userId: string, titre: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        titre,
        message,
        type,
      })

    if (error) throw new Error(error.message)
  }

  async getNotifications(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  }

  // Départements (Supabase)
  async getDepartments(): Promise<{ departments: { id: string; nom: string; description?: string; created_at: string; updated_at?: string }[] }> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('nom', { ascending: true })

    if (error) throw new Error(error.message)

    const departments = (data || []).map((d: any) => ({
      id: d.id,
      nom: d.nom,
      description: d.description ?? undefined,
      created_at: d.created_at,
      updated_at: d.updated_at ?? undefined,
    }))

    return { departments }
  }

  async createDepartment(payload: { nom: string; description?: string }): Promise<{ department: { id: string; nom: string; description?: string; created_at: string } }> {
    const { data, error } = await supabase
      .from('departments')
      .insert({
        nom: payload.nom,
        description: payload.description,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    return {
      department: {
        id: (data as any).id,
        nom: (data as any).nom,
        description: (data as any).description ?? undefined,
        created_at: (data as any).created_at,
      },
    }
  }

  async updateDepartment(id: string, payload: { nom?: string; description?: string }): Promise<{ department: { id: string; nom: string; description?: string; created_at: string } }> {
    const { data, error } = await supabase
      .from('departments')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    return {
      department: {
        id: (data as any).id,
        nom: (data as any).nom,
        description: (data as any).description ?? undefined,
        created_at: (data as any).created_at,
      },
    }
  }

  async deleteDepartment(id: string): Promise<{ message: string }> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
    return { message: 'Département supprimé avec succès' }
  }

  async markNotificationAsRead(id: number): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  // Gestion des utilisateurs
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    departement_id?: string;
    role?: string;
  }): Promise<{
    users: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select(`
        *,
        departments(nom)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filtres
    if (params?.search) {
      query = query.or(`nom.ilike.%${params.search}%,prenom.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

    if (params?.departement_id) {
      query = query.eq('departement_id', params.departement_id);
    }

    if (params?.role) {
      query = query.eq('role', params.role);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    const users = (data || []).map(user => ({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      fonction: user.fonction,
      departement_id: user.departement_id,
      departement: user.departments?.nom,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    return {
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // Charger tous les utilisateurs (pour la synchronisation)
  async getAllUsers(): Promise<{ users: any[] }> {
    console.log('🔍 Chargement de tous les utilisateurs depuis Supabase...');

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        departments(nom)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      throw new Error(error.message);
    }

    console.log('✅ Utilisateurs chargés:', data?.length || 0);

    const users = (data || []).map(user => ({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      fonction: user.fonction,
      departement_id: user.departement_id,
      departement: user.departments?.nom || 'Non assigné',
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    return { users };
  }

  // Vérifier et corriger la synchronisation entre auth.users et users
  async checkAndFixUserSync(): Promise<{ fixed: number; errors: string[] }> {
    let fixed = 0;
    const errors: string[] = [];

    try {
      console.log('🔍 Vérification de la synchronisation des utilisateurs...');

      // 1. Récupérer tous les utilisateurs auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        errors.push(`Erreur auth.users: ${authError.message}`);
        return { fixed, errors };
      }

      console.log(`📊 ${authUsers.users.length} utilisateurs trouvés dans auth.users`);

      // 2. Récupérer tous les profils
      const { data: profileUsers, error: profileError } = await supabase
        .from('users')
        .select('*');
      
      if (profileError) {
        errors.push(`Erreur public.users: ${profileError.message}`);
        return { fixed, errors };
      }

      console.log(`📊 ${profileUsers.length} profils trouvés dans public.users`);

      // 3. Créer un map des profils existants
      const profileMap = new Map(profileUsers.map(p => [p.id, p]));

      // 4. Traiter chaque utilisateur auth
      for (const authUser of authUsers.users) {
        try {
          const profile = profileMap.get(authUser.id);
          
          if (!profile) {
            // Profil manquant, le créer
            console.log(`⚠️ Profil manquant pour ${authUser.email}, création...`);
            
            const nom = authUser.user_metadata?.nom || authUser.user_metadata?.full_name?.split(' ')[1] || authUser.email?.split('@')[0] || 'Utilisateur';
            const prenom = authUser.user_metadata?.prenom || authUser.user_metadata?.full_name?.split(' ')[0] || 'Utilisateur';
            const role = authUser.user_metadata?.role || 'USER';
            const fonction = authUser.user_metadata?.fonction;
            const departement_id = authUser.user_metadata?.departement_id;

            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: authUser.id,
                email: authUser.email,
                nom,
                prenom,
                role,
                fonction,
                departement_id,
              });

            if (!insertError) {
              console.log(`✅ Profil créé pour: ${authUser.email}`);
              fixed++;
            } else {
              errors.push(`Erreur création profil pour ${authUser.email}: ${insertError.message}`);
            }
          } else {
            // Profil existe, vérifier la synchronisation des métadonnées
            const metadata = authUser.user_metadata || {};
            const needsSync = (
              metadata.nom !== profile.nom ||
              metadata.prenom !== profile.prenom ||
              metadata.role !== profile.role ||
              metadata.fonction !== profile.fonction ||
              metadata.departement_id !== profile.departement_id
            );

            if (needsSync) {
              console.log(`🔄 Synchronisation des métadonnées pour ${authUser.email}...`);
              
              try {
                await supabase.auth.admin.updateUserById(authUser.id, {
                  user_metadata: {
                    nom: profile.nom,
                    prenom: profile.prenom,
                    role: profile.role,
                    fonction: profile.fonction,
                    departement_id: profile.departement_id,
                  }
                });
                console.log(`✅ Métadonnées synchronisées pour ${authUser.email}`);
                fixed++;
              } catch (syncError) {
                errors.push(`Erreur synchronisation métadonnées pour ${authUser.email}: ${syncError instanceof Error ? syncError.message : 'Erreur inconnue'}`);
              }
            }
          }
        } catch (error) {
          errors.push(`Erreur traitement ${authUser.email}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }

      // 5. Trouver les profils orphelins (sans utilisateur auth)
      const authUserIds = new Set(authUsers.users.map(u => u.id));
      const orphanProfiles = profileUsers.filter(profileUser => !authUserIds.has(profileUser.id));
      
      if (orphanProfiles.length > 0) {
        console.log(`⚠️ ${orphanProfiles.length} profils orphelins trouvés`);
        // Optionnel : supprimer les profils orphelins
        // for (const orphan of orphanProfiles) {
        //   await supabase.from('users').delete().eq('id', orphan.id);
        // }
      }

      console.log(`✅ Synchronisation terminée. ${fixed} problèmes résolus, ${errors.length} erreurs.`);
      
    } catch (error) {
      errors.push(`Erreur générale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    return { fixed, errors };
  }

  // Subscriptions temps réel
  subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  }

  subscribeToMeetingMinutes(callback: (payload: any) => void) {
    return supabase
      .channel('meeting_minutes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_minutes',
        },
        callback
      )
      .subscribe()
  }

  // Méthodes de compatibilité avec l'ancienne API
  async getAllProjects(): Promise<{ projects: Project[] }> {
    return this.getProjects();
  }

  async getProjectMeetingMinutes(projectId: string): Promise<{ meetingMinutes: MeetingMinutes[] }> {
    return this.getMeetingMinutes(projectId);
  }

  async downloadMeetingMinutes(id: string): Promise<Blob> {
    // Pour l'instant, on simule le téléchargement
    // Dans une vraie implémentation, on utiliserait Supabase Storage
    return new Blob(['PV de réunion simulé'], { type: 'application/pdf' });
  }

  async updateUser(id: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    try {
      console.log('🔄 Mise à jour de l\'utilisateur:', id, 'avec les données:', updates);
      console.log('🔍 Type des données:', typeof updates);
      console.log('🔍 Clés des données:', Object.keys(updates));
      console.log('🔍 Données role:', updates.role);
      
      // 1. Mettre à jour la table public.users
      console.log('📝 Étape 1: Préparation du payload de mise à jour...');
      // Ne garder que les colonnes modifiables, éviter les payloads vides ou champs inconnus
      const allowedColumns = new Set(['nom', 'prenom', 'role', 'fonction', 'departement_id']);
      const sanitizedUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) continue;
        if (allowedColumns.has(key)) sanitizedUpdates[key] = value;
      }

      if (Object.keys(sanitizedUpdates).length === 0) {
        console.warn('⚠️ Aucune donnée valide à mettre à jour. Lecture et retour du profil courant.');
        const { data: current } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        return (current as unknown) as AuthUser;
      }

      // Normaliser et valider le rôle (enum côté DB)
      if (sanitizedUpdates.role) {
        const roleValue = String(sanitizedUpdates.role).toUpperCase();
        if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'].includes(roleValue)) {
          throw new Error(`Rôle invalide fourni: ${sanitizedUpdates.role as string}`);
        }
        sanitizedUpdates.role = roleValue as AuthUser['role'];
      }

      console.log('📝 Payload final envoyé à public.users:', sanitizedUpdates);
      const { data, error } = await supabase
        .from('users')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur mise à jour public.users:', error);
        console.error('❌ Code d\'erreur:', error.code);
        console.error('❌ Message d\'erreur:', error.message);
        console.error('❌ Détails:', error.details);
        console.error('❌ Hint:', error.hint);
        console.error('❌ Erreur complète:', JSON.stringify(error, null, 2));
        
        // Log des données envoyées pour debug
        console.error('🔍 Données envoyées qui ont causé l\'erreur:', updates);
        console.error('🔍 ID utilisateur cible:', id);
        
        throw error;
      }

      console.log('✅ Table public.users mise à jour avec succès');
      console.log('✅ Données retournées:', data);

      // 2. Synchroniser les métadonnées dans auth.users (via l'utilisateur connecté)
      console.log('📝 Étape 2: Synchronisation des métadonnées auth.users...');
      const metadataUpdates: any = {};
      if (updates.nom) metadataUpdates.nom = updates.nom;
      if (updates.prenom) metadataUpdates.prenom = updates.prenom;
      if (updates.role) metadataUpdates.role = updates.role;
      if (updates.fonction) metadataUpdates.fonction = updates.fonction;
      if (updates.departement_id) metadataUpdates.departement_id = updates.departement_id;

      console.log('🔍 Métadonnées à synchroniser:', metadataUpdates);
      console.log('🔍 Nombre de métadonnées:', Object.keys(metadataUpdates).length);

      if (Object.keys(metadataUpdates).length > 0) {
        console.log('🔄 Mise à jour des métadonnées auth.users:', metadataUpdates);
        
        // Utiliser l'API publique au lieu de l'API admin
        console.log('🔐 Appel de supabase.auth.updateUser...');
        const { error: authError } = await supabase.auth.updateUser({
          data: metadataUpdates
        });
        
        if (authError) {
          console.error('❌ Erreur mise à jour métadonnées auth.users:', authError);
          console.error('❌ Code d\'erreur auth:', authError.code);
          console.error('❌ Message d\'erreur auth:', authError.message);
          // Ne pas faire échouer la mise à jour si la synchronisation auth échoue
          console.warn('⚠️ Synchronisation auth.users échouée, mais public.users mise à jour');
        } else {
          console.log('✅ Métadonnées auth.users mises à jour avec succès');
        }
      } else {
        console.log('ℹ️ Aucune métadonnée à synchroniser');
      }

      // 3. Mettre à jour le mot de passe si fourni (via l'utilisateur connecté)
      if (updates.mot_de_passe) {
        console.log('🔐 Mise à jour du mot de passe...');
        const { error: passwordError } = await supabase.auth.updateUser({
          password: updates.mot_de_passe
        });
        
        if (passwordError) {
          console.warn('⚠️ Erreur mise à jour mot de passe:', passwordError);
        } else {
          console.log('✅ Mot de passe mis à jour avec succès');
        }
      }

      console.log('✅ Synchronisation complète réussie pour l\'utilisateur:', id);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }
}

export const supabaseApiService = new SupabaseApiService()
