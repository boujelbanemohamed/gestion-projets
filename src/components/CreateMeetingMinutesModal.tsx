import React, { useState } from 'react';
import { X, Upload, FileText, Calendar, Building, AlertCircle } from 'lucide-react';
import { Project } from '../types';

interface CreateMeetingMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  projects: Project[];
  loadingProjects?: boolean;
}

const CreateMeetingMinutesModal: React.FC<CreateMeetingMinutesModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
  loadingProjects = false
}) => {
  const [formData, setFormData] = useState({
    titre: '',
    date_reunion: '',
    description: '',
    projets: [] as string[]
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Type de fichier non autorisé. Veuillez sélectionner un fichier PDF, Word, Excel ou texte.');
        return;
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Le fichier est trop volumineux. Taille maximale autorisée : 10MB.');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
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

    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setLoading(true);

      // Create FormData
      const submitData = new FormData();
      submitData.append('titre', formData.titre.trim());
      submitData.append('date_reunion', formData.date_reunion);
      submitData.append('description', formData.description.trim());
      submitData.append('projets', JSON.stringify(formData.projets));
      submitData.append('file', file);

      await onSubmit(submitData);
      
      // Reset form
      setFormData({
        titre: '',
        date_reunion: '',
        description: '',
        projets: []
      });
      setFile(null);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la création du PV');
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
          <h2 className="text-xl font-semibold text-gray-900">Ajouter un PV de Réunion</h2>
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

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichier PV *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <label
                htmlFor="file"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <Upload className="text-gray-400" size={32} />
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-700">
                    Cliquez pour sélectionner un fichier
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, Word, Excel ou Texte (max 10MB)
                  </p>
                </div>
              </label>
            </div>
            
            {file && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center space-x-3">
                <FileText className="text-blue-500" size={20} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{file.name}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Projects Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projets associés * ({formData.projets.length} sélectionné{formData.projets.length !== 1 ? 's' : ''} sur {projects.length} disponible{projects.length !== 1 ? 's' : ''})
            </label>
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              {loadingProjects ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Chargement des projets...</span>
                  </div>
                </div>
              ) : projects.length === 0 ? (
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
              <span>{loading ? 'Création...' : 'Créer le PV'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingMinutesModal;
