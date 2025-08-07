export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface CurrencyRate {
  id: string;
  devise_source: string;
  devise_cible: string;
  taux: number;
  date_mise_a_jour: Date;
}

export interface ProjectExpense {
  id: string;
  projet_id: string;
  date_depense: Date;
  intitule: string;
  montant: number;
  devise: string;
  taux_conversion?: number;
  montant_converti?: number;
  rubrique?: string;
  piece_jointe_url?: string;
  piece_jointe_nom?: string;
  piece_jointe_type?: string;
  piece_jointe_taille?: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface BudgetSummary {
  budget_initial: number;
  devise_budget: string;
  total_depenses: number;
  montant_restant: number;
  pourcentage_consommation: number;
  statut_budgetaire: 'success' | 'warning' | 'danger';
}

export interface ExpenseCategory {
  id: string;
  nom: string;
  description?: string;
}