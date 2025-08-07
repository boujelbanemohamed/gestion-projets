import React, { useState, useMemo, useCallback } from 'react';
import { BarChart3, Users, Building, TrendingUp, Filter, CheckCircle } from 'lucide-react';
import { Project, User, Department } from '../types';
import { getProjectStats } from '../utils/calculations';
import { calculateBudgetSummary, formatCurrency } from '../utils/budgetCalculations';

interface PerformanceDashboardProps {
  projects: Project[];
  users: User[];
  departments: Department[];
}

interface DepartmentPerformance {
  department: Department;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  completionRate: number;
}

interface UserPerformance {
  user: User;
  assignedProjects: number;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionRate: number;
}

interface ProjectPerformance {
  project: Project;
  totalTasks: number;
  completedTasks: number;
  notCompletedTasks: number;
  completionRate: number;
  budgetStatus?: {
    budgetInitial: number;
    totalExpenses: number;
    remainingAmount: number;
    consumptionRate: number;
  };
}

interface ClosedProject {
  project: Project;
  closureDate: Date;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  budgetConsumptionRate: number;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  projects,
  users,
  departments
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedProjectStatus, setSelectedProjectStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Apply filters to projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by project status
    if (selectedProjectStatus !== 'all') {
      if (selectedProjectStatus === 'en_cours') {
        filtered = filtered.filter(p => p.statut !== 'cloture');
      } else if (selectedProjectStatus === 'clotures') {
        filtered = filtered.filter(p => p.statut === 'cloture');
      }
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      const selectedDept = departments.find(d => d.id === selectedDepartment);
      if (selectedDept) {
        filtered = filtered.filter(p => p.departement === selectedDept.nom);
      }
    }

    // Filter by user
    if (selectedUser !== 'all') {
      filtered = filtered.filter(p => 
        p.taches.some(t => t.utilisateurs.some(u => u.id === selectedUser))
      );
    }

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(p => {
        // Check if project has tasks within the date range
        return p.taches.some(t => {
          const taskDate = t.date_creation || new Date();
          return taskDate >= start && taskDate <= end;
        });
      });
    }

    return filtered;
  }, [projects, departments, selectedDepartment, selectedUser, startDate, endDate, selectedProjectStatus]);

  // Calculate department performance
  const departmentPerformance = useMemo(() => {
    const deptPerf: DepartmentPerformance[] = departments.map(dept => {
      const deptProjects = filteredProjects.filter(p => p.departement === dept.nom);
      const deptTasks = deptProjects.flatMap(p => p.taches);
      
      const totalTasks = deptTasks.length;
      const completedTasks = deptTasks.filter(t => t.etat === 'cloturee').length;
      const inProgressTasks = deptTasks.filter(t => t.etat === 'en_cours').length;
      const notStartedTasks = deptTasks.filter(t => t.etat === 'non_debutee').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        department: dept,
        totalTasks,
        completedTasks,
        inProgressTasks,
        notStartedTasks,
        completionRate
      };
    });

    return deptPerf.sort((a, b) => b.completionRate - a.completionRate);
  }, [filteredProjects, departments]);

  // Calculate user performance
  const userPerformance = useMemo(() => {
    const userPerf: UserPerformance[] = users.map(user => {
      const userTasks = filteredProjects.flatMap(p => 
        p.taches.filter(t => t.utilisateurs.some(u => u.id === user.id))
      );
      
      const assignedProjects = new Set(
        filteredProjects.filter(p => 
          p.taches.some(t => t.utilisateurs.some(u => u.id === user.id))
        ).map(p => p.id)
      ).size;

      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(t => t.etat === 'cloturee').length;
      const remainingTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        user,
        assignedProjects,
        totalTasks,
        completedTasks,
        remainingTasks,
        completionRate
      };
    });

    return userPerf.sort((a, b) => b.completionRate - a.completionRate);
  }, [filteredProjects, users]);

  // Calculate project performance
  const projectPerformance = useMemo(() => {
    const projPerf: ProjectPerformance[] = filteredProjects.map(project => {
      const stats = getProjectStats(project.taches);
      
      let budgetStatus;
      if (project.budget_initial && project.devise) {
        // Start with empty expenses - in real app, would fetch from API
        const projectExpenses: any[] = [];
        
        const budgetSummary = calculateBudgetSummary(project.budget_initial, project.devise, projectExpenses);
        budgetStatus = {
          budgetInitial: project.budget_initial,
          totalExpenses: budgetSummary.total_depenses,
          remainingAmount: budgetSummary.montant_restant,
          consumptionRate: budgetSummary.pourcentage_consommation
        };
      }

      return {
        project,
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        notCompletedTasks: stats.totalTasks - stats.completedTasks,
        completionRate: stats.percentage,
        budgetStatus
      };
    });

    return projPerf.sort((a, b) => b.completionRate - a.completionRate);
  }, [filteredProjects]);

  // Calculate closed projects
  const closedProjects = useMemo(() => {
    const closed: ClosedProject[] = projects
      .filter(project => project.statut === 'cloture')
      .map(project => {
        const stats = getProjectStats(project.taches);
        
        // Calculate budget consumption rate
        let budgetConsumptionRate = 0;
        if (project.budget_initial && project.devise) {
          // Mock expenses for demonstration
          const mockExpenses = [
            {
              id: '1',
              projet_id: project.id,
              date_depense: new Date('2024-02-01'),
              intitule: 'Licences logiciels',
              montant: project.budget_initial * 0.85, // 85% consumption for demo
              devise: 'EUR',
              rubrique: 'logiciel',
              created_by: 'user1',
              created_at: new Date('2024-02-01'),
              updated_at: new Date('2024-02-01')
            }
          ];
          
          const budgetSummary = calculateBudgetSummary(project.budget_initial, project.devise, mockExpenses);
          budgetConsumptionRate = budgetSummary.pourcentage_consommation;
        }

        return {
          project,
          closureDate: project.date_cloture || new Date('2024-01-15'), // Use closure date or default
          totalTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          completionRate: stats.percentage,
          budgetConsumptionRate
        };
      });

    return closed.sort((a, b) => b.closureDate.getTime() - a.closureDate.getTime()); // Sort by closure date (newest first)
  }, [projects]);

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-100';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getBudgetStatusColor = (rate: number) => {
    if (rate <= 70) return 'text-green-600 bg-green-100';
    if (rate <= 90) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Check if any data is available after filtering
  const hasData = filteredProjects.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Performance</h1>
                <p className="text-gray-600 mt-1">Analyse des performances par département, utilisateur et projet</p>
              </div>
            </div>
            
                         {/* Filters */}
            <div className="flex items-center space-x-4">
               {(startDate || endDate || selectedDepartment !== 'all' || selectedUser !== 'all' || selectedProjectStatus !== 'all') && (
                 <div className="flex items-center space-x-2 text-sm text-gray-600">
                   <Filter size={16} />
                   <span>Filtres actifs</span>
                 </div>
               )}
              
              <select
                value={selectedProjectStatus}
                onChange={(e) => setSelectedProjectStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les projets</option>
                <option value="en_cours">En cours</option>
                <option value="clotures">Clôturés</option>
              </select>

              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Date de début"
                />
                <span className="text-gray-500">à</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Date de fin"
                />
              </div>
               
               <select
                 value={selectedDepartment}
                 onChange={(e) => setSelectedDepartment(e.target.value)}
                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               >
                 <option value="all">Tous les départements</option>
                 {departments.map(dept => (
                   <option key={dept.id} value={dept.id}>{dept.nom}</option>
                 ))}
               </select>

               <select
                 value={selectedUser}
                 onChange={(e) => setSelectedUser(e.target.value)}
                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               >
                 <option value="all">Tous les utilisateurs</option>
                 {users.map(user => (
                   <option key={user.id} value={user.id}>
                     {user.prenom} {user.nom} ({user.departement})
                   </option>
                 ))}
               </select>
             </div>
            </div>
          </div>
        </div>

      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                                 <p className="text-sm font-medium text-gray-600">Tâches Total</p>
                <p className="text-2xl font-bold text-gray-900">
                   {filteredProjects.reduce((sum, p) => sum + p.taches.length, 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                                 <p className="text-sm font-medium text-gray-600">Tâches Clôturées</p>
                 <p className="text-2xl font-bold text-green-600">
                   {filteredProjects.reduce((sum, p) => sum + p.taches.filter(t => t.etat === 'cloturee').length, 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                                 <p className="text-sm font-medium text-gray-600">Taux de Clôture</p>
                 <p className="text-2xl font-bold text-blue-600">
                   {(() => {
                     const totalTasks = filteredProjects.reduce((sum, p) => sum + p.taches.length, 0);
                     const completedTasks = filteredProjects.reduce((sum, p) => sum + p.taches.filter(t => t.etat === 'cloturee').length, 0);
                     return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                   })()}%
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                                 <p className="text-sm font-medium text-gray-600">Projets Actifs</p>
                 <p className="text-2xl font-bold text-purple-600">{filteredProjects.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building className="text-purple-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* No Data Message */}
        {!hasData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <TrendingUp className="text-yellow-600" size={24} />
              <h3 className="text-lg font-medium text-yellow-800">Aucune donnée disponible</h3>
            </div>
            <p className="text-yellow-700 mb-4">
              Aucune donnée ne correspond aux critères de filtrage sélectionnés.
            </p>
            <div className="text-sm text-yellow-600">
              <p>Essayez de modifier vos filtres pour voir les données disponibles :</p>
              <ul className="mt-2 space-y-1">
                <li>• Changez l'état du projet (En cours / Clôturés / Tous)</li>
                <li>• Sélectionnez un autre département</li>
                <li>• Choisissez un autre utilisateur</li>
                <li>• Modifiez la période de temps</li>
              </ul>
            </div>
          </div>
        )}

        {/* Performance Sections */}
        {hasData && (
          <div className="space-y-8">
            {/* 1. Performance par département */}
            <div className="bg-white rounded-xl shadow-sm">
            <div className="p-8 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="text-blue-600" size={20} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Performance par Département</h2>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart placeholder */}
                <div className="bg-gray-50 rounded-lg p-6 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500">Graphique par département</p>
                  </div>
          </div>
          
                {/* Table */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Détails par département</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Département
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clôturées
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Taux
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {departmentPerformance.map((dept) => (
                          <tr key={dept.department.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {dept.department.nom}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dept.totalTasks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dept.completedTasks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompletionRateColor(dept.completionRate)}`}>
                                {dept.completionRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Performance par utilisateur */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-8 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="text-green-600" size={20} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Performance par Utilisateur</h2>
                      </div>
                      </div>
                    </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart placeholder */}
                <div className="bg-gray-50 rounded-lg p-6 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500">Graphique par utilisateur</p>
                      </div>
                    </div>

                {/* Table */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Classement des utilisateurs</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Utilisateur
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Projets
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tâches
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Taux
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userPerformance.map((user) => (
                          <tr key={user.user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {user.user.prenom.charAt(0)}{user.user.nom.charAt(0)}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.user.prenom} {user.user.nom}
                      </div>
                                  <div className="text-sm text-gray-500">{user.user.departement}</div>
                      </div>
                    </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.assignedProjects}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.totalTasks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompletionRateColor(user.completionRate)}`}>
                                {user.completionRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Performance par projet */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-8 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building className="text-purple-600" size={20} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Performance par Projet</h2>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clôturées
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taux
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projectPerformance.map((proj) => (
                      <tr key={proj.project.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{proj.project.nom}</div>
                          <div className="text-sm text-gray-500">{proj.project.departement}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {proj.totalTasks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {proj.completedTasks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompletionRateColor(proj.completionRate)}`}>
                            {proj.completionRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {proj.budgetStatus ? (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-900">
                                {formatCurrency(proj.budgetStatus.totalExpenses, proj.project.devise!)} / {formatCurrency(proj.budgetStatus.budgetInitial, proj.project.devise!)}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBudgetStatusColor(proj.budgetStatus.consumptionRate)}`}>
                                {proj.budgetStatus.consumptionRate.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Non défini</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. Projets clôturés */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-8 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="text-green-600" size={20} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Projets Clôturés</h2>
                </div>
                <div className="text-sm text-gray-500">
                  {closedProjects.length} projet{closedProjects.length > 1 ? 's' : ''} clôturé{closedProjects.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <div className="p-8">
              {closedProjects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Projet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Département
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date de clôture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tâches
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Taux de clôture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Consommation budget
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {closedProjects.map((closedProject) => (
                        <tr key={closedProject.project.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{closedProject.project.nom}</div>
                            <div className="text-sm text-gray-500">{closedProject.project.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {closedProject.project.departement}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {closedProject.closureDate.toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {closedProject.completedTasks} / {closedProject.totalTasks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompletionRateColor(closedProject.completionRate)}`}>
                              {closedProject.completionRate}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {closedProject.project.budget_initial && closedProject.project.devise ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBudgetStatusColor(closedProject.budgetConsumptionRate)}`}>
                                {closedProject.budgetConsumptionRate.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">Non défini</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <CheckCircle className="text-gray-400" size={24} />
                    <h3 className="text-lg font-medium text-gray-500">Aucun projet clôturé</h3>
                  </div>
                  <p className="text-gray-400">
                    Aucun projet n'a encore été clôturé. Les projets clôturés apparaîtront ici.
                  </p>
            </div>
          )}
        </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;