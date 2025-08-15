import express from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const createUserSchema = Joi.object({
  nom: Joi.string().required().min(2).max(100),
  prenom: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
  fonction: Joi.string().optional().max(100),
  departement_id: Joi.string().uuid().optional(),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER').default('USER')
});

const updateUserSchema = Joi.object({
  nom: Joi.string().optional().min(2).max(100),
  prenom: Joi.string().optional().min(2).max(100),
  email: Joi.string().email().optional(),
  fonction: Joi.string().optional().max(100),
  departement_id: Joi.string().uuid().optional(),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER').optional()
});

const updatePermissionsSchema = Joi.object({
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER').required(),
  customPermissions: Joi.object().optional()
});

const assignProjectsSchema = Joi.object({
  project_ids: Joi.array().items(Joi.string().uuid()).required()
});

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 10, search, departement_id, role } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('users as u')
      .select([
        'u.id',
        'u.nom',
        'u.prenom',
        'u.email',
        'u.fonction',
        'u.role',
        'u.created_at',
        'u.updated_at',
        'd.nom as departement_nom'
      ])
      .leftJoin('departements as d', 'u.departement_id', 'd.id');

    // Apply filters
    if (search) {
      query = query.where(function() {
        this.where('u.nom', 'ilike', `%${search}%`)
          .orWhere('u.prenom', 'ilike', `%${search}%`)
          .orWhere('u.email', 'ilike', `%${search}%`);
      });
    }

    if (departement_id) {
      query = query.where('u.departement_id', departement_id);
    }

    if (role) {
      query = query.where('u.role', role);
    }

    const users = await query
      .orderBy('u.created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    // Get total count
    const totalQuery = db('users as u');
    if (search) {
      totalQuery.where(function() {
        this.where('u.nom', 'ilike', `%${search}%`)
          .orWhere('u.prenom', 'ilike', `%${search}%`)
          .orWhere('u.email', 'ilike', `%${search}%`);
      });
    }
    if (departement_id) {
      totalQuery.where('u.departement_id', departement_id);
    }
    if (role) {
      totalQuery.where('u.role', role);
    }

    const [{ count }] = await totalQuery.count('u.id as count');

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Users can only access their own profile unless they're admin
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN' && req.user!.id !== id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const user = await db('users as u')
      .select([
        'u.id',
        'u.nom',
        'u.prenom',
        'u.email',
        'u.fonction',
        'u.role',
        'u.created_at',
        'u.updated_at',
        'd.nom as departement_nom'
      ])
      .leftJoin('departements as d', 'u.departement_id', 'd.id')
      .where('u.id', id)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Create user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { nom, prenom, email, password, fonction, departement_id, role } = value;

    // Check if user already exists
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const [user] = await db('users')
      .insert({
        nom,
        prenom,
        email,
        password_hash,
        fonction,
        departement_id,
        role,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'nom', 'prenom', 'email', 'fonction', 'departement_id', 'role', 'created_at']);

    logger.info(`New user created by admin: ${email}`);

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Users can only update their own profile unless they're admin
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN' && req.user!.id !== id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Check if user exists
    const existingUser = await db('users').where('id', id).first();
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Check if email is being changed and if it's already taken
    if (value.email && value.email !== existingUser.email) {
      const emailExists = await db('users').where('email', value.email).whereNot('id', id).first();
      if (emailExists) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
    }

    // Update user
    const [user] = await db('users')
      .where('id', id)
      .update({
        ...value,
        updated_at: new Date()
      })
      .returning(['id', 'nom', 'prenom', 'email', 'fonction', 'departement_id', 'role', 'created_at']);

    logger.info(`User updated: ${user.email}`);

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Prevent deleting own account
    if (req.user!.id === id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Check if user has assigned tasks
    const assignedTasks = await db('tache_utilisateurs').where('user_id', id).first();
    if (assignedTasks) {
      return res.status(400).json({ error: 'Impossible de supprimer un utilisateur avec des tâches assignées' });
    }

    // Delete user
    await db('users').where('id', id).del();

    logger.info(`User deleted: ${user.email}`);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update user permissions (admin only)
router.put('/:id/permissions', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePermissionsSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if user exists
    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Prevent updating own permissions
    if (req.user!.id === id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas modifier vos propres permissions' });
    }

    // Update user permissions
    const [updatedUser] = await db('users')
      .where('id', id)
      .update({
        role: value.role,
        custom_permissions: value.customPermissions ? JSON.stringify(value.customPermissions) : null,
        updated_at: new Date()
      })
      .returning(['id', 'nom', 'prenom', 'email', 'fonction', 'departement_id', 'role', 'created_at']);

    logger.info(`User permissions updated: ${updatedUser.email} - Role: ${value.role}`);

    res.json({
      message: 'Permissions mises à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update user permissions error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Assign projects to user
router.put('/:id/projects', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = assignProjectsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { project_ids } = value;

    // Get target user
    const targetUser = await db('users').where('id', id).first();
    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Check permissions
    const canAssign = await checkProjectAssignmentPermissions(req.user!, targetUser, project_ids);
    if (!canAssign.allowed) {
      return res.status(403).json({ error: canAssign.message });
    }

    // Update user's assigned projects
    const [updatedUser] = await db('users')
      .where('id', id)
      .update({
        assigned_projects: JSON.stringify(project_ids),
        updated_at: new Date()
      })
      .returning(['id', 'nom', 'prenom', 'email', 'fonction', 'departement_id', 'role', 'assigned_projects', 'created_at']);

    // Also update the user_project_assignments table for audit trail
    await db.transaction(async (trx) => {
      // Remove existing assignments
      await trx('user_project_assignments').where('user_id', id).del();

      // Add new assignments
      if (project_ids.length > 0) {
        const assignments = project_ids.map(project_id => ({
          user_id: id,
          project_id,
          assigned_by: req.user!.id,
          assigned_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }));

        await trx('user_project_assignments').insert(assignments);
      }
    });

    logger.info(`User projects assigned: ${targetUser.email} - Projects: ${project_ids.join(', ')} by ${req.user!.email}`);

    res.json({
      message: 'Projets assignés avec succès',
      user: {
        ...updatedUser,
        assigned_projects: project_ids
      }
    });
  } catch (error) {
    logger.error('Assign projects error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get user's assigned projects
router.get('/:id/projects', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get user with assigned projects
    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Check permissions - users can see their own projects, admins can see all
    if (req.user!.role === 'USER' && req.user!.id !== id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Get project details
    const assignedProjectIds = user.assigned_projects ? JSON.parse(user.assigned_projects) : [];
    let projects = [];

    if (assignedProjectIds.length > 0) {
      projects = await db('projets as p')
        .select(['p.*', 'd.nom as departement_nom'])
        .leftJoin('departements as d', 'p.departement_id', 'd.id')
        .whereIn('p.id', assignedProjectIds);
    }

    res.json({
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email
      },
      projects
    });
  } catch (error) {
    logger.error('Get user projects error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Helper function to check project assignment permissions
async function checkProjectAssignmentPermissions(
  currentUser: any,
  targetUser: any,
  projectIds: string[]
): Promise<{ allowed: boolean; message: string }> {
  // Super Admin can assign anyone to any project
  if (currentUser.role === 'SUPER_ADMIN') {
    return { allowed: true, message: '' };
  }

  // Admin can assign projects to regular users
  if (currentUser.role === 'ADMIN') {
    if (targetUser.role !== 'USER') {
      return {
        allowed: false,
        message: 'Vous ne pouvez assigner des projets qu\'aux utilisateurs réguliers'
      };
    }
    return { allowed: true, message: '' };
  }

  // Regular users can only assign projects they manage
  if (currentUser.role === 'USER') {
    if (targetUser.role !== 'USER') {
      return {
        allowed: false,
        message: 'Vous ne pouvez assigner des projets qu\'aux utilisateurs réguliers'
      };
    }

    // Check if current user is responsible for all the projects being assigned
    const managedProjects = await db('projets')
      .whereIn('id', projectIds)
      .where('responsable_id', currentUser.id);

    if (managedProjects.length !== projectIds.length) {
      return {
        allowed: false,
        message: 'Vous ne pouvez assigner que les projets dont vous êtes responsable'
      };
    }

    return { allowed: true, message: '' };
  }

  return { allowed: false, message: 'Permissions insuffisantes' };
}

export default router;