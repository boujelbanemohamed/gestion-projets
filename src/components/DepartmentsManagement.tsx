import React, { useState } from 'react';
import { ArrowLeft, Plus, Building, Search, Edit2, Trash2, Calendar, Users } from 'lucide-react';
import { Department, User } from '../types';
import CreateDepartmentModal from './CreateDepartmentModal';
import DepartmentMembersModal from './DepartmentMembersModal';

interface DepartmentsManagementProps {
  departments: Department[];
  members: User[];
  onBack: () => void;
  onCreateDepartment: (department: Omit<Department, 'id' | 'created_at'>) => void;
  onUpdateDepartment: (id: string, department: Omit<Department, 'id' | 'created_at'>) => void;
  onDeleteDepartment: (id: string) => void;
}

const DepartmentsManagement: React.FC<DepartmentsManagementProps> = ({
  departments,
  members,
  onBack,
  onCreateDepartment,
  onUpdateDepartment,
  onDeleteDepartment
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const filteredDepartments = departments.filter(dept =>
    dept.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMemberCount = (departmentName: string) => {
    return members.filter(member => member.departement === departmentName).length;
  };

  const getDepartmentMembers = (departmentName: string) => {
    return members.filter(member => member.departement === departmentName);
  };

  const handleDeleteDepartment = (department: Department) => {
    const memberCount = getMemberCount(department.nom);
    
    if (memberCount > 0) {
      const confirmMessage = `Le département "${department.nom}" contient ${memberCount} membre${memberCount > 1 ? 's' : ''}. Êtes-vous sûr de vouloir le supprimer ? Les membres devront être réassignés à un autre département.`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    } else {
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le département "${department.nom}" ?`)) {
        return;
      }
    }
    
    onDeleteDepartment(department.id);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsCreateModalOpen(true);
  };

  const handleSubmitDepartment = (departmentData: Omit<Department, 'id' | 'created_at'>) => {
    if (editingDepartment) {
      onUpdateDepartment(editingDepartment.id, departmentData);
    } else {
      onCreateDepartment(departmentData);
    }
    setEditingDepartment(undefined);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingDepartment(undefined);
  };

  const handleShowMembers = (department: Department) => {
    setSelectedDepartment(department);
    setIsMembersModalOpen(true);
  };

  const handleCloseMembersModal = () => {
    setIsMembersModalOpen(false);
    setSelectedDepartment(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestion des départements</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {departments.length} département{departments.length > 1 ? 's' : ''} enregistré{departments.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Créer un département</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un département..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Departments List */}
        {filteredDepartments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Building className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Aucun département trouvé' : 'Aucun département'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? 'Aucun département ne correspond à votre recherche'
                : 'Commencez par créer votre premier département'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer un département
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Nom du département
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Membres
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Date de création
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDepartments.map((department) => {
                    const memberCount = getMemberCount(department.nom);
                    return (
                      <tr key={department.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Building className="text-white" size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {department.nom}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleShowMembers(department)}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                          >
                            <Users size={16} />
                            <span className="text-sm font-medium">
                              {memberCount} membre{memberCount > 1 ? 's' : ''}
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {department.created_at.toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditDepartment(department)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteDepartment(department)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CreateDepartmentModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitDepartment}
        editingDepartment={editingDepartment}
        existingNames={departments.map(d => d.nom)}
      />

      <DepartmentMembersModal
        isOpen={isMembersModalOpen}
        onClose={handleCloseMembersModal}
        departmentName={selectedDepartment?.nom || ''}
        members={selectedDepartment ? getDepartmentMembers(selectedDepartment.nom) : []}
      />
    </div>
  );
};

export default DepartmentsManagement;