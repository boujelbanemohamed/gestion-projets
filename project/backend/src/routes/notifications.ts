import express from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const createNotificationSchema = Joi.object({
  titre: Joi.string().required().min(1).max(200),
  message: Joi.string().required().min(1).max(1000),
  type: Joi.string().valid('info', 'success', 'warning', 'error').default('info'),
  destinataire_id: Joi.string().uuid().optional(),
  projet_id: Joi.string().uuid().optional(),
  tache_id: Joi.string().uuid().optional()
});

// Get user notifications
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('notifications as n')
      .select([
        'n.id',
        'n.titre',
        'n.message',
        'n.type',
        'n.lu',
        'n.created_at',
        'n.projet_id',
        'n.tache_id',
        'p.nom as projet_nom',
        't.nom as tache_nom'
      ])
      .leftJoin('projets as p', 'n.projet_id', 'p.id')
      .leftJoin('taches as t', 'n.tache_id', 't.id')
      .where(function() {
        this.where('n.destinataire_id', req.user!.id)
          .orWhereNull('n.destinataire_id'); // Global notifications
      });

    // Filter unread only
    if (unread_only === 'true') {
      query = query.where('n.lu', false);
    }

    const notifications = await query
      .orderBy('n.created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    // Get total count
    const totalQuery = db('notifications as n')
      .where(function() {
        this.where('n.destinataire_id', req.user!.id)
          .orWhereNull('n.destinataire_id');
      });

    if (unread_only === 'true') {
      totalQuery.where('n.lu', false);
    }

    const [{ count }] = await totalQuery.count('n.id as count');

    // Get unread count
    const [{ unreadCount }] = await db('notifications as n')
      .where(function() {
        this.where('n.destinataire_id', req.user!.id)
          .orWhereNull('n.destinataire_id');
      })
      .where('n.lu', false)
      .count('n.id as unreadCount');

    res.json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      },
      unreadCount: Number(unreadCount)
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get notification by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const notification = await db('notifications as n')
      .select([
        'n.id',
        'n.titre',
        'n.message',
        'n.type',
        'n.lu',
        'n.created_at',
        'n.projet_id',
        'n.tache_id',
        'p.nom as projet_nom',
        't.nom as tache_nom'
      ])
      .leftJoin('projets as p', 'n.projet_id', 'p.id')
      .leftJoin('taches as t', 'n.tache_id', 't.id')
      .where('n.id', id)
      .where(function() {
        this.where('n.destinataire_id', req.user!.id)
          .orWhereNull('n.destinataire_id');
      })
      .first();

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    res.json({ notification });
  } catch (error) {
    logger.error('Get notification error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Create notification (admin only)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { error, value } = createNotificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { titre, message, type, destinataire_id, projet_id, tache_id } = value;

    // Check if destinataire exists if provided
    if (destinataire_id) {
      const user = await db('users').where('id', destinataire_id).first();
      if (!user) {
        return res.status(404).json({ error: 'Destinataire non trouvé' });
      }
    }

    // Check if project exists if provided
    if (projet_id) {
      const project = await db('projets').where('id', projet_id).first();
      if (!project) {
        return res.status(404).json({ error: 'Projet non trouvé' });
      }
    }

    // Check if task exists if provided
    if (tache_id) {
      const task = await db('taches').where('id', tache_id).first();
      if (!task) {
        return res.status(404).json({ error: 'Tâche non trouvée' });
      }
    }

    // Create notification
    const [notification] = await db('notifications')
      .insert({
        titre,
        message,
        type,
        destinataire_id,
        projet_id,
        tache_id,
        lu: false,
        created_at: new Date()
      })
      .returning(['id', 'titre', 'message', 'type', 'lu', 'created_at']);

    logger.info(`Notification created by ${req.user!.email}`);

    res.status(201).json({
      message: 'Notification créée avec succès',
      notification
    });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if notification exists and belongs to user
    const notification = await db('notifications')
      .where('id', id)
      .where(function() {
        this.where('destinataire_id', req.user!.id)
          .orWhereNull('destinataire_id');
      })
      .first();

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    // Mark as read
    await db('notifications')
      .where('id', id)
      .update({ lu: true });

    logger.info(`Notification marked as read by ${req.user!.email}`);

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await db('notifications')
      .where(function() {
        this.where('destinataire_id', req.user!.id)
          .orWhereNull('destinataire_id');
      })
      .where('lu', false)
      .update({ lu: true });

    logger.info(`All notifications marked as read by ${req.user!.email}`);

    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if notification exists and belongs to user
    const notification = await db('notifications')
      .where('id', id)
      .where(function() {
        this.where('destinataire_id', req.user!.id)
          .orWhereNull('destinataire_id');
      })
      .first();

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    // Delete notification
    await db('notifications').where('id', id).del();

    logger.info(`Notification deleted by ${req.user!.email}`);

    res.json({ message: 'Notification supprimée avec succès' });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get notification statistics
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Get total notifications count
    const [{ totalCount }] = await db('notifications as n')
      .where(function() {
        this.where('n.destinataire_id', req.user!.id)
          .orWhereNull('n.destinataire_id');
      })
      .count('n.id as totalCount');

    // Get unread notifications count
    const [{ unreadCount }] = await db('notifications as n')
      .where(function() {
        this.where('n.destinataire_id', req.user!.id)
          .orWhereNull('n.destinataire_id');
      })
      .where('n.lu', false)
      .count('n.id as unreadCount');

    // Get notifications by type
    const notificationsByType = await db('notifications as n')
      .select('n.type')
      .count('n.id as count')
      .where(function() {
        this.where('n.destinataire_id', req.user!.id)
          .orWhereNull('n.destinataire_id');
      })
      .groupBy('n.type');

    // Get recent notifications (last 7 days)
    const [{ recentCount }] = await db('notifications as n')
      .where(function() {
        this.where('n.destinataire_id', req.user!.id)
          .orWhereNull('n.destinataire_id');
      })
      .where('n.created_at', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .count('n.id as recentCount');

    res.json({
      totalCount: Number(totalCount),
      unreadCount: Number(unreadCount),
      recentCount: Number(recentCount),
      byType: notificationsByType
    });
  } catch (error) {
    logger.error('Get notification stats error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router; 