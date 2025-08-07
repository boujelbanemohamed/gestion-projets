import React from 'react';
import { X, User, Mail, Briefcase, Calendar } from 'lucide-react';
import { User as UserType } from '../types';

interface DepartmentMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentName: string;
  members: UserType[];
}

const DepartmentMembersModal: React.FC<DepartmentMembersModalProps> = ({
  isOpen,
  onClose,
  departmentName,
  members
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="text-blue-600\" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Membres du département "{departmentName}"
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {members.length} membre{members.length > 1 ? 's' : ''} dans ce département
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {members.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto text-gray-400 mb-4\" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun membre dans ce département
              </h3>
              <p className="text-gray-500">
                Ce département ne contient actuellement aucun membre.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map(member => (
                <div key={member.id} className="bg-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {member.prenom.charAt(0)}{member.nom.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.prenom} {member.nom}
                      </h3>
                      {member.fonction && (
                        <p className="text-sm text-gray-600">{member.fonction}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {member.fonction && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Briefcase size={16} className="text-gray-400" />
                        <span>{member.fonction}</span>
                      </div>
                    )}

                    {member.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail size={16} className="text-gray-400" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-xs text-gray-500 pt-3 border-t">
                      <Calendar size={14} className="text-gray-400" />
                      <span>Créé le {member.created_at.toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

export default DepartmentMembersModal;