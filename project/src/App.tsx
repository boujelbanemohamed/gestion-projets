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

  // Check for existing authentication on app load
  useEffect(() => {
    // Pour Supabase, on vérifiera la session automatiquement
    // Pour l'instant, on ouvre directement le modal de connexion
    setIsLoginModalOpen(true);
  }, []);

  // Charger les utilisateurs quand un utilisateur se connecte
  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
  }, [currentUser]);

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

  const handleCreateProject = (projectData: {
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

    const newProject: Project = {
      id: Date.now().toString(),
      nom: projectData.nom,
      type_projet: projectData.type_projet,
      budget_initial: projectData.budget_initial,
      devise: projectData.devise,
      description: projectData.description,
      responsable_id: projectData.responsable_id,
      prestataire_externe: projectData.prestataire_externe,
      nouvelles_fonctionnalites: projectData.nouvelles_fonctionnalites,
      avantages: projectData.avantages,
      departement: projectData.departement,
      date_debut: projectData.dateDebut,
      date_fin: projectData.dateFin,
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
    setProjects(prev => [...prev, newProject]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    if (!PermissionService.hasPermission(currentUser, 'projects', 'edit')) {
      alert('Vous n\'avez pas les permissions pour modifier ce projet');
      return;
    }

    setProjects(prev => 
      prev.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    );
    setSelectedProject(updatedProject);
  };

  const handleDeleteProject = (projectId: string) => {
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
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(null);
        setCurrentView('dashboard');
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

      // Appeler l'API pour créer l'utilisateur
      const createdUser = await api.createUser({
        nom: memberData.nom,
        prenom: memberData.prenom,
        email: memberData.email,
        fonction: memberData.fonction,
        role: memberData.role,
        departement_id: memberData.departement
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

  const handleUpdateMember = (id: string, memberData: Omit<User, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'members', 'edit')) {
      alert('Vous n\'avez pas les permissions pour modifier ce membre');
      return;
    }

    const targetUser = users.find(u => u.id === id);
    if (targetUser && !PermissionService.canManageUser(currentUser, targetUser)) {
      alert('Vous n\'avez pas les permissions pour modifier ce membre');
      return;
    }

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
  };

  const handleDeleteMember = (id: string) => {
    if (!PermissionService.hasPermission(currentUser, 'members', 'delete')) {
      alert('Vous n\'avez pas les permissions pour supprimer ce membre');
      return;
    }

    const targetUser = users.find(u => u.id === id);
    if (targetUser && !PermissionService.canManageUser(currentUser, targetUser)) {
      alert('Vous n\'avez pas les permissions pour supprimer ce membre');
      return;
    }

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

  const handleCreateDepartment = (departmentData: Omit<Department, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'departments', 'create')) {
      alert('Vous n\'avez pas les permissions pour créer un département');
      return;
    }

    const newDepartment: Department = {
      ...departmentData,
      id: Date.now().toString(),
      created_at: new Date()
    };
    setDepartments(prev => [...prev, newDepartment]);
  };

  const handleUpdateDepartment = (id: string, departmentData: Omit<Department, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'departments', 'edit')) {
      alert('Vous n\'avez pas les permissions pour modifier ce département');
      return;
    }

    const oldDepartment = departments.find(d => d.id === id);
    if (!oldDepartment) return;

    setDepartments(prev => 
      prev.map(dept => 
        dept.id === id ? { ...departmentData, id, created_at: dept.created_at } : dept
      )
    );

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
  };

  const handleDeleteDepartment = (id: string) => {
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