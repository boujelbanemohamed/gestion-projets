import React, { useState, useEffect } from 'react';
import { Project, User, Department } from '../types';
import { mockProjects, mockUsers, mockDepartments } from '../data/mockData';
import { PermissionService } from '../utils/permissions';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import Dashboard from './Dashboard';
import ProjectDetail from './ProjectDetail';
import MembersManagement from './MembersManagement';
import DepartmentsManagement from './DepartmentsManagement';
import AuthLoginModal from './AuthLoginModal';
import UserProfileModal from './UserProfileModal';
import CreateProjectModal from './CreateProjectModal';
import CreateMemberModal from './CreateMemberModal';
import CreateDepartmentModal from './CreateDepartmentModal';
import Navigation from './Navigation';
import PerformanceDashboard from './PerformanceDashboard';
import ClosedProjectsView from './ClosedProjectsView';
import AdminSettings from './AdminSettings';
import SupabaseSetupButton from './SupabaseSetupButton';

type ViewType = 'dashboard' | 'project' | 'members' | 'departments' | 'performance' | 'closed-projects' | 'admin-settings';

export default function AppWithAuth() {
  const { user: currentUser, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true' || localStorage.getItem('useMockData') === 'true';

  const [projects, setProjects] = useState<Project[]>(useMock ? mockProjects : []);
  const [users, setUsers] = useState<User[]>(useMock ? mockUsers : []);
  const [departments, setDepartments] = useState<Department[]>(useMock ? mockDepartments : []);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateMemberModalOpen, setIsCreateMemberModalOpen] = useState(false);
  const [isCreateDepartmentModalOpen, setIsCreateDepartmentModalOpen] = useState(false);

  // Hook pour les notifications toast
  const { showToast, ToastContainer } = useToast();
  const [unreadNotificationsCount] = useState(2);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const api = useApi();

  // Afficher le modal de connexion si pas d'utilisateur connecté
  useEffect(() => {
    if (!authLoading && !currentUser) {
      setIsLoginModalOpen(true);
    } else if (currentUser) {
      setIsLoginModalOpen(false);
    }
  }, [currentUser, authLoading]);

  // Charger les données quand l'utilisateur se connecte
  useEffect(() => {
    if (currentUser && !useMock) {
      loadUsers();
      loadDepartments();
      loadProjects();
    }
  }, [currentUser, useMock]);

  const loadUsers = async () => {
    if (useMock) return;
    
    try {
      setIsLoadingUsers(true);
      console.log('📥 Chargement des utilisateurs...');
      const { users } = await api.getUsers();
      setUsers(users);
      console.log('✅ Utilisateurs chargés:', users.length);
    } catch (error: any) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      showToast(`Erreur chargement utilisateurs: ${error.message}`, 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadDepartments = async () => {
    if (useMock) return;
    
    try {
      console.log('📥 Chargement des départements...');
      const { departments } = await api.getDepartments();
      setDepartments(departments);
      console.log('✅ Départements chargés:', departments.length);
    } catch (error: any) {
      console.error('❌ Erreur chargement départements:', error);
      showToast(`Erreur chargement départements: ${error.message}`, 'error');
    }
  };

  const loadProjects = async () => {
    if (useMock) return;
    
    try {
      console.log('📥 Chargement des projets...');
      const { projects } = await api.getProjects();
      const accessibleProjects = PermissionService.getAccessibleProjects(currentUser, projects);
      setProjects(accessibleProjects as Project[]);
      console.log('✅ Projets chargés:', accessibleProjects.length);
    } catch (error: any) {
      console.error('❌ Erreur chargement projets:', error);
      showToast(`Erreur chargement projets: ${error.message}`, 'error');
    }
  };

  // Gestion de la connexion avec le nouveau système d'auth
  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentative de connexion:', email);

      const { user, error } = await signIn(email, password);

      if (error) {
        console.error('❌ Erreur connexion:', error);
        showToast(`Erreur de connexion: ${error.message}`, 'error');
        return { user: null };
      }

      if (user) {
        console.log('✅ Connexion réussie:', user);
        showToast('Connexion réussie !', 'success');
        setIsLoginModalOpen(false);
        return { user };
      }

      return { user: null };
    } catch (error: any) {
      console.error('❌ Erreur handleLogin:', error);
      showToast(`Erreur: ${error.message}`, 'error');
      return { user: null };
    }
  };

  // Wrapper pour compatibilité avec l'ancien LoginModal
  const handleLoginWrapper = async (user: any) => {
    // Cette fonction est appelée par l'ancien LoginModal
    // Le nouveau système gère déjà la connexion via useAuth
    console.log('✅ Connexion via wrapper:', user);
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      console.log('🔐 Déconnexion...');
      await signOut();
      
      // Réinitialiser l'état
      setProjects(useMock ? mockProjects : []);
      setUsers(useMock ? mockUsers : []);
      setDepartments(useMock ? mockDepartments : []);
      setSelectedProject(null);
      setCurrentView('dashboard');
      
      showToast('Déconnexion réussie', 'success');
      console.log('✅ Déconnexion réussie');
    } catch (error: any) {
      console.error('❌ Erreur déconnexion:', error);
      showToast(`Erreur déconnexion: ${error.message}`, 'error');
    }
  };

  // Création d'un nouveau membre avec le système d'auth Supabase
  const handleCreateMember = async (memberData: {
    nom: string;
    prenom: string;
    email: string;
    role: string;
    fonction?: string;
    departement?: string;
    mot_de_passe?: string;
  }) => {
    if (!PermissionService.hasPermission(currentUser, 'users', 'create')) {
      showToast('Vous n\'avez pas les permissions pour créer un membre', 'error');
      return;
    }

    try {
      console.log('👤 Création d\'un nouveau membre via Supabase:', memberData.email);
      console.log('📋 Données membre:', {
        nom: memberData.nom,
        prenom: memberData.prenom,
        role: memberData.role,
        fonction: memberData.fonction
      });

      // Utiliser directement le système d'authentification Supabase
      const { user, error } = await signUp(
        memberData.email,
        memberData.mot_de_passe || 'password123',
        {
          nom: memberData.nom,
          prenom: memberData.prenom,
          role: memberData.role,
          fonction: memberData.fonction
        }
      );

      if (error) {
        console.error('❌ Erreur création membre Supabase:', error);
        showToast(`Erreur lors de la création: ${error.message} (Code: ${error.code || 'UNKNOWN'})`, 'error');
        return;
      }

      if (user) {
        console.log('✅ Membre créé avec succès dans Supabase:', user);

        // Recharger automatiquement la liste des utilisateurs
        await loadUsers();

        showToast('Membre créé avec succès !', 'success', 4000);
      } else {
        console.error('❌ Aucun utilisateur retourné par Supabase');
        showToast('Erreur: Aucun utilisateur créé', 'error');
      }

    } catch (error: any) {
      console.error('❌ Erreur création membre:', error);
      showToast(`Erreur lors de la création du membre: ${error.message || 'Erreur inconnue'}`, 'error');
    }
  };

  // Autres handlers (création projet, département, etc.)
  const handleCreateProject = async (projectData: any) => {
    if (!PermissionService.hasPermission(currentUser, 'projects', 'create')) {
      showToast('Vous n\'avez pas les permissions pour créer un projet', 'error');
      return;
    }

    try {
      console.log('🚀 Création projet via API:', projectData.nom);
      
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
      await loadProjects();
      showToast('Projet créé avec succès !', 'success', 4000);

    } catch (error: any) {
      console.error('❌ Erreur création projet:', error);
      showToast(`Erreur lors de la création : ${error.message}`, 'error');
    }
  };

  const handleCreateDepartment = async (departmentData: any) => {
    if (!PermissionService.hasPermission(currentUser, 'departments', 'create')) {
      showToast('Vous n\'avez pas les permissions pour créer un département', 'error');
      return;
    }

    try {
      console.log('🏢 Création département via API:', departmentData.nom);
      
      const { department } = await api.createDepartment({
        nom: departmentData.nom,
        description: departmentData.description || ''
      });

      console.log('✅ Département créé avec succès:', department);
      await loadDepartments();
      showToast('Département créé avec succès !', 'success', 4000);

    } catch (error: any) {
      console.error('❌ Erreur création département:', error);
      showToast(`Erreur lors de la création : ${error.message}`, 'error');
    }
  };

  // Affichage de chargement pendant l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Interface principale
  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser ? (
        <div className="min-h-screen bg-gray-50">
          <Navigation
            currentUser={currentUser}
            currentView={currentView}
            onNavigate={setCurrentView}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onLogout={handleLogout}
          />

          <main className="pt-16 px-6 pb-6">
              {currentView === 'dashboard' && (
                <Dashboard 
                  projects={projects}
                  users={users}
                  currentUser={currentUser}
                  onProjectSelect={(project) => {
                    setSelectedProject(project);
                    setCurrentView('project');
                  }}
                />
              )}
              
              {currentView === 'project' && selectedProject && (
                <ProjectDetail 
                  project={selectedProject}
                  users={users}
                  currentUser={currentUser}
                  onBack={() => {
                    setSelectedProject(null);
                    setCurrentView('dashboard');
                  }}
                  onUpdateProject={async (updatedProject) => {
                    // Mise à jour via API
                    await loadProjects();
                  }}
                />
              )}
              
              {currentView === 'members' && (
                <MembersManagement 
                  users={users}
                  departments={departments}
                  currentUser={currentUser}
                  isLoading={isLoadingUsers}
                  onCreateMember={() => setIsCreateMemberModalOpen(true)}
                  onUpdateMember={async () => await loadUsers()}
                  onDeleteMember={async () => await loadUsers()}
                />
              )}
              
              {currentView === 'departments' && (
                <DepartmentsManagement 
                  departments={departments}
                  currentUser={currentUser}
                  onCreateDepartment={() => setIsCreateDepartmentModalOpen(true)}
                  onUpdateDepartment={async () => await loadDepartments()}
                  onDeleteDepartment={async () => await loadDepartments()}
                />
              )}
              
              {currentView === 'performance' && (
                <PerformanceDashboard
                  projects={projects}
                  users={users}
                  departments={departments}
                />
              )}
              
              {currentView === 'closed-projects' && (
                <ClosedProjectsView 
                  projects={projects.filter(p => p.statut === 'termine' || p.statut === 'annule')}
                  currentUser={currentUser}
                  onProjectSelect={(project) => {
                    setSelectedProject(project);
                    setCurrentView('project');
                  }}
                />
              )}
              
              {currentView === 'admin-settings' && (
                <AdminSettings 
                  currentUser={currentUser}
                  users={users}
                  projects={projects}
                  departments={departments}
                />
              )}
          </main>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestion de Projets</h1>
            <p className="text-gray-600 mb-8">Connectez-vous pour accéder à l'application</p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuthLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {currentUser && (
        <>
          <UserProfileModal 
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={currentUser}
            onLogout={handleLogout}
            onProfileUpdate={async () => {
              // Rafraîchir les données utilisateur
            }}
          />

          <CreateProjectModal 
            isOpen={isCreateProjectModalOpen}
            onClose={() => setIsCreateProjectModalOpen(false)}
            onCreateProject={handleCreateProject}
            users={users}
            departments={departments}
          />

          <CreateMemberModal 
            isOpen={isCreateMemberModalOpen}
            onClose={() => setIsCreateMemberModalOpen(false)}
            onCreateMember={handleCreateMember}
            departments={departments}
          />

          <CreateDepartmentModal 
            isOpen={isCreateDepartmentModalOpen}
            onClose={() => setIsCreateDepartmentModalOpen(false)}
            onCreateDepartment={handleCreateDepartment}
          />
        </>
      )}

      {/* Setup Button pour Supabase */}
      {useSupabase && (
        <SupabaseSetupButton />
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
