import React, { useState, useEffect } from 'react';
import { X, Save, Edit2, Building, FileText, Upload, File, Trash2, Download, Calendar, User, DollarSign } from 'lucide-react';
import { Project, Department, ProjectAttachment, User as UserType, AuthUser } from '../types';
import { CURRENCIES } from '../utils/budgetCalculations';

interface ProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: {
    nom: string;
    description?: string;
    type_projet?: string;
    budget_initial?: number;
    devise?: string;
    responsable_id?: string;
    prestataire_externe?: string;
    nouvelles_fonctionnalites?: string;
    avantages?: string;
    departement?: string;
    attachments?: ProjectAttachment[];
    date_debut?: Date;
    date_fin?: Date;
  }) => void;
  project: Project;
  departments: Department[];
  availableUsers: UserType[];
}

const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  project,
  departments,
  availableUsers
}) => {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    type_projet: '',
    budget_initial: '',
    devise: '',
    responsable_id: '',
    prestataire_externe: '',
    nouvelles_fonctionnalites: '',
    avantages: '',
    departement: '',
    dateDebut: '',
    dateFin: ''
  });
  const [existingAttachments, setExistingAttachments] = useState<ProjectAttachment[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock current user for demo purposes
  const getCurrentUser = (): AuthUser => {
    return {
      id: 'current-user',
      nom: 'Utilisateur',
      prenom: 'Système',
      departement: 'Administration',
      email: 'system@example.com',
      role: 'SUPER_ADMIN',
      created_at: new Date()
    };
  };

  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        nom: project.nom,
        description: project.description || '',
        type_projet: project.type_projet || '',
        budget_initial: project.budget_initial ? project.budget_initial.toString() : '',
        devise: project.devise || '',
        responsable_id: project.responsable_id || '',
        prestataire_externe: project.prestataire_externe || '',
        nouvelles_fonctionnalites: project.nouvelles_fonctionnalites || '',
        avantages: project.avantages || '',
        departement: project.departement || '',
        dateDebut: project.date_debut ? project.date_debut.toISOString().split('T')[0] : '',
        dateFin: project.date_fin ? project.date_fin.toISOString().split('T')[0] : ''
      });
      setExistingAttachments(project.attachments || []);
      setNewAttachments([]);
      setErrors({});
    }
  }, [isOpen, project]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du projet est obligatoire';
    }

    if (formData.dateDebut && formData.dateFin && new Date(formData.dateDebut) > new Date(formData.dateFin)) {
      newErrors.dateFin = 'La date de fin doit être postérieure à la date de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const currentUser = getCurrentUser();
      
      // Convert new files to ProjectAttachment objects
      const newProjectAttachments: ProjectAttachment[] = newAttachments.map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        nom: file.name,
        taille: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // In a real app, this would be the server URL
        uploaded_at: new Date(),
        uploaded_by: currentUser
      }));

      // Combine existing and new attachments
      const allAttachments = [...existingAttachments, ...newProjectAttachments];

      onSubmit({
        nom: formData.nom.trim(),
        description: formData.description.trim() || undefined,
        budget_initial: formData.budget_initial ? parseFloat(formData.budget_initial) : undefined,
        devise: formData.devise.trim() || undefined,
        type_projet: formData.type_projet.trim() || undefined,
        responsable_id: formData.responsable_id || undefined,
        prestataire_externe: formData.prestataire_externe.trim() || undefined,
        nouvelles_fonctionnalites: formData.nouvelles_fonctionnalites.trim() || undefined,
        avantages: formData.avantages.trim() || undefined,
        departement: formData.departement.trim() || undefined,
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
        date_debut: formData.dateDebut ? new Date(formData.dateDebut) : undefined,
        date_fin: formData.dateFin ? new Date(formData.dateFin) : undefined
      });
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`Le fichier "${file.name}" est trop volumineux (max 10MB)`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`Le type de fichier "${file.name}" n'est pas autorisé`);
        return false;
      }
      return true;
    });

    setNewAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeExistingAttachment = (attachmentId: string) => {
    setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

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

  const downloadAttachment = (attachment: ProjectAttachment) => {
    // In a real app, this would download from the server
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.nom;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const totalAttachments = existingAttachments.length + newAttachments.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit2 className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Modifier le projet
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom du projet */}
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du projet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              value={formData.nom}
              onChange={(e) => handleInputChange('nom', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.nom ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ex: Refonte du site web"
              autoFocus
            />
            {errors.nom && (
              <p className="text-red-600 text-sm mt-1">{errors.nom}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3">
                <FileText size={16} className="text-gray-400" />
              </div>
              <textarea
                id="projectDescription"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Décrivez brièvement les objectifs et le contexte du projet..."
                maxLength={1000}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Description détaillée du projet (optionnel)
              </p>
              <p className="text-xs text-gray-500">
                {formData.description.length}/1000 caractères
              </p>
            </div>
          </div>

          {/* Type Projet */}
          <div>
            <label htmlFor="typeProjet" className="block text-sm font-medium text-gray-700 mb-2">
              Type de projet
            </label>
            <input
              type="text"
              id="typeProjet"
              value={formData.type_projet}
              onChange={(e) => handleInputChange('type_projet', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Ex: Développement, Maintenance, Innovation..."
              maxLength={100}
            />
          </div>

          {/* Budget Initial et Devise */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="budgetInitial" className="block text-sm font-medium text-gray-700 mb-2">
                Budget Initial
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <DollarSign size={16} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  id="budgetInitial"
                  value={formData.budget_initial}
                  onChange={(e) => handleInputChange('budget_initial', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: 10000"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label htmlFor="devise" className="block text-sm font-medium text-gray-700 mb-2">
                Devise
              </label>
              <select
                id="devise"
                value={formData.devise}
                onChange={(e) => handleInputChange('devise', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Sélectionner une devise</option>
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsable du projet */}
          <div>
            <label htmlFor="responsable" className="block text-sm font-medium text-gray-700 mb-2">
              Responsable du projet
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <User size={16} className="text-gray-400" />
              </div>
              <select
                id="responsable"
                value={formData.responsable_id}
                onChange={(e) => handleInputChange('responsable_id', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
              >
                <option value="">Aucun responsable assigné</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.prenom} {user.nom} {user.fonction ? `(${user.fonction})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {availableUsers.length === 0 && (
              <p className="text-amber-600 text-sm mt-1">
                Aucun membre disponible. Créez d'abord des membres pour pouvoir assigner un responsable.
              </p>
            )}
          </div>

          {/* Prestataire externe */}
          <div>
            <label htmlFor="prestataireExterne" className="block text-sm font-medium text-gray-700 mb-2">
              Prestataire externe
            </label>
            <input
              type="text"
              id="prestataireExterne"
              value={formData.prestataire_externe}
              onChange={(e) => handleInputChange('prestataire_externe', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Nom du prestataire externe (optionnel)"
              maxLength={200}
            />
          </div>

          {/* Nouvelles fonctionnalités */}
          <div>
            <label htmlFor="nouvellesFonctionnalites" className="block text-sm font-medium text-gray-700 mb-2">
              Nouvelles fonctionnalités
            </label>
            <textarea
              id="nouvellesFonctionnalites"
              value={formData.nouvelles_fonctionnalites}
              onChange={(e) => handleInputChange('nouvelles_fonctionnalites', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Décrivez les nouvelles fonctionnalités apportées par ce projet..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.nouvelles_fonctionnalites.length}/1000 caractères
            </p>
          </div>

          {/* Avantages */}
          <div>
            <label htmlFor="avantages" className="block text-sm font-medium text-gray-700 mb-2">
              Avantages
            </label>
            <textarea
              id="avantages"
              value={formData.avantages}
              onChange={(e) => handleInputChange('avantages', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Décrivez les avantages et bénéfices attendus de ce projet..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.avantages.length}/1000 caractères
            </p>
          </div>

          {/* Département */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
              Département
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Building size={16} className="text-gray-400" />
              </div>
              <select
                id="department"
                value={formData.departement}
                onChange={(e) => handleInputChange('departement', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
              >
                <option value="">Aucun département assigné</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.nom}>{dept.nom}</option>
                ))}
              </select>
            </div>
            {departments.length === 0 && (
              <p className="text-amber-600 text-sm mt-1">
                Aucun département disponible. Créez d'abord des départements si vous souhaitez en assigner un.
              </p>
            )}
          </div>

          {/* Dates du projet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dateDebut" className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                id="dateDebut"
                value={formData.dateDebut}
                onChange={(e) => handleInputChange('dateDebut', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.dateDebut ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dateDebut && <p className="text-red-600 text-sm mt-1">{errors.dateDebut}</p>}
            </div>

            <div>
              <label htmlFor="dateFin" className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                id="dateFin"
                value={formData.dateFin}
                onChange={(e) => handleInputChange('dateFin', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.dateFin ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dateFin && <p className="text-red-600 text-sm mt-1">{errors.dateFin}</p>}
            </div>
          </div>

          {/* Pièces jointes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pièces jointes ({totalAttachments})
            </label>
            <div className="space-y-4">
              {/* Existing Attachments */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Fichiers existants ({existingAttachments.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {existingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(attachment.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.nom}
                            </p>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>{formatFileSize(attachment.taille)}</span>
                              <div className="flex items-center space-x-1">
                                <Calendar size={10} />
                                <span>{attachment.uploaded_at.toLocaleDateString('fr-FR')}</span>
                              </div>
                              <span>par {attachment.uploaded_by.prenom} {attachment.uploaded_by.nom}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => downloadAttachment(attachment)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Télécharger le fichier"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExistingAttachment(attachment.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer le fichier"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="fileUpload"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                />
                <label
                  htmlFor="fileUpload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Upload className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Cliquez pour ajouter de nouveaux fichiers
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Word, Excel, Images, Texte (max 10MB par fichier)
                    </p>
                  </div>
                </label>
              </div>

              {/* New Attachments */}
              {newAttachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Nouveaux fichiers ({newAttachments.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {newAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-green-50 rounded-lg p-3 border border-green-200"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • Nouveau fichier
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewAttachment(index)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer le fichier"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informations du projet */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Informations du projet</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Date de création :</span>
                <span className="ml-2 font-medium text-gray-900">
                  {project.created_at.toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Dernière modification :</span>
                <span className="ml-2 font-medium text-gray-900">
                  {project.updated_at.toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Nombre de tâches :</span>
                <span className="ml-2 font-medium text-gray-900">
                  {project.taches.length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tâches terminées :</span>
                <span className="ml-2 font-medium text-gray-900">
                  {project.taches.filter(t => t.etat === 'cloturee').length}
                </span>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!formData.nom.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Save size={18} />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectEditModal;