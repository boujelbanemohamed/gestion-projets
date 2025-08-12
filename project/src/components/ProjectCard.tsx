import React, { useState, useMemo } from 'react';
import { Calendar, Users, BarChart3, Download, Building, FileText, Trash2, MoreVertical, DollarSign, Clock, AlertTriangle, User } from 'lucide-react';
import { Project } from '../types';
import { getProjectStats } from '../utils/calculations';
import { exportProjectToExcel } from '../utils/export';
import { isProjectApproachingDeadline, isProjectOverdue, getDaysUntilDeadline, getAlertMessage, getAlertSeverity, getAlertColorClasses, DEFAULT_ALERT_THRESHOLD } from '../utils/alertsConfig';
import { calculateBudgetSummary, formatCurrency } from '../utils/budgetCalculations';
import { ProjectExpense } from '../types/budget';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onDelete: (projectId: string) => void;
  alertThreshold?: number; // Optional custom alert threshold
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onDelete, alertThreshold = DEFAULT_ALERT_THRESHOLD }) => {
  const [showActions, setShowActions] = useState(false);

  // Sécurisation des tâches
  const safeTasks = project.taches || [];
  const stats = getProjectStats(safeTasks);

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportProjectToExcel(project);
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
    setShowActions(false);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Memoized calculations for performance
  const alertData = useMemo(() => {
    if (!project.date_fin) return null;

    const isApproachingDeadline = isProjectApproachingDeadline(project.date_fin, alertThreshold);
    const isOverdue = isProjectOverdue(project.date_fin);
    const daysUntilDeadline = getDaysUntilDeadline(project.date_fin);
    const showDeadlineAlert = (isApproachingDeadline || isOverdue) && safeTasks.some(t => t.etat !== 'cloturee');
    const alertMessage = daysUntilDeadline !== null ? getAlertMessage(daysUntilDeadline) : '';
    const alertSeverity = daysUntilDeadline !== null ? getAlertSeverity(daysUntilDeadline) : 'info';
    const alertColorClasses = getAlertColorClasses(alertSeverity);

    return {
      isApproachingDeadline,
      isOverdue,
      daysUntilDeadline,
      showDeadlineAlert,
      alertMessage,
      alertSeverity,
      alertColorClasses
    };
  }, [project.date_fin, alertThreshold, project.taches]);

  // Memoized budget calculation
  const budgetSummary = useMemo(() => {
    if (!project.budget_initial || !project.devise) return null;
    const mockExpenses: ProjectExpense[] = []; // In a real app, this would come from props or API
    return calculateBudgetSummary(project.budget_initial, project.devise, mockExpenses);
  }, [project.budget_initial, project.devise]);

  // Memoized project manager lookup - Sécurisé
  const projectManager = useMemo(() => {
    if (!project.responsable_id) return null;
    try {
      return safeTasks.flatMap(t => t.utilisateurs || []).find(user => user.id === project.responsable_id) || null;
    } catch (error) {
      console.warn('Erreur lors de la recherche du responsable:', error);
      return null;
    }
  }, [project.responsable_id, safeTasks]);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 p-6 group relative"
      data-project-id={project.id}
      data-testid={`project-card-${project.id}`}
    >
      {/* Actions Menu */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={18} />
          </button>
          
          {showActions && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(false);
                }}
              />
              
              {/* Actions dropdown */}
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-20">
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Exporter Excel</span>
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Supprimer</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-12">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {project.nom}
            </h3>
            {/* Statut du projet */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              project.statut === 'termine' ? 'bg-green-100 text-green-800' :
              project.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
              project.statut === 'en_pause' ? 'bg-orange-100 text-orange-800' :
              project.statut === 'annule' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.statut === 'termine' ? 'Terminé' :
               project.statut === 'en_cours' ? 'En cours' :
               project.statut === 'en_pause' ? 'En pause' :
               project.statut === 'annule' ? 'Annulé' :
               project.statut === 'planification' ? 'Planification' :
               project.statut || 'Non défini'}
            </span>
          </div>
          
          {/* Type Projet - Sécurisé */}
          {project.type_projet && (
            <div className="flex items-center space-x-2 mb-2">
              <FileText size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Type: {project.type_projet}</span>
            </div>
          )}

          {/* Project Manager */}
          {projectManager && (
            <div className="flex items-center space-x-2 mb-2">
              <User size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                Responsable: {projectManager.prenom} {projectManager.nom}
              </span>
            </div>
          )}
          
          {/* Budget - Sécurisé */}
          {project.budget_initial && (
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                Budget: {project.budget_initial} {project.devise || 'EUR'}
              </span>
            </div>
          )}
          
          {/* Description */}
          {project.description && (
            <div className="flex items-start space-x-2 mb-3">
              <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            </div>
          )}
          
          {/* Department */}
          {project.departement && (
            <div className="flex items-center space-x-2 mb-2">
              <Building size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Département: {project.departement}</span>
            </div>
          )}

          {/* Priorité si disponible */}
          {project.priorite && (
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle size={16} className={
                project.priorite === 'high' ? 'text-red-500' :
                project.priorite === 'medium' ? 'text-orange-500' :
                'text-green-500'
              } />
              <span className="text-sm text-gray-600">
                Priorité: {
                  project.priorite === 'high' ? 'Haute' :
                  project.priorite === 'medium' ? 'Moyenne' :
                  project.priorite === 'low' ? 'Basse' :
                  project.priorite
                }
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Deadline Alert */}
      {alertData?.showDeadlineAlert && (
        <div className={`mt-3 p-2 rounded-lg border ${alertData.alertColorClasses} flex items-center space-x-2`}>
          {alertData.isOverdue ? (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">{alertData.alertMessage}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span className="text-sm font-medium">{alertData.alertMessage}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Budget Progress Bar */}
        {budgetSummary && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Consommation budgétaire</span>
              <span className="text-sm font-bold text-gray-900">{budgetSummary.pourcentage_consommation.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  budgetSummary.statut_budgetaire === 'danger' ? 'bg-red-500' :
                  budgetSummary.statut_budgetaire === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetSummary.pourcentage_consommation, 100)}%` }}
              />
            </div>
            {budgetSummary.montant_restant < 0 && (
              <div className="text-xs text-red-600 font-medium flex items-center space-x-1">
                <span>⚠</span>
                <span>Dépassé de {formatCurrency(Math.abs(budgetSummary.montant_restant), budgetSummary.devise_budget)}</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Progression Global du Projet</span>
            <span className="text-sm font-bold text-gray-900">{stats.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(stats.percentage)}`}
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <BarChart3 size={16} className="text-gray-400" />
            <span className="text-gray-600">{stats.totalTasks} tâches</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-gray-400" />
            <span className="text-gray-600">
              {(() => {
                try {
                  const uniqueMembers = new Set(
                    safeTasks.flatMap(t => (t.utilisateurs || []).map(u => u.id))
                  );
                  return uniqueMembers.size;
                } catch (error) {
                  console.warn('Erreur calcul membres:', error);
                  return 0;
                }
              })()} membres
            </span>
          </div>
        </div>

        {/* Task Status */}
        <div className="flex space-x-2 text-xs">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
            {stats.completedTasks} terminées
          </span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
            {stats.inProgressTasks} en cours
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
            {stats.notStartedTasks} à faire
          </span>
          {alertData?.isOverdue && (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
              En retard
            </span>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2 pt-2 border-t">
          {/* Dates du projet */}
          {(project.date_debut || project.date_fin) && (
            <div className="space-y-1">
              {project.date_debut && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar size={14} className="text-green-500" />
                  <span>Début : {
                    typeof project.date_debut === 'string'
                      ? new Date(project.date_debut).toLocaleDateString('fr-FR')
                      : project.date_debut.toLocaleDateString('fr-FR')
                  }</span>
                </div>
              )}
              {project.date_fin && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar size={14} className="text-red-500" />
                  <span className={alertData?.isOverdue ? 'text-red-600 font-medium' : ''}>
                    Fin : {
                      typeof project.date_fin === 'string'
                        ? new Date(project.date_fin).toLocaleDateString('fr-FR')
                        : project.date_fin.toLocaleDateString('fr-FR')
                    }
                    {alertData?.isOverdue && ' (dépassée)'}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Date de création - Sécurisée */}
          {project.created_at && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar size={14} />
              <span>Créé le {
                typeof project.created_at === 'string'
                  ? new Date(project.created_at).toLocaleDateString('fr-FR')
                  : project.created_at.toLocaleDateString('fr-FR')
              }</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;