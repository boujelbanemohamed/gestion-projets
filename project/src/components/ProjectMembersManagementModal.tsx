import React, { useState } from 'react';
import { X, Users, Plus, Trash2, AlertTriangle, User, Building, Briefcase, Search } from 'lucide-react';
import { Project, User as UserType } from '../types';

interface ProjectMembersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  availableUsers: UserType[];
  onUpdateProject: (project: Project) => void;
}

const ProjectMembersManagementModal: React.FC<ProjectMembersManagementModalProps> = ({
  isOpen,
  onClose,
  project,
  availableUsers,
  onUpdateProject
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Get current project members
  const projectMembers = Array.from(
    new Map(
      project.taches
        .flatMap(task => task.utilisateurs)
        .map(user => [user.id, user])
    ).values()
  );

  // Add project manager to members list if not already included
  const allProjectMembers = [...projectMembers];
  const projectManager = project.responsable_id 
    ? availableUsers.find(user => user.id === project.responsable_id)
    : null;
    
  if (projectManager && !projectMembers.some(member => member.id === projectManager.id)) {
    allProjectMembers.push(projectManager);
  }

  // Get available users to add (not already in project)
  const usersToAdd = availableUsers.filter(user => 
    !allProjectMembers.some(member => member.id === user.id)
  );

  // Filter users based on search
  const filteredUsersToAdd = usersToAdd.filter(user =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.fonction && user.fonction.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get tasks assigned to a specific user
  const getUserTasks = (userId: string) => {
    return project.taches.filter(task => 
      task.utilisateurs.some(user => user.id === userId)
    );
  };

  // Check if user can be removed (has no assigned tasks)
  const canRemoveUser = (userId: string) => {
    return getUserTasks(userId).length === 0;
  };

  // Add user to project
  const handleAddUser = (user: UserType) => {
    // For demo purposes, we'll add the user to the first incomplete task
    // In a real app, you might want to let the user choose which tasks to assign
    const incompleteTask = project.taches.find(task => task.etat !== 'cloturee');
    
    if (incompleteTask) {
      const updatedTasks = project.taches.map(task => {
        if (task.id === incompleteTask.id) {
          return {
            ...task,
            utilisateurs: [...task.utilisateurs, user]
          };
        }
        return task;
      });

      const updatedProject = {
        ...project,
        taches: updatedTasks,
        updated_at: new Date()
      };

      onUpdateProject(updatedProject);
    } else {
      alert('Aucune tâche disponible pour assigner ce membre. Créez d\'abord une tâche.');
    }
  };

  // Remove user from project
  const handleRemoveUser = (user: UserType) => {
    const userTasks = getUserTasks(user.id);
    
    if (!canRemoveUser(user.id)) {
      const taskNames = userTasks.map(task => task.nom).join(', ');
      alert(`Impossible de supprimer ${user.prenom} ${user.nom} car il/elle est assigné(e) aux tâches suivantes :\n\n${taskNames}\n\nVeuillez d'abord retirer ce membre de ces tâches.`);
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir retirer ${user.prenom} ${user.nom} du projet ?`)) {
      const updatedTasks = project.taches.map(task => ({
        ...task,
        utilisateurs: task.utilisateurs.filter(u => u.id !== user.id)
      }));

      const updatedProject = {
        ...project,
        taches: updatedTasks,
        updated_at: new Date()
      };

      onUpdateProject(updatedProject);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gestion des membres - {project.nom}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Ajouter ou retirer des membres du projet
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Members */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Users size={20} className="text-blue-600" />
                <span>Membres actuels ({allProjectMembers.length})</span>
              </h3>
              
              {allProjectMembers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-500">Aucun membre assigné</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allProjectMembers.map(member => {
                    const userTasks = getUserTasks(member.id);
                    const canRemove = canRemoveUser(member.id);
                    const isProjectManager = member.id === project.responsable_id;
                    
                    return (
                      <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {member.prenom.charAt(0)}{member.nom.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                {member.prenom} {member.nom}
                                {isProjectManager && (
                                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                    Responsable
                                  </span>
                                )}
                              </h4>
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Building size={12} />
                                  <span>{member.departement}</span>
                                </div>
                                {member.fonction && (
                                  <div className="flex items-center space-x-1">
                                    <Briefcase size={12} />
                                    <span>{member.fonction}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {isProjectManager && userTasks.length === 0 
                                  ? 'Responsable du projet' 
                                  : `${userTasks.length} tâche${userTasks.length > 1 ? 's' : ''} assignée${userTasks.length > 1 ? 's' : ''}`
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {!canRemove && !isProjectManager && (
                              <div className="flex items-center space-x-1 text-orange-600" title={`Assigné à : ${userTasks.map(t => t.nom).join(', ')}`}>
                                <AlertTriangle size={16} />
                                <span className="text-xs">Tâches assignées</span>
                              </div>
                            )}
                            {isProjectManager && (
                              <div className="flex items-center space-x-1 text-yellow-600" title="Responsable du projet - ne peut pas être supprimé">
                                <AlertTriangle size={16} />
                                <span className="text-xs">Responsable</span>
                              </div>
                            )}
                            <button
                              onClick={() => handleRemoveUser(member)}
                              disabled={!canRemove || isProjectManager}
                              className={`p-2 rounded-lg transition-colors ${
                                canRemove && !isProjectManager
                                  ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              title={
                                isProjectManager 
                                  ? 'Impossible de retirer le responsable du projet' 
                                  : canRemove 
                                    ? 'Retirer du projet' 
                                    : 'Impossible de retirer : membre assigné à des tâches'
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {!canRemove && !isProjectManager && userTasks.length > 0 && (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <AlertTriangle size={16} className="text-orange-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-orange-800">
                                  Impossible de supprimer ce membre
                                </p>
                                <p className="text-xs text-orange-700 mt-1">
                                  Tâches assignées : {userTasks.map(task => task.nom).join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {isProjectManager && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800">
                                  Responsable du projet
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                  Le responsable du projet ne peut pas être retiré de l'équipe. Modifiez d'abord le responsable dans les paramètres du projet.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Available Users to Add */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Plus size={20} className="text-green-600" />
                <span>Ajouter des membres ({usersToAdd.length} disponibles)</span>
              </h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {usersToAdd.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <User className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-500">Tous les membres sont déjà dans le projet</p>
                </div>
              ) : filteredUsersToAdd.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Search className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-500">Aucun membre trouvé</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredUsersToAdd.map(user => (
                    <div key={user.id} className="bg-green-50 rounded-lg p-4 border border-green-200 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.prenom.charAt(0)}{user.nom.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {user.prenom} {user.nom}
                            </h4>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
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
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleAddUser(user)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                          title="Ajouter au projet"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-blue-100 rounded">
                <AlertTriangle className="text-blue-600" size={16} />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Instructions :</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Cliquez sur <strong>+</strong> pour ajouter un membre au projet</li>
                  <li>Cliquez sur <strong>🗑️</strong> pour retirer un membre du projet</li>
                  <li>Les membres avec des tâches assignées ne peuvent pas être supprimés</li>
                  <li>Retirez d'abord le membre de ses tâches pour pouvoir le supprimer du projet</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {allProjectMembers.length} membre{allProjectMembers.length > 1 ? 's' : ''} dans le projet • 
              {usersToAdd.length} membre{usersToAdd.length > 1 ? 's' : ''} disponible{usersToAdd.length > 1 ? 's' : ''}
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

export default ProjectMembersManagementModal;