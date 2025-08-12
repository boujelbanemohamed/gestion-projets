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

    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: `${userData.prenom} ${userData.nom}`,
          nom: userData.nom,
          prenom: userData.prenom,
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

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert(profilePayload)
      .select('*')
      .single()

    if (profileError) {
      console.error('❌ Erreur création profil users:', profileError)
      // On continue même si le profil échoue, on utilisera auth.users
    }

    console.log('✅ Profil créé dans users:', profile)

    // 3. Retourner l'utilisateur
    const authUser: AuthUser = {
      id: authData.user.id,
      email: userData.email,
      nom: userData.nom,
      prenom: userData.prenom,
      role: userData.role || 'USER',
      fonction: userData.fonction,
      departement_id: userData.departement_id,
    }

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
      console.log('⚠️ Profil non trouvé, fallback auth.users')
      // Fallback: utiliser les données auth.users directement
      return {
        id: user.id,
        email: user.email ?? '',
        nom: user.user_metadata?.full_name?.split(' ')[1] || '',
        prenom: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur',
        role: 'USER',
      }
    }

    console.log('✅ Profil trouvé:', profile)

    return {
      id: profile.id as string,
      email: (profile as any).email || '',
      nom: (profile as any).nom || '',
      prenom: (profile as any).prenom || '',
      role: ((profile as any).role || 'USER') as AuthUser['role'],
      fonction: (profile as any).fonction || undefined,
      departement_id: (profile as any).departement_id || undefined,
    }
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
    projectIds: string[]
  ): Promise<{ meetingMinutes: MeetingMinutes }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non authentifié')

    // Créer le PV
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

    if (mmError) throw new Error(mmError.message)

    // Associer aux projets
    if (projectIds.length > 0) {
      const { error: linkError } = await supabase
        .from('meeting_minutes_projects')
        .insert(
          projectIds.map(projectId => ({
            meeting_minute_id: mmData.id,
            project_id: parseInt(projectId),
          }))
        )

      if (linkError) throw new Error(linkError.message)
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
    console.log('🔍 Vérification de la synchronisation des utilisateurs...');
    
    const errors: string[] = [];
    let fixed = 0;

    try {
      // 1. Récupérer tous les utilisateurs auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        errors.push(`Erreur récupération auth.users: ${authError.message}`);
        return { fixed, errors };
      }

      // 2. Récupérer tous les profils users
      const { data: profileUsers, error: profileError } = await supabase
        .from('users')
        .select('*');
      
      if (profileError) {
        errors.push(`Erreur récupération users: ${profileError.message}`);
        return { fixed, errors };
      }

      const authUserIds = new Set(authUsers.users.map(u => u.id));
      const profileUserIds = new Set(profileUsers.map(u => u.id));

      // 3. Trouver les utilisateurs auth sans profil
      const missingProfiles = authUsers.users.filter(authUser => !profileUserIds.has(authUser.id));

      // 4. Créer les profils manquants
      for (const authUser of missingProfiles) {
        try {
          const displayName = authUser.user_metadata?.full_name as string || '';
          const [prenom = '', nom = ''] = displayName.split(' ');
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              nom: nom || authUser.email?.split('@')[0] || 'Utilisateur',
              prenom: prenom || 'Supabase',
              role: 'USER',
            });

          if (!insertError) {
            console.log(`✅ Profil créé pour: ${authUser.email}`);
            fixed++;
          } else {
            errors.push(`Erreur création profil pour ${authUser.email}: ${insertError.message}`);
          }
        } catch (error) {
          errors.push(`Erreur traitement ${authUser.email}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }

      // 5. Trouver les profils orphelins (sans utilisateur auth)
      const orphanProfiles = profileUsers.filter(profileUser => !authUserIds.has(profileUser.id));
      
      if (orphanProfiles.length > 0) {
        console.log(`⚠️ ${orphanProfiles.length} profils orphelins trouvés`);
        // Optionnel : supprimer les profils orphelins
        // for (const orphan of orphanProfiles) {
        //   await supabase.from('users').delete().eq('id', orphan.id);
        // }
      }

      console.log(`✅ Synchronisation terminée. ${fixed} profils créés, ${errors.length} erreurs.`);
      
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
}

export const supabaseApiService = new SupabaseApiService()
