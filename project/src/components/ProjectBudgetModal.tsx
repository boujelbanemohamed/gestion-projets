import React, { useState, useEffect } from 'react';
import { X, DollarSign, Plus, FileText, Upload, Download, Trash2, Calculator, TrendingUp, AlertTriangle } from 'lucide-react';
import { Project } from '../types';
import { ProjectExpense, BudgetSummary } from '../types/budget';
import {
  CURRENCIES,
  calculateBudgetSummary,
  formatCurrency,
  getBudgetStatusColor,
  getBudgetProgressColor,
  getExchangeRate,
  convertAmount
} from '../utils/budgetCalculations';
import api from '../utils/api';

interface ProjectBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;

}

interface Rubrique {
  id: string;
  nom: string;
}

const ProjectBudgetModal: React.FC<ProjectBudgetModalProps> = ({
  isOpen,
  onClose,
  project,

}) => {
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [rubriques, setRubriques] = useState<Rubrique[]>([]);
  
  // Form state for new expense
  const [newExpense, setNewExpense] = useState({
    date_depense: new Date().toISOString().split('T')[0],
    intitule: '',
    montant: '',
    devise: project.devise || 'EUR',
    rubrique: '',
    taux_conversion: '',
    piece_jointe: null as File | null
  });

  const [conversionResult, setConversionResult] = useState<{
    montant_converti: number;
    taux_utilise: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load expenses for this project (mock data for now)
      loadProjectExpenses();
      // Load rubriques from API
      loadRubriques();
    }
  }, [isOpen, project.id]);

  const loadRubriques = async () => {
    try {
      const response = await api.getRubriques();
      setRubriques(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading rubriques:', error);
      setRubriques([]);
    }
  };

  const getRubriqueNom = (rubriqueId: string): string => {
    const rubrique = rubriques.find(r => r.id === rubriqueId);
    return rubrique ? rubrique.nom : rubriqueId;
  };

  useEffect(() => {
    if (project.budget_initial && project.devise) {
      const summary = calculateBudgetSummary(project.budget_initial, project.devise, expenses);
      setBudgetSummary(summary);
    }
  }, [project.budget_initial, project.devise, expenses]);

  const loadProjectExpenses = () => {
    // In a real app, this would fetch from API
    // For now, start with empty expenses array - user will add them manually
    setExpenses([]);

    // TODO: Replace with actual API call
    // const response = await api.getProjectExpenses(project.id);
    // setExpenses(response.data);
  };

  const handleCalculateConversion = () => {
    const montant = parseFloat(newExpense.montant);
    const budgetCurrency = project.devise || 'EUR';
    
    if (!montant || newExpense.devise === budgetCurrency) {
      setConversionResult(null);
      return;
    }

    let taux = 1;
    if (newExpense.taux_conversion) {
      taux = parseFloat(newExpense.taux_conversion);
    } else {
      taux = getExchangeRate(newExpense.devise, budgetCurrency);
    }

    const montantConverti = montant * taux;
    
    setConversionResult({
      montant_converti: montantConverti,
      taux_utilise: taux
    });

    setNewExpense(prev => ({
      ...prev,
      taux_conversion: taux.toString()
    }));
  };

  const handleAddExpense = () => {
    const montant = parseFloat(newExpense.montant);
    if (!newExpense.intitule.trim() || !montant || montant <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const budgetCurrency = project.devise || 'EUR';
    let montantConverti = montant;
    let tauxConversion = 1;

    if (newExpense.devise !== budgetCurrency) {
      if (newExpense.taux_conversion) {
        tauxConversion = parseFloat(newExpense.taux_conversion);
        montantConverti = montant * tauxConversion;
      } else {
        tauxConversion = getExchangeRate(newExpense.devise, budgetCurrency);
        montantConverti = convertAmount(montant, newExpense.devise, budgetCurrency);
      }
    }

    const expense: ProjectExpense = {
      id: Date.now().toString(),
      projet_id: project.id,
      date_depense: new Date(newExpense.date_depense),
      intitule: newExpense.intitule.trim(),
      montant,
      devise: newExpense.devise,
      taux_conversion: newExpense.devise !== budgetCurrency ? tauxConversion : undefined,
      montant_converti: newExpense.devise !== budgetCurrency ? montantConverti : undefined,
      rubrique: newExpense.rubrique || undefined,
      created_by: 'current-user', // In a real app, this would be the current user ID
      created_at: new Date(),
      updated_at: new Date()
    };

    // Handle file attachment
    if (newExpense.piece_jointe) {
      expense.piece_jointe_nom = newExpense.piece_jointe.name;
      expense.piece_jointe_type = newExpense.piece_jointe.type;
      expense.piece_jointe_taille = newExpense.piece_jointe.size;
      expense.piece_jointe_url = URL.createObjectURL(newExpense.piece_jointe);
    }

    setExpenses(prev => [...prev, expense]);
    
    // Reset form
    setNewExpense({
      date_depense: new Date().toISOString().split('T')[0],
      intitule: '',
      montant: '',
      devise: project.devise || 'EUR',
      rubrique: '',
      taux_conversion: '',
      piece_jointe: null
    });
    setConversionResult(null);
    setIsAddingExpense(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la dépense "${expense.intitule}" ?`)) {
      // Clean up file URL if it exists
      if (expense.piece_jointe_url && expense.piece_jointe_url.startsWith('blob:')) {
        URL.revokeObjectURL(expense.piece_jointe_url);
      }
      
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Le fichier est trop volumineux (max 5MB)');
        return;
      }
      setNewExpense(prev => ({ ...prev, piece_jointe: file }));
    }
  };

  const downloadAttachment = (expense: ProjectExpense) => {
    if (expense.piece_jointe_url) {
      const link = document.createElement('a');
      link.href = expense.piece_jointe_url;
      link.download = expense.piece_jointe_nom || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCurrencySymbol = (code: string): string => {
    return CURRENCIES.find(c => c.code === code)?.symbol || code;
  };

  if (!isOpen) return null;

  const hasBudget = project.budget_initial && project.devise;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gestion budgétaire - {project.nom}
              </h2>
              <p className="text-sm text-gray-500">
                Suivi des dépenses et consommation du budget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {!hasBudget ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun budget défini
              </h3>
              <p className="text-gray-500 mb-4">
                Ce projet n'a pas de budget initial défini. Veuillez d'abord configurer le budget dans les paramètres du projet.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Modifier le projet
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Budget Summary */}
              {budgetSummary && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="text-blue-600" size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Synthèse budgétaire</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Budget initial</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(budgetSummary.budget_initial, budgetSummary.devise_budget)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Total dépenses</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(budgetSummary.total_depenses, budgetSummary.devise_budget)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Montant restant</p>
                      <p className={`text-xl font-bold ${budgetSummary.montant_restant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(budgetSummary.montant_restant, budgetSummary.devise_budget)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Consommation</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xl font-bold text-gray-900">
                          {budgetSummary.pourcentage_consommation.toFixed(1)}%
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBudgetStatusColor(budgetSummary.statut_budgetaire)}`}>
                          {budgetSummary.statut_budgetaire === 'success' ? 'OK' : 
                           budgetSummary.statut_budgetaire === 'warning' ? 'Attention' : 'Critique'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Progression budgétaire</span>
                      <span className="text-sm font-bold text-gray-900">
                        {budgetSummary.pourcentage_consommation.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${getBudgetProgressColor(budgetSummary.pourcentage_consommation)}`}
                        style={{ width: `${Math.min(budgetSummary.pourcentage_consommation, 100)}%` }}
                      />
                    </div>
                    {budgetSummary.pourcentage_consommation > 100 && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertTriangle size={16} />
                        <span className="text-sm font-medium">
                          Budget dépassé de {formatCurrency(Math.abs(budgetSummary.montant_restant), budgetSummary.devise_budget)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add Expense Section */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Dépenses du projet</h3>
                    <button
                      onClick={() => setIsAddingExpense(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Ajouter une dépense</span>
                    </button>
                  </div>
                </div>

                {/* Add Expense Form */}
                {isAddingExpense && (
                  <div className="p-6 border-b bg-gray-50">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Nouvelle dépense</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de la dépense <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={newExpense.date_depense}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, date_depense: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Intitulé / Description <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newExpense.intitule}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, intitule: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Ex: Achat de matériel informatique"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Montant <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newExpense.montant}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, montant: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Devise <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newExpense.devise}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, devise: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          {CURRENCIES.map(currency => (
                            <option key={currency.code} value={currency.code}>
                              {currency.code} - {currency.name} ({currency.symbol})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rubrique
                        </label>
                        <select
                          value={newExpense.rubrique}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, rubrique: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Sélectionner une rubrique</option>
                          {rubriques.map(rubrique => (
                            <option key={rubrique.id} value={rubrique.id}>
                              {rubrique.nom}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Currency Conversion */}
                      {newExpense.devise !== (project.devise || 'EUR') && (
                        <div className="md:col-span-3">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-blue-900 mb-3">Conversion de devise</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Taux de conversion (optionnel)
                                </label>
                                <input
                                  type="number"
                                  step="0.000001"
                                  value={newExpense.taux_conversion}
                                  onChange={(e) => setNewExpense(prev => ({ ...prev, taux_conversion: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  placeholder={`1 ${newExpense.devise} = ? ${project.devise || 'EUR'}`}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Laissez vide pour utiliser le taux automatique
                                </p>
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={handleCalculateConversion}
                                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                  <Calculator size={16} />
                                  <span>Convertir</span>
                                </button>
                              </div>
                              {conversionResult && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-sm text-green-800">
                                    <strong>Montant converti :</strong><br />
                                    {formatCurrency(conversionResult.montant_converti, project.devise || 'EUR')}
                                  </p>
                                  <p className="text-xs text-green-700 mt-1">
                                    Taux utilisé : {conversionResult.taux_utilise.toFixed(6)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* File Upload */}
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pièce jointe justificative
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors">
                          <input
                            type="file"
                            id="expenseFile"
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                          />
                          <label htmlFor="expenseFile" className="cursor-pointer">
                            <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                            <p className="text-sm text-gray-600">
                              {newExpense.piece_jointe ? newExpense.piece_jointe.name : 'Cliquez pour ajouter une facture ou un reçu'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PDF, Images, Word, Excel (max 5MB)
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => {
                          setIsAddingExpense(false);
                          setNewExpense({
                            date_depense: new Date().toISOString().split('T')[0],
                            intitule: '',
                            montant: '',
                            devise: project.devise || 'EUR',
                            rubrique: '',
                            taux_conversion: '',
                            piece_jointe: null
                          });
                          setConversionResult(null);
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleAddExpense}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Plus size={16} />
                        <span>Ajouter la dépense</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Expenses List */}
                <div className="p-6">
                  {expenses.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="mx-auto text-gray-400 mb-4" size={32} />
                      <p className="text-gray-500">Aucune dépense enregistrée pour ce projet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expenses
                        .sort((a, b) => new Date(b.date_depense).getTime() - new Date(a.date_depense).getTime())
                        .map((expense) => (
                          <div key={expense.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {expense.intitule}
                                  </h4>
                                  {expense.rubrique && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                      {getRubriqueNom(expense.rubrique)}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Date :</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                      {expense.date_depense.toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Montant :</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                      {formatCurrency(expense.montant, expense.devise)}
                                    </span>
                                  </div>
                                  {expense.montant_converti && expense.taux_conversion && (
                                    <div>
                                      <span className="text-gray-600">Converti :</span>
                                      <span className="ml-2 font-medium text-green-600">
                                        {formatCurrency(expense.montant_converti, project.devise || 'EUR')}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-1">
                                        (taux: {expense.taux_conversion.toFixed(4)})
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {expense.piece_jointe_nom && (
                                  <div className="mt-3 flex items-center space-x-2">
                                    <FileText size={16} className="text-gray-400" />
                                    <button
                                      onClick={() => downloadAttachment(expense)}
                                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {expense.piece_jointe_nom}
                                    </button>
                                    <span className="text-xs text-gray-500">
                                      ({formatFileSize(expense.piece_jointe_taille || 0)})
                                    </span>
                                    <Download size={14} className="text-gray-400" />
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer la dépense"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectBudgetModal;