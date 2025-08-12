import React, { useState, useEffect } from 'react';
import { Project, User, Department, AuthUser } from './types';
import { mockProjects, mockUsers, mockDepartments } from './data/mockData';
import { AuthService } from './utils/auth';
import { PermissionService } from './utils/permissions';
import { useApi } from './hooks/useApi';
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

type ViewType = 'dashboard' | 'project' | 'members' | 'departments' | 'performance' | 'closed-projects' | 'admin-settings';

function App() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [unreadNotificationsCount] = useState(2); // Mock count for demo
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const api = useApi();

  // Charger les utilisateurs depuis l'API
  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await api.getUsers();

      // Convertir les utilisateurs Supabase au format attendu par l'app
      const convertedUsers = response.users.map(user => ({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        fonction: user.fonction || '',
        departement: user.departement || 'Non assigné',
        email: user.email,
        role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR',
        assigned_projects: user.assigned_projects || [],
        created_at: new Date(user.created_at || Date.now())
      }));

      setUsers(convertedUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      // En cas d'erreur, garder les données mockées
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Charger les départements depuis l'API
  const loadDepartments = async () => {
    try {
      console.log('🏢 Chargement départements depuis API...');
      const response = await api.getDepartments();

      // Convertir les départements Supabase au format attendu par l'app
      const convertedDepartments = response.departments.map((dept: any) => ({
        id: dept.id,
        nom: dept.nom,
        description: dept.description || '',
        created_at: new Date(dept.created_at)
      }));

      console.log('✅ Départements chargés:', convertedDepartments.length);
      setDepartments(convertedDepartments);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des départements:', error);
      // En cas d'erreur, garder les données mockées
      setDepartments(mockDepartments);
    }
  };

  // Charger les projets depuis l'API
  const loadProjects = async () => {
    try {
      console.log('🚀 Chargement projets depuis API...');
      const response = await api.getProjects();

      // Normaliser les statuts de projets invalides
      const normalizeProjectStatus = (status: string | null) => {
        if (!status || status === '') return 'actif';

        // Mapping des anciens statuts vers les nouveaux
        const statusMap: { [key: string]: string } = {
          'planification': 'actif',
          'active': 'actif',
          'completed': 'termine',
          'closed': 'cloture',
          'suspended': 'suspendu',
          'on_hold': 'suspendu'
        };

        return statusMap[status] || status;
      };

      // Convertir les projets Supabase au format attendu par l'app
      const convertedProjects = response.projects.map((project: any) => ({
        id: project.id,
        nom: project.nom,
        description: project.description || '',
        statut: normalizeProjectStatus(project.statut),
        date_debut: project.date_debut ? new Date(project.date_debut) : undefined,
        date_fin: project.date_fin ? new Date(project.date_fin) : undefined,
        budget_initial: project.budget,
        devise: project.devise || 'EUR',
        avancement: project.avancement || 0,
        responsable_id: project.created_by,
        departement: project.departement,
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at),
        taches: []
      }));

      console.log('✅ Projets chargés:', convertedProjects.length);
      setProjects(convertedProjects);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des projets:', error);
      // En cas d'erreur, garder les données mockées
      setProjects(mockProjects);
    }
  };

  // Check for existing authentication on app load
  useEffect(() => {
    console.log('🔍 Vérification session existante...');

    // Vérifier s'il y a une session sauvegardée
    const savedSession = localStorage.getItem('sb-obdadipsbbrlwetkuyui-auth-token');
    const savedUser = localStorage.getItem('currentUser');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';

    if (savedSession && savedUser && isAuth) {
      try {
        const sessionData = JSON.parse(savedSession);
        const userData = JSON.parse(savedUser);

        // Vérifier que la session n'est pas trop ancienne (24h)
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures

        if (sessionAge < maxAge) {
          console.log('✅ Session valide trouvée:', userData.email);
          setCurrentUser(userData);
          setIsLoginModalOpen(false);
          return;
        } else {
          console.log('⏰ Session expirée, nettoyage...');
          localStorage.removeItem('sb-obdadipsbbrlwetkuyui-auth-token');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('isAuthenticated');
        }
      } catch (error) {
        console.error('❌ Erreur parsing session:', error);
        localStorage.removeItem('sb-obdadipsbbrlwetkuyui-auth-token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
      }
    }

    console.log('🔐 Aucune session valide, ouverture modal connexion');
    setIsLoginModalOpen(true);
  }, []);

  // Charger les utilisateurs, départements et projets quand un utilisateur se connecte
  useEffect(() => {
    if (currentUser) {
      loadUsers();
      loadDepartments();
      loadProjects();
    }
  }, [currentUser]);

  // Get accessible projects based on user role
  const getAccessibleProjects = () => {
    return PermissionService.getAccessibleProjects(currentUser, projects);
  };

  // Get active projects (not closed) avec diagnostic
  const getActiveProjects = () => {
    const accessibleProjects = getAccessibleProjects();
    const activeProjects = accessibleProjects.filter(project => project.statut !== 'cloture');

    console.log('🔍 getActiveProjects - Diagnostic:', {
      totalProjects: projects.length,
      accessibleProjects: accessibleProjects.length,
      activeProjects: activeProjects.length,
      projectStatuses: projects.map(p => ({ nom: p.nom, statut: p.statut }))
    });

    return activeProjects;
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
    console.log('🚪 Déconnexion utilisateur');

    // Nettoyer toutes les données de session
    localStorage.removeItem('sb-obdadipsbbrlwetkuyui-auth-token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');

    setCurrentUser(null);
    setSelectedProject(null);
    setCurrentView('dashboard');
    setIsLoginModalOpen(true);

    console.log('✅ Session nettoyée');
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
      alert('Vous n\'avez pas les permissions pour créer un projet');
      return;
    }

    try {
      console.log('🚀 Création projet via API:', projectData);

      // Appeler l'API pour créer le projet
      const createdProject = await api.createProject({
        nom: projectData.nom,
        description: projectData.description,
        statut: 'planification',
        date_debut: projectData.dateDebut?.toISOString().split('T')[0],
        date_fin: projectData.dateFin?.toISOString().split('T')[0],
        budget: projectData.budget_initial,
        devise: projectData.devise || 'EUR',
        avancement: 0
      });

      console.log('✅ Projet créé avec succès:', createdProject);

      // Ajouter le projet créé à la liste locale
      const projectId = createdProject.id || createdProject.project?.id || 'temp_' + Date.now();
      const newProject: Project = {
        id: projectId,
        nom: createdProject.nom || createdProject.project?.nom || projectData.nom,
        description: createdProject.description || createdProject.project?.description || projectData.description,
        statut: 'planification',
        date_debut: projectData.dateDebut,
        date_fin: projectData.dateFin,
        budget_initial: projectData.budget_initial,
        devise: projectData.devise || 'EUR',
        responsable_id: projectData.responsable_id,
        prestataire_externe: projectData.prestataire_externe,
        nouvelles_fonctionnalites: projectData.nouvelles_fonctionnalites,
        avantages: projectData.avantages,
        departement: projectData.departement,
        created_at: new Date(),
        updated_at: new Date(),
        taches: [],
        attachments: projectData.attachments ? projectData.attachments.map(file => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          nom: file.name,
          taille: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploaded_at: new Date(),
          uploaded_by: currentUser!
        })) : undefined
      };

      // Ajouter le projet à l'état local IMMÉDIATEMENT
      console.log('📝 Ajout du projet à l\'état local...');
      console.log('🆕 Nouveau projet à ajouter:', {
        id: newProject.id,
        nom: newProject.nom,
        statut: newProject.statut,
        description: newProject.description
      });

      setProjects(prev => {
        const updatedProjects = [...prev, newProject];
        console.log('✅ Projets mis à jour:', updatedProjects.length, 'projets total');
        console.log('📊 Liste complète des projets:', updatedProjects.map(p => ({ id: p.id, nom: p.nom, statut: p.statut })));
        return updatedProjects;
      });

      // Notification de succès
      alert('Projet créé avec succès !');

      // PAS de rechargement - laisser React gérer l'état
      console.log('✅ Projet ajouté sans rechargement - React gère l\'affichage');

    } catch (error: any) {
      console.error('❌ Erreur création projet:', error);
      alert(`Erreur lors de la création : ${error.message}`);
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    if (!PermissionService.hasPermission(currentUser, 'projects', 'edit')) {
      alert('Vous n\'avez pas les permissions pour modifier ce projet');
      return;
    }

    try {
      console.log('🔄 Modification projet via API:', updatedProject.id);

      // Appeler l'API pour modifier le projet
      await api.updateProject(updatedProject.id, {
        nom: updatedProject.nom,
        description: updatedProject.description,
        statut: updatedProject.statut,
        date_debut: updatedProject.date_debut?.toISOString().split('T')[0],
        date_fin: updatedProject.date_fin?.toISOString().split('T')[0],
        budget: updatedProject.budget_initial,
        devise: updatedProject.devise,
        avancement: updatedProject.avancement
      });

      console.log('✅ Projet modifié avec succès');

      // Mettre à jour la liste locale
      setProjects(prev =>
        prev.map(project =>
          project.id === updatedProject.id ? updatedProject : project
        )
      );
      setSelectedProject(updatedProject);

      alert('Projet modifié avec succès !');

    } catch (error: any) {
      console.error('❌ Erreur modification projet:', error);
      alert(`Erreur lors de la modification : ${error.message}`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!PermissionService.hasPermission(currentUser, 'projects', 'delete')) {
      alert('Vous n\'avez pas les permissions pour supprimer ce projet');
      return;
    }

    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;

    const taskCount = projectToDelete.taches?.length || 0;
    const memberCount = projectToDelete.taches ? new Set(projectToDelete.taches.flatMap(t => t.utilisateurs?.map(u => u.id) || [])).size : 0;
    const attachmentCount = (projectToDelete.attachments?.length || 0) +
                           (projectToDelete.taches?.reduce((sum, task) => sum + (task.attachments?.length || 0), 0) || 0);

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

        // Appeler l'API pour supprimer le projet
        await api.deleteProject(projectId);

        console.log('✅ Projet supprimé avec succès');

        // Supprimer de la liste locale
        setProjects(prev => prev.filter(project => project.id !== projectId));

        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(null);
          setCurrentView('dashboard');
        }

        alert('Projet supprimé avec succès !');

      } catch (error: any) {
        console.error('❌ Erreur suppression projet:', error);
        alert(`Erreur lors de la suppression : ${error.message}`);
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
      console.log('🚀 Création utilisateur via API:', memberData);

      // Mapper le nom du département vers son UUID
      const departmentMapping: { [key: string]: string } = {
        'IT': '62c446b9-f4c2-4448-a21a-3f9bb5e3eb35',
        'RH': '73d557ca-a5d3-5559-b32b-4a0cc6f4fc46',
        'Finance': '84e668db-b6e4-666a-c43c-5b1dd7a5ad57'
      };

      const departmentId = memberData.departement ? departmentMapping[memberData.departement] : null;

      console.log('🔄 Mapping département:', memberData.departement, '→', departmentId);

      // Appeler l'API pour créer l'utilisateur
      const createdUser = await api.createUser({
        nom: memberData.nom,
        prenom: memberData.prenom,
        email: memberData.email,
        fonction: memberData.fonction,
        role: memberData.role,
        departement_id: departmentId
      });

      console.log('✅ Utilisateur créé avec succès:', createdUser);

      // Ajouter l'utilisateur créé à la liste locale
      const newMember: User = {
        id: createdUser.id,
        nom: createdUser.nom,
        prenom: createdUser.prenom,
        email: createdUser.email,
        fonction: createdUser.fonction,
        role: createdUser.role,
        departement: createdUser.departement,
        created_at: new Date(createdUser.created_at)
      };

      setUsers(prev => [...prev, newMember]);

      // Notification de succès
      alert('Utilisateur créé avec succès !');

    } catch (error: any) {
      console.error('❌ Erreur création utilisateur:', error);
      alert(`Erreur lors de la création : ${error.message}`);
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
      console.log('🔄 Modification utilisateur via API:', id, memberData);

      // Mapper le nom du département vers son UUID
      const departmentMapping: { [key: string]: string } = {
        'IT': '62c446b9-f4c2-4448-a21a-3f9bb5e3eb35',
        'RH': '73d557ca-a5d3-5559-b32b-4a0cc6f4fc46',
        'Finance': '84e668db-b6e4-666a-c43c-5b1dd7a5ad57'
      };

      const departmentId = memberData.departement ? departmentMapping[memberData.departement] : null;

      // Appeler l'API pour modifier l'utilisateur
      const updatedUser = await api.updateUser(id, {
        nom: memberData.nom,
        prenom: memberData.prenom,
        email: memberData.email,
        fonction: memberData.fonction,
        role: memberData.role,
        departement_id: departmentId
      });

      console.log('✅ Utilisateur modifié avec succès:', updatedUser);

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

      alert('Utilisateur modifié avec succès !');

    } catch (error: any) {
      console.error('❌ Erreur modification utilisateur:', error);
      alert(`Erreur lors de la modification : ${error.message}`);
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

    try {
      console.log('🗑️ Suppression utilisateur via API:', id);

      // Appeler l'API pour supprimer l'utilisateur
      await api.deleteUser(id);

      console.log('✅ Utilisateur supprimé avec succès');

      // Supprimer de la liste locale
      setUsers(prev => prev.filter(user => user.id !== id));

      alert('Utilisateur supprimé avec succès !');

    } catch (error: any) {
      console.error('❌ Erreur suppression utilisateur:', error);
      alert(`Erreur lors de la suppression : ${error.message}`);
      return;
    }
    
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
      console.log('🏢 Création département via API:', departmentData);

      // Appeler l'API pour créer le département
      const createdDepartment = await api.createDepartment({
        nom: departmentData.nom,
        description: departmentData.description
      });

      console.log('✅ Département créé avec succès:', createdDepartment);

      // Ajouter le département créé à la liste locale
      const newDepartment: Department = {
        id: createdDepartment.id,
        nom: createdDepartment.nom,
        description: createdDepartment.description,
        created_at: new Date(createdDepartment.created_at)
      };

      setDepartments(prev => [...prev, newDepartment]);

      // Notification de succès
      alert('Département créé avec succès !');

    } catch (error: any) {
      console.error('❌ Erreur création département:', error);
      alert(`Erreur lors de la création : ${error.message}`);
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
      console.log('🔄 Modification département via API:', id, departmentData);

      // Appeler l'API pour modifier le département
      const updatedDepartment = await api.updateDepartment(id, {
        nom: departmentData.nom,
        description: departmentData.description
      });

      console.log('✅ Département modifié avec succès:', updatedDepartment);

      // Mettre à jour la liste locale
      setDepartments(prev =>
        prev.map(dept =>
          dept.id === id ? { ...departmentData, id, created_at: dept.created_at } : dept
        )
      );

      // Mettre à jour les utilisateurs si le nom du département a changé
      if (oldDepartment.nom !== departmentData.nom) {
        setUsers(prev =>
          prev.map(user =>
            user.departement === oldDepartment.nom
              ? { ...user, departement: departmentData.nom }
              : user
          )
        );

        setProjects(prev =>
          prev.map(project =>
            project.departement === oldDepartment.nom
              ? { ...project, departement: departmentData.nom, updated_at: new Date() }
              : project
          )
        );
      }

      alert('Département modifié avec succès !');

    } catch (error: any) {
      console.error('❌ Erreur modification département:', error);
      alert(`Erreur lors de la modification : ${error.message}`);
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
        console.log('🗑️ Suppression département via API:', id);

        // Appeler l'API pour supprimer le département
        await api.deleteDepartment(id);

        console.log('✅ Département supprimé avec succès');

        // Supprimer de la liste locale
        setDepartments(prev => prev.filter(dept => dept.id !== id));

        // Réassigner les utilisateurs
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

        alert('Département supprimé avec succès !');

      } catch (error: any) {
        console.error('❌ Erreur suppression département:', error);
        alert(`Erreur lors de la suppression : ${error.message}`);
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
    
    // Show success message
    alert(`Le projet "${project.nom}" a été réouvert avec succès.`);
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
          onUpdateProjects={setProjects}
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
    </div>
  );
}

export default App;