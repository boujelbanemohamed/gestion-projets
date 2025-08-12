import React, { useState, useEffect, useMemo } from 'react';
import { X, Briefcase, Search, Check, Shield } from 'lucide-react';
import { User as UserType, Project, AuthUser } from '../types';
import { PermissionService } from '../utils/permissions';

interface ProjectAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: UserType | undefined;
  projects: Project[];
  currentUser: AuthUser;
  onAssignProjects: (memberId: string, projectIds: string[]) => void;
}

const ProjectAssignmentModal: React.FC<ProjectAssignmentModalProps> = ({
  isOpen,
  onClose,
  member,
  projects,
  currentUser,
  onAssignProjects
}) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter projects based on current user's permissions
  const assignableProjects = useMemo(() => {
    return PermissionService.getAssignableProjects(currentUser, projects);
  }, [currentUser, projects]);

  useEffect(() => {
    if (member && isOpen) {
      setSelectedProjects(member.assigned_projects || []);
      setSearchTerm('');
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const filteredProjects = assignableProjects.filter(project =>
    project.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSubmit = () => {
    onAssignProjects(member.id, selectedProjects);
  };

  const handleSelectAll = () => {
    setSelectedProjects(filteredProjects.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedProjects([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Assigner des projets
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {member.prenom} {member.nom} - {member.email}
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

        <div className="p-6">
          {/* Permission Info */}
          {currentUser.role === 'USER' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="text-blue-600" size={16} />
                <p className="text-sm text-blue-800">
                  <strong>Permissions :</strong> Vous ne pouvez assigner que les projets dont vous êtes responsable.
                </p>
              </div>
            </div>
          )}

          {assignableProjects.length === 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="text-yellow-600" size={16} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Aucun projet disponible pour assignation
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {currentUser.role === 'USER'
                      ? 'Vous devez être responsable d\'un projet pour pouvoir y assigner des membres.'
                      : 'Aucun projet disponible dans le système.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un projet..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div className="flex space-x-2 ml-4">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Tout sélectionner
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          {/* Projects List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="mx-auto mb-2" size={32} />
                <p>Aucun projet trouvé</p>
                {searchTerm && (
                  <p className="text-sm mt-1">Essayez de modifier votre recherche</p>
                )}
              </div>
            ) : (
              filteredProjects.map((project) => (
                <label
                  key={project.id}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => handleProjectToggle(project.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    {selectedProjects.includes(project.id) && (
                      <Check className="absolute -top-1 -right-1 h-3 w-3 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {project.nom}
                      </h3>
                      <div className="flex items-center space-x-2 ml-2">
                        {project.responsable_id === currentUser.id && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Shield size={12} className="mr-1" />
                            Responsable
                          </span>
                        )}
                        {project.statut && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            project.statut === 'actif'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {project.statut === 'actif' ? 'Actif' : 'Clôturé'}
                          </span>
                        )}
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {project.departement && (
                        <span>Département: {project.departement}</span>
                      )}
                      <span>Tâches: {project.taches?.length || 0}</span>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {selectedProjects.length} projet{selectedProjects.length > 1 ? 's' : ''} sélectionné{selectedProjects.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {member.prenom} {member.nom} aura accès à ces projets
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Check size={16} />
            <span>Assigner les projets</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectAssignmentModal;
