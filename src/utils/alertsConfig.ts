// Default alert threshold in days
export const DEFAULT_ALERT_THRESHOLD = 7;

// Alert types
export enum AlertType {
  APPROACHING = 'approaching',
  OVERDUE = 'overdue'
}

// Alert severity levels
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  DANGER = 'danger'
}

// Alert configuration
export interface AlertConfig {
  threshold: number; // Days before deadline to trigger alert
  enabled: boolean;
}

// Project alert settings
export interface ProjectAlertSettings {
  projectId: string;
  threshold: number; // Custom threshold for this project (if different from default)
}

// Get alert settings for a project
export const getProjectAlertThreshold = (
  projectId: string, 
  projectSettings: ProjectAlertSettings[] = []
): number => {
  const projectSetting = projectSettings.find(s => s.projectId === projectId);
  return projectSetting?.threshold || DEFAULT_ALERT_THRESHOLD;
};

// Check if a project is approaching its deadline
export const isProjectApproachingDeadline = (
  endDate: Date | undefined, 
  threshold: number = DEFAULT_ALERT_THRESHOLD
): boolean => {
  if (!endDate) return false;
  
  const today = new Date();
  const daysUntilDeadline = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilDeadline >= 0 && daysUntilDeadline <= threshold;
};

// Check if a project is overdue
export const isProjectOverdue = (endDate: Date | undefined): boolean => {
  if (!endDate) return false;
  
  const today = new Date();
  return today > endDate;
};

// Get days until deadline (negative if overdue)
export const getDaysUntilDeadline = (endDate: Date | undefined): number | null => {
  if (!endDate) return null;
  
  const today = new Date();
  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// Get alert message based on days until deadline
export const getAlertMessage = (daysUntilDeadline: number | null): string => {
  if (daysUntilDeadline === null) return '';
  
  if (daysUntilDeadline < 0) {
    return `Projet en dépassement de délai depuis ${Math.abs(daysUntilDeadline)} jour${Math.abs(daysUntilDeadline) > 1 ? 's' : ''}`;
  } else if (daysUntilDeadline === 0) {
    return 'Ce projet arrive à échéance aujourd\'hui';
  } else {
    return `Ce projet arrive à échéance dans ${daysUntilDeadline} jour${daysUntilDeadline > 1 ? 's' : ''}`;
  }
};

// Get alert severity based on days until deadline
export const getAlertSeverity = (daysUntilDeadline: number | null): AlertSeverity => {
  if (daysUntilDeadline === null) return AlertSeverity.INFO;
  
  if (daysUntilDeadline < 0) {
    return AlertSeverity.DANGER;
  } else if (daysUntilDeadline <= 2) {
    return AlertSeverity.DANGER;
  } else if (daysUntilDeadline <= 5) {
    return AlertSeverity.WARNING;
  } else {
    return AlertSeverity.INFO;
  }
};

// Get alert color classes based on severity
export const getAlertColorClasses = (severity: AlertSeverity): string => {
  switch (severity) {
    case AlertSeverity.DANGER:
      return 'bg-red-100 border-red-300 text-red-800';
    case AlertSeverity.WARNING:
      return 'bg-orange-100 border-orange-300 text-orange-800';
    case AlertSeverity.INFO:
    default:
      return 'bg-blue-100 border-blue-300 text-blue-800';
  }
};