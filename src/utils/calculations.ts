import { Task, ProjectStats } from '../types';

export const calculateProjectProgress = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  
  const totalPoints = tasks.reduce((sum, task) => {
    switch (task.etat) {
      case 'non_debutee': return sum + 0;
      case 'en_cours': return sum + 50;
      case 'cloturee': return sum + 100;
      default: return sum;
    }
  }, 0);
  
  return Math.round(totalPoints / tasks.length);
};

export const getProjectStats = (tasks: Task[]): ProjectStats => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.etat === 'cloturee').length;
  const inProgressTasks = tasks.filter(t => t.etat === 'en_cours').length;
  const notStartedTasks = tasks.filter(t => t.etat === 'non_debutee').length;
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    percentage: calculateProjectProgress(tasks)
  };
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'non_debutee': return 'bg-gray-100 text-gray-800';
    case 'en_cours': return 'bg-orange-100 text-orange-800';
    case 'cloturee': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'non_debutee': return 'Non débutée';
    case 'en_cours': return 'En cours';
    case 'cloturee': return 'Clôturée';
    default: return 'Inconnu';
  }
};