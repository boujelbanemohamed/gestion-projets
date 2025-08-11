import React, { useState } from 'react';
import { Calendar, User, Building, Briefcase, MessageCircle, Edit2, Eye, MoreVertical, Trash2, BarChart3, Paperclip } from 'lucide-react';
import { Task } from '../types';
import { getStatusColor, getStatusText } from '../utils/calculations';

interface KanbanTaskCardProps {
  task: Task;
  taskNumber?: number;
  onTaskClick: (task: Task) => void;
  onShowComments: (task: Task) => void;
  onShowDetails: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({ task, taskNumber, onTaskClick, onShowComments, onShowDetails, onDeleteTask }) => {
  const [showActions, setShowActions] = useState(false);

  // Protection contre date_realisation undefined
  const dateRealisation = task.date_realisation || task.date_fin || task.date_debut || new Date();
  const isOverdue = new Date(dateRealisation) < new Date() && task.etat !== 'cloturee';
  const commentsCount = task.commentaires?.length || 0;
  const attachmentsCount = task.attachments?.length || 0;

  // Calculate task progress percentage
  const getTaskProgress = (task: Task): number => {
    switch (task.etat) {
      case 'non_debutee': return 0;
      case 'en_cours': return 50;
      case 'cloturee': return 100;
      default: return 0;
    }
  };

  const taskProgress = getTaskProgress(task);

  // Get progress color based on percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📎';
  };

  const downloadAttachment = (attachment: { url: string; nom: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would download from the server
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.nom;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTaskClick(task);
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTask(task.id);
    setShowActions(false);
  };

  const handleShowDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDetails(task);
    setShowActions(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group relative">
      {/* Header with title and actions */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start space-x-2 flex-1 pr-2">
          {taskNumber && (
            <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
              {taskNumber}
            </div>
          )}
          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
            {task.nom}
          </h4>
        </div>
        <div className="flex space-x-1">
          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Actions"
            >
              <MoreVertical size={14} />
            </button>
            
            {showActions && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                  }}
                />
                
                {/* Actions dropdown */}
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-20">
                  <button
                    onClick={handleShowDetails}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Eye size={12} />
                    <span>Détails</span>
                  </button>
                  <button
                    onClick={handleEdit}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit2 size={12} />
                    <span>Modifier</span>
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 size={12} />
                    <span>Supprimer</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Task Attachments - Always visible and clickable */}
        {attachmentsCount > 0 && (
          <div 
            className="bg-orange-50 rounded-md p-2 cursor-pointer hover:bg-orange-100 transition-colors border border-orange-200 hover:border-orange-300"
            onClick={(e) => {
              e.stopPropagation();
              onShowDetails(task);
            }}
            title="Cliquez pour voir les détails"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Paperclip size={12} className="text-orange-600" />
                <p className="text-xs text-orange-800 font-medium">
                  {attachmentsCount} pièce{attachmentsCount > 1 ? 's' : ''} jointe{attachmentsCount > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-xs text-orange-600 font-medium">
                Voir →
              </div>
            </div>
            {/* Show first attachment preview */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-xs">{getFileIcon(task.attachments[0].type)}</span>
                <span className="text-xs text-orange-700 truncate">
                  {task.attachments[0].nom}
                </span>
                {attachmentsCount > 1 && (
                  <span className="text-xs text-orange-600">
                    +{attachmentsCount - 1}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Comments indicator - Always visible and clickable */}
        {commentsCount > 0 && (
          <div 
            className="bg-orange-50 rounded-md p-2 cursor-pointer hover:bg-orange-100 transition-colors border border-orange-200 hover:border-orange-300"
            onClick={(e) => {
              e.stopPropagation();
              onShowComments(task);
            }}
            title="Cliquez pour voir les commentaires"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle size={12} className="text-orange-600" />
                <p className="text-xs text-orange-800 font-medium">
                  {commentsCount} commentaire{commentsCount > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-xs text-orange-600 font-medium">
                Voir →
              </div>
            </div>
          </div>
        )}

        {/* Status and Progress */}
        <div className="space-y-2">
          {/* Status */}
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.etat)}`}>
              {getStatusText(task.etat)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <BarChart3 size={10} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Progression</span>
              </div>
              <span className="text-xs font-bold text-gray-900">{taskProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(taskProgress)}`}
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Assigned Users - Always visible */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User size={12} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-700">
              {task.utilisateurs.length} membre{task.utilisateurs.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1">
            {task.utilisateurs.slice(0, 2).map((user) => (
              <div key={user.id} className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {user.prenom.charAt(0)}{user.nom.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-900 truncate">
                    {user.prenom} {user.nom}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Building size={8} />
                      <span className="truncate">{user.departement}</span>
                    </div>
                    {user.fonction && (
                      <div className="flex items-center space-x-1">
                        <Briefcase size={8} />
                        <span className="truncate">{user.fonction}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {task.utilisateurs.length > 2 && (
              <div className="text-xs text-gray-500 ml-7">
                +{task.utilisateurs.length - 2} autre{task.utilisateurs.length - 2 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Date - Always visible */}
        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
          <Calendar size={12} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
          <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
            {dateRealisation.toLocaleDateString('fr-FR')}
          </span>
          {isOverdue && task.etat !== 'cloturee' && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
              Retard
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanTaskCard;