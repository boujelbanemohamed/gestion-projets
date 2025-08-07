import express from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const createDepartmentSchema = Joi.object({
  nom: Joi.string().required().min(2).max(100),
  description: Joi.string().optional().max(500)
});

const updateDepartmentSchema = Joi.object({
  nom: Joi.string().optional().min(2).max(100),
  description: Joi.string().optional().max(500)
});

// Get all departments
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;

    let query = db('departements')
      .select([
        'id',
        'nom',
        'description',
        'created_at',
        'updated_at'
      ]);

    // Apply search filter
    if (search) {
      query = query.where('nom', 'ilike', `%${search}%`);
    }

    const departments = await query
      .orderBy('nom', 'asc');

    res.json({ departments });
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get department by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const department = await db('departements')
      .select([
        'id',
        'nom',
        'description',
        'created_at',
        'updated_at'
      ])
      .where('id', id)
      .first();

    if (!department) {
      return res.status(404).json({ error: 'Département non trouvé' });
    }

    // Get users count in this department
    const [{ userCount }] = await db('users')
      .where('departement_id', id)
      .count('id as userCount');

    // Get projects count in this department
    const [{ projectCount }] = await db('projets')
      .where('departement_id', id)
      .count('id as projectCount');

    res.json({
      department: {
        ...department,
        userCount: Number(userCount),
        projectCount: Number(projectCount)
      }
    });
  } catch (error) {
    logger.error('Get department error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Create department (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { error, value } = createDepartmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { nom, description } = value;

    // Check if department already exists
    const existingDepartment = await db('departements').where('nom', nom).first();
    if (existingDepartment) {
      return res.status(400).json({ error: 'Un département avec ce nom existe déjà' });
    }

    // Create department
    const [department] = await db('departements')
      .insert({
        nom,
        description,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'nom', 'description', 'created_at']);

    logger.info(`New department created: ${nom}`);

    res.status(201).json({
      message: 'Département créé avec succès',
      department
    });
  } catch (error) {
    logger.error('Create department error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update department (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateDepartmentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if department exists
    const existingDepartment = await db('departements').where('id', id).first();
    if (!existingDepartment) {
      return res.status(404).json({ error: 'Département non trouvé' });
    }

    // Check if name is being changed and if it's already taken
    if (value.nom && value.nom !== existingDepartment.nom) {
      const nameExists = await db('departements').where('nom', value.nom).whereNot('id', id).first();
      if (nameExists) {
        return res.status(400).json({ error: 'Un département avec ce nom existe déjà' });
      }
    }

    // Update department
    const [department] = await db('departements')
      .where('id', id)
      .update({
        ...value,
        updated_at: new Date()
      })
      .returning(['id', 'nom', 'description', 'created_at']);

    logger.info(`Department updated: ${department.nom}`);

    res.json({
      message: 'Département mis à jour avec succès',
      department
    });
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete department (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const department = await db('departements').where('id', id).first();
    if (!department) {
      return res.status(404).json({ error: 'Département non trouvé' });
    }

    // Check if department has users
    const [{ userCount }] = await db('users').where('departement_id', id).count('id as userCount');
    if (Number(userCount) > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer un département avec des utilisateurs assignés',
        userCount: Number(userCount)
      });
    }

    // Check if department has projects
    const [{ projectCount }] = await db('projets').where('departement_id', id).count('id as projectCount');
    if (Number(projectCount) > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer un département avec des projets assignés',
        projectCount: Number(projectCount)
      });
    }

    // Delete department
    await db('departements').where('id', id).del();

    logger.info(`Department deleted: ${department.nom}`);

    res.json({ message: 'Département supprimé avec succès' });
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get department statistics
router.get('/:id/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const department = await db('departements').where('id', id).first();
    if (!department) {
      return res.status(404).json({ error: 'Département non trouvé' });
    }

    // Get users in department
    const users = await db('users')
      .select(['id', 'nom', 'prenom', 'email', 'fonction', 'role'])
      .where('departement_id', id);

    // Get projects in department
    const projects = await db('projets')
      .select(['id', 'nom', 'description', 'statut', 'created_at'])
      .where('departement_id', id);

    // Get tasks count for projects in this department
    const [{ totalTasks }] = await db('projets as p')
      .leftJoin('taches as t', 'p.id', 't.projet_id')
      .where('p.departement_id', id)
      .count('t.id as totalTasks');

    // Get completed tasks count
    const [{ completedTasks }] = await db('projets as p')
      .leftJoin('taches as t', 'p.id', 't.projet_id')
      .where('p.departement_id', id)
      .where('t.etat', 'cloturee')
      .count('t.id as completedTasks');

    const completionRate = Number(totalTasks) > 0 
      ? Math.round((Number(completedTasks) / Number(totalTasks)) * 100) 
      : 0;

    res.json({
      department,
      stats: {
        userCount: users.length,
        projectCount: projects.length,
        totalTasks: Number(totalTasks),
        completedTasks: Number(completedTasks),
        completionRate
      },
      users,
      projects
    });
  } catch (error) {
    logger.error('Get department stats error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router; 