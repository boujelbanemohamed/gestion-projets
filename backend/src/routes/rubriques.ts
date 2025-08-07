import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RubriqueBudgetaire } from '../types';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';

const router = Router();
const DATA_PATH = path.join(__dirname, '../../data/rubriques.json');
const DEPENSES_PATH = path.join(__dirname, '../../data/depenses.json');

function readRubriques(): RubriqueBudgetaire[] {
  try {
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return [];
  }
}
function writeRubriques(rubriques: RubriqueBudgetaire[]) {
  writeFileSync(DATA_PATH, JSON.stringify(rubriques, null, 2));
}
function readDepenses(): any[] {
  try {
    return JSON.parse(readFileSync(DEPENSES_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

// GET all rubriques
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  res.json(readRubriques());
});

// POST create rubrique (Admin only)
router.post('/', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  try {
    const rubriques = readRubriques();
    const { nom } = req.body;

    if (!nom || nom.trim().length === 0) {
      return res.status(400).json({ message: 'Le nom de la rubrique est requis' });
    }

    const newRubrique: RubriqueBudgetaire = {
      id: uuidv4(),
      nom: nom.trim(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    rubriques.push(newRubrique);
    writeRubriques(rubriques);
    res.status(201).json(newRubrique);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la rubrique' });
  }
});

// PUT update rubrique (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  try {
    const rubriques = readRubriques();
    const rubrique = rubriques.find(r => r.id === req.params.id);
    if (!rubrique) return res.status(404).json({ message: 'Rubrique non trouvée' });

    const { nom } = req.body;
    if (!nom || nom.trim().length === 0) {
      return res.status(400).json({ message: 'Le nom de la rubrique est requis' });
    }

    rubrique.nom = nom.trim();
    rubrique.updated_at = new Date();
    writeRubriques(rubriques);
    res.json(rubrique);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la modification de la rubrique' });
  }
});

// DELETE rubrique sécurisée (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  try {
    const rubriques = readRubriques();
    const depenses = readDepenses();
    const rubrique = rubriques.find(r => r.id === req.params.id);
    if (!rubrique) return res.status(404).json({ message: 'Rubrique non trouvée' });
    const depenseLiee = depenses.find(d => d.rubriqueId === req.params.id);
    if (depenseLiee) {
      return res.status(409).json({ message: 'Impossible de supprimer cette rubrique car une dépense est affectée.' });
    }
    const newRubriques = rubriques.filter(r => r.id !== req.params.id);
    writeRubriques(newRubriques);
    res.json({ message: 'Rubrique supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la rubrique' });
  }
});

export default router;