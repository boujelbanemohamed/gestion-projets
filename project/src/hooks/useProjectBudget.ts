import { useMemo } from 'react';
import { Project } from '../types';
import { ProjectExpense } from '../types/budget';
import { calculateBudgetSummary } from '../utils/budgetCalculations';

export const useProjectBudget = (project: Project, expenses?: ProjectExpense[]) => {
  return useMemo(() => {
    if (!project.budget_initial || !project.devise) return null;
    
    // Use provided expenses or empty array if none provided
    const projectExpenses = expenses || [];

    // TODO: In a real app, fetch expenses from API if not provided
    // if (!expenses) {
    //   const response = await api.getProjectExpenses(project.id);
    //   projectExpenses = response.data;
    // }

    return calculateBudgetSummary(project.budget_initial, project.devise, projectExpenses);
  }, [project.budget_initial, project.devise, project.id, expenses]);
};
