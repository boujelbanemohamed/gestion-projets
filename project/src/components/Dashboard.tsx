import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, BarChart3, Calendar, Filter, Building, Clock, AlertTriangle, Folder, FileText } from 'lucide-react';
import { Project, Department, User, AuthUser, Task } from '../types';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import { isProjectApproachingDeadline, isProjectOverdue, DEFAULT_ALERT_THRESHOLD } from '../utils/alertsConfig';
import { PermissionService } from '../utils/permissions';
import LoadingBar, { useLoadingProgress, ProjectCardSkeleton } from './LoadingBar';
import { useToast } from './Toast';

interface DashboardProps {
  projects: Project[];
  departments: Department[];
  onCreateProject: (projectData: {
    nom: string;
    description?: string;
    responsable_id?: string;
    prestataire_externe?: string;
    nouvelles_fonctionnalites?: string;
    avantages?: string;
    departement?: string;
    dateDebut?: Date;
    dateFin?: Date;
    attachments?: File[];
  }) => void;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProjects: (projects: Project[]) => void; // Nouvelle prop pour mettre à jour les projets
  availableUsers: User[];
  onNavigateToClosedProjects?: () => void;
  onNavigateToMeetingMinutes?: () => void;
  currentUser?: AuthUser;
}

const Dashboard: React.FC<DashboardProps> = ({
  projects,
  departments,
  availableUsers,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
  onUpdateProjects,
  onNavigateToClosedProjects,
  onNavigateToMeetingMinutes,
  currentUser
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'date' | 'department'>('name');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterDeadline, setFilterDeadline] = useState<'all' | 'approaching' | 'overdue'>('all');
  const [alertThreshold] = useState(DEFAULT_ALERT_THRESHOLD);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  // Hooks pour le chargement avec progression
  const { isLoading, progress, message, startLoading, updateProgress, finishLoading } = useLoadingProgress();
  const { showToast, ToastContainer } = useToast();

  // Fonction de chargement global des tâches pour tous les projets
  const loadAllProjectTasks = useCallback(async () => {
    console.log('🚀 Dashboard: Chargement global des tâches pour tous les projets');
    setIsLoadingTasks(true);
    startLoading('Initialisation du chargement...');

    try {
      updateProgress(10, 'Connexion à la base de données...');
      // Récupérer toutes les tâches en une seule requête
      updateProgress(30, 'Récupération des tâches...');
      const response = await fetch('https://obdadipsbbrlwetkuyui.supabase.co/rest/v1/tasks?select=*', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODgxMjMsImV4cCI6MjA3MDA2NDEyM30.jracnTOp7Y0QBTbt7qjY4076aBqh3pq7DR-rU_U33fo'
        }
      });

      updateProgress(50, 'Traitement de la réponse...');

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const allTasks = await response.json();
      console.log('✅ Dashboard: Toutes les tâches récupérées:', allTasks.length);
      updateProgress(70, `${allTasks.length} tâches récupérées, traitement...`);

      // Grouper les tâches par projet
      const tasksByProject: { [projectId: string]: Task[] } = {};

      allTasks.forEach((supabaseTask: any) => {
        if (supabaseTask.project_id) {
          if (!tasksByProject[supabaseTask.project_id]) {
            tasksByProject[supabaseTask.project_id] = [];
          }

          // Conversion Supabase → Interface
          const convertedTask: Task = {
            id: supabaseTask.id,
            nom: supabaseTask.titre || 'Tâche sans nom',
            description: supabaseTask.description || '',
            etat: supabaseTask.statut === 'todo' ? 'non_debutee' :
                  supabaseTask.statut === 'en_cours' ? 'en_cours' :
                  supabaseTask.statut === 'termine' ? 'cloturee' : 'non_debutee',
            priorite: supabaseTask.priorite || 'medium',
            date_debut: supabaseTask.date_debut ? new Date(supabaseTask.date_debut) : undefined,
            date_fin: supabaseTask.date_fin ? new Date(supabaseTask.date_fin) : undefined,
            date_realisation: supabaseTask.date_fin ? new Date(supabaseTask.date_fin) : new Date(),
            projet_id: supabaseTask.project_id,
            utilisateurs: [],
            commentaires: [],
            history: [],
            attachments: []
          };

          tasksByProject[supabaseTask.project_id].push(convertedTask);
        }
      });

      console.log('📊 Dashboard: Tâches groupées par projet:', Object.keys(tasksByProject).length, 'projets');

      // Mettre à jour chaque projet avec ses tâches
      const updatedProjects = projects.map(project => {
        const projectTasks = tasksByProject[project.id] || [];
        console.log(`🔄 Dashboard: Projet ${project.nom} - ${projectTasks.length} tâches`);

        return {
          ...project,
          taches: projectTasks
        };
      });

      updateProgress(90, 'Mise à jour des projets...');
      console.log('✅ Dashboard: Projets mis à jour avec tâches');

      // Utiliser une référence stable pour éviter la boucle
      if (typeof onUpdateProjects === 'function') {
        onUpdateProjects(updatedProjects);
      }

      // Finalisation avec notification
      updateProgress(100, 'Chargement terminé !');
      finishLoading();

      // Notification de succès
      showToast(`Dashboard mis à jour avec ${Object.keys(tasksByProject).length} projets et ${allTasks.length} tâches`, 'success', 4000);

    } catch (error) {
      console.error('❌ Dashboard: Erreur chargement tâches globales:', error);
      finishLoading();
      showToast(`Erreur lors du chargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
    } finally {
      setIsLoadingTasks(false);
    }
  }, []); // SUPPRESSION DES DÉPENDANCES pour éviter la boucle infinie

  // Chargement initial des tâches au montage du Dashboard UNIQUEMENT
  useEffect(() => {
    console.log('🎯 Dashboard: Montage - Chargement initial des tâches');
    if (projects.length > 0 && !hasInitialLoaded && !isLoadingTasks) {
      console.log('✅ Conditions remplies pour chargement initial');
      setHasInitialLoaded(true);
      loadAllProjectTasks();
    }
  }, [projects.length, hasInitialLoaded, isLoadingTasks]); // Dépendances contrôlées

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.nom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !filterDepartment || project.departement === filterDepartment;
      
      // Deadline filter
      let matchesDeadline = true;
      if (filterDeadline === 'approaching') {
        matchesDeadline = project.date_fin ? isProjectApproachingDeadline(project.date_fin, alertThreshold) && !isProjectOverdue(project.date_fin) : false;
      } else if (filterDeadline === 'overdue') {
        matchesDeadline = project.date_fin ? isProjectOverdue(project.date_fin) : false;
      }
      
      return matchesSearch && matchesDepartment && matchesDeadline;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.nom.localeCompare(b.nom);
        case 'progress':
          const aProgress = a.taches.length > 0 ? (a.taches.filter(t => t.etat === 'cloturee').length / a.taches.length) * 100 : 0;
          const bProgress = b.taches.length > 0 ? (b.taches.filter(t => t.etat === 'cloturee').length / b.taches.length) * 100 : 0;
          return bProgress - aProgress;
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'department':
          const aDept = a.departement || 'Zzz'; // Put projects without department at the end
          const bDept = b.departement || 'Zzz';
          return aDept.localeCompare(bDept);
        default:
          return 0;
      }
    });

  const totalTasks = projects.reduce((sum, project) => sum + project.taches.length, 0);
  const completedTasks = projects.reduce((sum, project) => 
    sum + project.taches.filter(task => task.etat === 'cloturee').length, 0
  );
  
  // Count projects approaching deadline or overdue
  const approachingDeadlineCount = projects.filter(p => 
    p.date_fin && 
    isProjectApproachingDeadline(p.date_fin, alertThreshold) && 
    !isProjectOverdue(p.date_fin) &&
    p.taches.some(t => t.etat !== 'cloturee')
  ).length;
  
  const overdueCount = projects.filter(p => 
    p.date_fin && 
    isProjectOverdue(p.date_fin) &&
    p.taches.some(t => t.etat !== 'cloturee')
  ).length;
  
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, project) => {
        const projectProgress = project.taches.length > 0 
          ? (project.taches.filter(t => t.etat === 'cloturee').length / project.taches.length) * 100 
          : 0;
        return sum + projectProgress;
      }, 0) / projects.length)
    : 0;

  const availableDepartments = Array.from(new Set(projects.map(p => p.departement).filter(Boolean))).sort();

  // Mock current user for demo purposes


  const handleCreateProject = (projectData: {
    nom: string;
    description?: string;
    responsable_id?: string;
    prestataire_externe?: string;
    nouvelles_fonctionnalites?: string;
    avantages?: string;
    departement?: string;
    dateDebut?: Date;
    dateFin?: Date;
    attachments?: File[];
  }) => {
    onCreateProject(projectData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de chargement */}
      <LoadingBar
        isLoading={isLoading}
        progress={progress}
        message={message}
        showMessage={true}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-gray-600 mt-1">Gérez vos projets et suivez leur avancement</p>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-500">Affiche uniquement les projets actifs</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadAllProjectTasks}
                disabled={isLoadingTasks}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <BarChart3 size={20} />
                <span>{isLoadingTasks ? 'Chargement...' : 'Actualiser Tâches'}</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
              >
                <Plus size={20} />
                <span>Nouveau projet</span>
              </button>
              {onNavigateToClosedProjects && (
                <button
                  onClick={onNavigateToClosedProjects}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 shadow-sm"
                >
                  <Folder size={20} />
                  <span>Projets Clôturés</span>
                </button>
              )}
              {onNavigateToMeetingMinutes && PermissionService.hasPermission(currentUser, 'meeting-minutes', 'view') && (
                <button
                  onClick={onNavigateToMeetingMinutes}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-sm"
                >
                  <FileText size={20} />
                  <span>PV de Réunion</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Projets actifs</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tâches terminées</p>
                <p className="text-2xl font-bold text-gray-900">{completedTasks} / {totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progression Global du Projet</p>
                <p className="text-2xl font-bold text-gray-900">{avgProgress}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Échéance proche</p>
                <p className="text-2xl font-bold text-gray-900">{approachingDeadlineCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">En retard</p>
                <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400" size={20} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'progress' | 'date' | 'department')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Trier par nom</option>
                  <option value="progress">Trier par progression</option>
                  <option value="date">Trier par date</option>
                  <option value="department">Trier par département</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="flex items-center space-x-2">
                  <Building className="text-gray-400" size={20} />
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous les départements</option>
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                    <option value="no-department">Sans département</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="text-gray-400" size={20} />
                  <select
                    value={filterDeadline}
                    onChange={(e) => setFilterDeadline(e.target.value as 'all' | 'approaching' | 'overdue')}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les échéances</option>
                    <option value="approaching">Échéance proche ({alertThreshold} jours)</option>
                    <option value="overdue">En retard</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterDepartment ? 'Aucun projet trouvé' : 'Aucun projet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterDepartment
                ? 'Aucun projet ne correspond à vos critères de recherche'
                : 'Commencez par créer votre premier projet'
              }
            </p>
            {!searchTerm && !filterDepartment && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer un projet
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onSelectProject(project)}
                onDelete={onDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        departments={departments}
        availableUsers={availableUsers}
      />

      {/* Container pour les notifications */}
      <ToastContainer />
    </div>
  );
};

export default Dashboard;