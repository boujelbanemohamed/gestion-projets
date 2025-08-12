import { AuthUser, RolePermissions } from '../types';

export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'SUPER_ADMIN',
    permissions: [
      { resource: 'dashboard', action: 'view', allowed: true },
      { resource: 'performance', action: 'view', allowed: true },
      { resource: 'departments', action: 'view', allowed: true },
      { resource: 'departments', action: 'create', allowed: true },
      { resource: 'departments', action: 'edit', allowed: true },
      { resource: 'departments', action: 'delete', allowed: true },
      { resource: 'members', action: 'view', allowed: true },
      { resource: 'members', action: 'create', allowed: true },
      { resource: 'members', action: 'edit', allowed: true },
      { resource: 'members', action: 'delete', allowed: true },
      { resource: 'members', action: 'manage_roles', allowed: true },
      { resource: 'members', action: 'assign_projects', allowed: true },
      { resource: 'projects', action: 'view', allowed: true },
      { resource: 'projects', action: 'create', allowed: true },
      { resource: 'projects', action: 'edit', allowed: true },
      { resource: 'projects', action: 'delete', allowed: true },
      { resource: 'tasks', action: 'view', allowed: true },
      { resource: 'tasks', action: 'create', allowed: true },
      { resource: 'tasks', action: 'edit', allowed: true },
      { resource: 'tasks', action: 'delete', allowed: true },
      { resource: 'comments', action: 'view', allowed: true },
      { resource: 'comments', action: 'create', allowed: true },
      { resource: 'comments', action: 'delete', allowed: true },
      { resource: 'attachments', action: 'view', allowed: true },
      { resource: 'attachments', action: 'upload', allowed: true },
      { resource: 'attachments', action: 'delete', allowed: true },
      { resource: 'closed-projects', action: 'view', allowed: true },
      { resource: 'meeting-minutes', action: 'view', allowed: true },
      { resource: 'meeting-minutes', action: 'create', allowed: true },
      { resource: 'meeting-minutes', action: 'edit', allowed: true },
      { resource: 'meeting-minutes', action: 'delete', allowed: true },
      { resource: 'admin-settings', action: 'view', allowed: true },
      { resource: 'admin-settings', action: 'edit', allowed: true },
    ]
  },
  {
    role: 'ADMIN',
    permissions: [
      { resource: 'dashboard', action: 'view', allowed: true },
      { resource: 'performance', action: 'view', allowed: true },
      { resource: 'departments', action: 'view', allowed: true },
      { resource: 'departments', action: 'create', allowed: true },
      { resource: 'departments', action: 'edit', allowed: true },
      { resource: 'departments', action: 'delete', allowed: true },
      { resource: 'members', action: 'view', allowed: true },
      { resource: 'members', action: 'create', allowed: true },
      { resource: 'members', action: 'edit', allowed: true },
      { resource: 'members', action: 'delete', allowed: true },
      { resource: 'members', action: 'manage_roles', allowed: false },
      { resource: 'members', action: 'assign_projects', allowed: true },
      { resource: 'projects', action: 'view', allowed: true },
      { resource: 'projects', action: 'create', allowed: true },
      { resource: 'projects', action: 'edit', allowed: true },
      { resource: 'projects', action: 'delete', allowed: true },
      { resource: 'tasks', action: 'view', allowed: true },
      { resource: 'tasks', action: 'create', allowed: true },
      { resource: 'tasks', action: 'edit', allowed: true },
      { resource: 'tasks', action: 'delete', allowed: true },
      { resource: 'comments', action: 'view', allowed: true },
      { resource: 'comments', action: 'create', allowed: true },
      { resource: 'comments', action: 'delete', allowed: true },
      { resource: 'attachments', action: 'view', allowed: true },
      { resource: 'attachments', action: 'upload', allowed: true },
      { resource: 'attachments', action: 'delete', allowed: true },
      { resource: 'closed-projects', action: 'view', allowed: true },
      { resource: 'meeting-minutes', action: 'view', allowed: true },
      { resource: 'meeting-minutes', action: 'create', allowed: true },
      { resource: 'meeting-minutes', action: 'edit', allowed: true },
      { resource: 'meeting-minutes', action: 'delete', allowed: true },
      { resource: 'admin-settings', action: 'view', allowed: false },
      { resource: 'admin-settings', action: 'edit', allowed: false },
    ]
  },
  {
    role: 'UTILISATEUR',
    permissions: [
      { resource: 'dashboard', action: 'view', allowed: true },
      { resource: 'performance', action: 'view', allowed: false },
      { resource: 'departments', action: 'view', allowed: false },
      { resource: 'departments', action: 'create', allowed: false },
      { resource: 'departments', action: 'edit', allowed: false },
      { resource: 'departments', action: 'delete', allowed: false },
      { resource: 'members', action: 'view', allowed: false },
      { resource: 'members', action: 'create', allowed: false },
      { resource: 'members', action: 'edit', allowed: false },
      { resource: 'members', action: 'delete', allowed: false },
      { resource: 'members', action: 'manage_roles', allowed: false },
      { resource: 'members', action: 'assign_projects', allowed: false },
      { resource: 'projects', action: 'view', allowed: true }, // Filtered to assigned projects
      { resource: 'projects', action: 'create', allowed: false },
      { resource: 'projects', action: 'edit', allowed: false },
      { resource: 'projects', action: 'delete', allowed: false },
      { resource: 'tasks', action: 'view', allowed: true }, // Only on assigned projects
      { resource: 'tasks', action: 'create', allowed: true }, // Only on assigned projects
      { resource: 'tasks', action: 'edit', allowed: true }, // Only on assigned projects
      { resource: 'tasks', action: 'delete', allowed: false },
      { resource: 'comments', action: 'view', allowed: true },
      { resource: 'comments', action: 'create', allowed: true },
      { resource: 'comments', action: 'delete', allowed: false },
      { resource: 'attachments', action: 'view', allowed: true },
      { resource: 'attachments', action: 'upload', allowed: true },
      { resource: 'attachments', action: 'delete', allowed: false },
      { resource: 'closed-projects', action: 'view', allowed: false },
      { resource: 'meeting-minutes', action: 'view', allowed: true },
      { resource: 'meeting-minutes', action: 'create', allowed: false },
      { resource: 'meeting-minutes', action: 'edit', allowed: false },
      { resource: 'meeting-minutes', action: 'delete', allowed: false },
    ]
  }
];

export class PermissionService {
  static hasPermission(user: AuthUser | null, resource: string, action: string): boolean {
    if (!user) return false;
    
    const rolePermissions = ROLE_PERMISSIONS.find(rp => rp.role === user.role);
    if (!rolePermissions) return false;
    
    const permission = rolePermissions.permissions.find(p => 
      p.resource === resource && p.action === action
    );
    
    return permission?.allowed || false;
  }
  
  static canAccessPage(user: AuthUser | null, page: string): boolean {
    if (!user) return false;
    
    switch (page) {
      case 'dashboard':
        return this.hasPermission(user, 'dashboard', 'view');
      case 'performance':
        return this.hasPermission(user, 'performance', 'view');
      case 'members':
        return this.hasPermission(user, 'members', 'view');
      case 'departments':
        return this.hasPermission(user, 'departments', 'view');
      case 'admin-settings':
        return this.hasPermission(user, 'admin-settings', 'view');
      case 'closed-projects':
        return this.hasPermission(user, 'closed-projects', 'view');
      case 'meeting-minutes':
        return this.hasPermission(user, 'meeting-minutes', 'view');
      default:
        return false;
    }
  }
  
  static getAccessibleProjects(user: AuthUser | null, allProjects: unknown[]): unknown[] {
    if (!user) return [];

    // TEMPORAIRE: Tous les utilisateurs connectés peuvent voir tous les projets
    // Cela corrige le problème d'affichage des projets
    console.log('🔍 getAccessibleProjects - Utilisateur:', user.email, 'Role:', user.role);
    console.log('📊 Projets disponibles:', allProjects.length);

    return allProjects;

    // ANCIEN CODE (désactivé temporairement)
    /*
    // Super Admin and Admin can see all projects
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return allProjects;
    }

    // Regular users can only see projects they're assigned to
    if (user.assigned_projects && user.assigned_projects.length > 0) {
      return allProjects.filter(project =>
        user.assigned_projects!.includes((project as { id: string }).id)
      );
    }
    */

    // Fallback: if no assigned_projects, check tasks (for backward compatibility)
    return allProjects.filter(project =>
      (project as { taches: Array<{ utilisateurs: Array<{ id: string }> }> }).taches.some((task) =>
        task.utilisateurs.some((taskUser) => taskUser.id === user.id)
      )
    );
  }
  
  static canManageUser(currentUser: AuthUser | null, targetUser: { role: string }): boolean {
    if (!currentUser) return false;
    
    // Super Admin can manage everyone
    if (currentUser.role === 'SUPER_ADMIN') return true;
    
    // Admin can manage regular users but not other admins or super admins
    if (currentUser.role === 'ADMIN') {
      return targetUser.role === 'UTILISATEUR';
    }
    
    // Regular users can't manage anyone
    return false;
  }
  
  static canChangeRole(currentUser: AuthUser | null): boolean {
    return this.hasPermission(currentUser, 'members', 'manage_roles');
  }

  static canAssignProjectsToMember(
    currentUser: AuthUser | null,
    targetMember: { id: string; role: string },
    projects: Array<{ id: string; responsable_id?: string }>
  ): boolean {
    if (!currentUser) return false;

    // Super Admin can assign anyone to any project
    if (currentUser.role === 'SUPER_ADMIN') return true;

    // Admin can assign projects to regular users
    if (currentUser.role === 'ADMIN') {
      return targetMember.role === 'UTILISATEUR';
    }

    // Regular users can only assign projects they manage
    if (currentUser.role === 'UTILISATEUR') {
      // Check if the current user is a project manager for any of the projects
      const managedProjects = projects.filter(project =>
        project.responsable_id === currentUser.id
      );

      // Can only assign if they manage at least one project and target is a regular user
      return managedProjects.length > 0 && targetMember.role === 'UTILISATEUR';
    }

    return false;
  }

  static getAssignableProjects(
    currentUser: AuthUser | null,
    allProjects: Array<{ id: string; responsable_id?: string; nom: string }>
  ): Array<{ id: string; responsable_id?: string; nom: string }> {
    if (!currentUser) return [];

    // Super Admin and Admin can assign any project
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
      return allProjects;
    }

    // Regular users can only assign projects they manage
    if (currentUser.role === 'UTILISATEUR') {
      return allProjects.filter(project => project.responsable_id === currentUser.id);
    }

    return [];
  }
}