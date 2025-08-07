import React, { useState } from 'react';
import { ArrowLeft, Folder, CheckCircle, Calendar, Users, Building, BarChart3, Eye, Unlock } from 'lucide-react';
import { Project, User, Department, AuthUser } from '../types';
import { calculateProjectProgress, getProjectStats } from '../utils/calculations';
import { formatCurrency } from '../utils/budgetCalculations';

interface ClosedProjectsViewProps {
  projects: Project[];
  departments: Department[];
  availableUsers: User[];
  onSelectProject: (project: Project) => void;
  onBack: () => void;
  currentUser: AuthUser | null;
  onReopenProject?: (project: Project, reason?: string) => void;
}

const ClosedProjectsView: React.FC<ClosedProjectsViewProps> = ({
  projects,
  departments,
  availableUsers,
  onSelectProject,
  onBack,
  currentUser,
  onReopenProject
}) => {
  const [sortBy, setSortBy] = useState<'date_cloture' | 'nom' | 'departement'>('date_cloture');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [selectedProjectForReopen, setSelectedProjectForReopen] = useState<Project | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  // Get department name
  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'Non assigné';
    const department = departments.find(d => d.id === departmentId);
    return department?.nom || 'Non assigné';
  };

  // Get project manager name
  const getProjectManagerName = (responsableId?: string) => {
    if (!responsableId) return 'Non assigné';
    const manager = availableUsers.find(u => u.id === responsableId);
    return manager ? `${manager.prenom} ${manager.nom}` : 'Non assigné';
  };

  // Get budget consumption rate
  const getBudgetConsumptionRate = (project: Project) => {
    if (!project.budget_initial) return 0;
    
    // Mock expenses calculation (in real app, this would come from actual expenses)
    const mockExpenses = project.budget_initial * 0.85; // 85% consumption for demo
    return (mockExpenses / project.budget_initial) * 100;
  };

  // Sort projects
  const sortedProjects = [...projects].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'date_cloture':
        aValue = a.date_cloture || new Date(0);
        bValue = b.date_cloture || new Date(0);
        break;
      case 'nom':
        aValue = a.nom.toLowerCase();
        bValue = b.nom.toLowerCase();
        break;
      case 'departement':
        aValue = getDepartmentName(a.departement).toLowerCase();
        bValue = getDepartmentName(b.departement).toLowerCase();
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: 'date_cloture' | 'nom' | 'departement') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Check if user can reopen project
  const canReopenProject = (project: Project) => {
    if (!currentUser || !onReopenProject) return false;
    
    // Only ADMIN and SUPER_ADMIN can reopen projects
    return currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
  };

  // Handle reopen project attempt
  const handleReopenProject = (project: Project) => {
    setSelectedProjectForReopen(project);
    setIsReopenModalOpen(true);
  };

  // Handle reopen confirmation
  const handleReopenConfirm = () => {
    if (selectedProjectForReopen && onReopenProject) {
      onReopenProject(selectedProjectForReopen, reopenReason);
      setIsReopenModalOpen(false);
      setSelectedProjectForReopen(null);
      setReopenReason('');
    }
  };

  // Handle reopen cancel
  const handleReopenCancel = () => {
    setIsReopenModalOpen(false);
    setSelectedProjectForReopen(null);
    setReopenReason('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Folder className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Projets Clôturés</h1>
                  <p className="text-sm text-gray-500">
                    {projects.length} projet{projects.length > 1 ? 's' : ''} clôturé{projects.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet clôturé</h3>
            <p className="text-gray-500">
              Les projets clôturés apparaîtront ici une fois qu'ils auront été fermés.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('nom')}>
                      <div className="flex items-center space-x-1">
                        <span>Nom du projet</span>
                        {sortBy === 'nom' && (
                          <span className="text-gray-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('departement')}>
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>Département</span>
                        {sortBy === 'departement' && (
                          <span className="text-gray-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>Responsable</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('date_cloture')}>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Date de clôture</span>
                        {sortBy === 'date_cloture' && (
                          <span className="text-gray-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>Tâches</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span>Taux de clôture</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span>Consommation budgétaire</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProjects.map((project) => {
                    const stats = getProjectStats(project.taches);
                    const budgetRate = getBudgetConsumptionRate(project);
                    
                    return (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {project.nom}
                              </div>
                              {project.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {project.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getDepartmentName(project.departement)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getProjectManagerName(project.responsable_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {project.date_cloture ? 
                              new Date(project.date_cloture).toLocaleDateString('fr-FR') : 
                              'Non définie'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {project.taches.length} tâche{project.taches.length > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: '100%' }}
                              />
                            </div>
                            <span className="text-sm font-medium text-green-600">100%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  budgetRate > 90 ? 'bg-red-500' :
                                  budgetRate > 70 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(budgetRate, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${
                              budgetRate > 90 ? 'text-red-600' :
                              budgetRate > 70 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {budgetRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                           <div className="flex items-center space-x-3">
                             <button
                               onClick={() => onSelectProject(project)}
                               className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                             >
                               <Eye size={16} />
                               <span>Consulter</span>
                             </button>
                             {canReopenProject(project) && (
                               <button
                                 onClick={() => handleReopenProject(project)}
                                 className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                                 title="Réouvrir le projet"
                               >
                                 <Unlock size={16} />
                                 <span>Réouvrir</span>
                               </button>
                             )}
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

       {/* Reopen Project Confirmation Modal */}
       {isReopenModalOpen && selectedProjectForReopen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
             <div className="flex items-center space-x-3 mb-4">
               <div className="flex-shrink-0">
                 <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                   <Unlock className="h-6 w-6 text-yellow-600" />
                 </div>
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-gray-900">Réouvrir le projet</h3>
                 <p className="text-sm text-gray-500">Confirmation requise</p>
               </div>
             </div>
             
             <div className="mb-6">
               <p className="text-gray-700 mb-4">
                 ❗ <strong>Attention :</strong> vous êtes sur le point de réouvrir ce projet.
               </p>
               <p className="text-gray-700 mb-4">
                 Cela permettra de :
               </p>
               <ul className="text-gray-700 text-sm space-y-1 mb-4">
                 <li>• Modifier de nouveau les tâches, membres, dépenses, budget...</li>
                 <li>• Réintégrer le projet dans le tableau de bord principal</li>
                 <li>• Restaurer toutes les fonctionnalités de modification</li>
               </ul>
               <p className="text-gray-700 font-medium">
                 Souhaitez-vous continuer ?
               </p>
             </div>

             <div className="mb-4">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Motif de réouverture (optionnel)
               </label>
               <textarea
                 value={reopenReason}
                 onChange={(e) => setReopenReason(e.target.value)}
                 placeholder="Ex: Erreur détectée, évolution du périmètre, audit correctif..."
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                 rows={3}
               />
             </div>

             <div className="flex space-x-3">
               <button
                 onClick={handleReopenCancel}
                 className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
               >
                 ❌ Annuler
               </button>
               <button
                 onClick={handleReopenConfirm}
                 className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
               >
                 ✅ Oui, réouvrir le projet
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default ClosedProjectsView; 