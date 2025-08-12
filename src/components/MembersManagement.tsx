import React, { useState } from 'react';
import { ArrowLeft, Plus, User, Mail, Building, Briefcase, Search, Edit2, Trash2, Shield, Crown, UserCheck, Settings, RefreshCw } from 'lucide-react';
import { User as UserType, Department, AuthUser, Project } from '../types';
import { PermissionService } from '../utils/permissions';
import CreateMemberModal from './CreateMemberModal';
import ChangeRoleModal from './ChangeRoleModal';
import PermissionsModal from './PermissionsModal';
import ProjectAssignmentModal from './ProjectAssignmentModal';

interface MembersManagementProps {
  members: UserType[];
  departments: Department[];
  projects: Project[]; // Add projects to props
  onBack: () => void;
  onCreateMember: (member: Omit<UserType, 'id' | 'created_at'>) => void;
  onUpdateMember: (id: string, member: Omit<UserType, 'id' | 'created_at'>) => void;
  onDeleteMember: (id: string) => void;
  onManageDepartments: () => void;
  onUpdatePermissions: (memberId: string, permissions: Record<string, boolean>) => void;
  onAssignProjects: (memberId: string, projectIds: string[]) => void; // Add project assignment handler
  onSyncUsers?: () => void; // Add sync users handler
  currentUser: AuthUser;
  isLoading?: boolean;
}

const MembersManagement: React.FC<MembersManagementProps> = ({
  members,
  departments,
  projects,
  onBack,
  onCreateMember,
  onUpdateMember,
  onDeleteMember,
  onManageDepartments,
  onUpdatePermissions,
  onAssignProjects,
  onSyncUsers,
  currentUser,
  isLoading = false
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<UserType | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'>('all');
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] = useState<UserType | undefined>();
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [memberForPermissions, setMemberForPermissions] = useState<UserType | undefined>();
  const [isProjectAssignmentModalOpen, setIsProjectAssignmentModalOpen] = useState(false);
  const [memberForProjectAssignment, setMemberForProjectAssignment] = useState<UserType | undefined>();

  const availableDepartments = Array.from(new Set(members.map(m => m.departement))).sort();

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.fonction && member.fonction.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = !filterDepartment || member.departement === filterDepartment;
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    
    return matchesSearch && matchesDepartment && matchesRole;
  });

  const handleDeleteMember = (member: UserType) => {
    if (!PermissionService.canManageUser(currentUser, member)) {
      alert('Vous n\'avez pas les permissions pour supprimer ce membre');
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${member.prenom} ${member.nom} ?`)) {
      onDeleteMember(member.id);
    }
  };

  const handleEditMember = (member: UserType) => {
    if (!PermissionService.canManageUser(currentUser, member)) {
      alert('Vous n\'avez pas les permissions pour modifier ce membre');
      return;
    }

    setEditingMember(member);
    setIsCreateModalOpen(true);
  };

  const handleSubmitMember = (memberData: Omit<UserType, 'id' | 'created_at'>) => {
    if (editingMember) {
      onUpdateMember(editingMember.id, memberData);
    } else {
      onCreateMember(memberData);
    }
    setEditingMember(undefined);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingMember(undefined);
  };

  const handleChangeRole = (member: UserType) => {
    if (!PermissionService.canChangeRole(currentUser)) {
      alert('Vous n\'avez pas les permissions pour modifier les rôles');
      return;
    }

    if (member.id === currentUser.id) {
      alert('Vous ne pouvez pas modifier votre propre rôle');
      return;
    }

    setMemberToChangeRole(member);
    setIsChangeRoleModalOpen(true);
  };

  const handleRoleChange = (newRole: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER') => {
    if (!memberToChangeRole) return;

    const updatedMemberData = {
      nom: memberToChangeRole.nom,
      prenom: memberToChangeRole.prenom,
      fonction: memberToChangeRole.fonction,
      departement: memberToChangeRole.departement,
      email: memberToChangeRole.email,
      role: newRole
    };

    onUpdateMember(memberToChangeRole.id, updatedMemberData);
    setMemberToChangeRole(undefined);
    setIsChangeRoleModalOpen(false);
  };

  const handleManagePermissions = (member: UserType) => {
    if (!PermissionService.hasPermission(currentUser, 'members', 'manage_roles')) {
      alert('Vous n\'avez pas les permissions pour gérer les permissions des utilisateurs');
      return;
    }

    if (member.id === currentUser.id) {
      alert('Vous ne pouvez pas modifier vos propres permissions');
      return;
    }

    setMemberForPermissions(member);
    setIsPermissionsModalOpen(true);
  };

  const handleUpdatePermissions = (memberId: string, permissions: Record<string, boolean>) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const updatedMemberData = {
      nom: member.nom,
      prenom: member.prenom,
      fonction: member.fonction,
      departement: member.departement,
      email: member.email,
      role: permissions.role as 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'
    };

    onUpdateMember(memberId, updatedMemberData);
    onUpdatePermissions(memberId, permissions);
  };

  const handleManageProjects = (member: UserType) => {
    if (!PermissionService.canAssignProjectsToMember(currentUser, member, projects)) {
      let message = 'Vous n\'avez pas les permissions pour assigner des projets à cet utilisateur.';

      if (currentUser.role === 'USER') {
        message += ' Vous ne pouvez assigner que les projets dont vous êtes responsable, et seulement aux utilisateurs réguliers.';
      } else if (currentUser.role === 'ADMIN') {
        message += ' Vous ne pouvez assigner des projets qu\'aux utilisateurs réguliers.';
      }

      alert(message);
      return;
    }

    setMemberForProjectAssignment(member);
    setIsProjectAssignmentModalOpen(true);
  };

  const handleAssignProjects = (memberId: string, projectIds: string[]) => {
    onAssignProjects(memberId, projectIds);
    setIsProjectAssignmentModalOpen(false);
    setMemberForProjectAssignment(undefined);
  };

  const getMemberProjects = (member: UserType): Project[] => {
    if (!member.assigned_projects) return [];
    return projects.filter(project => member.assigned_projects!.includes(project.id));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="text-purple-600" size={16} />;
      case 'ADMIN':
        return <Shield className="text-blue-600" size={16} />;
      case 'MANAGER':
        return <Users className="text-orange-600" size={16} />;
      case 'USER':
        return <UserCheck className="text-green-600" size={16} />;
      default:
        return <User className="text-gray-600" size={16} />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            <Crown size={12} />
            <span>Super Admin</span>
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <Shield size={12} />
            <span>Admin</span>
          </span>
        );
      case 'USER':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <UserCheck size={12} />
            <span>Utilisateur</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            <User size={12} />
            <span>{role}</span>
          </span>
        );
    }
  };

  const getRoleStats = () => {
    const superAdminCount = members.filter(m => m.role === 'SUPER_ADMIN').length;
    const adminCount = members.filter(m => m.role === 'ADMIN').length;
    const userCount = members.filter(m => m.role === 'USER').length;
    
    return { superAdminCount, adminCount, userCount };
  };

  const roleStats = getRoleStats();

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
                  <User className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestion des membres</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {members.length} membre{members.length > 1 ? 's' : ''} enregistré{members.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {PermissionService.hasPermission(currentUser, 'departments', 'view') && (
                <button
                  onClick={onManageDepartments}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Building size={18} />
                  <span>Gérer les départements</span>
                </button>
              )}
              {PermissionService.hasPermission(currentUser, 'members', 'create') && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Créer un membre</span>
                </button>
              )}
              {onSyncUsers && (
                <button
                  onClick={onSyncUsers}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw size={18} />
                  <span>Synchroniser les utilisateurs</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Crown className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Super Admins</p>
                <p className="text-2xl font-bold text-gray-900">{roleStats.superAdminCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{roleStats.adminCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{roleStats.userCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou fonction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les départements</option>
                {availableDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les rôles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">Utilisateur</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members List */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement des membres...</h3>
            <p className="text-gray-500">Récupération des données depuis Supabase</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterDepartment || filterRole !== 'all' ? 'Aucun membre trouvé' : 'Aucun membre'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterDepartment || filterRole !== 'all'
                ? 'Aucun membre ne correspond à vos critères de recherche'
                : 'Commencez par créer votre premier membre'
              }
            </p>
            {!searchTerm && !filterDepartment && filterRole === 'all' && (
              <div className="space-y-4">
                {departments.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-amber-800 text-sm">
                      Vous devez d'abord créer des départements avant de pouvoir créer des membres.
                    </p>
                    {PermissionService.hasPermission(currentUser, 'departments', 'view') && (
                      <button
                        onClick={onManageDepartments}
                        className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                      >
                        Gérer les départements
                      </button>
                    )}
                  </div>
                )}
                {PermissionService.hasPermission(currentUser, 'members', 'create') && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={departments.length === 0}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Créer un membre
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Membre
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Rôle
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Département
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Projets assignés
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      Permissions
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.prenom.charAt(0)}{member.nom.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.prenom} {member.nom}
                              {member.id === currentUser.id && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  Vous
                                </span>
                              )}
                            </div>
                            {member.fonction && (
                              <div className="text-sm text-gray-500">{member.fonction}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getRoleBadge(member.role)}
                          {PermissionService.canChangeRole(currentUser) && member.id !== currentUser.id && (
                            <button
                              onClick={() => handleChangeRole(member)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Modifier le rôle"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Building size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-900">{member.departement}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{member.email}</span>
                          </div>
                          {member.fonction && (
                            <div className="flex items-center space-x-2">
                              <Briefcase size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-500">{member.fonction}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getMemberProjects(member).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {getMemberProjects(member).slice(0, 2).map((project) => (
                                <span
                                  key={project.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                >
                                  {project.nom}
                                </span>
                              ))}
                              {getMemberProjects(member).length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                  +{getMemberProjects(member).length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Aucun projet assigné</span>
                          )}
                          {PermissionService.canAssignProjectsToMember(currentUser, member, projects) && (
                            <button
                              onClick={() => handleManageProjects(member)}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              title="Gérer les projets"
                            >
                              Gérer les projets
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          {PermissionService.hasPermission(currentUser, 'members', 'manage_roles') && member.id !== currentUser.id ? (
                            <button
                              onClick={() => handleManagePermissions(member)}
                              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors flex items-center space-x-1"
                              title="Gérer les permissions"
                            >
                              <Settings size={12} />
                              <span>Gérer</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {PermissionService.canManageUser(currentUser, member) && (
                            <>
                              <button
                                onClick={() => handleEditMember(member)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CreateMemberModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitMember}
        editingMember={editingMember}
        departments={departments}
      />

      <ChangeRoleModal
        isOpen={isChangeRoleModalOpen}
        onClose={() => {
          setIsChangeRoleModalOpen(false);
          setMemberToChangeRole(undefined);
        }}
        member={memberToChangeRole}
        onConfirm={handleRoleChange}
      />

      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          setMemberForPermissions(undefined);
        }}
        member={memberForPermissions}
        onUpdatePermissions={handleUpdatePermissions}
      />

      <ProjectAssignmentModal
        isOpen={isProjectAssignmentModalOpen}
        onClose={() => {
          setIsProjectAssignmentModalOpen(false);
          setMemberForProjectAssignment(undefined);
        }}
        member={memberForProjectAssignment}
        projects={projects}
        currentUser={currentUser}
        onAssignProjects={handleAssignProjects}
      />
    </div>
  );
};

export default MembersManagement;