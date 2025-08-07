import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project } from '../types';

export const exportProjectToPdf = (project: Project): void => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Add company name at the top with new style
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 178, 232); // #1BB2E8
  doc.text('SOCIETE MONETIQUE TUNISIE', 105, 15, { align: 'center' });
  
  // Add title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102);
  doc.text('FICHE PROJET', 105, 30, { align: 'center' });
  
  // Add centered project name
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(project.nom, 105, 45, { align: 'center' });
  
  // Add project details
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  
  let y = 65;
  const lineHeight = 10;
  
  // Get project manager
  const projectManager = project.responsable_id 
    ? project.taches.flatMap(t => t.utilisateurs).find(user => user.id === project.responsable_id)
    : null;
  
  // Date de début & Date de fin
  doc.setFont('helvetica', 'bold');
  doc.text('Date Début & Date Fin:', 20, y);
  doc.setFont('helvetica', 'normal');
  const dateDebut = project.date_debut ? project.date_debut.toLocaleDateString('fr-FR') : 'N/A';
  const dateFin = project.date_fin ? project.date_fin.toLocaleDateString('fr-FR') : 'N/A';
  doc.text(`${dateDebut} - ${dateFin}`, 80, y);
  y += lineHeight;
  
  // Budget Initial & Devise
  doc.setFont('helvetica', 'bold');
  doc.text('Budget Initial & Devise:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(project.budget_initial ? `${project.budget_initial} ${project.devise || 'N/A'}` : 'N/A', 100, y);
  y += lineHeight;
  
  // Type de projet
  doc.setFont('helvetica', 'bold');
  doc.text('Type de projet:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(project.type_projet || 'N/A', 80, y);
  y += lineHeight;
  
  // Prestataire externe
  doc.setFont('helvetica', 'bold');
  doc.text('Prestataire externe:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(project.prestataire_externe || 'N/A', 80, y);
  y += lineHeight;
  
  // Département
  doc.setFont('helvetica', 'bold');
  doc.text('Département:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(project.departement || 'N/A', 80, y);
  y += lineHeight + 5;
  
  // Description du projet
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', 20, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  
  if (project.description) {
    const descriptionLines = doc.splitTextToSize(project.description, 170);
    doc.text(descriptionLines, 20, y);
    y += lineHeight * descriptionLines.length + 5;
  } else {
    doc.text('N/A', 20, y);
    y += lineHeight + 5;
  }
  
  // Avantages
  doc.setFont('helvetica', 'bold');
  doc.text('Avantages:', 20, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  
  if (project.avantages) {
    const avantagesLines = doc.splitTextToSize(project.avantages, 170);
    doc.text(avantagesLines, 20, y);
    y += lineHeight * avantagesLines.length + 5;
  } else {
    doc.text('N/A', 20, y);
    y += lineHeight + 5;
  }
  
  // Nouvelles fonctionnalités
  doc.setFont('helvetica', 'bold');
  doc.text('Nouvelles fonctionnalités:', 20, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  
  if (project.nouvelles_fonctionnalites) {
    const fonctionnalitesLines = doc.splitTextToSize(project.nouvelles_fonctionnalites, 170);
    doc.text(fonctionnalitesLines, 20, y);
    y += lineHeight * fonctionnalitesLines.length + 5;
  } else {
    doc.text('N/A', 20, y);
    y += lineHeight + 5;
  }
  
  // Responsable du projet
  doc.setFont('helvetica', 'bold');
  doc.text('Responsable du projet:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(projectManager ? `${projectManager.prenom} ${projectManager.nom}` : 'N/A', 80, y);
  y += lineHeight + 5;
  
  // Add a new page if needed for members
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  // Membres du projet
  const projectMembers = Array.from(
    new Map(
      project.taches
        .flatMap(task => task.utilisateurs)
        .map(user => [user.id, user])
    ).values()
  );

  // Add project manager to members list if not already included
  const allProjectMembers = [...projectMembers];
  if (projectManager && !projectMembers.some(member => member.id === projectManager.id)) {
    allProjectMembers.push(projectManager);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Membres:', 20, y);
  y += lineHeight + 5;
  
  if (allProjectMembers.length > 0) {
    // Create a table for members
    const membersData = allProjectMembers.map(member => [
      `${member.prenom} ${member.nom}`,
      member.fonction || 'N/A',
      member.departement || 'N/A'
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [['Nom', 'Fonction', 'Département']],
      body: membersData,
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102], textColor: 255 },
      margin: { top: 10 }
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.text('N/A', 20, y);
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Page ${i} sur ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('Centre urbain Nord, Sana Center, bloc C – 1082, Tunis', 105, 290, { align: 'center' });
  }
  
  // Save the PDF
  doc.save(`Fiche_Projet_${project.nom.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};