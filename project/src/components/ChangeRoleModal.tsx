import React, { useState } from 'react';
import { X, Shield, Crown, UserCheck, AlertTriangle } from 'lucide-react';
import { User, AuthUser } from '../types';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: User;
  onConfirm: (newRole: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR') => void;
  currentUser: AuthUser;
}

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  member,
  onConfirm
}) => {
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR'>('UTILISATEUR');

  React.useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const roles = [
    {
      value: 'SUPER_ADMIN' as const,
      label: 'Super Admin',
      icon: Crown,
      color: 'purple',
      description: 'Accès total à toutes les fonctionnalités + gestion des rôles',
      permissions: [
        'Accès complet au tableau de bord',
        'Accès complet à la page Performance',
        'Gestion complète des départements et membres',
        'Gestion complète des projets et tâches',
        'Gestion des rôles des autres membres',
        'Suppression de commentaires et fichiers'
      ]
    },
    {
      value: 'ADMIN' as const,
      label: 'Admin',
      icon: Shield,
      color: 'blue',
      description: 'Accès complet sauf gestion des rôles',
      permissions: [
        'Accès complet au tableau de bord',
        'Accès complet à la page Performance',
        'Gestion complète des départements et membres',
        'Gestion complète des projets et tâches',
        'Suppression de commentaires et fichiers',
        '❌ Pas de gestion des rôles'
      ]
    },
    {
      value: 'UTILISATEUR' as const,
      label: 'Utilisateur',
      icon: UserCheck,
      color: 'green',
      description: 'Accès limité aux projets assignés uniquement',
      permissions: [
        'Tableau de bord filtré (projets assignés)',
        'Création/modification de tâches sur ses projets',
        'Ajout de commentaires et pièces jointes',
        '❌ Pas d\'accès aux pages Performance/Membres/Départements',
        '❌ Pas de suppression de commentaires/fichiers'
      ]
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseClasses = isSelected ? 'ring-2 ring-offset-2' : 'hover:shadow-md';
    
    switch (color) {
      case 'purple':
        return `${baseClasses} ${isSelected ? 'ring-purple-500 bg-purple-50 border-purple-200' : 'border-gray-200 hover:border-purple-300'}`;
      case 'blue':
        return `${baseClasses} ${isSelected ? 'ring-blue-500 bg-blue-50 border-blue-200' : 'border-gray-200 hover:border-blue-300'}`;
      case 'green':
        return `${baseClasses} ${isSelected ? 'ring-green-500 bg-green-50 border-green-200' : 'border-gray-200 hover:border-green-300'}`;
      default:
        return `${baseClasses} border-gray-200`;
    }
  };

  const getIconColorClass = (color: string) => {
    switch (color) {
      case 'purple': return 'text-purple-600';
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleConfirm = () => {
    if (selectedRole === member.role) {
      onClose();
      return;
    }

    let confirmMessage = `Êtes-vous sûr de vouloir changer le rôle de ${member.prenom} ${member.nom} ?\n\n`;
    confirmMessage += `Ancien rôle : ${member.role}\n`;
    confirmMessage += `Nouveau rôle : ${selectedRole}\n\n`;
    
    if (selectedRole === 'SUPER_ADMIN') {
      confirmMessage += '⚠️ ATTENTION : Ce membre aura accès à toutes les fonctionnalités et pourra gérer les rôles des autres membres.';
    } else if (member.role === 'SUPER_ADMIN' && selectedRole !== 'SUPER_ADMIN') {
      confirmMessage += '⚠️ ATTENTION : Ce membre perdra ses privilèges de Super Admin et ne pourra plus gérer les rôles.';
    }

    if (window.confirm(confirmMessage)) {
      onConfirm(selectedRole);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Modifier le rôle de {member.prenom} {member.nom}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Rôle actuel : <span className="font-medium">{member.role}</span>
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
          {/* Warning for Super Admin changes */}
          {(selectedRole === 'SUPER_ADMIN' || member.role === 'SUPER_ADMIN') && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Attention - Modification de privilèges Super Admin</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    {selectedRole === 'SUPER_ADMIN' 
                      ? 'Vous êtes sur le point d\'accorder des privilèges Super Admin. Cette personne aura accès à toutes les fonctionnalités et pourra gérer les rôles des autres membres.'
                      : 'Vous êtes sur le point de retirer les privilèges Super Admin. Cette personne perdra l\'accès à la gestion des rôles.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Sélectionnez le nouveau rôle :
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles.map((role) => {
                const IconComponent = role.icon;
                const isSelected = selectedRole === role.value;
                
                return (
                  <div
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`cursor-pointer border-2 rounded-xl p-6 transition-all duration-200 ${getColorClasses(role.color, isSelected)}`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-2 ${role.color === 'purple' ? 'bg-purple-100' : role.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'} rounded-lg`}>
                        <IconComponent className={getIconColorClass(role.color)} size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{role.label}</h4>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-900">Permissions :</h5>
                      <ul className="space-y-1">
                        {role.permissions.map((permission, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start space-x-2">
                            <span className={permission.startsWith('❌') ? 'text-red-500' : 'text-green-500'}>
                              {permission.startsWith('❌') ? '❌' : '✅'}
                            </span>
                            <span className={permission.startsWith('❌') ? 'text-red-600' : ''}>
                              {permission.replace(/^(✅|❌)\s*/, '')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className={`text-sm font-medium ${
                          role.color === 'purple' ? 'text-purple-700' : 
                          role.color === 'blue' ? 'text-blue-700' : 'text-green-700'
                        }`}>
                          ✓ Rôle sélectionné
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current vs New Role Comparison */}
          {selectedRole !== member.role && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Résumé des changements :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Rôle actuel :</p>
                  <div className="text-sm font-medium text-red-600">
                    {roles.find(r => r.value === member.role)?.label} ({member.role})
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Nouveau rôle :</p>
                  <div className="text-sm font-medium text-green-600">
                    {roles.find(r => r.value === selectedRole)?.label} ({selectedRole})
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedRole === member.role}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {selectedRole === member.role ? 'Aucun changement' : 'Confirmer le changement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeRoleModal;