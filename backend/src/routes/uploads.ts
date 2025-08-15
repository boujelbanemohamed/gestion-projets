import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { db } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Configure multer for in-memory uploads (we stream to Supabase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

// Supabase admin client
const supabaseAdmin = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE as string);
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'attachments';
const SIGN_TTL = parseInt(process.env.STORAGE_SIGNED_URL_TTL || '3600', 10);

async function uploadBufferAndGetSignedUrl(key: string, buffer: Buffer, contentType: string) {
  const { error: upErr } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(key, buffer, {
    contentType,
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data: signed, error: signErr } = await supabaseAdmin.storage.from(STORAGE_BUCKET).createSignedUrl(key, SIGN_TTL);
  if (signErr) throw signErr;
  return signed?.signedUrl;
}

// Upload file for project
router.post('/project/:projectId', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Check if project exists
    const project = await db('projets').where('id', projectId).first();
    if (!project) {
      // Delete uploaded file if project doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Check if user has access to this project
    if (req.user!.role === 'USER') {
      const hasAccess = await db('tache_utilisateurs as tu')
        .leftJoin('taches as t', 'tu.tache_id', 't.id')
        .where('t.projet_id', projectId)
        .where('tu.user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        // Delete uploaded file if no access
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Accès non autorisé à ce projet' });
      }
    }

    // Upload to Supabase Storage
    const key = `project_attachments/${projectId}/${randomUUID()}-${req.file.originalname}`;
    const signedUrl = await uploadBufferAndGetSignedUrl(key, req.file.buffer, req.file.mimetype);

    // Save file info to database (storage_key instead of local path)
    const [attachment] = await db('projet_attachments')
      .insert({
        projet_id: projectId,
        nom: req.file.originalname,
        taille: req.file.size,
        type: req.file.mimetype,
        url: signedUrl || '',
        storage_key: key,
        uploaded_by: req.user!.id,
        uploaded_at: new Date()
      })
      .returning(['id', 'nom', 'taille', 'type', 'url', 'storage_key', 'uploaded_at']);

    logger.info(`File uploaded for project ${projectId} by ${req.user!.email}`);

    res.status(201).json({
      message: 'Fichier uploadé avec succès',
      attachment
    });
  } catch (error) {
    // Nothing to cleanup (memory storage)
    
    logger.error('Upload project file error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Upload file for task
router.post('/task/:taskId', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Check if task exists
    const task = await db('taches').where('id', taskId).first();
    if (!task) {
      // Delete uploaded file if task doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    // Check if user has access to this task
    if (req.user!.role === 'USER') {
      const hasAccess = await db('tache_utilisateurs')
        .where('tache_id', taskId)
        .where('user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        // Delete uploaded file if no access
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Accès non autorisé à cette tâche' });
      }
    }

    const key = `task_attachments/${taskId}/${randomUUID()}-${req.file.originalname}`;
    const signedUrl = await uploadBufferAndGetSignedUrl(key, req.file.buffer, req.file.mimetype);

    const [attachment] = await db('tache_attachments')
      .insert({
        tache_id: taskId,
        nom: req.file.originalname,
        taille: req.file.size,
        type: req.file.mimetype,
        url: signedUrl || '',
        storage_key: key,
        uploaded_by: req.user!.id,
        uploaded_at: new Date()
      })
      .returning(['id', 'nom', 'taille', 'type', 'url', 'storage_key', 'uploaded_at']);

    logger.info(`File uploaded for task ${taskId} by ${req.user!.email}`);

    res.status(201).json({
      message: 'Fichier uploadé avec succès',
      attachment
    });
  } catch (error) {
    // Nothing to cleanup (memory storage)
    
    logger.error('Upload task file error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Upload file for comment
router.post('/comment/:commentId', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { commentId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Check if comment exists
    const comment = await db('commentaires').where('id', commentId).first();
    if (!comment) {
      // Delete uploaded file if comment doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    // Check if user has access to this comment's task
    if (req.user!.role === 'USER') {
      const hasAccess = await db('tache_utilisateurs')
        .where('tache_id', comment.tache_id)
        .where('user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        // Delete uploaded file if no access
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Accès non autorisé à ce commentaire' });
      }
    }

    const key = `comment_attachments/${commentId}/${randomUUID()}-${req.file.originalname}`;
    const signedUrl = await uploadBufferAndGetSignedUrl(key, req.file.buffer, req.file.mimetype);

    const [attachment] = await db('commentaire_attachments')
      .insert({
        commentaire_id: commentId,
        nom: req.file.originalname,
        taille: req.file.size,
        type: req.file.mimetype,
        url: signedUrl || '',
        storage_key: key,
        uploaded_by: req.user!.id,
        uploaded_at: new Date()
      })
      .returning(['id', 'nom', 'taille', 'type', 'url', 'storage_key', 'uploaded_at']);

    logger.info(`File uploaded for comment ${commentId} by ${req.user!.email}`);

    res.status(201).json({
      message: 'Fichier uploadé avec succès',
      attachment
    });
  } catch (error) {
    // Nothing to cleanup (memory storage)
    
    logger.error('Upload comment file error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get file by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Try to find file in different attachment tables
    let attachment = await db('projet_attachments').where('id', id).first();
    let tableName = 'projet_attachments';

    if (!attachment) {
      attachment = await db('tache_attachments').where('id', id).first();
      tableName = 'tache_attachments';
    }

    if (!attachment) {
      attachment = await db('commentaire_attachments').where('id', id).first();
      tableName = 'commentaire_attachments';
    }

    if (!attachment) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Check if user has access to this file
    if (req.user!.role === 'USER') {
      let hasAccess = false;

      if (tableName === 'projet_attachments') {
        const hasProjectAccess = await db('tache_utilisateurs as tu')
          .leftJoin('taches as t', 'tu.tache_id', 't.id')
          .where('t.projet_id', attachment.projet_id)
          .where('tu.user_id', req.user!.id)
          .first();
        hasAccess = !!hasProjectAccess;
      } else if (tableName === 'tache_attachments') {
        const hasTaskAccess = await db('tache_utilisateurs')
          .where('tache_id', attachment.tache_id)
          .where('user_id', req.user!.id)
          .first();
        hasAccess = !!hasTaskAccess;
      } else if (tableName === 'commentaire_attachments') {
        const comment = await db('commentaires').where('id', attachment.commentaire_id).first();
        if (comment) {
          const hasCommentAccess = await db('tache_utilisateurs')
            .where('tache_id', comment.tache_id)
            .where('user_id', req.user!.id)
            .first();
          hasAccess = !!hasCommentAccess;
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à ce fichier' });
      }
    }

    // If using Storage, return a signed URL
    if (attachment.storage_key) {
      const { data, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).createSignedUrl(attachment.storage_key, SIGN_TTL);
      if (error) {
        logger.error('Signed URL error:', error);
        return res.status(500).json({ error: 'Impossible de générer une URL signée' });
      }
      return res.json({ url: data?.signedUrl });
    }

    // Legacy: fallback to local file if still present
    if (attachment.chemin_fichier && fs.existsSync(attachment.chemin_fichier)) {
      return res.download(attachment.chemin_fichier, attachment.nom_fichier || attachment.nom);
    }

    return res.status(404).json({ error: 'Fichier introuvable' });
  } catch (error) {
    logger.error('Get file error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete file
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Try to find file in different attachment tables
    let attachment = await db('projet_attachments').where('id', id).first();
    let tableName = 'projet_attachments';

    if (!attachment) {
      attachment = await db('tache_attachments').where('id', id).first();
      tableName = 'tache_attachments';
    }

    if (!attachment) {
      attachment = await db('commentaire_attachments').where('id', id).first();
      tableName = 'commentaire_attachments';
    }

    if (!attachment) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Check if user has permission to delete this file
    if (req.user!.role === 'USER') {
      if (attachment.uploaded_by !== req.user!.id) {
        return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres fichiers' });
      }
    }

    // Delete from Storage if applicable
    if (attachment.storage_key) {
      try {
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([attachment.storage_key]);
      } catch (e) {
        logger.warn('Storage delete warning:', e as any);
      }
    } else if (attachment.chemin_fichier && fs.existsSync(attachment.chemin_fichier)) {
      fs.unlinkSync(attachment.chemin_fichier);
    }

    // Delete file record from database
    await db(tableName).where('id', id).del();

    logger.info(`File deleted by ${req.user!.email}`);

    res.json({ message: 'Fichier supprimé avec succès' });
  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get project attachments
router.get('/project/:projectId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const project = await db('projets').where('id', projectId).first();
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Check if user has access to this project
    if (req.user!.role === 'USER') {
      const hasAccess = await db('tache_utilisateurs as tu')
        .leftJoin('taches as t', 'tu.tache_id', 't.id')
        .where('t.projet_id', projectId)
        .where('tu.user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à ce projet' });
      }
    }

    const attachments = await db('projet_attachments as pa')
      .select([
        'pa.id',
        'pa.nom',
        'pa.taille',
        'pa.type',
        'pa.url',
        'pa.storage_key',
        'pa.uploaded_at',
        'u.nom as uploaded_by_nom',
        'u.prenom as uploaded_by_prenom'
      ])
      .leftJoin('users as u', 'pa.uploaded_by', 'u.id')
      .where('pa.projet_id', projectId)
      .orderBy('pa.uploaded_at', 'desc');

    res.json({ attachments });
  } catch (error) {
    logger.error('Get project attachments error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get task attachments
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

    const attachments = await db('tache_attachments as ta')
      .select([
        'ta.id',
        'ta.nom',
        'ta.taille',
        'ta.type',
        'ta.url',
        'ta.storage_key',
        'ta.uploaded_at',
        'u.nom as uploaded_by_nom',
        'u.prenom as uploaded_by_prenom'
      ])
      .leftJoin('users as u', 'ta.uploaded_by', 'u.id')
      .where('ta.tache_id', taskId)
      .orderBy('ta.uploaded_at', 'desc');

    res.json({ attachments });
  } catch (error) {
    logger.error('Get task attachments error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router; 