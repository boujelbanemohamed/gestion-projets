import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Plus, Download, Calendar, FileText, User, Users, X, Edit2, Grid3X3, List, Clock, Play, CheckCircle, Paperclip, BarChart, Star, ExternalLink, Lightbulb, TrendingUp, DollarSign, FileText as FileText2, AlertTriangle, Bell, Search } from 'lucide-react';
import { Project, Task, User as UserType, Comment, Department, ProjectAttachment, AuthUser } from '../types';
import { getProjectStats } from '../utils/calculations';
import { exportProjectToExcel } from '../utils/export';
import { exportProjectToPdf } from '../utils/pdfExport';
import { calculateBudgetSummary, formatCurrency } from '../utils/budgetCalculations';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskCommentsModal from './TaskCommentsModal';
import ProjectMembersModal from './ProjectMembersModal';
import ProjectEditModal from './ProjectEditModal';
import KanbanBoard from './KanbanBoard';
import TaskDetailsModal from './TaskDetailsModal';
import ProjectAttachmentsModal from './ProjectAttachmentsModal';
import GanttChart from './GanttChart';
import { isProjectApproachingDeadline, isProjectOverdue, getDaysUntilDeadline, getAlertMessage, getAlertSeverity, getAlertColorClasses, DEFAULT_ALERT_THRESHOLD } from '../utils/alertsConfig';
import ProjectAlertSettingsModal from './ProjectAlertSettingsModal';
import ProjectBudgetModal from './ProjectBudgetModal';
import ProjectMembersManagementModal from './ProjectMembersManagementModal';
import ProjectInfoModal from './ProjectInfoModal';
import ProjectMeetingMinutes from './ProjectMeetingMinutes';
import { useApi } from '../hooks/useApi';


interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (project: Project) => void;
  availableUsers: UserType[];
  departments: Department[];
  isReadOnly?: boolean;
  currentUser: AuthUser;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onUpdateProject, availableUsers, departments, isReadOnly = false, currentUser }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | undefined>();
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'gantt'>('kanban');
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | undefined>();
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isAlertSettingsModalOpen, setIsAlertSettingsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isMembersManagementModalOpen, setIsMembersManagementModalOpen] = useState(false);
  const [isProjectInfoModalOpen, setIsProjectInfoModalOpen] = useState(false);
  const [showMeetingMinutes, setShowMeetingMinutes] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(DEFAULT_ALERT_THRESHOLD);
  const [isCloseProjectModalOpen, setIsCloseProjectModalOpen] = useState(false);
  const [isCloseProjectAlertOpen, setIsCloseProjectAlertOpen] = useState(false);
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [alertData, setAlertData] = useState({
    isApproachingDeadline: false,
    isOverdue: false,
    daysUntilDeadline: null as number | null,
    showDeadlineAlert: false,
    alertMessage: '',
    alertSeverity: 'info' as any,
    alertColorClasses: ''
  });

  // Hook API
  const api = useApi();

  // Memoized calculations for performance
  const hasBudget = useMemo(() =>
    project.budget_initial && project.devise,
    [project.budget_initial, project.devise]
  );

  const stats = useMemo(() =>
    getProjectStats(project.taches),
    [project.taches]
  );

  // Recalculate alert data when threshold or project end date changes
  useEffect(() => {
    const calculateAlertData = () => {
      const isApproachingDeadline = project.date_fin ? isProjectApproachingDeadline(project.date_fin, alertThreshold) : false;
      const isOverdue = project.date_fin ? isProjectOverdue(project.date_fin) : false;
      const daysUntilDeadline = project.date_fin ? getDaysUntilDeadline(project.date_fin) : null;
      const showDeadlineAlert = (isApproachingDeadline || isOverdue) && project.taches.some(t => t.etat !== 'cloturee');
      const alertMessage = daysUntilDeadline !== null ? getAlertMessage(daysUntilDeadline) : '';
      const alertSeverity = daysUntilDeadline !== null ? getAlertSeverity(daysUntilDeadline) : 'info';
      const alertColorClasses = getAlertColorClasses(alertSeverity);

      setAlertData({
        isApproachingDeadline,
        isOverdue,
        daysUntilDeadline,
        showDeadlineAlert,
        alertMessage,
        alertSeverity,
        alertColorClasses
      });
    };

    calculateAlertData();
  }, [alertThreshold, project.date_fin, project.taches]);

  // Memoized budget progress calculation
  const budgetProgress = useMemo(() => {
    if (!hasBudget) return null;

    // Start with empty expenses - in real app, this would come from API
    const projectExpenses: any[] = [];

    // TODO: Replace with actual API call to get project expenses
    // const projectExpenses = await api.getProjectExpenses(project.id);

    return calculateBudgetSummary(project.budget_initial!, project.devise!, projectExpenses);
  }, [hasBudget, project.budget_initial, project.devise, project.id]);

  // Memoized project members based on user assignments
  const projectMembers = useMemo(() => {
    // Get users assigned to this project
    const assignedUsers = availableUsers.filter(user =>
      user.assigned_projects && user.assigned_projects.includes(project.id)
    );

    // Get project manager if exists and not already included
    const projectManager = project.responsable_id
      ? availableUsers.find(user => user.id === project.responsable_id)
      : null;

    const allUsers = [...assignedUsers];
    if (projectManager && !assignedUsers.some(user => user.id === projectManager.id)) {
      allUsers.push(projectManager);
    }

    return allUsers;
  }, [project.id, project.responsable_id, availableUsers]);

  // Calculate total attachments count (project + all tasks + all comments)
  const getTotalAttachmentsCount = () => {
    const projectAttachments = project.attachments?.length || 0;
    const taskAttachments = project.taches.reduce((sum, task) => sum + (task.attachments?.length || 0), 0);
    const commentAttachments = project.taches.reduce((sum, task) => 
      sum + (task.commentaires?.reduce((commentSum, comment) => 
        commentSum + (comment.attachments?.length || 0), 0) || 0), 0);
    
    return projectAttachments + taskAttachments + commentAttachments;
  };




  const filteredTasks = project.taches.filter(task => {
    // Gérer les valeurs null/undefined pour le statut
    const taskStatus = task.etat || 'todo';
    const matchesStatus = filterStatus === 'all' || taskStatus === filterStatus;

    const matchesMember = filterMember === 'all' || task.utilisateurs.some(user => user.id === filterMember);

    // Search by task number (index + 1) or task name
    const taskNumber = (project.taches.indexOf(task) + 1).toString();
    const matchesSearch = !searchQuery ||
      taskNumber.includes(searchQuery) ||
      (task.nom && task.nom.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesMember && matchesSearch;
  });

  // Get current user for history tracking (in a real app, this would come from authentication)
  const getCurrentUser = (): UserType => {
    // Convert AuthUser to UserType for compatibility
    return {
      id: currentUser.id,
      nom: currentUser.nom,
      prenom: currentUser.prenom,
      email: currentUser.email,
      departement: currentUser.departement,
      fonction: currentUser.fonction,
      role: currentUser.role,
      created_at: currentUser.created_at
    };
  };

  // Charger les tâches depuis l'API
  const loadTasks = async () => {
    try {
      console.log('📝 Chargement tâches depuis API pour projet:', project.id);
      const response = await api.getTasks(project.id);

      console.log('📊 Réponse API getTasks:', response);
      console.log('📊 Nombre tâches reçues:', response.tasks?.length || 0);

      // Convertir les tâches Supabase au format attendu par l'app
      const convertedTasks = response.tasks.map((task: any) => {
        console.log('🔄 Conversion tâche:', task.titre, 'ID:', task.id);
        // Protection des dates pour éviter les erreurs
        let dateDebut = undefined;
        let dateFin = undefined;

        try {
          if (task.date_debut && task.date_debut !== 'null' && task.date_debut !== '') {
            dateDebut = new Date(task.date_debut);
            if (isNaN(dateDebut.getTime())) dateDebut = undefined;
          }
        } catch (e) {
          console.warn('Date début invalide:', task.date_debut);
          dateDebut = undefined;
        }

        try {
          if (task.date_fin && task.date_fin !== 'null' && task.date_fin !== '') {
            dateFin = new Date(task.date_fin);
            if (isNaN(dateFin.getTime())) dateFin = undefined;
          }
        } catch (e) {
          console.warn('Date fin invalide:', task.date_fin);
          dateFin = undefined;
        }

        // Normaliser les statuts invalides
        const normalizeStatus = (status: string | null) => {
          if (!status || status === '') return 'todo';

          // Mapping des anciens statuts vers les nouveaux
          const statusMap: { [key: string]: string } = {
            'non_debutee': 'todo',
            'cloturee': 'termine',
            'in_progress': 'en_cours',
            'cancelled': 'annule',
            'completed': 'termine',
            'pending': 'todo'
          };

          return statusMap[status] || status;
        };

        const convertedTask = {
          id: task.id,
          nom: task.titre || 'Tâche sans nom',
          description: task.description || '',
          etat: normalizeStatus(task.statut),
          priorite: task.priorite || 'medium',
          date_debut: dateDebut,
          date_fin: dateFin,
          date_realisation: dateFin || dateDebut || new Date(), // CORRECTION: Ajouter date_realisation
          projet_id: task.project_id,
          utilisateurs: task.assigned_user ? [task.assigned_user] : [],
          commentaires: [],
          history: [],
          attachments: []
        };

        console.log('✅ Tâche convertie:', convertedTask.nom, 'État:', convertedTask.etat);
        return convertedTask;
      });

      console.log('✅ Tâches converties:', convertedTasks.length);
      console.log('📋 Détails tâches converties:', convertedTasks);

      // Mettre à jour le projet avec les tâches chargées
      const updatedProject = {
        ...project,
        taches: convertedTasks
      };

      console.log('🔄 Mise à jour projet avec', convertedTasks.length, 'tâches');
      onUpdateProject(updatedProject);
      console.log('✅ Projet mis à jour');

    } catch (error) {
      console.error('❌ Erreur lors du chargement des tâches:', error);
      // En cas d'erreur, garder les tâches existantes
    }
  };

  // Charger les tâches au montage du composant
  useEffect(() => {
    loadTasks();
  }, [project.id]);

  const handleCreateTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      console.log('📝 Création tâche via API:', taskData);

      // Appeler l'API pour créer la tâche avec les vraies valeurs
      console.log('📊 Données tâche reçues:', {
        nom: taskData.nom,
        etat: taskData.etat,
        priorite: taskData.priorite,
        date_debut: taskData.date_debut,
        date_fin: taskData.date_fin
      });

      const createdTask = await api.createTask({
        titre: taskData.nom,
        description: taskData.description,
        statut: taskData.etat || 'todo', // Valeur par défaut si vide
        priorite: taskData.priorite || 'medium', // Valeur par défaut si vide
        date_debut: taskData.date_debut && !isNaN(taskData.date_debut.getTime()) ? taskData.date_debut.toISOString().split('T')[0] : null,
        date_fin: taskData.date_fin && !isNaN(taskData.date_fin.getTime()) ? taskData.date_fin.toISOString().split('T')[0] : null,
        project_id: project.id,
        assigned_to: taskData.utilisateurs?.[0]?.id,
        created_by: currentUser?.id
      });

      console.log('✅ Tâche créée avec succès:', createdTask);

      // Créer la tâche locale pour l'interface
      const dateDebut = (() => {
        try {
          if (createdTask.date_debut) {
            const date = new Date(createdTask.date_debut);
            return !isNaN(date.getTime()) ? date : taskData.date_debut;
          }
          return taskData.date_debut;
        } catch (e) {
          return taskData.date_debut;
        }
      })();

      const dateFin = (() => {
        try {
          if (createdTask.date_fin) {
            const date = new Date(createdTask.date_fin);
            return !isNaN(date.getTime()) ? date : taskData.date_fin;
          }
          return taskData.date_fin;
        } catch (e) {
          return taskData.date_fin;
        }
      })();

      const newTask: Task = {
        id: createdTask.id,
        nom: createdTask.titre,
        description: createdTask.description,
        etat: createdTask.statut,
        priorite: createdTask.priorite,
        date_debut: dateDebut,
        date_fin: dateFin,
        date_realisation: dateFin || dateDebut || new Date(), // CORRECTION: Ajouter date_realisation
        projet_id: project.id,
        utilisateurs: taskData.utilisateurs || [],
        commentaires: [],
        history: [],
        attachments: taskData.attachments
      };

      const updatedProject = {
        ...project,
        taches: [...project.taches, newTask],
        updated_at: new Date()
      };

      onUpdateProject(updatedProject);

      // Recharger les tâches depuis l'API pour s'assurer de la synchronisation
      console.log('🔄 Rechargement programmé des tâches dans 1 seconde...');
      setTimeout(() => {
        console.log('🔄 Exécution du rechargement des tâches...');
        loadTasks();
      }, 1000);

      alert('Tâche créée avec succès !');

    } catch (error: any) {
      console.error('❌ Erreur création tâche:', error);
      alert(`Erreur lors de la création : ${error.message}`);
    }
  };

  const handleUpdateTask = async (taskData: Omit<Task, 'id'>) => {
    if (!editingTask) return;

    try {
      console.log('🔄 Modification tâche via API:', editingTask.id, taskData);

      // Appeler l'API pour modifier la tâche
      await api.updateTask(editingTask.id, {
        titre: taskData.nom,
        description: taskData.description,
        statut: taskData.etat,
        priorite: taskData.priorite,
        date_debut: taskData.date_debut && !isNaN(taskData.date_debut.getTime()) ? taskData.date_debut.toISOString().split('T')[0] : null,
        date_fin: taskData.date_fin && !isNaN(taskData.date_fin.getTime()) ? taskData.date_fin.toISOString().split('T')[0] : null,
        assigned_to: taskData.utilisateurs?.[0]?.id
      });

      console.log('✅ Tâche modifiée avec succès');

      // Mettre à jour la liste locale
      const newHistory = [...(editingTask.history || [])];
      const updatedTasks = project.taches.map(task =>
        task.id === editingTask.id ? {
          ...taskData,
          id: editingTask.id,
          commentaires: editingTask.commentaires || [],
          history: newHistory
        } : task
      );

      const updatedProject = {
        ...project,
        taches: updatedTasks,
        updated_at: new Date()
      };

      onUpdateProject(updatedProject);
      setEditingTask(undefined);
      alert('Tâche modifiée avec succès !');

    } catch (error: any) {
      console.error('❌ Erreur modification tâche:', error);
      alert(`Erreur lors de la modification : ${error.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = project.taches.find(t => t.id === taskId);
    if (!taskToDelete) return;

    const commentsCount = taskToDelete.commentaires?.length || 0;
    const attachmentsCount = taskToDelete.attachments?.length || 0;
    const commentAttachmentsCount = taskToDelete.commentaires?.reduce((sum, comment) => 
      sum + (comment.attachments?.length || 0), 0) || 0;
    const totalAttachments = attachmentsCount + commentAttachmentsCount;

    let confirmMessage = `Êtes-vous sûr de vouloir supprimer la tâche "${taskToDelete.nom}" ?`;
    
    if (commentsCount > 0 || totalAttachments > 0) {
      confirmMessage += '\n\nCette action supprimera également :';
      if (commentsCount > 0) {
        confirmMessage += `\n• ${commentsCount} commentaire${commentsCount > 1 ? 's' : ''}`;
      }
      if (totalAttachments > 0) {
        confirmMessage += `\n• ${totalAttachments} pièce${totalAttachments > 1 ? 's' : ''} jointe${totalAttachments > 1 ? 's' : ''}`;
      }
      confirmMessage += '\n\nCette action est irréversible.';
    }

    if (window.confirm(confirmMessage)) {
      // Clean up any object URLs to prevent memory leaks
      if (taskToDelete.attachments) {
        taskToDelete.attachments.forEach(attachment => {
          if (attachment.url.startsWith('blob:')) {
            URL.revokeObjectURL(attachment.url);
          }
        });
      }

      if (taskToDelete.commentaires) {
        taskToDelete.commentaires.forEach(comment => {
          if (comment.attachments) {
            comment.attachments.forEach(attachment => {
              if (attachment.url.startsWith('blob:')) {
                URL.revokeObjectURL(attachment.url);
              }
            });
          }
        });
      }

      try {
        console.log('🗑️ Suppression tâche via API:', taskId);

        // Appeler l'API pour supprimer la tâche
        await api.deleteTask(taskId);

        console.log('✅ Tâche supprimée avec succès');

        // Supprimer de la liste locale
        const updatedTasks = project.taches.filter(task => task.id !== taskId);
        const updatedProject = {
          ...project,
          taches: updatedTasks,
          updated_at: new Date()
        };

        onUpdateProject(updatedProject);

        // Close any open modals related to this task
        if (selectedTaskForComments && selectedTaskForComments.id === taskId) {
          setSelectedTaskForComments(undefined);
          setIsCommentsModalOpen(false);
        }
        if (selectedTaskForDetails && selectedTaskForDetails.id === taskId) {
          setSelectedTaskForDetails(undefined);
          setIsTaskDetailsModalOpen(false);
        }
        if (editingTask && editingTask.id === taskId) {
          setEditingTask(undefined);
          setIsTaskModalOpen(false);
        }

        alert('Tâche supprimée avec succès !');

      } catch (error: any) {
        console.error('❌ Erreur suppression tâche:', error);
        alert(`Erreur lors de la suppression : ${error.message}`);
      }
    }
  };

  const handleUpdateProject = (projectData: {
    nom: string;
    description?: string;
    type_projet?: string;
    responsable_id?: string;
    prestataire_externe?: string;
    nouvelles_fonctionnalites?: string;
    avantages?: string;
    departement?: string;
    attachments?: ProjectAttachment[];
    date_debut?: Date;
    date_fin?: Date;
    budget_initial?: number;
    devise?: string;
  }) => {
    const updatedProject = {
      ...project,
      nom: projectData.nom,
      description: projectData.description,
      type_projet: projectData.type_projet,
      responsable_id: projectData.responsable_id,
      prestataire_externe: projectData.prestataire_externe,
      nouvelles_fonctionnalites: projectData.nouvelles_fonctionnalites,
      avantages: projectData.avantages,
      departement: projectData.departement,
      attachments: projectData.attachments,
      date_debut: projectData.date_debut,
      date_fin: projectData.date_fin,
      budget_initial: projectData.budget_initial,
      devise: projectData.devise,
      updated_at: new Date()
    };

    onUpdateProject(updatedProject);
  };

  const handleAddComment = (taskId: string, commentData: Omit<Comment, 'id' | 'created_at'>) => {
    console.log('Adding comment to task:', taskId, commentData);
    
    const currentUser = getCurrentUser();
    const newComment: Comment = {
      ...commentData,
      id: Date.now().toString(),
      created_at: new Date()
    };

    console.log('New comment created:', newComment);

    const updatedTasks = project.taches.map(task => {
      if (task.id === taskId) {
        console.log('Found task to update:', task.nom);
        console.log('Current commentaires:', task.commentaires);
        
        const updatedTask = {
          ...task,
          commentaires: [...(task.commentaires || []), newComment],
          history: [...(task.history || []), {
            id: Date.now().toString(),
            action: 'comment_added',
            user: commentData.auteur,
            timestamp: new Date(),
            details: `Commentaire ajouté par ${commentData.auteur.prenom} ${commentData.auteur.nom}`
          }]
        };
        
        console.log('Updated task commentaires:', updatedTask.commentaires);
        return updatedTask;
      }
      return task;
    });

    const updatedProject = {
      ...project,
      taches: updatedTasks,
      updated_at: new Date()
    };

    console.log('Updating project with new comment');
    onUpdateProject(updatedProject);

    // Update selected task for comments modal
    if (selectedTaskForComments && selectedTaskForComments.id === taskId) {
      const updatedTask = updatedTasks.find(t => t.id === taskId);
      if (updatedTask) {
        console.log('Updating selected task for comments modal');
        setSelectedTaskForComments(updatedTask);
      }
    }
  };

  const handleDeleteComment = (taskId: string, commentId: string) => {
    
    const updatedTasks = project.taches.map(task => {
      if (task.id === taskId) {
        const commentToDelete = (task.commentaires || []).find(c => c.id === commentId);
        const updatedTask = {
          ...task,
          commentaires: (task.commentaires || []).filter(comment => comment.id !== commentId),
          history: [...(task.history || [])]
        };
        return updatedTask;
      }
      return task;
    });

    const updatedProject = {
      ...project,
      taches: updatedTasks,
      updated_at: new Date()
    };

    onUpdateProject(updatedProject);

    // Update selected task for comments modal
    if (selectedTaskForComments && selectedTaskForComments.id === taskId) {
      const updatedTask = updatedTasks.find(t => t.id === taskId);
      if (updatedTask) {
        setSelectedTaskForComments(updatedTask);
      }
    }
  };

  const handleShowComments = (task: Task) => {
    setSelectedTaskForComments(task);
    setIsCommentsModalOpen(true);
  };

  const handleCloseCommentsModal = () => {
    setIsCommentsModalOpen(false);
    setSelectedTaskForComments(undefined);
  };

  const handleShowTaskDetails = (task: Task) => {
    setSelectedTaskForDetails(task);
    setIsTaskDetailsModalOpen(true);
  };

  const handleCloseTaskDetailsModal = () => {
    setIsTaskDetailsModalOpen(false);
    setSelectedTaskForDetails(undefined);
  };

  const handleEditTaskFromDetails = (task: Task) => {
    setEditingTask(task);
    setIsTaskDetailsModalOpen(false);
    setSelectedTaskForDetails(undefined);
  };

  // Handle task update from details modal (for attachment deletion)
  const handleUpdateTaskFromDetails = (updatedTask: Task) => {
    const updatedTasks = project.taches.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );

    const updatedProject = {
      ...project,
      taches: updatedTasks,
      updated_at: new Date()
    };

    onUpdateProject(updatedProject);

    // Update the selected task for details modal
    setSelectedTaskForDetails(updatedTask);
  };

  const handleExport = useCallback(() => {
    exportProjectToExcel(project);
  }, [project]);

  const handleExportPdf = useCallback(() => {
    exportProjectToPdf(project);
  }, [project]);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterMember('all');
    setSearchQuery('');
  };

  const hasActiveFilters = filterStatus !== 'all' || filterMember !== 'all';

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Check if user can close project (Admin or Project Manager)
  const canCloseProject = () => {
    return currentUser.id === project.responsable_id || 
           currentUser.role === 'ADMIN' || 
           currentUser.role === 'SUPER_ADMIN';
  };

  // Check if all tasks are closed
  const areAllTasksClosed = () => {
    return project.taches.every(task => task.etat === 'cloturee');
  };

  // Get open tasks
  const getOpenTasks = () => {
    return project.taches.filter(task => task.etat !== 'cloturee');
  };

  // Handle project closure attempt
  const handleCloseProjectAttempt = () => {
    const openTasksList = getOpenTasks();
    
    if (openTasksList.length === 0) {
      // All tasks are closed, show confirmation modal
      setIsCloseProjectModalOpen(true);
    } else {
      // Some tasks are still open, show alert
      setOpenTasks(openTasksList);
      setIsCloseProjectAlertOpen(true);
    }
  };

  // Handle project closure confirmation
  const handleCloseProjectConfirm = () => {
    const updatedProject = {
      ...project,
      statut: 'cloture',
      date_cloture: new Date(),
      updated_at: new Date()
    };
    
    onUpdateProject(updatedProject);
    setIsCloseProjectModalOpen(false);
  };

  const totalAttachmentsCount = getTotalAttachmentsCount();

  // Use dynamically calculated alert data
  const {
    isApproachingDeadline,
    isOverdue,
    daysUntilDeadline,
    showDeadlineAlert,
    alertMessage,
    alertSeverity,
    alertColorClasses
  } = alertData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-6">
                <h1 className="text-4xl font-bold text-gray-900">{project.nom}</h1>
                {/* Project Status Badge */}
                {project.statut === 'cloture' && (
                  <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg border flex items-center space-x-2">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">Projet Clôturé</span>
                  </div>
                )}
                {project.statut === 'actif' && project.date_reouverture && (
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg border flex items-center space-x-2">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">Projet Réouvert</span>
                  </div>
                )}
                {/* Deadline Alert next to title */}
                {showDeadlineAlert && (
                  <div className={`px-3 py-1 rounded-lg border flex items-center space-x-2 ${alertColorClasses}`}>
                    {isOverdue ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                    <span className="text-sm font-medium">{alertMessage}</span>
                    <button
                      onClick={() => setIsAlertSettingsModalOpen(true)}
                      className="ml-2 text-xs hover:underline flex items-center space-x-1 opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <Bell size={12} />
                      <span>Configurer</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <p className="text-gray-600">
                  {project.taches.length} tâche{project.taches.length > 1 ? 's' : ''} • 
                  {new Set(project.taches.flatMap(t => t.utilisateurs.map(u => u.id))).size} membre{new Set(project.taches.flatMap(t => t.utilisateurs.map(u => u.id))).size > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              {totalAttachmentsCount > 0 && (
                <button
                  onClick={() => setIsAttachmentsModalOpen(true)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Paperclip size={18} />
                  <span>Pièces jointes ({totalAttachmentsCount})</span>
                </button>
              )}
              <button
                onClick={handleExport}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Download size={18} />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => setIsProjectInfoModalOpen(true)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <FileText size={18} />
                <span>Détails du projet</span>
              </button>
              {hasBudget && (
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <DollarSign size={18} />
                  <span>Budget</span>
                </button>
              )}
              <button
                onClick={() => setShowMeetingMinutes(!showMeetingMinutes)}
                className={`px-4 py-2 border border-gray-300 rounded-lg transition-colors flex items-center space-x-2 ${
                  showMeetingMinutes
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <FileText2 size={18} />
                <span>PV de Réunion Projet</span>
              </button>
              <button
                onClick={() => setIsAlertSettingsModalOpen(true)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Bell size={18} />
                <span>Alertes</span>
              </button>
              {canCloseProject() && project.statut !== 'cloture' && !isReadOnly && (
                <button
                  onClick={handleCloseProjectAttempt}
                  className="px-4 py-2 text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle size={18} />
                  <span>Clôturer le projet</span>
                </button>
              )}

            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Progress Bars Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Budget Progress Bar */}
          {hasBudget && budgetProgress && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <h3 className="text-base font-semibold text-gray-900">Progression Budgétaire</h3>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-gray-900">
                    {budgetProgress.pourcentage_consommation.toFixed(1)}%
                  </span>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(budgetProgress.total_depenses, project.devise!)} / {formatCurrency(project.budget_initial!, project.devise!)}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    budgetProgress.statut_budgetaire === 'success' ? 'bg-green-500' :
                    budgetProgress.statut_budgetaire === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(budgetProgress.pourcentage_consommation, 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Reste: {formatCurrency(budgetProgress.montant_restant, project.devise!)}
              </div>
            </div>
          )}

          {/* Global Progress Bar */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-gray-900">Progression Global du Projet</h3>
              <span className="text-base font-bold text-gray-900">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-500 ${getProgressColor(stats.percentage)}`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status Progress Cards */}

        {/* Tasks Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-8 border-b">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tâches ({viewMode === 'list' ? filteredTasks.length : project.taches.length})
                  {hasActiveFilters && viewMode === 'list' && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      sur {project.taches.length} au total
                    </span>
                  )}
                </h3>
                
                {/* New Task Button */}
                {!isReadOnly && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsTaskModalOpen(true)}
                      disabled={project.statut === 'cloture' || projectMembers.length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm font-medium"
                      title={
                        project.statut === 'cloture'
                          ? 'Le projet est clôturé, impossible d\'ajouter des tâches'
                          : projectMembers.length === 0
                          ? 'Assignez d\'abord des membres au projet'
                          : ''
                      }
                    >
                      <Plus size={16} />
                      <span>Nouvelle Tâche</span>
                    </button>

                    {projectMembers.length === 0 && (
                      <button
                        onClick={() => setIsMembersManagementModalOpen(true)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 text-sm font-medium"
                        title="Assigner des membres au projet"
                      >
                        <Users size={16} />
                        <span>Assigner des membres</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      viewMode === 'kanban' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid3X3 size={16} />
                    <span>Kanban</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List size={16} />
                    <span>Liste</span>
                  </button>
                  <button
                    onClick={() => setViewMode('gantt')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      viewMode === 'gantt' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart size={16} />
                    <span>Gantt</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters - Only show in list view */}
            {viewMode === 'list' && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {/* Search field */}
                <div className="relative flex-1 max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par numéro ou nom..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="non_debutee">Non débutées</option>
                  <option value="en_cours">En cours</option>
                  <option value="cloturee">Terminées</option>
                </select>

                <select
                  value={filterMember}
                  onChange={(e) => setFilterMember(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">Tous les membres</option>
                  {projectMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.prenom} {member.nom}
                    </option>
                  ))}
                </select>

                {(hasActiveFilters || searchQuery) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center space-x-1"
                    title="Effacer les filtres"
                  >
                    <X size={16} />
                    <span>Effacer</span>
                  </button>
                )}
              </div>
            )}

            {/* Active Filters Display - Only show in list view */}
            {viewMode === 'list' && (hasActiveFilters || searchQuery) && (
              <div className="flex flex-wrap gap-2 mb-4 mt-4">
                {searchQuery && (
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <Search size={14} />
                    <span>Recherche: "{searchQuery}"</span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {filterStatus !== 'all' && (
                  <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <span>Statut: {
                      filterStatus === 'non_debutee' ? 'Non débutées' :
                      filterStatus === 'en_cours' ? 'En cours' :
                      filterStatus === 'cloturee' ? 'Terminées' : filterStatus
                    }</span>
                    <button
                      onClick={() => setFilterStatus('all')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {filterMember !== 'all' && (
                  <div className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    <User size={14} />
                    <span>
                      {projectMembers.find(m => m.id === filterMember)?.prenom} {projectMembers.find(m => m.id === filterMember)?.nom}
                    </span>
                    <button
                      onClick={() => setFilterMember('all')}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-8">
            {project.taches.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche</h4>
                <p className="text-gray-500 mb-4">Commencez par créer votre première tâche</p>
                {projectMembers.length > 0 ? (
                  <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Créer une tâche
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex items-center space-x-2">
                        <Users className="text-yellow-600" size={20} />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Aucun membre assigné au projet
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Assignez des utilisateurs à ce projet pour pouvoir créer des tâches.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMembersManagementModalOpen(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Users size={16} />
                      <span>Assigner des membres</span>
                    </button>
                  </div>
                )}
              </div>
            ) : viewMode === 'kanban' ? (
              <KanbanBoard
                tasks={project.taches}
                onTaskClick={(task) => setEditingTask(task)}
                onShowComments={handleShowComments}
                onShowDetails={handleShowTaskDetails}
                onDeleteTask={handleDeleteTask}
              />
            ) : viewMode === 'gantt' ? (
              <GanttChart
                tasks={project.taches}
                onTaskClick={(task) => setEditingTask(task)}
                onShowComments={handleShowComments}
                onShowDetails={handleShowTaskDetails}
                onDeleteTask={handleDeleteTask}
              />
            ) : (
              <>
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune tâche correspondante
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Aucune tâche ne correspond aux filtres sélectionnés
                    </p>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Effacer les filtres
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredTasks.map((task, index) => {
                      // Find the original index in the project.taches array
                      const originalIndex = project.taches.findIndex(t => t.id === task.id);
                      const taskNumber = originalIndex + 1;
                      
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          taskNumber={taskNumber}
                          onClick={() => setEditingTask(task)}
                          onShowComments={handleShowComments}
                          onDelete={handleDeleteTask}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Meeting Minutes Section */}
        {showMeetingMinutes && (
          <div className="mt-8">
            <ProjectMeetingMinutes
              projectId={project.id}
              projectName={project.nom}
            />
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen || !!editingTask}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(undefined);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        projectId={project.id}
        availableUsers={projectMembers}
      />

      {/* Project Edit Modal */}
      <ProjectEditModal
        isOpen={isProjectEditModalOpen}
        onClose={() => setIsProjectEditModalOpen(false)}
        onSubmit={handleUpdateProject}
        project={project}
        departments={departments}
        availableUsers={availableUsers}
      />

      {/* Project Attachments Modal */}
      <ProjectAttachmentsModal
        isOpen={isAttachmentsModalOpen}
        onClose={() => setIsAttachmentsModalOpen(false)}
        project={project}
      />

      {/* Project Members Modal */}
      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        projectName={project.nom}
        members={projectMembers}
      />

      {/* Task Comments Modal */}
      {selectedTaskForComments && (
        <TaskCommentsModal
          isOpen={isCommentsModalOpen}
          onClose={handleCloseCommentsModal}
          task={selectedTaskForComments}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          availableUsers={availableUsers}
        />
      )}

      {/* Task Details Modal */}
      {selectedTaskForDetails && (
        <TaskDetailsModal
          isOpen={isTaskDetailsModalOpen}
          onClose={handleCloseTaskDetailsModal}
          task={selectedTaskForDetails}
          onEdit={handleEditTaskFromDetails}
          onShowComments={handleShowComments}
          onDelete={handleDeleteTask}
          onUpdateTask={handleUpdateTaskFromDetails}
        />
      )}
    
    {/* Project Alert Settings Modal */}
    <ProjectAlertSettingsModal
      isOpen={isAlertSettingsModalOpen}
      onClose={() => setIsAlertSettingsModalOpen(false)}
      currentThreshold={alertThreshold}
      onSave={(threshold) => {
        setAlertThreshold(threshold);
        setIsAlertSettingsModalOpen(false);
      }}
    />

    {/* Project Budget Modal */}
    <ProjectBudgetModal
      isOpen={isBudgetModalOpen}
      onClose={() => setIsBudgetModalOpen(false)}
      project={project}
      onUpdateProject={onUpdateProject}
    />

    {/* Project Members Management Modal */}
    <ProjectMembersManagementModal
      isOpen={isMembersManagementModalOpen}
      onClose={() => setIsMembersManagementModalOpen(false)}
      project={project}
      availableUsers={availableUsers}
      onUpdateProject={onUpdateProject}
    />

    {/* Project Info Modal */}
    <ProjectInfoModal
      isOpen={isProjectInfoModalOpen}
      onClose={() => setIsProjectInfoModalOpen(false)}
      project={project}
      availableUsers={availableUsers}
      onEditProject={() => {
        setIsProjectInfoModalOpen(false);
        setIsProjectEditModalOpen(true);
      }}
      onManageMembers={() => {
        setIsProjectInfoModalOpen(false);
        setIsMembersManagementModalOpen(true);
      }}
    />

    {/* Close Project Confirmation Modal */}
    {isCloseProjectModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmer la clôture</h3>
              <p className="text-sm text-gray-500">Toutes les tâches sont clôturées</p>
            </div>
          </div>
          <p className="text-gray-700 mb-6">
            ✅ Toutes les tâches du projet sont clôturées. Souhaitez-vous confirmer la clôture du projet ? 
            Celui-ci sera déplacé dans les archives et deviendra non modifiable.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsCloseProjectModalOpen(false)}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCloseProjectConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Confirmer la clôture
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Close Project Alert Modal */}
    {isCloseProjectAlertOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Impossible de clôturer</h3>
              <p className="text-sm text-gray-500">Des tâches sont encore ouvertes</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            ❌ Impossible de clôturer le projet. Les tâches suivantes ne sont pas clôturées :
          </p>
          <div className="bg-red-50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
            {openTasks.map((task, index) => {
              const taskNumber = project.taches.findIndex(t => t.id === task.id) + 1;
              return (
                <div key={task.id} className="flex items-center space-x-2 mb-2 last:mb-0">
                  <div className="flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                    {taskNumber}
                  </div>
                  <span className="text-sm text-gray-700">{task.nom}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setIsCloseProjectAlertOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default ProjectDetail;