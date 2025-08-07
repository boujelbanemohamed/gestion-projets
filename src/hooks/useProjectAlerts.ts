import { useMemo } from 'react';
import { Project } from '../types';
import { 
  isProjectApproachingDeadline, 
  isProjectOverdue, 
  getDaysUntilDeadline, 
  getAlertMessage, 
  getAlertSeverity, 
  getAlertColorClasses 
} from '../utils/alertsConfig';

interface AlertData {
  isApproachingDeadline: boolean;
  isOverdue: boolean;
  daysUntilDeadline: number | null;
  showDeadlineAlert: boolean;
  alertMessage: string;
  alertSeverity: string;
  alertColorClasses: string;
}

export const useProjectAlerts = (
  project: Project, 
  alertThreshold: number
): AlertData | null => {
  return useMemo(() => {
    if (!project.date_fin) return null;
    
    const isApproachingDeadline = isProjectApproachingDeadline(project.date_fin, alertThreshold);
    const isOverdue = isProjectOverdue(project.date_fin);
    const daysUntilDeadline = getDaysUntilDeadline(project.date_fin);
    const showDeadlineAlert = (isApproachingDeadline || isOverdue) && 
                             project.taches.some(t => t.etat !== 'cloturee');
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
};
