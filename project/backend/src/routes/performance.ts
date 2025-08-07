import express from 'express';
import { db } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Get performance by departments
router.get('/departments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = db('departements as d')
      .select([
        'd.id',
        'd.nom as department_name',
        db.raw('COUNT(DISTINCT t.id) as total_tasks'),
        db.raw('COUNT(DISTINCT CASE WHEN t.etat = ? THEN t.id END) as completed_tasks', ['cloturee']),
        db.raw('COUNT(DISTINCT CASE WHEN t.etat = ? THEN t.id END) as in_progress_tasks', ['en_cours']),
        db.raw('COUNT(DISTINCT CASE WHEN t.etat = ? THEN t.id END) as not_started_tasks', ['non_debutee'])
      ])
      .leftJoin('projets as p', 'd.id', 'p.departement_id')
      .leftJoin('taches as t', 'p.id', 't.projet_id')
      .groupBy('d.id', 'd.nom');

    // Apply date filters if provided
    if (start_date && end_date) {
      query = query.whereBetween('t.created_at', [start_date, end_date]);
    }

    const departments = await query;

    // Calculate completion rates
    const departmentsWithStats = departments.map(dept => {
      const totalTasks = Number(dept.total_tasks);
      const completedTasks = Number(dept.completed_tasks);
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        department: {
          id: dept.id,
          nom: dept.department_name
        },
        totalTasks,
        completedTasks,
        inProgressTasks: Number(dept.in_progress_tasks),
        notStartedTasks: Number(dept.not_started_tasks),
        completionRate
      };
    });

    // Sort by completion rate (descending)
    departmentsWithStats.sort((a, b) => b.completionRate - a.completionRate);

    res.json({ departments: departmentsWithStats });
  } catch (error) {
    logger.error('Get department performance error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get performance by users
router.get('/users', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = db('users as u')
      .select([
        'u.id',
        'u.nom',
        'u.prenom',
        'u.email',
        'u.fonction',
        'u.departement_id',
        'd.nom as departement_nom',
        db.raw('COUNT(DISTINCT t.id) as total_tasks'),
        db.raw('COUNT(DISTINCT CASE WHEN t.etat = ? THEN t.id END) as completed_tasks', ['cloturee']),
        db.raw('COUNT(DISTINCT p.id) as assigned_projects')
      ])
      .leftJoin('departements as d', 'u.departement_id', 'd.id')
      .leftJoin('tache_utilisateurs as tu', 'u.id', 'tu.user_id')
      .leftJoin('taches as t', 'tu.tache_id', 't.id')
      .leftJoin('projets as p', 't.projet_id', 'p.id')
      .groupBy('u.id', 'u.nom', 'u.prenom', 'u.email', 'u.fonction', 'u.departement_id', 'd.nom');

    // Apply date filters if provided
    if (start_date && end_date) {
      query = query.whereBetween('t.created_at', [start_date, end_date]);
    }

    const users = await query;

    // Calculate completion rates
    const usersWithStats = users.map(user => {
      const totalTasks = Number(user.total_tasks);
      const completedTasks = Number(user.completed_tasks);
      const remainingTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          fonction: user.fonction,
          departement: user.departement_nom
        },
        assignedProjects: Number(user.assigned_projects),
        totalTasks,
        completedTasks,
        remainingTasks,
        completionRate
      };
    });

    // Sort by completion rate (descending)
    usersWithStats.sort((a, b) => b.completionRate - a.completionRate);

    res.json({ users: usersWithStats });
  } catch (error) {
    logger.error('Get user performance error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get performance by projects
router.get('/projects', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date, status } = req.query;

    let query = db('projets as p')
      .select([
        'p.id',
        'p.nom',
        'p.description',
        'p.statut',
        'p.budget_initial',
        'p.devise',
        'p.created_at',
        'd.nom as departement_nom',
        db.raw('COUNT(DISTINCT t.id) as total_tasks'),
        db.raw('COUNT(DISTINCT CASE WHEN t.etat = ? THEN t.id END) as completed_tasks', ['cloturee']),
        db.raw('COUNT(DISTINCT CASE WHEN t.etat != ? THEN t.id END) as not_completed_tasks', ['cloturee'])
      ])
      .leftJoin('departements as d', 'p.departement_id', 'd.id')
      .leftJoin('taches as t', 'p.id', 't.projet_id')
      .groupBy('p.id', 'p.nom', 'p.description', 'p.statut', 'p.budget_initial', 'p.devise', 'p.created_at', 'd.nom');

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'en_cours') {
        query = query.where('p.statut', '!=', 'cloture');
      } else if (status === 'clotures') {
        query = query.where('p.statut', 'cloture');
      }
    }

    // Apply date filters if provided
    if (start_date && end_date) {
      query = query.whereBetween('t.created_at', [start_date, end_date]);
    }

    const projects = await query;

    // Calculate completion rates and budget consumption
    const projectsWithStats = projects.map(project => {
      const totalTasks = Number(project.total_tasks);
      const completedTasks = Number(project.completed_tasks);
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Mock budget consumption for demonstration
      // In a real app, this would come from actual expenses
      const budgetConsumption = project.budget_initial ? Math.round(Math.random() * 100) : 0;

      return {
        project: {
          id: project.id,
          nom: project.nom,
          description: project.description,
          statut: project.statut,
          budget_initial: project.budget_initial,
          devise: project.devise,
          departement: project.departement_nom,
          created_at: project.created_at
        },
        totalTasks,
        completedTasks,
        notCompletedTasks: Number(project.not_completed_tasks),
        completionRate,
        budgetConsumption
      };
    });

    // Sort by completion rate (descending)
    projectsWithStats.sort((a, b) => b.completionRate - a.completionRate);

    res.json({ projects: projectsWithStats });
  } catch (error) {
    logger.error('Get project performance error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get budget consumption by projects
router.get('/budget', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = db('projets as p')
      .select([
        'p.id',
        'p.nom',
        'p.budget_initial',
        'p.devise',
        'p.statut',
        'd.nom as departement_nom',
        db.raw('COALESCE(SUM(e.montant), 0) as total_expenses')
      ])
      .leftJoin('departements as d', 'p.departement_id', 'd.id')
      .leftJoin('expenses as e', 'p.id', 'e.projet_id')
      .groupBy('p.id', 'p.nom', 'p.budget_initial', 'p.devise', 'p.statut', 'd.nom');

    // Apply date filters if provided
    if (start_date && end_date) {
      query = query.whereBetween('e.date_depense', [start_date, end_date]);
    }

    const projects = await query;

    // Calculate budget consumption rates
    const projectsWithBudget = projects.map(project => {
      const budgetInitial = Number(project.budget_initial) || 0;
      const totalExpenses = Number(project.total_expenses);
      const remainingAmount = budgetInitial - totalExpenses;
      const consumptionRate = budgetInitial > 0 ? Math.round((totalExpenses / budgetInitial) * 100) : 0;

      return {
        project: {
          id: project.id,
          nom: project.nom,
          devise: project.devise,
          statut: project.statut,
          departement: project.departement_nom
        },
        budgetInitial,
        totalExpenses,
        remainingAmount,
        consumptionRate
      };
    });

    // Sort by consumption rate (descending)
    projectsWithBudget.sort((a, b) => b.consumptionRate - a.consumptionRate);

    res.json({ projects: projectsWithBudget });
  } catch (error) {
    logger.error('Get budget performance error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get closed projects
router.get('/closed-projects', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const closedProjects = await db('projets as p')
      .select([
        'p.id',
        'p.nom',
        'p.description',
        'p.date_cloture',
        'p.budget_initial',
        'p.devise',
        'd.nom as departement_nom',
        'u.nom as responsable_nom',
        'u.prenom as responsable_prenom',
        db.raw('COUNT(DISTINCT t.id) as total_tasks'),
        db.raw('COUNT(DISTINCT CASE WHEN t.etat = ? THEN t.id END) as completed_tasks', ['cloturee']),
        db.raw('COALESCE(SUM(e.montant), 0) as total_expenses')
      ])
      .leftJoin('departements as d', 'p.departement_id', 'd.id')
      .leftJoin('users as u', 'p.responsable_id', 'u.id')
      .leftJoin('taches as t', 'p.id', 't.projet_id')
      .leftJoin('expenses as e', 'p.id', 'e.projet_id')
      .where('p.statut', 'cloture')
      .groupBy('p.id', 'p.nom', 'p.description', 'p.date_cloture', 'p.budget_initial', 'p.devise', 'd.nom', 'u.nom', 'u.prenom')
      .orderBy('p.date_cloture', 'desc')
      .limit(Number(limit))
      .offset(offset);

    // Get total count
    const [{ count }] = await db('projets')
      .where('statut', 'cloture')
      .count('id as count');

    // Calculate completion rates and budget consumption
    const projectsWithStats = closedProjects.map(project => {
      const totalTasks = Number(project.total_tasks);
      const completedTasks = Number(project.completed_tasks);
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const budgetInitial = Number(project.budget_initial) || 0;
      const totalExpenses = Number(project.total_expenses);
      const consumptionRate = budgetInitial > 0 ? Math.round((totalExpenses / budgetInitial) * 100) : 0;

      return {
        project: {
          id: project.id,
          nom: project.nom,
          description: project.description,
          date_cloture: project.date_cloture,
          budget_initial: project.budget_initial,
          devise: project.devise,
          departement: project.departement_nom,
          responsable: `${project.responsable_prenom} ${project.responsable_nom}`
        },
        totalTasks,
        completedTasks,
        completionRate,
        budgetConsumptionRate: consumptionRate
      };
    });

    res.json({
      projects: projectsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get closed projects error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get overall performance summary
router.get('/summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Get total projects
    const [{ totalProjects }] = await db('projets')
      .count('id as totalProjects');

    // Get active projects
    const [{ activeProjects }] = await db('projets')
      .where('statut', '!=', 'cloture')
      .count('id as activeProjects');

    // Get closed projects
    const [{ closedProjects }] = await db('projets')
      .where('statut', 'cloture')
      .count('id as closedProjects');

    // Get total tasks
    let tasksQuery = db('taches');
    if (start_date && end_date) {
      tasksQuery = tasksQuery.whereBetween('created_at', [start_date, end_date]);
    }
    const [{ totalTasks }] = await tasksQuery.count('id as totalTasks');

    // Get completed tasks
    let completedTasksQuery = db('taches').where('etat', 'cloturee');
    if (start_date && end_date) {
      completedTasksQuery = completedTasksQuery.whereBetween('created_at', [start_date, end_date]);
    }
    const [{ completedTasks }] = await completedTasksQuery.count('id as completedTasks');

    // Get total users
    const [{ totalUsers }] = await db('users')
      .count('id as totalUsers');

    // Get total departments
    const [{ totalDepartments }] = await db('departements')
      .count('id as totalDepartments');

    // Calculate overall completion rate
    const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      summary: {
        totalProjects: Number(totalProjects),
        activeProjects: Number(activeProjects),
        closedProjects: Number(closedProjects),
        totalTasks: Number(totalTasks),
        completedTasks: Number(completedTasks),
        overallCompletionRate,
        totalUsers: Number(totalUsers),
        totalDepartments: Number(totalDepartments)
      }
    });
  } catch (error) {
    logger.error('Get performance summary error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router; 