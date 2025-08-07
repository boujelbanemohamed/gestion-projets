import React, { useState } from 'react';
import { Bell, Users, FolderOpen, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { AuthUser } from '../../types';

interface NotificationManagementProps {
  currentUser: AuthUser;
}

interface NotificationSettings {
  id: string;
  type: 'project' | 'user';
  name: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: {
    projectUpdates: boolean;
    taskAssignments: boolean;
    deadlineReminders: boolean;
    comments: boolean;
    statusChanges: boolean;
    budgetAlerts: boolean;
    memberAdded: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const NotificationManagement: React.FC<NotificationManagementProps> = () => {
  const [settings, setSettings] = useState<NotificationSettings[]>([
    {
      id: '1',
      type: 'project',
      name: 'Site E-commerce',
      emailNotifications: true,
      pushNotifications: true,
      notificationTypes: {
        projectUpdates: true,
        taskAssignments: true,
        deadlineReminders: true,
        comments: false,
        statusChanges: true,
        budgetAlerts: true,
        memberAdded: true
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    },
    {
      id: '2',
      type: 'user',
      name: 'John Doe',
      emailNotifications: true,
      pushNotifications: false,
      notificationTypes: {
        projectUpdates: true,
        taskAssignments: true,
        deadlineReminders: true,
        comments: true,
        statusChanges: false,
        budgetAlerts: false,
        memberAdded: true
      },
      frequency: 'daily',
      quietHours: {
        enabled: true,
        start: '20:00',
        end: '07:00'
      }
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'users'>('projects');


  const filteredSettings = settings.filter(setting => 
    activeTab === 'projects' ? setting.type === 'project' : setting.type === 'user'
  );

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = (id: string, updatedSettings: NotificationSettings) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? updatedSettings : setting
    ));
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ces paramètres ?')) {
      setSettings(prev => prev.filter(setting => setting.id !== id));
    }
  };

  const getNotificationTypeLabel = (key: string) => {
    const labels: Record<string, string> = {
      projectUpdates: 'Mises à jour de projet',
      taskAssignments: 'Assignations de tâches',
      deadlineReminders: 'Rappels d\'échéances',
      comments: 'Commentaires',
      statusChanges: 'Changements de statut',
      budgetAlerts: 'Alertes budgétaires',
      memberAdded: 'Ajout de membres au projet'
    };
    return labels[key] || key;
  };



  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Gestion des notifications</h2>
        <p className="text-sm text-gray-600">
          Configurez les paramètres de notifications par projet et par utilisateur.
        </p>
      </div>

      {/* Onglets */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'projects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FolderOpen size={16} />
              <span>Par projet ({settings.filter(s => s.type === 'project').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users size={16} />
              <span>Par utilisateur ({settings.filter(s => s.type === 'user').length})</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bouton d'ajout */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'projects' ? 'Paramètres par projet' : 'Paramètres par utilisateur'}
          </h3>
          <p className="text-sm text-gray-600">
            {activeTab === 'projects' 
              ? 'Configurez les notifications pour chaque projet'
              : 'Configurez les notifications pour chaque utilisateur'
            }
          </p>
        </div>
                 <button
           onClick={() => {/* TODO: Implement create modal */}}
           className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
         >
           <Plus size={16} />
           <span>Ajouter</span>
         </button>
      </div>

      {/* Liste des paramètres */}
      <div className="space-y-4">
        {filteredSettings.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun paramètre configuré</h3>
            <p className="text-sm text-gray-500">
              {activeTab === 'projects' 
                ? 'Aucun projet n\'a de paramètres de notifications configurés.'
                : 'Aucun utilisateur n\'a de paramètres de notifications configurés.'
              }
            </p>
          </div>
        ) : (
          filteredSettings.map((setting) => (
            <div key={setting.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {setting.type === 'project' ? (
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Users className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{setting.name}</h4>
                    <p className="text-sm text-gray-500">
                      {setting.type === 'project' ? 'Projet' : 'Utilisateur'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {editingId === setting.id ? (
                    <>
                      <button
                        onClick={() => handleSave(setting.id, setting)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        <Save size={14} />
                        <span>Sauvegarder</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        <X size={14} />
                        <span>Annuler</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(setting.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        <Edit size={14} />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => handleDelete(setting.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        <Trash2 size={14} />
                        <span>Supprimer</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Canaux de notification */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Canaux de notification</h5>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={setting.emailNotifications}
                        onChange={(e) => {
                          if (editingId === setting.id) {
                            setSettings(prev => prev.map(s => 
                              s.id === setting.id 
                                ? { ...s, emailNotifications: e.target.checked }
                                : s
                            ));
                          }
                        }}
                        disabled={editingId !== setting.id}
                        className="mr-2"
                      />
                      <span className="text-sm">Notifications par email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={setting.pushNotifications}
                        onChange={(e) => {
                          if (editingId === setting.id) {
                            setSettings(prev => prev.map(s => 
                              s.id === setting.id 
                                ? { ...s, pushNotifications: e.target.checked }
                                : s
                            ));
                          }
                        }}
                        disabled={editingId !== setting.id}
                        className="mr-2"
                      />
                      <span className="text-sm">Notifications push</span>
                    </label>
                  </div>
                </div>

                {/* Types de notifications */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Types de notifications</h5>
                  <div className="space-y-2">
                    {Object.entries(setting.notificationTypes).map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            if (editingId === setting.id) {
                              setSettings(prev => prev.map(s => 
                                s.id === setting.id 
                                  ? { 
                                      ...s, 
                                      notificationTypes: {
                                        ...s.notificationTypes,
                                        [key]: e.target.checked
                                      }
                                    }
                                  : s
                              ));
                            }
                          }}
                          disabled={editingId !== setting.id}
                          className="mr-2"
                        />
                        <span className="text-sm">{getNotificationTypeLabel(key)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fréquence et heures silencieuses */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Paramètres avancés</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence</label>
                      <select
                        value={setting.frequency}
                                                 onChange={(e) => {
                           if (editingId === setting.id) {
                             setSettings(prev => prev.map(s => 
                               s.id === setting.id 
                                 ? { ...s, frequency: e.target.value as 'immediate' | 'daily' | 'weekly' }
                                 : s
                             ));
                           }
                         }}
                        disabled={editingId !== setting.id}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="immediate">Immédiat</option>
                        <option value="daily">Quotidien</option>
                        <option value="weekly">Hebdomadaire</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={setting.quietHours.enabled}
                          onChange={(e) => {
                            if (editingId === setting.id) {
                              setSettings(prev => prev.map(s => 
                                s.id === setting.id 
                                  ? { 
                                      ...s, 
                                      quietHours: { ...s.quietHours, enabled: e.target.checked }
                                    }
                                  : s
                              ));
                            }
                          }}
                          disabled={editingId !== setting.id}
                          className="mr-2"
                        />
                        <span className="text-sm">Heures silencieuses</span>
                      </label>
                    </div>

                    {setting.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Début</label>
                          <input
                            type="time"
                            value={setting.quietHours.start}
                            onChange={(e) => {
                              if (editingId === setting.id) {
                                setSettings(prev => prev.map(s => 
                                  s.id === setting.id 
                                    ? { 
                                        ...s, 
                                        quietHours: { ...s.quietHours, start: e.target.value }
                                      }
                                    : s
                                ));
                              }
                            }}
                            disabled={editingId !== setting.id}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Fin</label>
                          <input
                            type="time"
                            value={setting.quietHours.end}
                            onChange={(e) => {
                              if (editingId === setting.id) {
                                setSettings(prev => prev.map(s => 
                                  s.id === setting.id 
                                    ? { 
                                        ...s, 
                                        quietHours: { ...s.quietHours, end: e.target.value }
                                      }
                                    : s
                                ));
                              }
                            }}
                            disabled={editingId !== setting.id}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationManagement; 