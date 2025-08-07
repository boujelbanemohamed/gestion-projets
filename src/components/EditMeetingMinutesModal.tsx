import React, { useState, useEffect } from 'react';
import { X, Calendar, Building, AlertCircle, FileText } from 'lucide-react';
import { Project, MeetingMinutes } from '../types';

interface EditMeetingMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  meetingMinutes: MeetingMinutes;
  projects: Project[];
}

const EditMeetingMinutesModal: React.FC<EditMeetingMinutesModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  meetingMinutes,
  projects
}) => {
  const [formData, setFormData] = useState({
    titre: '',
    date_reunion: '',
    description: '',
    projets: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (meetingMinutes) {
      setFormData({
        titre: meetingMinutes.titre,
        date_reunion: new Date(meetingMinutes.date_reunion).toISOString().split('T')[0],
        description: meetingMinutes.description || '',
        projets: meetingMinutes.projets.map(p => p.id)
      });
    }
  }, [meetingMinutes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProjectToggle = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projets: prev.projets.includes(projectId)
        ? prev.projets.filter(id => id !== projectId)
        : [...prev.projets, projectId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.titre.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    if (!formData.date_reunion) {
      setError('La date de réunion est obligatoire');
      return;
    }

    if (formData.projets.length === 0) {
      setError('Veuillez sélectionner au moins un projet');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        titre: formData.titre.trim(),
        date_reunion: formData.date_reunion,
        description: formData.description.trim(),
        projets: formData.projets
      };

      await onSubmit(submitData);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la modification du PV');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Modifier le PV de Réunion</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="text-red-500" size={20} />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Current File Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Fichier actuel</h3>
            <div className="flex items-center space-x-3">
              <FileText className="text-blue-500" size={20} />
              <div>
                <div className="text-sm font-medium text-gray-900">{meetingMinutes.nom_fichier}</div>
                <div className="text-xs text-gray-500">{formatFileSize(meetingMinutes.taille_fichier)}</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: Pour modifier le fichier, vous devez supprimer ce PV et en créer un nouveau.
            </p>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-2">
              Titre du PV *
            </label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Réunion de suivi projet..."
              required
            />
          </div>

          {/* Meeting Date */}
          <div>
            <label htmlFor="date_reunion" className="block text-sm font-medium text-gray-700 mb-2">
              Date de la réunion *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                id="date_reunion"
                name="date_reunion"
                value={formData.date_reunion}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description du contenu du PV..."
            />
          </div>

          {/* Projects Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projets associés * ({formData.projets.length} sélectionné{formData.projets.length !== 1 ? 's' : ''})
            </label>
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucun projet disponible
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {projects.map((project) => (
                    <label
                      key={project.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.projets.includes(project.id)}
                        onChange={() => handleProjectToggle(project.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Building size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{project.nom}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{loading ? 'Modification...' : 'Modifier le PV'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMeetingMinutesModal;
