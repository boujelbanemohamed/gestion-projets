import React from 'react';
import { X, History, Calendar, Clock } from 'lucide-react';
import { Task, TaskHistoryEntry } from '../types';
import { getActionIcon, getActionColor } from '../utils/taskHistory';

interface TaskHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

const TaskHistoryModal: React.FC<TaskHistoryModalProps> = ({
  isOpen,
  onClose,
  task
}) => {
  if (!isOpen) return null;

  const history = task.history || [];
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const groupHistoryByDate = (history: TaskHistoryEntry[]) => {
    const groups: { [key: string]: TaskHistoryEntry[] } = {};
    
    history.forEach(entry => {
      const dateKey = entry.created_at.toLocaleDateString('fr-FR');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    
    return groups;
  };

  const groupedHistory = groupHistoryByDate(sortedHistory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="text-purple-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Historique de la tâche
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {task.nom} • {history.length} action{history.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <History className="mx-auto text-gray-400 mb-4\" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun historique
              </h3>
              <p className="text-gray-500">
                L'historique des actions de cette tâche apparaîtra ici.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([date, entries]) => (
                <div key={date}>
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar size={16} className="text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900">{date}</h3>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  
                  <div className="space-y-3 ml-6">
                    {entries.map((entry) => (
                      <div key={entry.id} className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-8 bottom-0 w-px bg-gray-200"></div>
                        
                        <div className="flex items-start space-x-4">
                          {/* Action icon */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg ${getActionColor(entry.action)}`}>
                            {getActionIcon(entry.action)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 leading-relaxed">
                                  {entry.description}
                                </p>
                                
                                {/* Additional details */}
                                {entry.details && (
                                  <div className="mt-2 p-3 bg-white rounded-md border border-gray-200">
                                    <div className="text-xs text-gray-600">
                                      {entry.details.field && (
                                        <div className="mb-1">
                                          <span className="font-medium">Champ modifié :</span> {entry.details.field}
                                        </div>
                                      )}
                                      {entry.details.old_value && (
                                        <div className="mb-1">
                                          <span className="font-medium">Ancienne valeur :</span> {
                                            typeof entry.details.old_value === 'object' 
                                              ? JSON.stringify(entry.details.old_value)
                                              : entry.details.old_value
                                          }
                                        </div>
                                      )}
                                      {entry.details.new_value && (
                                        <div>
                                          <span className="font-medium">Nouvelle valeur :</span> {
                                            typeof entry.details.new_value === 'object'
                                              ? JSON.stringify(entry.details.new_value)
                                              : entry.details.new_value
                                          }
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                    {entry.auteur.prenom.charAt(0)}{entry.auteur.nom.charAt(0)}
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    {entry.auteur.prenom} {entry.auteur.nom}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Clock size={12} />
                                  <span>{formatTimeAgo(entry.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {history.length} action{history.length > 1 ? 's' : ''} enregistrée{history.length > 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskHistoryModal;