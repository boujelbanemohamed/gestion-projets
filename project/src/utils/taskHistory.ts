import { TaskHistoryEntry, User, Task } from '../types';

export const createHistoryEntry = (
  action: TaskHistoryEntry['action'],
  description: string,
  auteur: User,
  taskId: string,
  details?: TaskHistoryEntry['details']
): TaskHistoryEntry => {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    action,
    description,
    auteur,
    created_at: new Date(),
    task_id: taskId,
    details
  };
};

export const getActionIcon = (action: TaskHistoryEntry['action']): string => {
  switch (action) {
    case 'created': return '🆕';
    case 'updated': return '✏️';
    case 'status_changed': return '🔄';
    case 'assigned': return '👤';
    case 'unassigned': return '👤';
    case 'comment_added': return '💬';
    case 'comment_deleted': return '🗑️';
    case 'date_changed': return '📅';
    default: return '📝';
  }
};

export const getActionColor = (action: TaskHistoryEntry['action']): string => {
  switch (action) {
    case 'created': return 'bg-green-100 text-green-800 border-green-200';
    case 'updated': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'status_changed': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'assigned': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'unassigned': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'comment_added': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'comment_deleted': return 'bg-red-100 text-red-800 border-red-200';
    case 'date_changed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'non_debutee': return 'Non débutée';
    case 'en_cours': return 'En cours';
    case 'cloturee': return 'Clôturée';
    default: return status;
  }
};

export const addTaskCreatedHistory = (task: Task, creator: User): TaskHistoryEntry => {
  return createHistoryEntry(
    'created',
    `Tâche créée par ${creator.prenom} ${creator.nom}`,
    creator,
    task.id
  );
};

export const addTaskUpdatedHistory = (
  task: Task,
  updater: User,
  changes: string[]
): TaskHistoryEntry => {
  const changesList = changes.join(', ');
  return createHistoryEntry(
    'updated',
    `Tâche modifiée par ${updater.prenom} ${updater.nom} (${changesList})`,
    updater,
    task.id,
    { field: 'multiple', new_value: changes }
  );
};

export const addStatusChangedHistory = (
  task: Task,
  updater: User,
  oldStatus: string,
  newStatus: string
): TaskHistoryEntry => {
  return createHistoryEntry(
    'status_changed',
    `Statut changé de "${getStatusText(oldStatus)}" vers "${getStatusText(newStatus)}" par ${updater.prenom} ${updater.nom}`,
    updater,
    task.id,
    { field: 'etat', old_value: oldStatus, new_value: newStatus }
  );
};

export const addUserAssignedHistory = (
  task: Task,
  assigner: User,
  assignedUser: User
): TaskHistoryEntry => {
  return createHistoryEntry(
    'assigned',
    `${assignedUser.prenom} ${assignedUser.nom} assigné(e) à la tâche par ${assigner.prenom} ${assigner.nom}`,
    assigner,
    task.id,
    { field: 'utilisateurs', new_value: assignedUser }
  );
};

export const addUserUnassignedHistory = (
  task: Task,
  unassigner: User,
  unassignedUser: User
): TaskHistoryEntry => {
  return createHistoryEntry(
    'unassigned',
    `${unassignedUser.prenom} ${unassignedUser.nom} retiré(e) de la tâche par ${unassigner.prenom} ${unassigner.nom}`,
    unassigner,
    task.id,
    { field: 'utilisateurs', old_value: unassignedUser }
  );
};

export const addCommentAddedHistory = (
  task: Task,
  commenter: User
): TaskHistoryEntry => {
  return createHistoryEntry(
    'comment_added',
    `Commentaire ajouté par ${commenter.prenom} ${commenter.nom}`,
    commenter,
    task.id
  );
};

export const addCommentDeletedHistory = (
  task: Task,
  deleter: User,
  originalAuthor: User
): TaskHistoryEntry => {
  return createHistoryEntry(
    'comment_deleted',
    `Commentaire de ${originalAuthor.prenom} ${originalAuthor.nom} supprimé par ${deleter.prenom} ${deleter.nom}`,
    deleter,
    task.id
  );
};

export const addDateChangedHistory = (
  task: Task,
  updater: User,
  oldDate: Date,
  newDate: Date
): TaskHistoryEntry => {
  return createHistoryEntry(
    'date_changed',
    `Date de réalisation changée du ${oldDate.toLocaleDateString('fr-FR')} au ${newDate.toLocaleDateString('fr-FR')} par ${updater.prenom} ${updater.nom}`,
    updater,
    task.id,
    { field: 'date_realisation', old_value: oldDate, new_value: newDate }
  );
};