import * as XLSX from 'xlsx';
import { Project } from '../types';
import { getStatusText } from './calculations';

export const exportProjectToExcel = (project: Project): void => {
  // Prepare data for Excel export
  const worksheetData = [
    // Project header
    ['Nom du Projet', project.nom],
    ['Description', project.description || 'Aucune description'],
    ['Département', project.departement || 'Non assigné'],
    ['Pourcentage d\'avancement', `${Math.round((project.taches.filter(t => t.etat === 'cloturee').length / project.taches.length) * 100) || 0}%`],
    ['Nombre total de tâches', project.taches.length],
    ['Date de création', project.created_at.toLocaleDateString('fr-FR')],
    [],
    // Tasks header
    ['Nom de la tâche', 'Description', 'Scénario d\'exécution', 'Critères d\'acceptation', 'État', 'Personne(s) assignée(s)', 'Fonction(s)', 'Département(s)', 'Date de réalisation', 'Commentaires'],
    // Tasks data
    ...project.taches.map(task => [
      task.nom,
      task.description || 'Aucune description',
      task.scenario_execution || 'Aucun scénario défini',
      task.criteres_acceptation || 'Aucun critère défini',
      getStatusText(task.etat),
      task.utilisateurs.map(u => `${u.prenom} ${u.nom}`).join(', '),
      task.utilisateurs.map(u => u.fonction || 'Non spécifiée').join(', '),
      task.utilisateurs.map(u => u.departement).join(', '),
      task.date_realisation.toLocaleDateString('fr-FR'),
      task.commentaires ? `${task.commentaires.length} commentaire${task.commentaires.length > 1 ? 's' : ''}` : 'Aucun commentaire'
    ])
  ];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Style the header rows

  
  // Set column widths
  worksheet['!cols'] = [
    { width: 25 }, // Nom de la tâche
    { width: 40 }, // Description
    { width: 50 }, // Scénario d'exécution
    { width: 40 }, // Critères d'acceptation
    { width: 15 }, // État
    { width: 30 }, // Personnes assignées
    { width: 25 }, // Fonctions
    { width: 20 }, // Départements
    { width: 20 }, // Date de réalisation
    { width: 20 }  // Commentaires
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Projet');

  // Export file
  const fileName = `${project.nom.replace(/[^a-zA-Z0-9]/g, '_')}_export.xlsx`;
  XLSX.writeFile(workbook, fileName);
};