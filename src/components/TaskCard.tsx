import React, { useState } from 'react';
import { Calendar, User, Edit2, Building, Briefcase, FileText, PlayCircle, CheckCircle, MessageCircle, Paperclip, Download, MoreVertical, Trash2, BarChart3 } from 'lucide-react';
import { Task } from '../types';
import { getStatusColor, getStatusText } from '../utils/calculations';

interface TaskCardProps {
  task: Task;
  taskNumber?: number;
  onClick: () => void;
  onShowComments: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, taskNumber, onClick, onShowComments, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const isOverdue = new Date(task.date_realisation) < new Date() && task.etat !== 'cloturee';
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

  const formatFileSize = (bytes: number): string => {
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
    onClick();
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
    setShowActions(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200 group relative">
      {/* Actions Menu */}
      <div className="absolute top-3 right-3 z-10">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} />
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
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-20">
                <button
                  onClick={handleEdit}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit2 size={14} />
                  <span>Modifier</span>
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 size={14} />
                  <span>Supprimer</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          {taskNumber && (
            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
              {taskNumber}
            </div>
          )}
          <h4 
            className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer pr-8"
            onClick={onClick}
          >
            {task.nom}
          </h4>
        </div>
      </div>

      <div className="space-y-3">
        {/* Description */}
        {task.description && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <FileText size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-blue-800 mb-1">Description</p>
                <p className="text-sm text-blue-700 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scenario d'execution */}
        {task.scenario_execution && (
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <PlayCircle size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-green-800 mb-1">Scénario d'exécution</p>
                <p className="text-sm text-green-700 line-clamp-2 leading-relaxed">
                  {task.scenario_execution}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Criteres d'acceptation */}
        {task.criteres_acceptation && (
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <CheckCircle size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-purple-800 mb-1">Critères d'acceptation</p>
                <p className="text-sm text-purple-700 line-clamp-2 leading-relaxed">
                  {task.criteres_acceptation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Task Attachments */}
        {attachmentsCount > 0 && (
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Paperclip size={14} className="text-orange-600" />
              <p className="text-xs font-medium text-orange-800">
                {attachmentsCount} pièce{attachmentsCount > 1 ? 's' : ''} jointe{attachmentsCount > 1 ? 's' : ''}
              </p>
            </div>
            <div className="space-y-1">
              {task.attachments?.slice(0, 2).map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center space-x-2 bg-white rounded p-2 border border-orange-200 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={(e) => downloadAttachment(attachment, e)}
                >
                  <span className="text-xs">{getFileIcon(attachment.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {attachment.nom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.taille)}
                    </p>
                  </div>
                  <Download size={12} className="text-gray-400 hover:text-orange-600" />
                </div>
              ))}
              {attachmentsCount > 2 && (
                <p className="text-xs text-orange-700 text-center py-1">
                  +{attachmentsCount - 2} autre{attachmentsCount - 2 > 1 ? 's' : ''} fichier{attachmentsCount - 2 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Comments indicator - Clickable */}
        {commentsCount > 0 && (
          <div 
            className="bg-orange-50 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition-colors border border-orange-200 hover:border-orange-300"
            onClick={(e) => {
              e.stopPropagation();
              onShowComments(task);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle size={14} className="text-orange-600" />
                <div>
                  <p className="text-xs font-medium text-orange-800">
                    {commentsCount} commentaire{commentsCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-orange-700">
                    Cliquez pour voir les discussions
                  </p>
                </div>
              </div>
              <div className="text-xs text-orange-600 font-medium">
                Voir →
              </div>
            </div>
          </div>
        )}

        {/* Status and Progress */}
        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.etat)}`}>
              {getStatusText(task.etat)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Progression</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{taskProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(taskProgress)}`}
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Assigned Users */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {task.utilisateurs.length} membre{task.utilisateurs.length > 1 ? 's' : ''} assigné{task.utilisateurs.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1 ml-6">
            {task.utilisateurs.map((user) => (
              <div key={user.id} className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {user.prenom.charAt(0)}{user.nom.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">
                    {user.prenom} {user.nom}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                    <div className="flex items-center space-x-1">
                      <Building size={10} />
                      <span>{user.departement}</span>
                    </div>
                    {user.fonction && (
                      <div className="flex items-center space-x-1">
                        <Briefcase size={10} />
                        <span>{user.fonction}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center space-x-2 pt-2 border-t">
          <Calendar size={16} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
            {task.date_realisation.toLocaleDateString('fr-FR')}
            {isOverdue && task.etat !== 'cloturee' && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                En retard
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;