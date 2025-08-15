import express from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const createCommentSchema = Joi.object({
  contenu: Joi.string().required().min(1).max(2000),
  tache_id: Joi.string().uuid().required()
});

const updateCommentSchema = Joi.object({
  contenu: Joi.string().required().min(1).max(2000)
});

// Get comments for a task
router.get('/task/:taskId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;

    // Check if task exists
    const task = await db('taches').where('id', taskId).first();
    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    // Check if user has access to this task
    if (req.user!.role === 'USER') {
      const hasAccess = await db('tache_utilisateurs')
        .where('tache_id', taskId)
        .where('user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à cette tâche' });
      }
    }

    const comments = await db('commentaires as c')
      .select([
        'c.id',
        'c.contenu',
        'c.created_at',
        'c.updated_at',
        'u.id as auteur_id',
        'u.nom as auteur_nom',
        'u.prenom as auteur_prenom',
        'u.email as auteur_email',
        'u.fonction as auteur_fonction'
      ])
      .leftJoin('users as u', 'c.auteur_id', 'u.id')
      .where('c.tache_id', taskId)
      .orderBy('c.created_at', 'asc');

    res.json({ comments });
  } catch (error) {
    logger.error('Get comments error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get comment by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const comment = await db('commentaires as c')
      .select([
        'c.id',
        'c.contenu',
        'c.tache_id',
        'c.created_at',
        'c.updated_at',
        'u.id as auteur_id',
        'u.nom as auteur_nom',
        'u.prenom as auteur_prenom',
        'u.email as auteur_email',
        'u.fonction as auteur_fonction'
      ])
      .leftJoin('users as u', 'c.auteur_id', 'u.id')
      .where('c.id', id)
      .first();

    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    // Check if user has access to this comment's task
    if (req.user!.role === 'USER') {
      const hasAccess = await db('tache_utilisateurs')
        .where('tache_id', comment.tache_id)
        .where('user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à ce commentaire' });
      }
    }

    res.json({ comment });
  } catch (error) {
    logger.error('Get comment error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Create comment
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { error, value } = createCommentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { contenu, tache_id } = value;

    // Check if task exists
    const task = await db('taches').where('id', tache_id).first();
    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    // Check if user has access to this task
    if (req.user!.role === 'USER') {
      const hasAccess = await db('tache_utilisateurs')
        .where('tache_id', tache_id)
        .where('user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à cette tâche' });
      }
    }

    // Create comment
    const [comment] = await db('commentaires')
      .insert({
        contenu,
        tache_id,
        auteur_id: req.user!.id,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'contenu', 'tache_id', 'created_at']);

    // Get comment with author info
    const commentWithAuthor = await db('commentaires as c')
      .select([
        'c.id',
        'c.contenu',
        'c.tache_id',
        'c.created_at',
        'c.updated_at',
        'u.id as auteur_id',
        'u.nom as auteur_nom',
        'u.prenom as auteur_prenom',
        'u.email as auteur_email',
        'u.fonction as auteur_fonction'
      ])
      .leftJoin('users as u', 'c.auteur_id', 'u.id')
      .where('c.id', comment.id)
      .first();

    logger.info(`New comment created by ${req.user!.email} for task ${tache_id}`);

    res.status(201).json({
      message: 'Commentaire créé avec succès',
      comment: commentWithAuthor
    });
  } catch (error) {
    logger.error('Create comment error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update comment
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateCommentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if comment exists
    const comment = await db('commentaires').where('id', id).first();
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    // Only author can update their comment
    if (comment.auteur_id !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres commentaires' });
    }

    // Update comment
    const [updatedComment] = await db('commentaires')
      .where('id', id)
      .update({
        contenu: value.contenu,
        updated_at: new Date()
      })
      .returning(['id', 'contenu', 'tache_id', 'created_at']);

    // Get updated comment with author info
    const commentWithAuthor = await db('commentaires as c')
      .select([
        'c.id',
        'c.contenu',
        'c.tache_id',
        'c.created_at',
        'c.updated_at',
        'u.id as auteur_id',
        'u.nom as auteur_nom',
        'u.prenom as auteur_prenom',
        'u.email as auteur_email',
        'u.fonction as auteur_fonction'
      ])
      .leftJoin('users as u', 'c.auteur_id', 'u.id')
      .where('c.id', id)
      .first();

    logger.info(`Comment updated by ${req.user!.email}`);

    res.json({
      message: 'Commentaire mis à jour avec succès',
      comment: commentWithAuthor
    });
  } catch (error) {
    logger.error('Update comment error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if comment exists
    const comment = await db('commentaires').where('id', id).first();
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    // Only author or admin can delete comment
    if (comment.auteur_id !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres commentaires' });
    }

    // Delete comment
    await db('commentaires').where('id', id).del();

    logger.info(`Comment deleted by ${req.user!.email}`);

    res.json({ message: 'Commentaire supprimé avec succès' });
  } catch (error) {
    logger.error('Delete comment error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get comment attachments
router.get('/:id/attachments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if comment exists
    const comment = await db('commentaires').where('id', id).first();
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    // Check if user has access to this comment's task
    if (req.user!.role === 'USER') {
      const hasAccess = await db('tache_utilisateurs')
        .where('tache_id', comment.tache_id)
        .where('user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à ce commentaire' });
      }
    }

    const attachments = await db('commentaire_attachments')
      .select([
        'id',
        'nom_fichier',
        'chemin_fichier',
        'taille_fichier',
        'type_mime',
        'created_at'
      ])
      .where('commentaire_id', id)
      .orderBy('created_at', 'asc');

    res.json({ attachments });
  } catch (error) {
    logger.error('Get comment attachments error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router; 