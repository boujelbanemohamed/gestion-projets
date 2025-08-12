import React, { useState, useEffect } from 'react';
import { X, Shield, Check, X as XIcon, AlertTriangle, Info } from 'lucide-react';
import { User, AuthUser } from '../types';
import { ROLE_PERMISSIONS } from '../utils/permissions';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: User | undefined;
  onUpdatePermissions: (memberId: string, permissions: { role: string; customPermissions?: Permission[] }) => void;
  currentUser: AuthUser;
}

interface Permission {
  resource: string;
  action: string;
  allowed: boolean;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  member,
  onUpdatePermissions,
}) => {
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'>('USER');
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
      // Charger les permissions du rôle actuel
      const rolePermissions = ROLE_PERMISSIONS.find(rp => rp.role === member.role);
      if (rolePermissions) {
        setCustomPermissions(rolePermissions.permissions);
      }
    }
  }, [member]);

  const handleRoleChange = (role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER') => {
    setSelectedRole(role);
    setIsCustomMode(false);
    
    // Charger les permissions du nouveau rôle
    const rolePermissions = ROLE_PERMISSIONS.find(rp => rp.role === role);
    if (rolePermissions) {
      setCustomPermissions(rolePermissions.permissions);
    }
  };

  const handlePermissionToggle = (resource: string, action: string) => {
    if (!isCustomMode) {
      setIsCustomMode(true);
    }
    
    setCustomPermissions(prev => 
      prev.map(p => 
        p.resource === resource && p.action === action 
          ? { ...p, allowed: !p.allowed }
          : p
      )
    );
  };

  const handleSave = () => {
    if (!member) return;



    onUpdatePermissions(member.id, {
      role: selectedRole,
      customPermissions: isCustomMode ? customPermissions : undefined
    });

    onClose();
  };

  const getResourceLabel = (resource: string) => {
    const labels: { [key: string]: string } = {
      'dashboard': 'Tableau de bord',
      'performance': 'Performance',
      'departments': 'Départements',
      'members': 'Membres',
      'projects': 'Projets',
      'tasks': 'Tâches',
      'comments': 'Commentaires',
      'attachments': 'Pièces jointes',
      'closed-projects': 'Projets clôturés'
    };
    return labels[resource] || resource;
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      'view': 'Consulter',
      'create': 'Créer',
      'edit': 'Modifier',
      'delete': 'Supprimer',
      'upload': 'Télécharger',
      'manage_roles': 'Gérer les rôles'
    };
    return labels[action] || action;
  };

  const getResourceIcon = (resource: string) => {
    const icons: { [key: string]: string } = {
      'dashboard': '📊',
      'performance': '📈',
      'departments': '🏢',
      'members': '👥',
      'projects': '📁',
      'tasks': '✅',
      'comments': '💬',
      'attachments': '📎',
      'closed-projects': '📋'
    };
    return icons[resource] || '🔧';
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Gestion des permissions
              </h2>
              <p className="text-sm text-gray-500">
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

        <div className="p-6 overflow-y-auto flex-1">
          {/* Rôle principal */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rôle principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['SUPER_ADMIN', 'ADMIN', 'USER'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === role
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      selectedRole === role ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {role === 'SUPER_ADMIN' && <span className="text-lg">👑</span>}
                      {role === 'ADMIN' && <span className="text-lg">🛡️</span>}
                      {role === 'USER' && <span className="text-lg">👤</span>}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{role}</div>
                      <div className="text-xs text-gray-500">
                        {role === 'SUPER_ADMIN' && 'Accès complet'}
                        {role === 'ADMIN' && 'Gestion limitée'}
                        {role === 'USER' && 'Accès basique'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode personnalisé */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Permissions détaillées</h3>
              <button
                onClick={() => setIsCustomMode(!isCustomMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCustomMode
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {isCustomMode ? 'Mode personnalisé activé' : 'Activer le mode personnalisé'}
              </button>
            </div>
            
            {isCustomMode && (
              <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle size={16} className="text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">Mode personnalisé activé</p>
                    <p>Vous pouvez maintenant modifier les permissions individuelles. Les changements seront appliqués en plus du rôle sélectionné.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Permissions par ressource */}
          <div className="space-y-6">
            {Array.from(new Set(customPermissions.map(p => p.resource))).map(resource => (
              <div key={resource} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">{getResourceIcon(resource)}</span>
                  <h4 className="font-medium text-gray-900">{getResourceLabel(resource)}</h4>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {customPermissions
                    .filter(p => p.resource === resource)
                    .map(permission => (
                      <button
                        key={`${permission.resource}-${permission.action}`}
                        onClick={() => handlePermissionToggle(permission.resource, permission.action)}
                        disabled={!isCustomMode}
                        className={`p-3 rounded-lg border transition-all ${
                          permission.allowed
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-500'
                        } ${
                          isCustomMode 
                            ? 'hover:border-gray-300 cursor-pointer' 
                            : 'cursor-default'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {getActionLabel(permission.action)}
                          </span>
                          {permission.allowed ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <XIcon size={16} className="text-gray-400" />
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Informations */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info size={16} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Informations importantes</p>
                <ul className="mt-2 space-y-1">
                  <li>• Les permissions sont héritées du rôle principal</li>
                  <li>• Le mode personnalisé permet de modifier les permissions individuelles</li>
                  <li>• Les changements s'appliquent immédiatement</li>
                  <li>• Vous ne pouvez pas modifier vos propres permissions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Enregistrer les permissions
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal; 