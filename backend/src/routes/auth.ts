import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { db } from '../config/database';
import { User } from '../types';
import { logger } from '../utils/logger';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  nom: Joi.string().required().min(2).max(100),
  prenom: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
  fonction: Joi.string().optional().max(100),
  departement_id: Joi.string().uuid().optional(),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'UTILISATEUR').default('UTILISATEUR')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0]?.message || 'Validation error' });
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

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`New user registered: ${email}`);

    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user,
      token
    });
  } catch (error) {
    logger.error('Registration error:', error as any);
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0]?.message || 'Validation error' });
    }

    const { email, password } = value;

    // Find user
    const user = await db('users')
      .select(['id', 'nom', 'prenom', 'email', 'fonction', 'departement_id', 'role', 'password_hash', 'created_at'])
      .where('email', email)
      .first();

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifie la présence du hash
    if (!user.password_hash) {
      logger.warn(`Login attempt for ${email} but password_hash is missing`);
      return res.status(400).json({ error: 'Ce compte n’a pas de mot de passe défini. Veuillez vous inscrire ou réinitialiser le mot de passe.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    logger.info(`User logged in: ${email}`);

    return res.json({
      message: 'Connexion réussie',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    logger.error('Login error:', error as any);
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await db('users')
      .select(['id', 'nom', 'prenom', 'email', 'fonction', 'departement_id', 'role', 'created_at', 'updated_at'])
      .where('id', req.user!.id)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    return res.json({ user });
  } catch (error) {
    logger.error('Get current user error:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update password
router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().required().min(6)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0]?.message || 'Validation error' });
    }

    const { currentPassword, newPassword } = value;

    // Get current user with password
    const user = await db('users')
      .select(['password_hash'])
      .where('id', req.user!.id)
      .first();

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db('users')
      .where('id', req.user!.id)
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date()
      });

    logger.info(`Password updated for user: ${req.user!.email}`);

    return res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    logger.error('Update password error:', error as any);
    console.error('Update password error:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;