export interface User {
  id: string;
  nom: string;
  prenom: string;
  fonction?: string;
  departement: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR';
  mot_de_passe?: string; // Only for creation/update, not stored in state
  assigned_projects?: string[]; // Array of project IDs the user is assigned to
  created_at: Date;
}

export interface AuthUser {
  id: string;
  nom: string;
  prenom: string;
  fonction?: string;
  departement?: string;
  departement_id?: number;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';
  assigned_projects?: string[]; // Array of project IDs the user is assigned to
  created_at?: Date | string;
}

export interface CommentAttachment {
  id: string;
  nom: string;
  taille: number;
  type: string;
  url: string;
  uploaded_at: Date;
}

export interface Comment {
  id: string;
  contenu: string;
  auteur: AuthUser;
  created_at: Date;
  task_id: string;
  attachments?: CommentAttachment[];
}

export interface TaskHistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'unassigned' | 'comment_added' | 'comment_deleted' | 'date_changed';
  description: string;
  auteur: AuthUser;
  created_at: Date;
  task_id: string;
  details?: {
    old_value?: unknown;
    new_value?: unknown;
    field?: string;
  };
}

export interface ProjectAttachment {
  id: string;
  nom: string;
  taille: number;
  type: string;
  url: string;
  uploaded_at: Date;
  uploaded_by: AuthUser;
}

export interface TaskAttachment {
  id: string;
  nom: string;
  taille: number;
  type: string;
  url: string;
  uploaded_at: Date;
  uploaded_by: AuthUser;
}

export interface Task {
  id: string;
  nom: string;
  description?: string;
  scenario_execution?: string;
  criteres_acceptation?: string;
  etat: 'non_debutee' | 'en_cours' | 'cloturee';
  date_realisation: Date;
  projet_id: string;
  utilisateurs: User[];
  commentaires?: Comment[];
  history?: TaskHistoryEntry[];
  attachments?: TaskAttachment[];
}

export interface Project {
  id: string;
  nom: string;
  type_projet?: string;
  description?: string;
  responsable_id?: string;
  budget_initial?: number;
  devise?: string;
  prestataire_externe?: string;
  nouvelles_fonctionnalites?: string;
  avantages?: string;
  departement?: string;
  date_debut?: Date;
  date_fin?: Date;
  statut?: 'actif' | 'cloture';
  date_cloture?: Date;
  date_reouverture?: Date;
  motif_reouverture?: string;
  created_at: Date;
  updated_at: Date;
  taches: Task[];
  attachments?: ProjectAttachment[];
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  percentage: number;
}

export interface Department {
  id: string;
  nom: string;
  created_at: Date;
}

export interface MeetingMinutes {
  id: string;
  titre: string;
  date_reunion: Date;
  description?: string;
  nom_fichier: string;
  chemin_fichier: string;
  taille_fichier: number;
  type_mime: string;
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
  projets: Project[];
}

export interface MeetingMinutesProject {
  id: string;
  pv_id: string;
  projet_id: string;
  created_at: Date;
}

export interface MemberPerformance {
  user: User;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  completionPercentage: number;
  overdueTasks: number;
  tasks: {
    non_debutee: Task[];
    en_cours: Task[];
    cloturee: Task[];
  };
}

export interface Permission {
  resource: string;
  action: string;
  allowed: boolean;
}

export interface RolePermissions {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR';
  permissions: Permission[];
}