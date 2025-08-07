import React, { useState } from 'react';
import { X, Calendar, User, Building, Briefcase, FileText, PlayCircle, CheckCircle, MessageCircle, Edit2, History, Paperclip, Download, Trash2 } from 'lucide-react';
import { Task, TaskAttachment } from '../types';
import { getStatusColor, getStatusText } from '../utils/calculations';
import TaskHistoryModal from './TaskHistoryModal';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onEdit: (task: Task) => void;
  onShowComments: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdateTask?: (updatedTask: Task) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  task,
  onEdit,
  onShowComments,
  onDelete,
  onUpdateTask
}) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(task);

  // Update current task when prop changes
  React.useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  if (!isOpen) return null;

  const isOverdue = new Date(currentTask.date_realisation) < new Date() && currentTask.etat !== 'cloturee';
  const commentsCount = currentTask.commentaires?.length || 0;
  const historyCount = currentTask.history?.length || 0;
  const attachmentsCount = currentTask.attachments?.length || 0;

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

  const downloadAttachment = (attachment: TaskAttachment) => {
    // In a real app, this would download from the server
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.nom;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    const attachmentToDelete = currentTask.attachments?.find(att => att.id === attachmentId);
    if (!attachmentToDelete) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer définitivement le fichier "${attachmentToDelete.nom}" ?\n\nCette action est irréversible et le fichier sera supprimé de la tâche.`;
    
    if (window.confirm(confirmMessage)) {
      // Clean up object URL to prevent memory leaks
      if (attachmentToDelete.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachmentToDelete.url);
      }

      // Update the task with the attachment removed
      const updatedAttachments = currentTask.attachments?.filter(att => att.id !== attachmentId);
      const updatedTask = {
        ...currentTask,
        attachments: updatedAttachments && updatedAttachments.length > 0 ? updatedAttachments : undefined
      };

      setCurrentTask(updatedTask);
      
      // Notify parent component if callback is provided
      if (onUpdateTask) {
        onUpdateTask(updatedTask);
      }
    }
  };

  const handleDelete = () => {
    onDelete(currentTask.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Détails de la tâche
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Informations complètes de la tâche
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors relative"
                title="Voir l'historique"
              >
                <History size={18} />
                {historyCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {historyCount > 9 ? '9+' : historyCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => onShowComments(currentTask)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
                title="Voir les commentaires"
              >
                <MessageCircle size={18} />
                {commentsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {commentsCount > 9 ? '9+' : commentsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => onEdit(currentTask)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Modifier la tâche"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer la tâche"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              {/* Titre et statut */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{currentTask.nom}</h3>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentTask.etat)}`}>
                    {getStatusText(currentTask.etat)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                    <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      Échéance : {currentTask.date_realisation.toLocaleDateString('fr-FR')}
                    </span>
                    {isOverdue && currentTask.etat !== 'cloturee' && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        En retard
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {currentTask.description && (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="text-blue-600" size={20} />
                    </div>
                    <h4 className="text-lg font-semibold text-blue-900">Description</h4>
                  </div>
                  <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">
                    {currentTask.description}
                  </p>
                </div>
              )}

              {/* Scénario d'exécution */}
              {currentTask.scenario_execution && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <PlayCircle className="text-green-600" size={20} />
                    </div>
                    <h4 className="text-lg font-semibold text-green-900">Scénario d'exécution</h4>
                  </div>
                  <p className="text-green-800 leading-relaxed whitespace-pre-wrap">
                    {currentTask.scenario_execution}
                  </p>
                </div>
              )}

              {/* Critères d'acceptation */}
              {currentTask.criteres_acceptation && (
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CheckCircle className="text-purple-600" size={20} />
                    </div>
                    <h4 className="text-lg font-semibold text-purple-900">Critères d'acceptation</h4>
                  </div>
                  <p className="text-purple-800 leading-relaxed whitespace-pre-wrap">
                    {currentTask.criteres_acceptation}
                  </p>
                </div>
              )}

              {/* Pièces jointes de la tâche */}
              {attachmentsCount > 0 && (
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Paperclip className="text-orange-600" size={20} />
                      </div>
                      <h4 className="text-lg font-semibold text-orange-900">
                        Pièces jointes ({attachmentsCount})
                      </h4>
                    </div>
                    <div className="text-xs text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
                      Cliquez sur la corbeille pour supprimer
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentTask.attachments?.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="bg-white rounded-lg p-4 border border-orange-200 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                            onClick={() => downloadAttachment(attachment)}
                          >
                            <span className="text-2xl">{getFileIcon(attachment.type)}</span>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {attachment.nom}
                              </h5>
                              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                <span>{formatFileSize(attachment.taille)}</span>
                                <span>par {attachment.uploaded_by.prenom} {attachment.uploaded_by.nom}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Ajouté le {attachment.uploaded_at.toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={() => downloadAttachment(attachment)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Télécharger le fichier"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Supprimer définitivement ce fichier"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Warning about deletion */}
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="text-yellow-600 mt-0.5">⚠️</div>
                      <div className="text-xs text-yellow-800">
                        <p className="font-medium">Attention :</p>
                        <p>La suppression d'une pièce jointe est définitive et ne peut pas être annulée. Le fichier sera supprimé de la tâche.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Membres assignés */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="text-gray-600" size={20} />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Membres assignés ({currentTask.utilisateurs.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTask.utilisateurs.map((user) => (
                    <div key={user.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.prenom.charAt(0)}{user.nom.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-gray-900">
                            {user.prenom} {user.nom}
                          </h5>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                            <div className="flex items-center space-x-1">
                              <Building size={12} />
                              <span>{user.departement}</span>
                            </div>
                            {user.fonction && (
                              <div className="flex items-center space-x-1">
                                <Briefcase size={12} />
                                <span>{user.fonction}</span>
                              </div>
                            )}
                          </div>
                          {user.email && (
                            <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commentaires - Maintenant au-dessus de l'historique */}
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <MessageCircle className="text-orange-600" size={20} />
                    </div>
                    <h4 className="text-lg font-semibold text-orange-900">
                      Commentaires ({commentsCount})
                    </h4>
                  </div>
                  <button
                    onClick={() => onShowComments(currentTask)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                  >
                    Voir tous les commentaires
                  </button>
                </div>
                <p className="text-orange-800">
                  {commentsCount > 0 ? (
                    <>
                      Cette tâche contient {commentsCount} commentaire{commentsCount > 1 ? 's' : ''}. 
                      Cliquez sur "Voir tous les commentaires" pour les consulter et en ajouter de nouveaux.
                    </>
                  ) : (
                    <>
                      Cette tâche n'a pas encore de commentaires. 
                      Cliquez sur "Voir tous les commentaires" pour en ajouter un.
                    </>
                  )}
                </p>
              </div>

              {/* Historique - Maintenant en dessous des commentaires */}
              {historyCount > 0 && (
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <History className="text-purple-600" size={20} />
                      </div>
                      <h4 className="text-lg font-semibold text-purple-900">
                        Historique ({historyCount})
                      </h4>
                    </div>
                    <button
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      Voir l'historique complet
                    </button>
                  </div>
                  <p className="text-purple-800">
                    Cette tâche contient {historyCount} action{historyCount > 1 ? 's' : ''} dans son historique. 
                    Cliquez sur "Voir l'historique complet" pour consulter toutes les modifications.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Créée le {new Date(currentTask.date_realisation).toLocaleDateString('fr-FR')}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <History size={16} />
                  <span>Historique</span>
                  {historyCount > 0 && (
                    <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {historyCount > 9 ? '9+' : historyCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => onShowComments(currentTask)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <MessageCircle size={16} />
                  <span>Commentaires</span>
                  {commentsCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {commentsCount > 9 ? '9+' : commentsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Supprimer</span>
                </button>
                <button
                  onClick={() => onEdit(currentTask)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit2 size={16} />
                  <span>Modifier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task History Modal */}
      <TaskHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        task={currentTask}
      />
    </>
  );
};

export default TaskDetailsModal;