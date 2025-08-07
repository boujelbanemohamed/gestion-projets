import React from 'react';
import { X, FileText, Calendar, User, ExternalLink, DollarSign, Building, Download, Edit2, Lightbulb, TrendingUp, Users, Plus, Clock, Briefcase } from 'lucide-react';
import { Project, User as UserType } from '../types';
import { exportProjectToPdf } from '../utils/pdfExport';

interface ProjectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  availableUsers: UserType[];
  onEditProject: () => void;
  onManageMembers: () => void;
}

const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({
  isOpen,
  onClose,
  project,
  availableUsers,
  onEditProject,
  onManageMembers
}) => {
  if (!isOpen) return null;

  // Get project manager
  const projectManager = project.responsable_id 
    ? availableUsers.find(user => user.id === project.responsable_id)
    : null;

  // Get unique members from all tasks
  const projectMembers = Array.from(
    new Map(
      project.taches
        .flatMap(task => task.utilisateurs)
        .map(user => [user.id, user])
    ).values()
  );

  // Add project manager to members list if not already included
  const allProjectMembers = [...projectMembers];
  if (projectManager && !projectMembers.some(member => member.id === projectManager.id)) {
    allProjectMembers.push(projectManager);
  }

  const handleExportPdf = () => {
    exportProjectToPdf(project);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Informations du projet
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Détails complets du projet {project.nom}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPdf}
              className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Imprimer fiche projet</span>
            </button>
            <button
              onClick={onEditProject}
              className="px-3 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2"
            >
              <Edit2 size={16} />
              <span>Modifier</span>
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
          <div className="space-y-8">
            {/* En-tête du projet */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.nom}</h3>
                  <div className="flex items-center space-x-4">
                    {project.type_projet && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {project.type_projet}
                      </span>
                    )}
                    {project.departement && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Building size={14} />
                        <span>{project.departement}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                    <Calendar size={14} />
                    <span>Créé le {project.created_at.toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Clock size={14} />
                    <span>Modifié le {project.updated_at.toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
              
              {project.description && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations générales */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FileText size={20} className="text-blue-600" />
                  <span>Informations générales</span>
                </h4>
                <div className="space-y-4">
                  {/* Responsable */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <User size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Responsable du projet</p>
                      <p className="text-sm text-gray-600">
                        {projectManager ? `${projectManager.prenom} ${projectManager.nom}` : "N/A"}
                      </p>
                      {projectManager?.fonction && (
                        <p className="text-xs text-gray-500">{projectManager.fonction}</p>
                      )}
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <DollarSign size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Budget initial</p>
                      <p className="text-sm text-gray-600">
                        {project.budget_initial ? `${project.budget_initial} ${project.devise || ''}` : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Prestataire externe */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <ExternalLink size={16} className="text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Prestataire externe</p>
                      <p className="text-sm text-gray-600">
                        {project.prestataire_externe || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates et localisation */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar size={20} className="text-purple-600" />
                  <span>Planning et localisation</span>
                </h4>
                <div className="space-y-4">
                  {/* Dates du projet */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Calendar size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Date de début</p>
                      <p className="text-sm text-gray-600">
                        {project.date_debut ? project.date_debut.toLocaleDateString('fr-FR') : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Calendar size={16} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Date de fin</p>
                      <p className="text-sm text-gray-600">
                        {project.date_fin ? project.date_fin.toLocaleDateString('fr-FR') : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Département */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Building size={16} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Département</p>
                      <p className="text-sm text-gray-600">
                        {project.departement || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fonctionnalités et avantages */}
            {(project.nouvelles_fonctionnalites || project.avantages) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Nouvelles fonctionnalités */}
                {project.nouvelles_fonctionnalites && (
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Lightbulb size={18} className="text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-blue-900">Nouvelles fonctionnalités</h4>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                        {project.nouvelles_fonctionnalites}
                      </p>
                    </div>
                  </div>
                )}

                {/* Avantages */}
                {project.avantages && (
                  <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp size={18} className="text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-green-900">Avantages</h4>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
                        {project.avantages}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Membres du projet */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users size={20} className="text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Équipe du projet ({allProjectMembers.length} membre{allProjectMembers.length > 1 ? 's' : ''})
                  </h4>
                </div>
                <button
                  onClick={onManageMembers}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Gérer les membres</span>
                </button>
              </div>
              
              {allProjectMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allProjectMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.prenom.charAt(0)}{member.nom.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {member.prenom} {member.nom}
                            </p>
                            {member.id === project.responsable_id && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                Responsable
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {member.fonction && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Briefcase size={10} />
                                <span className="truncate">{member.fonction}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Building size={10} />
                              <span className="truncate">{member.departement}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Users className="mx-auto text-gray-400 mb-3" size={32} />
                  <h5 className="text-lg font-medium text-gray-900 mb-2">Aucun membre assigné</h5>
                  <p className="text-gray-500 mb-4">Ce projet n'a pas encore de membres assignés</p>
                  <button
                    onClick={onManageMembers}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Plus size={16} />
                    <span>Ajouter des membres</span>
                  </button>
                </div>
              )}
            </div>

            {/* Statistiques du projet */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar size={20} className="text-gray-600" />
                <span>Informations temporelles</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Calendar className="mx-auto text-blue-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-blue-900">Date de création</p>
                  <p className="text-sm text-blue-700">{project.created_at.toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <Calendar className="mx-auto text-green-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-green-900">Date de début</p>
                  <p className="text-sm text-green-700">
                    {project.date_debut ? project.date_debut.toLocaleDateString('fr-FR') : "N/A"}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <Calendar className="mx-auto text-red-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-red-900">Date de fin</p>
                  <p className="text-sm text-red-700">
                    {project.date_fin ? project.date_fin.toLocaleDateString('fr-FR') : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoModal;