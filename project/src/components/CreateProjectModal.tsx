import React, { useState } from 'react';
import { X, Plus, Upload, File, Trash2, DollarSign } from 'lucide-react';
import { Department, User } from '../types';
import { CURRENCIES } from '../utils/budgetCalculations';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: {
    nom: string;
    type_projet?: string;
    description?: string;
    budget_initial?: number;
    devise?: string;
    responsable_id?: string;
    prestataire_externe?: string;
    nouvelles_fonctionnalites?: string;
    avantages?: string;
    departement?: string;
    dateDebut?: Date;
    dateFin?: Date;
    attachments?: File[];
  }) => void;
  departments: Department[];
  availableUsers: User[];
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  departments,
  availableUsers
}) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [typeProjet, setTypeProjet] = useState('');
  const [budgetInitial, setBudgetInitial] = useState('');
  const [devise, setDevise] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [prestataireExterne, setPrestataireExterne] = useState('');
  const [nouvellesFonctionnalites, setNouvellesFonctionnalites] = useState('');
  const [avantages, setAvantages] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!projectName.trim()) {
      newErrors.projectName = 'Le nom du projet est obligatoire';
    }

    if (dateDebut && dateFin && new Date(dateDebut) > new Date(dateFin)) {
      newErrors.dateFin = 'La date de fin doit être postérieure à la date de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        nom: projectName.trim(),
        type_projet: typeProjet.trim() || undefined,
        budget_initial: budgetInitial ? parseFloat(budgetInitial) : undefined,
        devise: devise || undefined,
        description: projectDescription.trim() || undefined,
        responsable_id: responsableId || undefined,
        prestataire_externe: prestataireExterne.trim() || undefined,
        nouvelles_fonctionnalites: nouvellesFonctionnalites.trim() || undefined,
        avantages: avantages.trim() || undefined,
        departement: selectedDepartment || undefined,
        dateDebut: dateDebut ? new Date(dateDebut) : undefined,
        dateFin: dateFin ? new Date(dateFin) : undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      });
      setProjectName('');
      setProjectDescription('');
      setTypeProjet('');
      setBudgetInitial('');
      setDevise('');
      setResponsableId('');
      setPrestataireExterne('');
      setNouvellesFonctionnalites('');
      setAvantages('');
      setSelectedDepartment('');
      setDateDebut('');
      setDateFin('');
      setAttachments([]);
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'projectName') {
      setProjectName(value);
    } else if (field === 'typeProjet') {
      setTypeProjet(value);
    } else if (field === 'budgetInitial') {
      setBudgetInitial(value);
    } else if (field === 'devise') {
      setDevise(value);
    } else if (field === 'projectDescription') {
      setProjectDescription(value);
    } else if (field === 'responsable') {
      setResponsableId(value);
    } else if (field === 'prestataireExterne') {
      setPrestataireExterne(value);
    } else if (field === 'nouvellesFonctionnalites') {
      setNouvellesFonctionnalites(value);
    } else if (field === 'avantages') {
      setAvantages(value);
    } else if (field === 'department') {
      setSelectedDepartment(value);
    } else if (field === 'dateDebut') {
      setDateDebut(value);
    } else if (field === 'dateFin') {
      setDateFin(value);
    }
    
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

    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Créer un nouveau projet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du projet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.projectName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ex: Refonte du site web"
              autoFocus
            />
            {errors.projectName && (
              <p className="text-red-600 text-sm mt-1">{errors.projectName}</p>
            )}
          </div>

          <div>
            <label htmlFor="typeProjet" className="block text-sm font-medium text-gray-700 mb-2">
              Type de projet
            </label>
            <input
              type="text"
              id="typeProjet"
              value={typeProjet}
              onChange={(e) => handleInputChange('typeProjet', e.target.value)}
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
                  value={budgetInitial}
                  onChange={(e) => handleInputChange('budgetInitial', e.target.value)}
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
                value={devise}
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

          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Décrivez brièvement les objectifs et le contexte du projet..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {projectDescription.length}/1000 caractères
            </p>
          </div>

          <div>
            <label htmlFor="responsable" className="block text-sm font-medium text-gray-700 mb-2">
              Responsable du projet
            </label>
            <select
              id="responsable"
              value={responsableId}
              onChange={(e) => handleInputChange('responsable', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Aucun responsable assigné</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.prenom} {user.nom} {user.fonction ? `(${user.fonction})` : ''}
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <p className="text-amber-600 text-sm mt-1">
                Aucun membre disponible. Créez d'abord des membres pour pouvoir assigner un responsable.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="prestataireExterne" className="block text-sm font-medium text-gray-700 mb-2">
              Prestataire externe
            </label>
            <input
              type="text"
              id="prestataireExterne"
              value={prestataireExterne}
              onChange={(e) => handleInputChange('prestataireExterne', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Nom du prestataire externe (optionnel)"
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="nouvellesFonctionnalites" className="block text-sm font-medium text-gray-700 mb-2">
              Nouvelles fonctionnalités
            </label>
            <textarea
              id="nouvellesFonctionnalites"
              value={nouvellesFonctionnalites}
              onChange={(e) => handleInputChange('nouvellesFonctionnalites', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Décrivez les nouvelles fonctionnalités apportées par ce projet..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {nouvellesFonctionnalites.length}/1000 caractères
            </p>
          </div>

          <div>
            <label htmlFor="avantages" className="block text-sm font-medium text-gray-700 mb-2">
              Avantages
            </label>
            <textarea
              id="avantages"
              value={avantages}
              onChange={(e) => handleInputChange('avantages', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Décrivez les avantages et bénéfices attendus de ce projet..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {avantages.length}/1000 caractères
            </p>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
              Département
            </label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Aucun département assigné</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.nom}>{dept.nom}</option>
              ))}
            </select>
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
                value={dateDebut}
                onChange={(e) => handleInputChange('dateDebut', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.dateDebut ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.dateDebut && (
                <p className="text-red-600 text-sm mt-1">{errors.dateDebut}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateFin" className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                id="dateFin"
                value={dateFin}
                onChange={(e) => handleInputChange('dateFin', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.dateFin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.dateFin && (
                <p className="text-red-600 text-sm mt-1">{errors.dateFin}</p>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pièces jointes
            </label>
            <div className="space-y-4">
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
                      Cliquez pour ajouter des fichiers
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Word, Excel, Images, Texte (max 10MB par fichier)
                    </p>
                  </div>
                </label>
              </div>

              {/* Uploaded Files List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Fichiers sélectionnés ({attachments.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
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

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!projectName.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Plus size={18} />
              <span>Créer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;