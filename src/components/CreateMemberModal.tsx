import React, { useState } from 'react';
import { X, Save, User, Crown, Shield, UserCheck, Eye, EyeOff, Lock } from 'lucide-react';
import { User as UserType, Department, AuthUser } from '../types';
import { PermissionService } from '../utils/permissions';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (member: Omit<UserType, 'id' | 'created_at'>) => void;
  editingMember?: UserType;
  departments: Department[];
  currentUser?: AuthUser;
}

const CreateMemberModal: React.FC<CreateMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingMember,
  departments,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    fonction: '',
    departement: '',
    email: '',
    role: 'USER' as 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER',
    motDePasse: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      if (editingMember) {
        setFormData({
          nom: editingMember.nom,
          prenom: editingMember.prenom,
          fonction: editingMember.fonction || '',
          departement: editingMember.departement,
          email: editingMember.email,
          role: editingMember.role,
          motDePasse: '' // Ne pas pré-remplir le mot de passe lors de la modification
        });
      } else {
        setFormData({
          nom: '',
          prenom: '',
          fonction: '',
          departement: '',
          email: '',
          role: 'USER',
          motDePasse: ''
        });
      }
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen, editingMember]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est obligatoire';
    }
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est obligatoire';
    }
    if (!formData.departement.trim()) {
      newErrors.departement = 'Le département est obligatoire';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation du mot de passe
    if (!editingMember) {
      // Pour la création, le mot de passe est obligatoire
      if (!formData.motDePasse.trim()) {
        newErrors.motDePasse = 'Le mot de passe est obligatoire';
      } else if (formData.motDePasse.length < 6) {
        newErrors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
      }
    } else {
      // Pour la modification, le mot de passe est optionnel mais s'il est fourni, il doit être valide
      if (formData.motDePasse.trim() && formData.motDePasse.length < 6) {
        newErrors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const memberData: Omit<UserType, 'id' | 'created_at'> & { mot_de_passe?: string } = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        fonction: formData.fonction.trim() || undefined,
        departement: formData.departement.trim(),
        email: formData.email.trim(),
        role: formData.role
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (formData.motDePasse.trim()) {
        memberData.mot_de_passe = formData.motDePasse.trim();
      }

      onSubmit(memberData);
      
      // Reset form
      setFormData({
        nom: '',
        prenom: '',
        fonction: '',
        departement: '',
        email: '',
        role: 'USER',
        motDePasse: ''
      });
      setErrors({});
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="text-purple-600" size={16} />;
      case 'ADMIN':
        return <Shield className="text-blue-600" size={16} />;
      case 'MANAGER':
        return <UserCheck className="text-orange-600" size={16} />;
      case 'USER':
        return <User className="text-green-600" size={16} />;
      default:
        return <User className="text-gray-600" size={16} />;
    }
  };

  const canManageRoles = currentUser && PermissionService.canChangeRole(currentUser);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingMember ? 'Modifier le membre' : 'Créer un membre'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nom"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.nom ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Dupont"
              />
              {errors.nom && (
                <p className="text-red-600 text-sm mt-1">{errors.nom}</p>
              )}
            </div>

            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="prenom"
                value={formData.prenom}
                onChange={(e) => handleInputChange('prenom', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.prenom ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Marie"
              />
              {errors.prenom && (
                <p className="text-red-600 text-sm mt-1">{errors.prenom}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="marie.dupont@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Champ mot de passe */}
          <div>
            <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe {!editingMember && <span className="text-red-500">*</span>}
              {editingMember && <span className="text-gray-500 text-xs">(optionnel - laissez vide pour ne pas modifier)</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="motDePasse"
                value={formData.motDePasse}
                onChange={(e) => handleInputChange('motDePasse', e.target.value)}
                className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.motDePasse ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={editingMember ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.motDePasse && (
              <p className="text-red-600 text-sm mt-1">{errors.motDePasse}</p>
            )}
            <div className="mt-1">
              <p className="text-xs text-gray-500">
                Le mot de passe doit contenir au moins 6 caractères
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="fonction" className="block text-sm font-medium text-gray-700 mb-2">
              Fonction
            </label>
            <input
              type="text"
              id="fonction"
              value={formData.fonction}
              onChange={(e) => handleInputChange('fonction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Chef de projet, Développeur..."
            />
          </div>

          <div>
            <label htmlFor="departement" className="block text-sm font-medium text-gray-700 mb-2">
              Département <span className="text-red-500">*</span>
            </label>
            <select
              id="departement"
              value={formData.departement}
              onChange={(e) => handleInputChange('departement', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.departement ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner un département</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.nom}>{dept.nom}</option>
              ))}
            </select>
            {errors.departement && (
              <p className="text-red-600 text-sm mt-1">{errors.departement}</p>
            )}
            {departments.length === 0 && (
              <p className="text-amber-600 text-sm mt-1">
                Aucun département disponible. Créez d'abord des départements.
              </p>
            )}
          </div>

          {/* Role Selection - Only for Super Admin */}
          {canManageRoles && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Rôle <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="USER">Utilisateur</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {getRoleIcon(formData.role)}
                  <span className="text-sm font-medium text-gray-900">
                    {formData.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                     formData.role === 'ADMIN' ? 'Admin' : 
                     formData.role === 'MANAGER' ? 'Manager' : 'Utilisateur'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {formData.role === 'SUPER_ADMIN' && 'Accès total + gestion des rôles'}
                  {formData.role === 'ADMIN' && 'Accès complet sauf gestion des rôles'}
                  {formData.role === 'MANAGER' && 'Accès limité aux projets assignés'}
                  {formData.role === 'USER' && 'Accès limité aux projets assignés'}
                </p>
              </div>
            </div>
          )}

          {!canManageRoles && editingMember && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle actuel
              </label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                {getRoleIcon(editingMember.role)}
                <span className="text-sm font-medium text-gray-900">
                  {editingMember.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                   editingMember.role === 'ADMIN' ? 'Admin' : 
                   editingMember.role === 'MANAGER' ? 'Manager' : 'Utilisateur'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Seuls les Super Admin peuvent modifier les rôles
              </p>
            </div>
          )}

          {/* Conseils de sécurité pour le mot de passe */}
          {!editingMember && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Lock className="text-blue-600 mt-0.5" size={16} />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Conseils pour un mot de passe sécurisé :</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Au moins 6 caractères (recommandé : 8+)</li>
                    <li>Mélange de lettres, chiffres et symboles</li>
                    <li>Évitez les informations personnelles</li>
                    <li>L'utilisateur pourra modifier son mot de passe plus tard</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

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
              disabled={departments.length === 0}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Save size={18} />
              <span>{editingMember ? 'Modifier' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMemberModal;