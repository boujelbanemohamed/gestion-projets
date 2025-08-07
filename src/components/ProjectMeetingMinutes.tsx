import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Eye, AlertCircle, Building } from 'lucide-react';
import { MeetingMinutes } from '../types';
import { useApi } from '../hooks/useApi';

interface ProjectMeetingMinutesProps {
  projectId: string;
  projectName: string;
}

const ProjectMeetingMinutes: React.FC<ProjectMeetingMinutesProps> = ({
  projectId,
  projectName
}) => {
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinutes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const api = useApi();

  useEffect(() => {
    loadProjectMeetingMinutes();
  }, [projectId]);

  const loadProjectMeetingMinutes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getMeetingMinutes(projectId);
      setMeetingMinutes(response.meetingMinutes);
    } catch (error: any) {
      console.error('Error loading project meeting minutes:', error);
      setError('Erreur lors du chargement des PV de réunion');
    } finally {
      setLoading(false);
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

  const formatFileSize = (bytes: number | undefined | null): string => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return 'Taille inconnue';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <FileText className="text-blue-500" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">PV de Réunion</h3>
            <p className="text-sm text-gray-600">
              Procès-verbaux associés au projet "{projectName}"
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {meetingMinutes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Aucun PV de réunion
            </h4>
            <p className="text-gray-500">
              Aucun procès-verbal n'est associé à ce projet pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetingMinutes.map((pv) => (
              <div
                key={pv.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Title and Description */}
                    <div className="mb-3">
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        {pv.titre}
                      </h4>
                      {pv.description && (
                        <p className="text-sm text-gray-600">
                          {pv.description}
                        </p>
                      )}
                    </div>

                    {/* Meeting Date */}
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                      <Calendar size={16} />
                      <span>Réunion du {formatDate(pv.date_reunion)}</span>
                    </div>

                    {/* File Info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <FileText size={16} />
                        <span>{pv.file_name || pv.nom_fichier || 'Fichier PV'}</span>
                      </div>
                      <span>•</span>
                      <span>{formatFileSize(pv.taille_fichier || pv.file_size)}</span>
                      <span>•</span>
                      <span>
                        {pv.uploaded_by_nom && pv.uploaded_by_prenom
                          ? `Ajouté par ${pv.uploaded_by_nom} ${pv.uploaded_by_prenom}`
                          : `Créé le ${formatDate(pv.created_at)}`
                        }
                      </span>
                    </div>

                    {/* Associated Projects */}
                    {pv.projets && pv.projets.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">
                          {pv.projets.length === 1 ? 'Projet associé :' : 'Projets associés :'}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {pv.projets.map((projet) => (
                            <span
                              key={projet.id}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                projet.id.toString() === projectId
                                  ? 'bg-blue-100 text-blue-800 font-semibold'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <Building size={12} className="mr-1" />
                              {projet.nom || `Projet ${projet.id}`}
                              {projet.id.toString() === projectId && (
                                <span className="ml-1 text-blue-600">•</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDownload(pv.id, pv.file_name || pv.nom_fichier || `PV_${pv.titre}.pdf`)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Télécharger le PV"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {meetingMinutes.length > 0 && (
        <div className="px-6 py-3 border-t bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            {meetingMinutes.length} PV de réunion{meetingMinutes.length !== 1 ? 's' : ''} associé{meetingMinutes.length !== 1 ? 's' : ''} à ce projet
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectMeetingMinutes;
