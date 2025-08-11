// Mapping unifié des statuts entre Supabase et l'interface utilisateur

export type SupabaseTaskStatus = 'todo' | 'en_cours' | 'termine';
export type UITaskStatus = 'non_debutee' | 'en_cours' | 'cloturee';

export type SupabaseProjectStatus = 'planification' | 'en_cours' | 'en_pause' | 'termine' | 'annule';
export type UIProjectStatus = 'planification' | 'en_cours' | 'en_pause' | 'termine' | 'annule';

/**
 * Convertit un statut de tâche Supabase vers l'interface utilisateur
 */
export function mapSupabaseTaskStatusToUI(supabaseStatus: SupabaseTaskStatus): UITaskStatus {
  const mapping: Record<SupabaseTaskStatus, UITaskStatus> = {
    'todo': 'non_debutee',
    'en_cours': 'en_cours',
    'termine': 'cloturee'
  };
  
  return mapping[supabaseStatus] || 'non_debutee';
}

/**
 * Convertit un statut de tâche UI vers Supabase
 */
export function mapUITaskStatusToSupabase(uiStatus: UITaskStatus): SupabaseTaskStatus {
  const mapping: Record<UITaskStatus, SupabaseTaskStatus> = {
    'non_debutee': 'todo',
    'en_cours': 'en_cours',
    'cloturee': 'termine'
  };
  
  return mapping[uiStatus] || 'todo';
}

/**
 * Convertit un statut de projet Supabase vers l'interface utilisateur
 */
export function mapSupabaseProjectStatusToUI(supabaseStatus: SupabaseProjectStatus): UIProjectStatus {
  // Pour les projets, les statuts sont identiques
  return supabaseStatus;
}

/**
 * Convertit un statut de projet UI vers Supabase
 */
export function mapUIProjectStatusToSupabase(uiStatus: UIProjectStatus): SupabaseProjectStatus {
  // Pour les projets, les statuts sont identiques
  return uiStatus;
}

/**
 * Normalise un statut de tâche pour l'interface utilisateur
 * Gère les cas où le statut pourrait être undefined ou invalide
 */
export function normalizeTaskStatusForUI(status: any): UITaskStatus {
  if (!status) return 'non_debutee';
  
  // Si c'est déjà un statut UI valide
  if (['non_debutee', 'en_cours', 'cloturee'].includes(status)) {
    return status as UITaskStatus;
  }
  
  // Si c'est un statut Supabase
  if (['todo', 'en_cours', 'termine'].includes(status)) {
    return mapSupabaseTaskStatusToUI(status as SupabaseTaskStatus);
  }
  
  // Cas par défaut
  return 'non_debutee';
}

/**
 * Normalise un statut de projet pour l'interface utilisateur
 */
export function normalizeProjectStatusForUI(status: any): UIProjectStatus {
  if (!status) return 'planification';
  
  const validStatuses: UIProjectStatus[] = ['planification', 'en_cours', 'en_pause', 'termine', 'annule'];
  
  if (validStatuses.includes(status)) {
    return status as UIProjectStatus;
  }
  
  // Gestion des anciens statuts ou variations
  switch (status) {
    case 'planifie':
      return 'planification';
    case 'actif':
      return 'en_cours';
    case 'suspendu':
      return 'en_pause';
    case 'fini':
    case 'complete':
      return 'termine';
    case 'cancelled':
      return 'annule';
    default:
      return 'planification';
  }
}

/**
 * Obtient la couleur associée à un statut de tâche
 */
export function getTaskStatusColor(status: UITaskStatus): string {
  const colors: Record<UITaskStatus, string> = {
    'non_debutee': 'bg-gray-100 text-gray-800',
    'en_cours': 'bg-blue-100 text-blue-800',
    'cloturee': 'bg-green-100 text-green-800'
  };
  
  return colors[status] || colors['non_debutee'];
}

/**
 * Obtient la couleur associée à un statut de projet
 */
export function getProjectStatusColor(status: UIProjectStatus): string {
  const colors: Record<UIProjectStatus, string> = {
    'planification': 'bg-yellow-100 text-yellow-800',
    'en_cours': 'bg-blue-100 text-blue-800',
    'en_pause': 'bg-orange-100 text-orange-800',
    'termine': 'bg-green-100 text-green-800',
    'annule': 'bg-red-100 text-red-800'
  };
  
  return colors[status] || colors['planification'];
}

/**
 * Obtient le libellé français d'un statut de tâche
 */
export function getTaskStatusLabel(status: UITaskStatus): string {
  const labels: Record<UITaskStatus, string> = {
    'non_debutee': 'Non débutée',
    'en_cours': 'En cours',
    'cloturee': 'Terminée'
  };
  
  return labels[status] || labels['non_debutee'];
}

/**
 * Obtient le libellé français d'un statut de projet
 */
export function getProjectStatusLabel(status: UIProjectStatus): string {
  const labels: Record<UIProjectStatus, string> = {
    'planification': 'Planification',
    'en_cours': 'En cours',
    'en_pause': 'En pause',
    'termine': 'Terminé',
    'annule': 'Annulé'
  };
  
  return labels[status] || labels['planification'];
}

/**
 * Vérifie si un statut de tâche est valide
 */
export function isValidTaskStatus(status: any): status is UITaskStatus {
  return ['non_debutee', 'en_cours', 'cloturee'].includes(status);
}

/**
 * Vérifie si un statut de projet est valide
 */
export function isValidProjectStatus(status: any): status is UIProjectStatus {
  return ['planification', 'en_cours', 'en_pause', 'termine', 'annule'].includes(status);
}

// Export des types pour utilisation externe
export type { SupabaseTaskStatus, UITaskStatus, SupabaseProjectStatus, UIProjectStatus };
