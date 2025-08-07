import { supabase, Database } from '../lib/supabase'
import { AuthUser, Project, MeetingMinutes } from '../types'

type Tables = Database['public']['Tables']

class SupabaseApiService {
  // Authentification
  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Aucun utilisateur trouvé')

    // Récupérer les informations utilisateur étendues
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) throw new Error(userError.message)

    return {
      user: {
        id: userData.id,
        email: userData.email,
        nom: userData.nom,
        prenom: userData.prenom,
        role: userData.role as AuthUser['role'],
        fonction: userData.fonction,
        departement_id: userData.departement_id,
      },
      token: data.session?.access_token || '',
    }
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw new Error(error.message)

    return {
      id: userData.id,
      email: userData.email,
      nom: userData.nom,
      prenom: userData.prenom,
      role: userData.role as AuthUser['role'],
      fonction: userData.fonction,
      departement_id: userData.departement_id,
    }
  }

  // Projets
  async getProjects(): Promise<{ projects: Project[] }> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        created_by_user:users!projects_created_by_fkey(nom, prenom)
      `)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

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

    if (error) {
      console.error('Error fetching meeting minutes:', error)
      // Retourner un tableau vide en cas d'erreur au lieu de throw
      return { meetingMinutes: [] }
    }

    // Sécuriser l'accès aux données
    if (!Array.isArray(data)) {
      return { meetingMinutes: [] }
    }

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
