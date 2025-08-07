// Service de données mockées pour fonctionnement autonome
export const MOCK_DATA = {
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

export class MockDataService {
  private data: typeof MOCK_DATA;

  constructor() {
    // Charger les données depuis localStorage ou utiliser les données par défaut
    const savedData = localStorage.getItem('mockData');
    this.data = savedData ? JSON.parse(savedData) : { ...MOCK_DATA };
    this.saveData();
  }

  private saveData() {
    localStorage.setItem('mockData', JSON.stringify(this.data));
  }

  private generateId(collection: keyof typeof MOCK_DATA): number {
    const items = this.data[collection] as any[];
    return Math.max(...items.map(item => item.id), 0) + 1;
  }

  // Départements
  async getDepartments() {
    return this.data.departments;
  }

  async createDepartment(department: Omit<typeof MOCK_DATA.departments[0], 'id' | 'created_at'>) {
    const newDepartment = {
      ...department,
      id: this.generateId('departments'),
      created_at: new Date().toISOString()
    };
    this.data.departments.push(newDepartment);
    this.saveData();
    return newDepartment;
  }

  // Projets
  async getProjects() {
    return this.data.projects;
  }

  async createProject(project: Omit<typeof MOCK_DATA.projects[0], 'id' | 'created_at'>) {
    const newProject = {
      ...project,
      id: this.generateId('projects'),
      created_at: new Date().toISOString()
    };
    this.data.projects.push(newProject);
    this.saveData();
    return newProject;
  }

  async updateProject(id: number, updates: Partial<typeof MOCK_DATA.projects[0]>) {
    const index = this.data.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.projects[index] = { ...this.data.projects[index], ...updates };
      this.saveData();
      return this.data.projects[index];
    }
    throw new Error('Projet non trouvé');
  }

  // Utilisateurs
  async getUsers() {
    return this.data.users;
  }

  async createUser(user: Omit<typeof MOCK_DATA.users[0], 'id' | 'created_at'>) {
    const newUser = {
      ...user,
      id: this.generateId('users'),
      created_at: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  // PV de réunion
  async getMeetingMinutes() {
    return this.data.meeting_minutes;
  }

  async createMeetingMinute(meetingMinute: Omit<typeof MOCK_DATA.meeting_minutes[0], 'id' | 'created_at'>) {
    const newMeetingMinute = {
      ...meetingMinute,
      id: this.generateId('meeting_minutes'),
      created_at: new Date().toISOString()
    };
    this.data.meeting_minutes.push(newMeetingMinute);
    this.saveData();
    return newMeetingMinute;
  }

  // Tâches
  async getTasks() {
    return this.data.tasks;
  }

  async createTask(task: Omit<typeof MOCK_DATA.tasks[0], 'id' | 'created_at'>) {
    const newTask = {
      ...task,
      id: this.generateId('tasks'),
      created_at: new Date().toISOString()
    };
    this.data.tasks.push(newTask);
    this.saveData();
    return newTask;
  }

  // Authentification mockée
  async login(email: string, password: string) {
    const user = this.data.users.find(u => u.email === email);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Simulation de vérification de mot de passe
    const validPasswords = ['password123', 'Admin123!', 'Chef123!', 'Dev123!'];
    if (!validPasswords.includes(password)) {
      throw new Error('Mot de passe incorrect');
    }

    return {
      user,
      token: 'mock-token-' + Date.now()
    };
  }

  // Réinitialiser les données
  resetData() {
    this.data = { ...MOCK_DATA };
    this.saveData();
  }

  // Obtenir toutes les données
  getAllData() {
    return this.data;
  }
}

export const mockDataService = new MockDataService();
