import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const createMeetingMinutesSchema = Joi.object({
  titre: Joi.string().required().min(1).max(255),
  date_reunion: Joi.date().required(),
  description: Joi.string().optional().max(1000),
  projets: Joi.array().items(Joi.string().uuid()).min(1).required()
});

const updateMeetingMinutesSchema = Joi.object({
  titre: Joi.string().optional().min(1).max(255),
  date_reunion: Joi.date().optional(),
  description: Joi.string().optional().max(1000),
  projets: Joi.array().items(Joi.string().uuid()).min(1).optional()
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/meeting-minutes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pv-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow document types for meeting minutes
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé pour les PV'), false);
    }
  }
});

// Get all meeting minutes with pagination and filters
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, search, projet_id, start_date, end_date } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('pv_reunions as pv')
      .select([
        'pv.id',
        'pv.titre',
        'pv.date_reunion',
        'pv.description',
        'pv.nom_fichier',
        'pv.taille_fichier',
        'pv.type_mime',
        'pv.created_at',
        'pv.updated_at',
        'u.nom as uploaded_by_nom',
        'u.prenom as uploaded_by_prenom'
      ])
      .leftJoin('users as u', 'pv.uploaded_by', 'u.id')
      .orderBy('pv.date_reunion', 'desc');

    // Apply search filter
    if (search) {
      query = query.where(function() {
        this.where('pv.titre', 'ilike', `%${search}%`)
          .orWhere('pv.description', 'ilike', `%${search}%`);
      });
    }

    // Apply project filter
    if (projet_id) {
      query = query.whereExists(function() {
        this.select('*')
          .from('pv_projets as pp')
          .whereRaw('pp.pv_id = pv.id')
          .where('pp.projet_id', projet_id);
      });
    }

    // Apply date filters
    if (start_date) {
      query = query.where('pv.date_reunion', '>=', start_date);
    }
    if (end_date) {
      query = query.where('pv.date_reunion', '<=', end_date);
    }

    // Check user permissions
    if (req.user!.role === 'UTILISATEUR') {
      // Users can only see PV associated with their assigned projects
      const userProjects = await db('tache_utilisateurs as tu')
        .leftJoin('taches as t', 'tu.tache_id', 't.id')
        .where('tu.user_id', req.user!.id)
        .distinct('t.projet_id')
        .pluck('t.projet_id');

      if (userProjects.length > 0) {
        query = query.whereExists(function() {
          this.select('*')
            .from('pv_projets as pp')
            .whereRaw('pp.pv_id = pv.id')
            .whereIn('pp.projet_id', userProjects);
        });
      } else {
        // User has no assigned projects, return empty result
        return res.json({
          meetingMinutes: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          }
        });
      }
    }

    // Get total count for pagination
    const totalQuery = query.clone().clearSelect().clearOrder().count('pv.id as count');
    const [{ count: total }] = await totalQuery;

    // Get paginated results
    const meetingMinutes = await query.limit(Number(limit)).offset(offset);

    // Get associated projects for each PV
    for (const pv of meetingMinutes) {
      const projets = await db('pv_projets as pp')
        .select(['p.id', 'p.nom'])
        .leftJoin('projets as p', 'pp.projet_id', 'p.id')
        .where('pp.pv_id', pv.id);
      
      pv.projets = projets;
    }

    res.json({
      meetingMinutes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        pages: Math.ceil(Number(total) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get meeting minutes error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get meeting minutes by project
router.get('/project/:projectId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const project = await db('projets').where('id', projectId).first();
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Check user permissions
    if (req.user!.role === 'UTILISATEUR') {
      const hasAccess = await db('tache_utilisateurs as tu')
        .leftJoin('taches as t', 'tu.tache_id', 't.id')
        .where('t.projet_id', projectId)
        .where('tu.user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à ce projet' });
      }
    }

    const meetingMinutes = await db('pv_reunions as pv')
      .select([
        'pv.id',
        'pv.titre',
        'pv.date_reunion',
        'pv.description',
        'pv.nom_fichier',
        'pv.taille_fichier',
        'pv.type_mime',
        'pv.created_at',
        'u.nom as uploaded_by_nom',
        'u.prenom as uploaded_by_prenom'
      ])
      .leftJoin('users as u', 'pv.uploaded_by', 'u.id')
      .leftJoin('pv_projets as pp', 'pv.id', 'pp.pv_id')
      .where('pp.projet_id', projectId)
      .orderBy('pv.date_reunion', 'desc');

    res.json({ meetingMinutes });
  } catch (error) {
    logger.error('Get project meeting minutes error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get single meeting minutes
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const meetingMinutes = await db('pv_reunions as pv')
      .select([
        'pv.id',
        'pv.titre',
        'pv.date_reunion',
        'pv.description',
        'pv.nom_fichier',
        'pv.chemin_fichier',
        'pv.taille_fichier',
        'pv.type_mime',
        'pv.created_at',
        'pv.updated_at',
        'u.nom as uploaded_by_nom',
        'u.prenom as uploaded_by_prenom'
      ])
      .leftJoin('users as u', 'pv.uploaded_by', 'u.id')
      .where('pv.id', id)
      .first();

    if (!meetingMinutes) {
      return res.status(404).json({ error: 'PV non trouvé' });
    }

    // Get associated projects
    const projets = await db('pv_projets as pp')
      .select(['p.id', 'p.nom'])
      .leftJoin('projets as p', 'pp.projet_id', 'p.id')
      .where('pp.pv_id', id);

    meetingMinutes.projets = projets;

    // Check user permissions
    if (req.user!.role === 'UTILISATEUR') {
      const userProjects = await db('tache_utilisateurs as tu')
        .leftJoin('taches as t', 'tu.tache_id', 't.id')
        .where('tu.user_id', req.user!.id)
        .distinct('t.projet_id')
        .pluck('t.projet_id');

      const hasAccess = projets.some(p => userProjects.includes(p.id));
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à ce PV' });
      }
    }

    res.json({ meetingMinutes });
  } catch (error) {
    logger.error('Get meeting minutes error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Create meeting minutes
router.post('/', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    // Check permissions
    if (req.user!.role === 'UTILISATEUR') {
      return res.status(403).json({ error: 'Accès non autorisé pour créer des PV' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { error, value } = createMeetingMinutesSchema.validate(req.body);
    if (error) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { titre, date_reunion, description, projets } = value;

    // Verify all projects exist
    const existingProjects = await db('projets').whereIn('id', projets).pluck('id');
    if (existingProjects.length !== projets.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Un ou plusieurs projets n\'existent pas' });
    }

    // Create meeting minutes record
    const [meetingMinutes] = await db('pv_reunions')
      .insert({
        titre,
        date_reunion,
        description,
        nom_fichier: req.file.originalname,
        chemin_fichier: req.file.path,
        taille_fichier: req.file.size,
        type_mime: req.file.mimetype,
        uploaded_by: req.user!.id,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'titre', 'date_reunion', 'description', 'nom_fichier', 'taille_fichier', 'type_mime', 'created_at']);

    // Associate with projects
    const projectAssociations = projets.map((projetId: string) => ({
      pv_id: meetingMinutes.id,
      projet_id: projetId,
      created_at: new Date()
    }));

    await db('pv_projets').insert(projectAssociations);

    // Get project names for response
    const projectNames = await db('projets')
      .select(['id', 'nom'])
      .whereIn('id', projets);

    meetingMinutes.projets = projectNames;

    logger.info(`Meeting minutes created: ${meetingMinutes.id} by ${req.user!.email}`);

    res.status(201).json({
      message: 'PV créé avec succès',
      meetingMinutes
    });
  } catch (error) {
    // Clean up file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    logger.error('Create meeting minutes error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update meeting minutes
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user!.role === 'UTILISATEUR') {
      return res.status(403).json({ error: 'Accès non autorisé pour modifier des PV' });
    }

    const { error, value } = updateMeetingMinutesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if meeting minutes exists
    const existingPV = await db('pv_reunions').where('id', id).first();
    if (!existingPV) {
      return res.status(404).json({ error: 'PV non trouvé' });
    }

    const { titre, date_reunion, description, projets } = value;
    const updateData: any = { updated_at: new Date() };

    if (titre !== undefined) updateData.titre = titre;
    if (date_reunion !== undefined) updateData.date_reunion = date_reunion;
    if (description !== undefined) updateData.description = description;

    // Update meeting minutes
    const [updatedPV] = await db('pv_reunions')
      .where('id', id)
      .update(updateData)
      .returning(['id', 'titre', 'date_reunion', 'description', 'nom_fichier', 'taille_fichier', 'type_mime', 'updated_at']);

    // Update project associations if provided
    if (projets) {
      // Verify all projects exist
      const existingProjects = await db('projets').whereIn('id', projets).pluck('id');
      if (existingProjects.length !== projets.length) {
        return res.status(400).json({ error: 'Un ou plusieurs projets n\'existent pas' });
      }

      // Remove existing associations
      await db('pv_projets').where('pv_id', id).del();

      // Add new associations
      const projectAssociations = projets.map((projetId: string) => ({
        pv_id: id,
        projet_id: projetId,
        created_at: new Date()
      }));

      await db('pv_projets').insert(projectAssociations);
    }

    // Get updated project associations
    const projectNames = await db('pv_projets as pp')
      .select(['p.id', 'p.nom'])
      .leftJoin('projets as p', 'pp.projet_id', 'p.id')
      .where('pp.pv_id', id);

    updatedPV.projets = projectNames;

    logger.info(`Meeting minutes updated: ${id} by ${req.user!.email}`);

    res.json({
      message: 'PV mis à jour avec succès',
      meetingMinutes: updatedPV
    });
  } catch (error) {
    logger.error('Update meeting minutes error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete meeting minutes
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user!.role === 'UTILISATEUR') {
      return res.status(403).json({ error: 'Accès non autorisé pour supprimer des PV' });
    }

    // Check if meeting minutes exists
    const existingPV = await db('pv_reunions').where('id', id).first();
    if (!existingPV) {
      return res.status(404).json({ error: 'PV non trouvé' });
    }

    // Delete file from filesystem
    if (fs.existsSync(existingPV.chemin_fichier)) {
      fs.unlinkSync(existingPV.chemin_fichier);
    }

    // Delete from database (cascade will handle pv_projets)
    await db('pv_reunions').where('id', id).del();

    logger.info(`Meeting minutes deleted: ${id} by ${req.user!.email}`);

    res.json({ message: 'PV supprimé avec succès' });
  } catch (error) {
    logger.error('Delete meeting minutes error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Download meeting minutes file
router.get('/:id/download', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const meetingMinutes = await db('pv_reunions').where('id', id).first();
    if (!meetingMinutes) {
      return res.status(404).json({ error: 'PV non trouvé' });
    }

    // Check user permissions
    if (req.user!.role === 'UTILISATEUR') {
      const userProjects = await db('tache_utilisateurs as tu')
        .leftJoin('taches as t', 'tu.tache_id', 't.id')
        .where('tu.user_id', req.user!.id)
        .distinct('t.projet_id')
        .pluck('t.projet_id');

      const pvProjects = await db('pv_projets')
        .where('pv_id', id)
        .pluck('projet_id');

      const hasAccess = pvProjects.some(p => userProjects.includes(p));
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à ce PV' });
      }
    }

    // Check if file exists
    if (!fs.existsSync(meetingMinutes.chemin_fichier)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', meetingMinutes.type_mime);
    res.setHeader('Content-Disposition', `attachment; filename="${meetingMinutes.nom_fichier}"`);
    res.setHeader('Content-Length', meetingMinutes.taille_fichier);

    // Stream file
    const fileStream = fs.createReadStream(meetingMinutes.chemin_fichier);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Download meeting minutes error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
