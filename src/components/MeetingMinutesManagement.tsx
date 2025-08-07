import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit, Trash2, FileText, Calendar, Building, Eye, X } from 'lucide-react';
import { AuthUser, Project, MeetingMinutes } from '../types';
import { PermissionService } from '../utils/permissions';
import { useApi } from '../hooks/useApi';
import { mockProjects } from '../data/mockData';
import CreateMeetingMinutesModal from './CreateMeetingMinutesModal';
import EditMeetingMinutesModal from './EditMeetingMinutesModal';

interface MeetingMinutesManagementProps {
  currentUser: AuthUser;
  availableProjects?: Project[];
  selectedProjectId?: string | number; // ID du projet sélectionné depuis le détail projet
  selectedProjectName?: string; // Nom du projet pour l'affichage
}

const MeetingMinutesManagement: React.FC<MeetingMinutesManagementProps> = ({
  currentUser,
  availableProjects,
  selectedProjectId,
  selectedProjectName
}) => {
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinutes[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>(selectedProjectId ? selectedProjectId.toString() : '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPV, setEditingPV] = useState<MeetingMinutes | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const api = useApi();

  const canCreate = PermissionService.hasPermission(currentUser, 'meeting-minutes', 'create');
  const canEdit = PermissionService.hasPermission(currentUser, 'meeting-minutes', 'edit');
  const canDelete = PermissionService.hasPermission(currentUser, 'meeting-minutes', 'delete');

  useEffect(() => {
    loadMeetingMinutes();
  }, [currentPage, searchTerm, selectedProject, startDate, endDate]);

  // Load projects when component mounts or when availableProjects change
  useEffect(() => {
    loadProjects();
  }, [availableProjects]);

  const loadMeetingMinutes = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedProject) params.projet_id = selectedProject;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.getMeetingMinutes(params);
      setMeetingMinutes(response.meetingMinutes);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.warn('⚠️ Backend non disponible - Mode offline activé');
      console.error('Error loading meeting minutes from API:', error);
      // Fallback to empty list if API fails (backend not running)
      setMeetingMinutes([]);
      setTotalPages(1);
      setBackendAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);

      // Use projects from dashboard if available (ensures consistency)
      if (availableProjects && availableProjects.length > 0) {
        console.log('🎯 Using projects from dashboard:', availableProjects.length);
        setProjects(availableProjects);
        return;
      }

      // Fallback: Try to load from API
      const response = await api.getProjects();
      console.log('📡 Loaded projects from API:', response.projects.length);
      setProjects(response.projects);
    } catch (error) {
      console.error('Error loading projects from API, using mock data:', error);
      // Final fallback to mock data
      setProjects(mockProjects);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCreatePV = async (pvData: any) => {
    try {
      await api.createMeetingMinutes(pvData.titre, pvData.date_reunion, pvData.description, pvData.projets);
      setIsCreateModalOpen(false);
      loadMeetingMinutes();
    } catch (error) {
      console.error('Error creating meeting minutes:', error);
      // Check if it's a network error (backend not running)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('⚠️ Backend non disponible\n\nPour créer des PV de réunion, veuillez :\n1. Démarrer le backend (npm run dev)\n2. Vérifier que le serveur fonctionne sur http://localhost:3000');
      }
      throw error;
    }
  };

  const handleOpenCreateModal = () => {
    // Reload projects when opening the modal to get the latest list
    console.log('🔄 Rechargement de la liste des projets...');
    loadProjects();
    setIsCreateModalOpen(true);
  };

  const handleEditPV = async (id: string, pvData: any) => {
    try {
      await api.updateMeetingMinutes(id, pvData, pvData.projets);
      setIsEditModalOpen(false);
      setEditingPV(null);
      loadMeetingMinutes();
    } catch (error) {
      console.error('Error updating meeting minutes:', error);
      throw error;
    }
  };

  const handleDeletePV = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce PV ? Cette action est irréversible.')) {
      return;
    }

    try {
      await api.deleteMeetingMinutes(id);
      loadMeetingMinutes();
    } catch (error) {
      console.error('Error deleting meeting minutes:', error);
      alert('Erreur lors de la suppression du PV');
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      // Pour Supabase, on simule le téléchargement pour l'instant
      const blob = new Blob(['PV de réunion - ' + filename], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading meeting minutes:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProject('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="p-6">
      {/* Project Context Header */}
      {selectedProjectId && selectedProjectName && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                PV de Réunion - {selectedProjectName}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Affichage des procès-verbaux associés à ce projet uniquement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backend Status Warning */}
      {!backendAvailable && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Backend non disponible</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Le serveur backend n'est pas accessible. Vous pouvez consulter les projets mais pas créer de PV de réunion.
                <br />
                <strong>Solution :</strong> Démarrez le backend avec <code className="bg-yellow-100 px-1 rounded">npm run dev</code> dans le dossier backend.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PV de Réunion</h1>
            <p className="text-gray-600">Gestion centralisée des procès-verbaux de réunion</p>
          </div>
          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Ajouter un PV</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les projets</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nom}
                </option>
              ))}
            </select>

            {/* Date Start */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Date début"
            />

            {/* Date End */}
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Date fin"
            />
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedProject || startDate || endDate) && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
              >
                <X size={14} />
                <span>Effacer les filtres</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meeting Minutes List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : meetingMinutes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun PV trouvé</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedProject || startDate || endDate
                ? 'Aucun PV ne correspond aux critères de recherche'
                : 'Aucun PV de réunion n\'a été ajouté pour le moment'}
            </p>
            {canCreate && !searchTerm && !selectedProject && !startDate && !endDate && (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ajouter le premier PV
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de réunion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projets associés
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fichier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créé par
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {meetingMinutes.map((pv) => (
                    <tr key={pv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{pv.titre}</div>
                          {pv.description && (
                            <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                              {pv.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar size={16} className="mr-2 text-gray-400" />
                          {formatDate(pv.date_reunion)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {pv.projets && pv.projets.length > 0 ? (
                            pv.projets.map((projet) => (
                              <span
                                key={projet.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                <Building size={12} className="mr-1" />
                                {projet.nom || `Projet ${projet.id}`}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 italic">
                              Aucun projet associé
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FileText size={16} className="text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {pv.file_name || pv.nom_fichier || 'Fichier PV'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pv.taille_fichier ? formatFileSize(pv.taille_fichier) : 'Taille inconnue'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pv.uploaded_by_nom} {pv.uploaded_by_prenom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDownload(pv.id, pv.nom_fichier)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Télécharger"
                          >
                            <Download size={16} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingPV(pv);
                                setIsEditModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeletePV(pv.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} sur {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateMeetingMinutesModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePV}
          projects={projects}
          loadingProjects={loadingProjects}
        />
      )}

      {isEditModalOpen && editingPV && (
        <EditMeetingMinutesModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPV(null);
          }}
          onSubmit={(data) => handleEditPV(editingPV.id, data)}
          meetingMinutes={editingPV}
          projects={projects}
        />
      )}
    </div>
  );
};

export default MeetingMinutesManagement;
