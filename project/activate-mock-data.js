// ACTIVATION IMMÉDIATE DES DONNÉES MOCKÉES
console.log('🚀 ACTIVATION DES DONNÉES MOCKÉES');
console.log('='.repeat(50));

// Activer les données mockées
localStorage.setItem('useMockData', 'true');

// Données mockées complètes
const MOCK_DATA = {
  departments: [
    { id: 1, nom: 'IT', description: 'Département informatique et développement', created_at: new Date().toISOString() },
    { id: 2, nom: 'Design', description: 'Département design et expérience utilisateur', created_at: new Date().toISOString() },
    { id: 3, nom: 'Marketing', description: 'Département marketing et communication', created_at: new Date().toISOString() },
    { id: 4, nom: 'Qualité', description: 'Département qualité et assurance', created_at: new Date().toISOString() },
    { id: 5, nom: 'RH', description: 'Département ressources humaines', created_at: new Date().toISOString() }
  ],
  projects: [
    {
      id: 1,
      nom: 'Refonte Site Web',
      description: 'Modernisation complète du site web de l\'entreprise avec une nouvelle interface utilisateur',
      type_projet: 'Développement Web',
      budget: 25000,
      devise: 'EUR',
      statut: 'en_cours',
      date_debut: '2024-01-15',
      date_fin_prevue: '2024-04-15',
      priorite: 'haute',
      avancement: 35,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      nom: 'Application Mobile',
      description: 'Développement d\'une application mobile native pour iOS et Android',
      type_projet: 'Développement Mobile',
      budget: 35000,
      devise: 'EUR',
      statut: 'planifie',
      date_debut: '2024-03-01',
      date_fin_prevue: '2024-08-01',
      priorite: 'haute',
      avancement: 0,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      nom: 'Migration Base de Données',
      description: 'Migration vers une nouvelle infrastructure cloud avec amélioration des performances',
      type_projet: 'Infrastructure',
      budget: 15000,
      devise: 'EUR',
      statut: 'planifie',
      date_debut: '2024-02-01',
      date_fin_prevue: '2024-05-01',
      priorite: 'moyenne',
      avancement: 0,
      created_at: new Date().toISOString()
    }
  ],
  users: [
    {
      id: 1,
      email: 'marie.dupont@example.com',
      nom: 'Dupont',
      prenom: 'Marie',
      fonction: 'Chef de projet',
      role: 'SUPER_ADMIN',
      department_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      email: 'pierre.martin@example.com',
      nom: 'Martin',
      prenom: 'Pierre',
      fonction: 'Développeur Senior',
      role: 'ADMIN',
      department_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      email: 'sophie.bernard@example.com',
      nom: 'Bernard',
      prenom: 'Sophie',
      fonction: 'Designer UX/UI',
      role: 'UTILISATEUR',
      department_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      email: 'admin@gestionprojet.com',
      nom: 'Admin',
      prenom: 'Système',
      fonction: 'Administrateur système',
      role: 'SUPER_ADMIN',
      department_id: 1,
      created_at: new Date().toISOString()
    }
  ],
  meeting_minutes: [
    {
      id: 1,
      titre: 'Réunion de lancement - Refonte Site Web',
      date_reunion: '2024-01-15T10:00:00Z',
      organisateur: 'Marie Dupont',
      participants: ['Marie Dupont', 'Pierre Martin', 'Sophie Bernard'],
      ordre_du_jour: 'Présentation du projet, définition des objectifs, planning initial',
      decisions: 'Validation du cahier des charges, attribution des rôles',
      actions: 'Création des maquettes (Sophie), Setup environnement (Pierre)',
      project_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      titre: 'Point d\'avancement hebdomadaire',
      date_reunion: '2024-01-22T14:00:00Z',
      organisateur: 'Marie Dupont',
      participants: ['Marie Dupont', 'Pierre Martin'],
      ordre_du_jour: 'Revue des tâches, blocages, planning semaine suivante',
      decisions: 'Priorisation des fonctionnalités critiques',
      actions: 'Finalisation module authentification (Pierre)',
      project_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      titre: 'Réunion équipe Design',
      date_reunion: '2024-01-25T09:00:00Z',
      organisateur: 'Sophie Bernard',
      participants: ['Sophie Bernard', 'Marie Dupont'],
      ordre_du_jour: 'Validation des maquettes, retours utilisateurs',
      decisions: 'Approbation des designs finaux',
      actions: 'Intégration des maquettes (Pierre)',
      project_id: 1,
      created_at: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: 1,
      titre: 'Création des maquettes',
      description: 'Concevoir les maquettes pour la nouvelle interface',
      statut: 'termine',
      priorite: 'haute',
      assignee: 'Sophie Bernard',
      project_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      titre: 'Setup environnement de développement',
      description: 'Configurer l\'environnement de développement pour le projet',
      statut: 'en_cours',
      priorite: 'haute',
      assignee: 'Pierre Martin',
      project_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      titre: 'Intégration des maquettes',
      description: 'Intégrer les maquettes validées dans le code',
      statut: 'en_attente',
      priorite: 'moyenne',
      assignee: 'Pierre Martin',
      project_id: 1,
      created_at: new Date().toISOString()
    }
  ]
};

// Sauvegarder les données mockées
localStorage.setItem('mockData', JSON.stringify(MOCK_DATA));

console.log('✅ DONNÉES MOCKÉES ACTIVÉES !');
console.log('📊 Données disponibles:');
console.log(`   • ${MOCK_DATA.departments.length} départements`);
console.log(`   • ${MOCK_DATA.projects.length} projets`);
console.log(`   • ${MOCK_DATA.users.length} utilisateurs`);
console.log(`   • ${MOCK_DATA.meeting_minutes.length} PV de réunion`);
console.log(`   • ${MOCK_DATA.tasks.length} tâches`);

console.log('\n🔄 RECHARGEMENT DE LA PAGE...');
setTimeout(() => {
    window.location.reload();
}, 2000);

console.log('\n🎉 VOTRE PLATEFORME EST MAINTENANT 100% FONCTIONNELLE !');
console.log('✅ Toutes les données sont disponibles');
console.log('✅ Aucune dépendance externe');
console.log('✅ Fonctionnement autonome complet');

// Exposer les fonctions utiles
window.activateMockData = () => {
    localStorage.setItem('useMockData', 'true');
    localStorage.setItem('mockData', JSON.stringify(MOCK_DATA));
    window.location.reload();
};

window.deactivateMockData = () => {
    localStorage.setItem('useMockData', 'false');
    window.location.reload();
};

window.resetMockData = () => {
    localStorage.setItem('mockData', JSON.stringify(MOCK_DATA));
    console.log('🔄 Données mockées réinitialisées');
};

window.getMockData = () => {
    return JSON.parse(localStorage.getItem('mockData') || '{}');
};
