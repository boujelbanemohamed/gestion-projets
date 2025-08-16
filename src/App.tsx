import React, { useState, useEffect } from 'react';
import { Project, User, Department, AuthUser } from './types';
import { mockProjects, mockUsers, mockDepartments } from './data/mockData';
import { AuthService } from './utils/auth';
import { PermissionService } from './utils/permissions';
import { useApi } from './hooks/useApi';
import { supabase } from './lib/supabase';
import { supabaseApiService } from './services/supabaseApi';
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import MembersManagement from './components/MembersManagement';
import DepartmentsManagement from './components/DepartmentsManagement';
import PerformanceDashboard from './components/PerformanceDashboard';
import ClosedProjectsView from './components/ClosedProjectsView';
import MeetingMinutesManagement from './components/MeetingMinutesManagement';
import AdminSettings from './components/AdminSettings';
import LoginModal from './components/LoginModal';
import UserProfileModal from './components/UserProfileModal';
import Navigation from './components/Navigation';
import SupabaseSetupButton from './components/SupabaseSetupButton';
import { useToast } from './components/Toast';

type ViewType = 'dashboard' | 'project' | 'members' | 'departments' | 'performance' | 'closed-projects' | 'admin-settings';

function App() {
  const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true' || localStorage.getItem('useMockData') === 'true'

  const [projects, setProjects] = useState<Project[]>(useMock ? mockProjects : []);
  const [users, setUsers] = useState<User[]>(useMock ? mockUsers : []);
  const [departments, setDepartments] = useState<Department[]>(useMock ? mockDepartments : []);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Hook pour les notifications toast
  const { showToast, ToastContainer } = useToast();
  const [unreadNotificationsCount] = useState(2); // Mock count for demo
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const api = useApi();

  // Charger les départements depuis l'API
  const loadDepartments = async () => {
    try {
      if (useSupabase) {
        const { departments: data } = await supabaseApiService.getDepartments();
        const converted = data.map(d => ({
          id: String(d.id),
          nom: d.nom,
          created_at: new Date(d.created_at)
        } as Department));
        setDepartments(converted);
      } else {
        const { departments: data } = await api.getDepartments();
        const converted = data.map((d: any) => ({
          id: String(d.id),
          nom: d.nom,
          created_at: new Date(d.created_at)
        } as Department));
        setDepartments(converted);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des départements:', error);
    }
  };

  // Charger les utilisateurs depuis l'API
  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      
      if (useSupabase) {
        console.log('🔄 Chargement des utilisateurs depuis Supabase...');
        const response = await supabaseApiService.getAllUsers();

        // Convertir les utilisateurs Supabase au format attendu par l'app
        const convertedUsers = response.users.map(user => ({
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          fonction: user.fonction || '',
          departement: user.departement || 'Non assigné',
          email: user.email,
          role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER',
          assigned_projects: [], // Sera géré via une table de liaison
          created_at: new Date(user.created_at || Date.now())
        }));

        console.log('✅ Utilisateurs chargés depuis Supabase:', convertedUsers.length);
        setUsers(convertedUsers);
      } else {
        // Utiliser l'API locale
        const response = await api.getUsers();
        const convertedUsers = response.users.map(user => ({
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          fonction: user.fonction || '',
          departement: user.departement || 'Non assigné',
          email: user.email,
          role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER',
          assigned_projects: user.assigned_projects || [],
          created_at: new Date(user.created_at || Date.now())
        }));
        setUsers(convertedUsers);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
      // En cas d'erreur, garder les données mockées
      setUsers(mockUsers);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Synchroniser les utilisateurs entre auth.users et users
  const syncUsers = async () => {
    if (!useSupabase) {
      alert('La synchronisation n\'est disponible qu\'avec Supabase');
      return;
    }

    try {
      setIsLoadingUsers(true);
      console.log('🔄 Synchronisation des utilisateurs...');
      
      const { fixed, errors } = await supabaseApiService.checkAndFixUserSync();
      
      if (errors.length > 0) {
        console.warn('⚠️ Erreurs lors de la synchronisation:', errors);
      }
      
      if (fixed > 0) {
        console.log(`✅ ${fixed} profils synchronisés`);
        // Recharger les utilisateurs après synchronisation
        await loadUsers();
        showToast(`${fixed} utilisateurs synchronisés avec succès`, 'success', 4000);
      } else {
        showToast('Aucune synchronisation nécessaire', 'info', 3000);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      showToast('Erreur lors de la synchronisation', 'error', 4000);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Charger les projets depuis l'API
  const loadProjects = async () => {
    try {
      console.log('🔄 Chargement des projets depuis l\'API...');
      const response = await api.getProjects();

      // Convertir les projets Supabase au format attendu par l'app
      const convertedProjects = response.projects.map(project => ({
        id: project.id.toString(),
        nom: project.nom,
        description: project.description || '',
        statut: project.statut as 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule' | 'cloture',
        date_debut: project.date_debut ? new Date(project.date_debut) : undefined,
        date_fin: project.date_fin ? new Date(project.date_fin) : undefined,
        budget_initial: project.budget || 0,
        devise: 'EUR', // Valeur par défaut
        departement: project.departement || 'Non assigné',
        created_by: project.created_by || '',
        created_at: new Date(project.created_at || Date.now()),
        updated_at: new Date(project.updated_at || Date.now()),
        taches: [], // Les tâches seront chargées séparément si nécessaire
        attachments: []
      }));

      console.log('✅ Projets chargés:', convertedProjects.length);
      setProjects(convertedProjects);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des projets:', error);
      console.log('🔄 Utilisation des données mockées...');
      // En cas d'erreur, garder les données mockées
      setProjects(mockProjects);
    }
  };

  // Check for existing authentication on app load
  useEffect(() => {
    // Si Supabase est activé, on attend la connexion réelle
    // sinon on ouvre le modal de connexion mock
    setIsLoginModalOpen(true);
  }, []);

  // Charger les utilisateurs, départements et projets quand un utilisateur se connecte
  useEffect(() => {
    if (currentUser) {
      loadUsers();
      loadDepartments();
      loadProjects();

      // Activer les subscriptions temps réel
      setupRealtimeSubscriptions();
    }
  }, [currentUser]);

  // Subscriptions temps réel pour la dynamicité complète
  const setupRealtimeSubscriptions = () => {
    console.log('🔄 Activation des subscriptions temps réel...');

    // Subscription aux changements de projets
    const projectsSubscription = api.subscribeToProjects?.((payload: any) => {
      console.log('📊 Changement projet détecté:', payload);
      // Rechargement automatique avec délai pour éviter les appels multiples
      setTimeout(() => loadProjects(), 1000);
    });

    // Subscription aux changements d'utilisateurs
    const usersSubscription = api.subscribeToUsers?.((payload: any) => {
      console.log('👥 Changement utilisateur détecté:', payload);
      setTimeout(() => loadUsers(), 1000);
    });

    // Subscription aux changements de départements
    const departmentsSubscription = api.subscribeToDepartments?.((payload: any) => {
      console.log('🏢 Changement département détecté:', payload);
      setTimeout(() => loadDepartments(), 1000);
    });

    // Cleanup des subscriptions
    return () => {
      projectsSubscription?.unsubscribe?.();
      usersSubscription?.unsubscribe?.();
      departmentsSubscription?.unsubscribe?.();
    };
  };

  // Get accessible projects based on user role
  const getAccessibleProjects = () => {
    return PermissionService.getAccessibleProjects(currentUser, projects);
  };

  // Get active projects (not closed)
  const getActiveProjects = () => {
    return getAccessibleProjects().filter(project => project.statut !== 'cloture');
  };

  // Get closed projects
  const getClosedProjects = () => {
    return getAccessibleProjects().filter(project => project.statut === 'cloture');
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProject(null);
    setCurrentView('dashboard');
    setIsLoginModalOpen(true);
  };

  const handleProfileUpdate = (updatedUser: AuthUser) => {
    setCurrentUser(updatedUser);
    // Update the user in the users array as well
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id 
        ? { ...user, ...updatedUser }
        : user
    ));
  };

  const handleCreateProject = async (projectData: {
    nom: string;
    description?: string;
    responsable_id?: string;
    budget_initial?: number;
    devise?: string;
    prestataire_externe?: string;
    nouvelles_fonctionnalites?: string;
    avantages?: string;
    departement?: string;
    dateDebut?: Date;
    dateFin?: Date;
    attachments?: File[];
  }) => {
    if (!PermissionService.hasPermission(currentUser, 'projects', 'create')) {
      showToast('Vous n\'avez pas les permissions pour créer un projet', 'error');
      return;
    }

    try {
      console.log('🚀 Création projet via API:', projectData.nom);

      // Appel API dynamique pour créer le projet
      const { project } = await api.createProject({
        nom: projectData.nom,
        description: projectData.description || '',
        statut: 'planifie',
        date_debut: projectData.dateDebut?.toISOString().split('T')[0],
        date_fin: projectData.dateFin?.toISOString().split('T')[0],
        budget: projectData.budget_initial || 0,
        created_by: currentUser!.id
      });

      console.log('✅ Projet créé avec succès:', project);

      // Recharger automatiquement la liste des projets
      await loadProjects();

      showToast('Projet créé avec succès !', 'success', 4000);

    } catch (error: any) {
      console.error('❌ Erreur création projet:', error);
      showToast(`Erreur lors de la création : ${error.message}`, 'error');
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    if (!PermissionService.hasPermission(currentUser, 'projects', 'edit')) {
      showToast('Vous n\'avez pas les permissions pour modifier ce projet', 'error');
      return;
    }

    try {
      console.log('🔄 Mise à jour projet via API:', updatedProject.id);

      // Appel API dynamique pour mettre à jour le projet
      const { project } = await api.updateProject(updatedProject.id, {
        nom: updatedProject.nom,
        description: updatedProject.description,
        statut: updatedProject.statut,
        date_debut: updatedProject.date_debut?.toISOString?.()?.split('T')[0],
        date_fin: updatedProject.date_fin?.toISOString?.()?.split('T')[0],
        budget: updatedProject.budget_initial || 0
      });

      console.log('✅ Projet mis à jour avec succès:', project);

      // Recharger automatiquement la liste des projets
      await loadProjects();

      // Mettre à jour le projet sélectionné
      setSelectedProject(updatedProject);

      showToast('Projet mis à jour avec succès !', 'success', 3000);

    } catch (error: any) {
      console.error('❌ Erreur mise à jour projet:', error);
      showToast(`Erreur lors de la mise à jour : ${error.message}`, 'error');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!PermissionService.hasPermission(currentUser, 'projects', 'delete')) {
      alert('Vous n\'avez pas les permissions pour supprimer ce projet');
      return;
    }

    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;

    const taskCount = projectToDelete.taches.length;
    const memberCount = new Set(projectToDelete.taches.flatMap(t => t.utilisateurs.map(u => u.id))).size;
    const attachmentCount = (projectToDelete.attachments?.length || 0) + 
                           projectToDelete.taches.reduce((sum, task) => sum + (task.attachments?.length || 0), 0);

    let confirmMessage = `Êtes-vous sûr de vouloir supprimer le projet "${projectToDelete.nom}" ?`;
    
    if (taskCount > 0 || memberCount > 0 || attachmentCount > 0) {
      confirmMessage += '\n\nCette action supprimera également :';
      if (taskCount > 0) {
        confirmMessage += `\n• ${taskCount} tâche${taskCount > 1 ? 's' : ''}`;
      }
      if (memberCount > 0) {
        confirmMessage += `\n• Les assignations de ${memberCount} membre${memberCount > 1 ? 's' : ''}`;
      }
      if (attachmentCount > 0) {
        confirmMessage += `\n• ${attachmentCount} pièce${attachmentCount > 1 ? 's' : ''} jointe${attachmentCount > 1 ? 's' : ''}`;
      }
      confirmMessage += '\n\nCette action est irréversible.';
    }

    if (window.confirm(confirmMessage)) {
      try {
        console.log('🗑️ Suppression projet via API:', projectId);

        // Appel API dynamique pour supprimer le projet
        await api.deleteProject(projectId);

        console.log('✅ Projet supprimé avec succès');

        // Recharger automatiquement la liste des projets
        await loadProjects();

        // If the deleted project was selected, go back to dashboard
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(null);
          setCurrentView('dashboard');
        }

        showToast('Projet supprimé avec succès !', 'success', 3000);

      } catch (error: any) {
        console.error('❌ Erreur suppression projet:', error);
        showToast(`Erreur lors de la suppression : ${error.message}`, 'error');
      }
    }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('project');
  };

  const handleCreateMember = async (memberData: Omit<User, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'members', 'create')) {
      alert('Vous n\'avez pas les permissions pour créer un membre');
      return;
    }

    try {
      console.log('👤 Création d\'un nouveau membre:', memberData.email);
      console.log('🔍 Utilisateur actuel:', currentUser);
      console.log('🔍 Rôle utilisateur:', currentUser?.role);
      console.log('🔍 Token disponible:', !!localStorage.getItem('auth_token'));

      // Vérifier si nous utilisons Supabase ou le backend
      const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';
      console.log('🔄 Mode API:', useSupabase ? 'Supabase' : 'Backend');

      let user;

      if (useSupabase) {
        // Utiliser Supabase directement pour éviter les problèmes d'authentification admin
        console.log('🗄️ Création via Supabase...');
        const result = await supabaseApiService.createUser({
          email: memberData.email,
          password: memberData.mot_de_passe || 'password123',
          nom: memberData.nom,
          prenom: memberData.prenom,
          role: memberData.role as any,
          fonction: memberData.fonction,
          departement_id: undefined
        });
        user = result.user;
      } else {
        // Utiliser l'API backend (nécessite admin)
        console.log('⚙️ Création via Backend...');
        const result = await api.createUser({
          email: memberData.email,
          password: memberData.mot_de_passe || 'password123',
          nom: memberData.nom,
          prenom: memberData.prenom,
          role: memberData.role,
          fonction: memberData.fonction,
          departement_id: undefined
        });
        user = result.user;
      }

      console.log('✅ Membre créé avec succès:', user);

      // Recharger automatiquement la liste des utilisateurs
      await loadUsers();

      showToast('Membre créé avec succès !', 'success', 4000);
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du membre:', error);
      alert(`Erreur lors de la création du membre: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleUpdateMember = async (id: string, memberData: Omit<User, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'members', 'edit')) {
      alert('Vous n\'avez pas les permissions pour modifier ce membre');
      return;
    }

    const targetUser = users.find(u => u.id === id);
    if (targetUser && !PermissionService.canManageUser(currentUser, targetUser)) {
      alert('Vous n\'avez pas les permissions pour modifier ce membre');
      return;
    }

    try {
      console.log('🔄 Mise à jour du membre:', id);
      console.log('🔍 Données à mettre à jour:', memberData);
      console.log('🔍 ID utilisateur:', id);
      console.log('🔍 Utilisateur actuel:', currentUser);
      
      // Utiliser la fonction updateUser qui synchronise les deux tables
      await supabaseApiService.updateUser(id, memberData);

      console.log('✅ Membre mis à jour avec succès');

      // Mettre à jour la liste locale
      setUsers(prev => 
        prev.map(user => 
          user.id === id ? { ...memberData, id, created_at: user.created_at } : user
        )
      );

      // Update current user if they modified their own profile
      if (currentUser && currentUser.id === id) {
        const updatedCurrentUser = { ...currentUser, ...memberData };
        setCurrentUser(updatedCurrentUser);
        AuthService.updateProfile(updatedCurrentUser);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du membre:', error);
      alert(`Erreur lors de la mise à jour du membre: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!PermissionService.hasPermission(currentUser, 'members', 'delete')) {
      alert('Vous n\'avez pas les permissions pour supprimer ce membre');
      return;
    }

    const targetUser = users.find(u => u.id === id);
    if (targetUser && !PermissionService.canManageUser(currentUser, targetUser)) {
      alert('Vous n\'avez pas les permissions pour supprimer ce membre');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ? Cette action supprimera également son compte d\'authentification.')) {
      try {
        console.log('🗑️ Suppression du membre:', id);
        
        // Supprimer de la table custom users
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('❌ Erreur suppression Supabase:', deleteError);
          throw new Error(deleteError.message);
        }

        // Supprimer de Supabase Auth (optionnel, peut être désactivé)
        try {
          const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
          if (authDeleteError) {
            console.warn('⚠️ Erreur suppression auth (peut être normal):', authDeleteError);
          }
        } catch (authError) {
          console.warn('⚠️ Impossible de supprimer de auth (peut être normal):', authError);
        }

        console.log('✅ Membre supprimé avec succès');

        // Mettre à jour la liste locale
        setUsers(prev => prev.filter(user => user.id !== id));
        
        // Remove member from all tasks
        setProjects(prev => 
          prev.map(project => ({
            ...project,
            taches: project.taches.map(task => ({
              ...task,
              utilisateurs: task.utilisateurs.filter(user => user.id !== id)
            })),
            updated_at: new Date()
          }))
        );
        
      } catch (error) {
        console.error('❌ Erreur lors de la suppression du membre:', error);
        alert(`Erreur lors de la suppression du membre: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  const handleUpdatePermissions = (memberId: string, permissions: Record<string, boolean>) => {
    if (!PermissionService.hasPermission(currentUser, 'members', 'manage_roles')) {
      alert('Vous n\'avez pas les permissions pour gérer les permissions');
      return;
    }

    // Ici on pourrait sauvegarder les permissions personnalisées
    // Pour l'instant, on met à jour seulement le rôle
    console.log('Permissions updated for member:', memberId, permissions);
  };

  const handleAssignProjects = async (memberId: string, projectIds: string[]) => {
    const targetMember = users.find(u => u.id === memberId);
    if (!targetMember) {
      alert('Membre non trouvé');
      return;
    }

    if (!PermissionService.canAssignProjectsToMember(currentUser, targetMember, projects)) {
      alert('Vous n\'avez pas les permissions pour assigner des projets à cet utilisateur');
      return;
    }

    // Verify that the current user can assign all the selected projects
    const assignableProjects = PermissionService.getAssignableProjects(currentUser, projects);
    const assignableProjectIds = assignableProjects.map(p => p.id);

    const unauthorizedProjects = projectIds.filter(id => !assignableProjectIds.includes(id));
    if (unauthorizedProjects.length > 0) {
      alert('Vous n\'avez pas les permissions pour assigner certains projets sélectionnés');
      return;
    }

    try {
      // Utiliser l'API Supabase ou locale selon la configuration
      // Pour l'instant, on met à jour seulement l'état local
      // TODO: Implémenter l'assignation de projets dans Supabase

      // Update local state
      setUsers(prev => prev.map(user =>
        user.id === memberId
          ? { ...user, assigned_projects: projectIds }
          : user
      ));
    } catch (error) {
      console.error('Error assigning projects:', error);
      alert('Erreur lors de l\'assignation des projets');
    }
  };

  const handleCreateDepartment = async (departmentData: Omit<Department, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'departments', 'create')) {
      alert('Vous n\'avez pas les permissions pour créer un département');
      return;
    }

    try {
      if (useSupabase) {
        const { department } = await supabaseApiService.createDepartment({ nom: departmentData.nom });
        const created: Department = {
          id: String(department.id),
          nom: department.nom,
          created_at: new Date(department.created_at)
        };
        setDepartments(prev => [...prev, created]);
      } else {
        const { department } = await api.createDepartment({ nom: departmentData.nom });
        const created: Department = {
          id: String(department.id),
          nom: department.nom,
          created_at: new Date(department.created_at)
        };
        setDepartments(prev => [...prev, created]);
      }
      showToast('Département créé avec succès', 'success', 3000);
    } catch (error) {
      console.error('❌ Erreur création département:', error);
      alert('Erreur lors de la création du département');
    }
  };

  const handleUpdateDepartment = async (id: string, departmentData: Omit<Department, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'departments', 'edit')) {
      alert('Vous n\'avez pas les permissions pour modifier ce département');
      return;
    }

    const oldDepartment = departments.find(d => d.id === id);
    if (!oldDepartment) return;

    try {
      let updatedName = departmentData.nom;
      if (useSupabase) {
        const { department } = await supabaseApiService.updateDepartment(id, { nom: departmentData.nom });
        updatedName = department.nom;
      } else {
        const { department } = await api.updateDepartment(id, { nom: departmentData.nom });
        updatedName = department.nom;
      }

      setDepartments(prev => 
        prev.map(dept => 
          dept.id === id ? { id, nom: updatedName, created_at: dept.created_at } : dept
        )
      );

      if (oldDepartment.nom !== updatedName) {
        setUsers(prev => 
          prev.map(user => 
            user.departement === oldDepartment.nom 
              ? { ...user, departement: updatedName }
              : user
          )
        );

        setProjects(prev => 
          prev.map(project => 
            project.departement === oldDepartment.nom 
              ? { ...project, departement: updatedName, updated_at: new Date() }
              : project
          )
        );
      }
      showToast('Département mis à jour', 'success', 3000);
    } catch (error) {
      console.error('❌ Erreur mise à jour département:', error);
      alert('Erreur lors de la mise à jour du département');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!PermissionService.hasPermission(currentUser, 'departments', 'delete')) {
      alert('Vous n\'avez pas les permissions pour supprimer ce département');
      return;
    }

    const departmentToDelete = departments.find(d => d.id === id);
    if (!departmentToDelete) return;

    const memberCount = users.filter(u => u.departement === departmentToDelete.nom).length;
    
    let confirmMessage = `Êtes-vous sûr de vouloir supprimer le département "${departmentToDelete.nom}" ?`;
    
    if (memberCount > 0) {
      confirmMessage += `\n\nCe département contient ${memberCount} membre${memberCount > 1 ? 's' : ''}. Les membres devront être réassignés.`;
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        if (useSupabase) {
          await supabaseApiService.deleteDepartment(id);
        } else {
          await api.deleteDepartment(id);
        }

        setDepartments(prev => prev.filter(dept => dept.id !== id));

        setUsers(prev => 
          prev.map(user => 
            user.departement === departmentToDelete.nom 
              ? { ...user, departement: 'Non assigné' }
              : user
          )
        );

        setProjects(prev => 
          prev.map(project => 
            project.departement === departmentToDelete.nom 
              ? { ...project, departement: undefined, updated_at: new Date() }
              : project
          )
        );
        showToast('Département supprimé', 'success', 3000);
      } catch (error) {
        console.error('❌ Erreur suppression département:', error);
        alert('Erreur lors de la suppression du département');
      }
    }
  };

  // Handle project reopening
  const handleReopenProject = (project: Project, reason?: string) => {
    if (!PermissionService.hasPermission(currentUser, 'projects', 'update')) {
      alert('Vous n\'avez pas les permissions pour réouvrir un projet');
      return;
    }

    const updatedProject = {
      ...project,
      statut: 'actif',
      date_reouverture: new Date(),
      motif_reouverture: reason,
      updated_at: new Date()
    };

    // Update the project in the projects array
    setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
    
    // Notification toast dynamique au lieu d'alerte
    showToast(`Le projet "${project.nom}" a été réouvert avec succès.`, 'success', 4000);
  };

  const handleNavigate = (view: ViewType) => {
    // Check permissions before navigation
    if (!PermissionService.canAccessPage(currentUser, view)) {
      alert('Vous n\'avez pas accès à cette page');
      return;
    }

    setCurrentView(view);
    setSelectedProject(null);
  };

  const handleBackToDashboard = () => {
    setSelectedProject(null);
    setCurrentView('dashboard');
  };

  // Show login modal if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Plateforme de Gestion de Projets</h1>
          <p className="text-gray-600 mb-8">Veuillez vous connecter pour accéder à l'application</p>
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Se connecter
            </button>
            
            {/* Bouton de configuration Supabase */}
            <div className="mt-4">
              <SupabaseSetupButton />
            </div>
          </div>
        </div>
        
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLogin}
          users={users}
        />
      </div>
    );
  }

  const accessibleProjects = getAccessibleProjects();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {currentView === 'dashboard' && (
        <Dashboard
          projects={getActiveProjects()}
          departments={departments}
          availableUsers={users}
          onCreateProject={handleCreateProject}
          onSelectProject={handleSelectProject}
          onDeleteProject={handleDeleteProject}
          onNavigateToClosedProjects={() => handleNavigate('closed-projects')}
          onNavigateToMeetingMinutes={() => handleNavigate('meeting-minutes')}
          currentUser={currentUser}
        />
      )}

      {currentView === 'closed-projects' && (
        <ClosedProjectsView
          projects={getClosedProjects()}
          departments={departments}
          availableUsers={users}
          onSelectProject={handleSelectProject}
          onBack={() => handleNavigate('dashboard')}
          currentUser={currentUser}
          onReopenProject={handleReopenProject}
        />
      )}
      
      {currentView === 'project' && selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onBack={handleBackToDashboard}
          onUpdateProject={handleUpdateProject}
          availableUsers={users}
          departments={departments}
          isReadOnly={selectedProject.statut === 'cloture'}
          currentUser={currentUser}
        />
      )}
      
             {currentView === 'members' && (
         <MembersManagement
           members={users}
           departments={departments}
           projects={projects}
           onBack={handleBackToDashboard}
           onCreateMember={handleCreateMember}
           onUpdateMember={handleUpdateMember}
           onDeleteMember={handleDeleteMember}
           onManageDepartments={() => handleNavigate('departments')}
           onUpdatePermissions={handleUpdatePermissions}
           onAssignProjects={handleAssignProjects}
           onSyncUsers={syncUsers}
           currentUser={currentUser}
           isLoading={isLoadingUsers}
         />
       )}

      {currentView === 'departments' && (
        <DepartmentsManagement
          departments={departments}
          members={users}
          onBack={() => handleNavigate('members')}
          onCreateDepartment={handleCreateDepartment}
          onUpdateDepartment={handleUpdateDepartment}
          onDeleteDepartment={handleDeleteDepartment}
          currentUser={currentUser}
        />
      )}

      {currentView === 'performance' && (
        <PerformanceDashboard
          projects={accessibleProjects}
          users={users}
          departments={departments}
        />
      )}

      {currentView === 'meeting-minutes' && (
        <MeetingMinutesManagement
          currentUser={currentUser}
          availableProjects={getActiveProjects()}
        />
      )}

      {currentView === 'admin-settings' && (
        <AdminSettings
          currentUser={currentUser}
          onBack={() => handleNavigate('dashboard')}
        />
      )}

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Container pour les notifications toast */}
      <ToastContainer />
    </div>
  );
}

export default App;