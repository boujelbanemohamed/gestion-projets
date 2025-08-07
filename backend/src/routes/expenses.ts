import express from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const createExpenseSchema = Joi.object({
  intitule: Joi.string().required().min(1).max(200),
  montant: Joi.number().positive().required(),
  devise: Joi.string().required().max(10),
  date_depense: Joi.date().required(),
  rubrique: Joi.string().required().max(100),
  projet_id: Joi.string().uuid().required(),
  description: Joi.string().optional().max(1000)
});

const updateExpenseSchema = Joi.object({
  intitule: Joi.string().optional().min(1).max(200),
  montant: Joi.number().positive().optional(),
  devise: Joi.string().optional().max(10),
  date_depense: Joi.date().optional(),
  rubrique: Joi.string().optional().max(100),
  description: Joi.string().optional().max(1000)
});

// Get expenses for a project
router.get('/project/:projectId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20, start_date, end_date } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Check if project exists
    const project = await db('projets').where('id', projectId).first();
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Check if user has access to this project
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

    let query = db('expenses as e')
      .select([
        'e.id',
        'e.intitule',
        'e.montant',
        'e.devise',
        'e.date_depense',
        'e.rubrique',
        'e.description',
        'e.created_at',
        'u.nom as created_by_nom',
        'u.prenom as created_by_prenom'
      ])
      .leftJoin('users as u', 'e.created_by', 'u.id')
      .where('e.projet_id', projectId);

    // Apply date filters
    if (start_date && end_date) {
      query = query.whereBetween('e.date_depense', [start_date, end_date]);
    }

    const expenses = await query
      .orderBy('e.date_depense', 'desc')
      .limit(Number(limit))
      .offset(offset);

    // Get total count
    const totalQuery = db('expenses').where('projet_id', projectId);
    if (start_date && end_date) {
      totalQuery.whereBetween('date_depense', [start_date, end_date]);
    }
    const [{ count }] = await totalQuery.count('id as count');

    // Calculate total expenses
    const totalExpensesQuery = db('expenses').where('projet_id', projectId);
    if (start_date && end_date) {
      totalExpensesQuery.whereBetween('date_depense', [start_date, end_date]);
    }
    const [{ totalAmount }] = await totalExpensesQuery.sum('montant as totalAmount');

    res.json({
      expenses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      },
      totalAmount: Number(totalAmount) || 0
    });
  } catch (error) {
    logger.error('Get project expenses error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get expense by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const expense = await db('expenses as e')
      .select([
        'e.id',
        'e.intitule',
        'e.montant',
        'e.devise',
        'e.date_depense',
        'e.rubrique',
        'e.description',
        'e.projet_id',
        'e.created_at',
        'u.nom as created_by_nom',
        'u.prenom as created_by_prenom'
      ])
      .leftJoin('users as u', 'e.created_by', 'u.id')
      .where('e.id', id)
      .first();

    if (!expense) {
      return res.status(404).json({ error: 'Dépense non trouvée' });
    }

    // Check if user has access to this expense's project
    if (req.user!.role === 'UTILISATEUR') {
      const hasAccess = await db('tache_utilisateurs as tu')
        .leftJoin('taches as t', 'tu.tache_id', 't.id')
        .where('t.projet_id', expense.projet_id)
        .where('tu.user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à cette dépense' });
      }
    }

    res.json({ expense });
  } catch (error) {
    logger.error('Get expense error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Create expense
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { error, value } = createExpenseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { intitule, montant, devise, date_depense, rubrique, projet_id, description } = value;

    // Check if project exists
    const project = await db('projets').where('id', projet_id).first();
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Check if user has access to this project
    if (req.user!.role === 'UTILISATEUR') {
      const hasAccess = await db('tache_utilisateurs as tu')
        .leftJoin('taches as t', 'tu.tache_id', 't.id')
        .where('t.projet_id', projet_id)
        .where('tu.user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à ce projet' });
      }
    }

    // Create expense
    const [expense] = await db('expenses')
      .insert({
        intitule,
        montant,
        devise,
        date_depense,
        rubrique,
        projet_id,
        description,
        created_by: req.user!.id,
        created_at: new Date()
      })
      .returning(['id', 'intitule', 'montant', 'devise', 'date_depense', 'rubrique', 'description', 'created_at']);

    logger.info(`Expense created by ${req.user!.email} for project ${projet_id}`);

    res.status(201).json({
      message: 'Dépense créée avec succès',
      expense
    });
  } catch (error) {
    logger.error('Create expense error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update expense
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateExpenseSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if expense exists
    const expense = await db('expenses').where('id', id).first();
    if (!expense) {
      return res.status(404).json({ error: 'Dépense non trouvée' });
    }

    // Check if user has access to this expense's project
    if (req.user!.role === 'UTILISATEUR') {
      const hasAccess = await db('tache_utilisateurs as tu')
        .leftJoin('taches as t', 'tu.tache_id', 't.id')
        .where('t.projet_id', expense.projet_id)
        .where('tu.user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à cette dépense' });
      }
    }

    // Update expense
    const [updatedExpense] = await db('expenses')
      .where('id', id)
      .update({
        ...value,
        updated_at: new Date()
      })
      .returning(['id', 'intitule', 'montant', 'devise', 'date_depense', 'rubrique', 'description', 'created_at']);

    logger.info(`Expense updated by ${req.user!.email}`);

    res.json({
      message: 'Dépense mise à jour avec succès',
      expense: updatedExpense
    });
  } catch (error) {
    logger.error('Update expense error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if expense exists
    const expense = await db('expenses').where('id', id).first();
    if (!expense) {
      return res.status(404).json({ error: 'Dépense non trouvée' });
    }

    // Check if user has access to this expense's project
    if (req.user!.role === 'UTILISATEUR') {
      const hasAccess = await db('tache_utilisateurs as tu')
        .leftJoin('taches as t', 'tu.tache_id', 't.id')
        .where('t.projet_id', expense.projet_id)
        .where('tu.user_id', req.user!.id)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à cette dépense' });
      }
    }

    // Delete expense
    await db('expenses').where('id', id).del();

    logger.info(`Expense deleted by ${req.user!.email}`);

    res.json({ message: 'Dépense supprimée avec succès' });
  } catch (error) {
    logger.error('Delete expense error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get expense statistics for a project
router.get('/project/:projectId/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const project = await db('projets').where('id', projectId).first();
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Check if user has access to this project
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

    // Get total expenses
    const [{ totalExpenses }] = await db('expenses')
      .where('projet_id', projectId)
      .sum('montant as totalExpenses');

    // Get expenses by category
    const expensesByCategory = await db('expenses')
      .select('rubrique')
      .sum('montant as total')
      .where('projet_id', projectId)
      .groupBy('rubrique');

    // Get expenses by month
    const expensesByMonth = await db('expenses')
      .select(db.raw('EXTRACT(YEAR FROM date_depense) as year'))
      .select(db.raw('EXTRACT(MONTH FROM date_depense) as month'))
      .sum('montant as total')
      .where('projet_id', projectId)
      .groupBy('year', 'month')
      .orderBy('year', 'desc')
      .orderBy('month', 'desc');

    // Calculate budget consumption
    const budgetInitial = Number(project.budget_initial) || 0;
    const totalExpensesAmount = Number(totalExpenses) || 0;
    const remainingAmount = budgetInitial - totalExpensesAmount;
    const consumptionRate = budgetInitial > 0 ? Math.round((totalExpensesAmount / budgetInitial) * 100) : 0;

    res.json({
      project: {
        id: project.id,
        nom: project.nom,
        budget_initial: project.budget_initial,
        devise: project.devise
      },
      stats: {
        totalExpenses: totalExpensesAmount,
        remainingAmount,
        consumptionRate,
        expensesByCategory,
        expensesByMonth
      }
    });
  } catch (error) {
    logger.error('Get expense stats error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router; 