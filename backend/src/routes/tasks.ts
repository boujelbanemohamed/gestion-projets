import express from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';
import { io } from '../server';

const router = express.Router();

// Validation schemas
const createTaskSchema = Joi.object({
  nom: Joi.string().required().min(2).max(200),
  description: Joi.string().optional().max(2000),
  scenario_execution: Joi.string().optional().max(5000),
  criteres_acceptation: Joi.string().optional().max(2000),
  etat: Joi.string().valid('non_debutee', 'en_cours', 'cloturee').default('non_debutee'),
  date_realisation: Joi.date().required(),
  projet_id: Joi.string().uuid().required(),
  utilisateurs: Joi.array().items(Joi.string().uuid()).min(1).required()
});

const updateTaskSchema = Joi.object({
  nom: Joi.string().optional().min(2).max(200),
  description: Joi.string().optional().max(2000),
  scenario_execution: Joi.string().optional().max(5000),
  criteres_acceptation: Joi.string().optional().max(2000),
  etat: Joi.string().valid('non_debutee', 'en_cours', 'cloturee').optional(),
  date_realisation: Joi.date().optional(),
  utilisateurs: Joi.array().items(Joi.string().uuid()).optional()
});

// Helper function to add task history
async function addTaskHistory(tacheId: string, action: string, description: string, auteurId: string, details?: any) {
  await db('tache_history').insert({
    tache_id: tacheId,
    action,
    description,
    auteur_id: auteurId,
    details: details ? JSON.stringify(details) : null,
    created_at: new Date()
  });
}

// Get tasks for a project
router.get('/project/:projectId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const { status, assigned_to } = req.query;

    let query = db('taches as t')
      .select([
        't.*',
        db.raw('COALESCE(json_agg(DISTINCT jsonb_build_object(\'id\', u.id, \'nom\', u.nom, \'prenom\', u.prenom, \'email\', u.email, \'fonction\', u.fonction)) FILTER (WHERE u.id IS NOT NULL), \'[]\') as utilisateurs'),
        db.raw('COUNT(DISTINCT c.id) as commentaires_count'),
        db.raw('COUNT(DISTINCT ta.id) as attachments_count')
      ])
      .leftJoin('tache_utilisateurs as tu', 't.id', 'tu.tache_id')
      .leftJoin('users as u', 'tu.user_id', 'u.id')
      .leftJoin('commentaires as c', 't.id', 'c.tache_id')
      .leftJoin('tache_attachments as ta', 't.id', 'ta.tache_id')
      .where('t.projet_id', projectId)
      .groupBy('t.id');

    // Filter for regular users
    if (req.user!.role === 'UTILISATEUR') {
      query = query.whereExists(
        db('tache_utilisateurs')
          .where('tache_id', db.raw('t.id'))
          .where('user_id', req.user!.id)
      );
    }

    // Apply filters
    if (status) {
      query = query.where('t.etat', status);
    }

    if (assigned_to) {
      query = query.whereExists(
        db('tache_utilisateurs')
          .where('tache_id', db.raw('t.id'))
          .where('user_id', assigned_to)
      );
    }

    const tasks = await query.orderBy('t.created_at', 'desc');

    res.json({ tasks });
  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get task by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const task = await db('taches as t')
      .select([
        't.*',
        db.raw('COALESCE(json_agg(DISTINCT jsonb_build_object(\'id\', u.id, \'nom\', u.nom, \'prenom\', u.prenom, \'email\', u.email, \'fonction\', u.fonction)) FILTER (WHERE u.id IS NOT NULL), \'[]\') as utilisateurs')
      ])
      .leftJoin('tache_utilisateurs as tu', 't.id', 'tu.tache_id')
      .leftJoin('users as u', 'tu.user_id', 'u.id')
      .where('t.id', id)
      .groupBy('t.id')
      .first();

    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    // Check permissions for regular users
    if (req.user!.role === 'UTILISATEUR') {
      const hasAccess = await db('tache_utilisateurs')
        .where('tache_id', id)
        .where('user_id', req.user!.id)
        .first();

      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à cette tâche' });
      }
    }

    // Get comments
    const comments = await db('commentaires as c')
      .select(['c.*', 'u.nom', 'u.prenom', 'u.email'])
      .leftJoin('users as u', 'c.auteur_id', 'u.id')
      .where('c.tache_id', id)
      .orderBy('c.created_at', 'desc');

    // Get attachments
    const attachments = await db('tache_attachments as ta')
      .select(['ta.*', 'u.nom', 'u.prenom'])
      .leftJoin('users as u', 'ta.uploaded_by', 'u.id')
      .where('ta.tache_id', id)
      .orderBy('ta.uploaded_at', 'desc');

    // Get history
    const history = await db('tache_history as th')
      .select(['th.*', 'u.nom', 'u.prenom'])
      .leftJoin('users as u', 'th.auteur_id', 'u.id')
      .where('th.tache_id', id)
      .orderBy('th.created_at', 'desc');

    res.json({
      ...task,
      commentaires: comments,
      attachments,
      history
    });
  } catch (error) {
    logger.error('Get task error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Create task
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { nom, description, scenario_execution, criteres_acceptation, etat, date_realisation, projet_id, utilisateurs } = value;

    // Check if user has access to the project
    if (req.user!.role === 'UTILISATEUR') {
      const hasAccess = await db('taches as t')
        .leftJoin('tache_utilisateurs as tu', 't.id', 'tu.tache_id')
        .where('t.projet_id', projet_id)
        .where('tu.user_id', req.user!.id)
        .first();

      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à ce projet' });
      }
    }

    // Start transaction
    const trx = await db.transaction();

    try {
      // Create task
      const [task] = await trx('taches')
        .insert({
          nom,
          description,
          scenario_execution,
          criteres_acceptation,
          etat,
          date_realisation,
          projet_id,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // Assign users
      const userAssignments = utilisateurs.map((userId: string) => ({
        tache_id: task.id,
        user_id: userId,
        created_at: new Date()
      }));

      await trx('tache_utilisateurs').insert(userAssignments);

      // Add history
      await trx('tache_history').insert({
        tache_id: task.id,
        action: 'created',
        description: `Tâche créée par ${req.user!.prenom} ${req.user!.nom}`,
        auteur_id: req.user!.id,
        created_at: new Date()
      });

      await trx.commit();

      logger.info(`Task created: ${nom} by ${req.user!.email}`);

      // Emit real-time event
      io.to(`project:${projet_id}`).emit('task:created', task);

      res.status(201).json({
        message: 'Tâche créée avec succès',
        task
      });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Create task error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get current task
    const currentTask = await db('taches').where('id', id).first();
    if (!currentTask) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    // Check permissions
    if (req.user!.role === 'UTILISATEUR') {
      const hasAccess = await db('tache_utilisateurs')
        .where('tache_id', id)
        .where('user_id', req.user!.id)
        .first();

      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à cette tâche' });
      }
    }

    const { utilisateurs, ...taskData } = value;

    // Start transaction
    const trx = await db.transaction();

    try {
      // Update task
      const [task] = await trx('taches')
        .where('id', id)
        .update({
          ...taskData,
          updated_at: new Date()
        })
        .returning('*');

      // Update user assignments if provided
      if (utilisateurs) {
        await trx('tache_utilisateurs').where('tache_id', id).del();
        
        const userAssignments = utilisateurs.map((userId: string) => ({
          tache_id: id,
          user_id: userId,
          created_at: new Date()
        }));

        await trx('tache_utilisateurs').insert(userAssignments);
      }

      // Add history for status change
      if (taskData.etat && taskData.etat !== currentTask.etat) {
        await trx('tache_history').insert({
          tache_id: id,
          action: 'status_changed',
          description: `Statut changé de "${currentTask.etat}" vers "${taskData.etat}" par ${req.user!.prenom} ${req.user!.nom}`,
          auteur_id: req.user!.id,
          details: JSON.stringify({
            old_value: currentTask.etat,
            new_value: taskData.etat
          }),
          created_at: new Date()
        });
      }

      await trx.commit();

      logger.info(`Task updated: ${id} by ${req.user!.email}`);

      // Emit real-time event
      io.to(`project:${currentTask.projet_id}`).emit('task:updated', task);

      res.json({
        message: 'Tâche mise à jour avec succès',
        task
      });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Update task error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete task (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const task = await db('taches').where('id', id).first();
    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    await db('taches').where('id', id).del();

    logger.info(`Task deleted: ${id} by ${req.user!.email}`);

    // Emit real-time event
    io.to(`project:${task.projet_id}`).emit('task:deleted', { id });

    res.json({ message: 'Tâche supprimée avec succès' });
  } catch (error) {
    logger.error('Delete task error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;