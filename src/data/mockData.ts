import { Project, User, Department, Comment, TaskHistoryEntry } from '../types';

export const mockDepartments: Department[] = [
  {
    id: '1',
    nom: 'IT',
    created_at: new Date('2024-01-10')
  },
  {
    id: '2',
    nom: 'Design',
    created_at: new Date('2024-01-11')
  },
  {
    id: '3',
    nom: 'Marketing',
    created_at: new Date('2024-01-12')
  },
  {
    id: '4',
    nom: 'Qualité',
    created_at: new Date('2024-01-13')
  },
  {
    id: '5',
    nom: 'RH',
    created_at: new Date('2024-01-14')
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    nom: 'Dupont',
    prenom: 'Marie',
    fonction: 'Chef de projet',
    departement: 'IT',
    email: 'marie.dupont@example.com',
    role: 'SUPER_ADMIN',
    assigned_projects: ['1', '2', '3'], // Assigned to multiple projects
    created_at: new Date('2024-01-15')
  },
  {
    id: '2',
    nom: 'Martin',
    prenom: 'Pierre',
    fonction: 'Développeur Senior',
    departement: 'IT',
    email: 'pierre.martin@example.com',
    role: 'ADMIN',
    assigned_projects: ['1', '3'], // Assigned to specific projects
    created_at: new Date('2024-01-16')
  },
  {
    id: '3',
    nom: 'Lemoine',
    prenom: 'Sophie',
    fonction: 'Designer UX/UI',
    departement: 'Design',
    email: 'sophie.lemoine@example.com',
    role: 'USER',
    assigned_projects: ['1', '2'], // Assigned to design-related projects
    created_at: new Date('2024-01-17')
  },
  {
    id: '4',
    nom: 'Moreau',
    prenom: 'Jean',
    fonction: 'Développeur',
    departement: 'IT',
    email: 'jean.moreau@example.com',
    role: 'USER',
    assigned_projects: ['3'], // Assigned to one project
    created_at: new Date('2024-01-18')
  },
  {
    id: '5',
    nom: 'Rousseau',
    prenom: 'Alice',
    fonction: 'Testeur QA',
    departement: 'Qualité',
    email: 'alice.rousseau@example.com',
    role: 'USER',
    assigned_projects: ['2', '3'], // Assigned to QA projects
    created_at: new Date('2024-01-19')
  },
  {
    id: '6',
    nom: 'Bernard',
    prenom: 'Thomas',
    fonction: 'Chef Marketing',
    departement: 'Marketing',
    email: 'thomas.bernard@example.com',
    role: 'ADMIN',
    assigned_projects: ['2'], // Assigned to marketing project
    created_at: new Date('2024-01-20')
  }
];

// Mock comments for demonstration
const mockComments: Comment[] = [
  {
    id: '1',
    contenu: 'L\'analyse des besoins est maintenant terminée. Nous avons identifié les principales fonctionnalités à implémenter et les contraintes techniques.',
    auteur: mockUsers[0],
    created_at: new Date('2024-02-11T10:30:00'),
    task_id: '1'
  },
  {
    id: '2',
    contenu: 'Parfait ! J\'ai commencé à travailler sur les wireframes en me basant sur vos recommandations.',
    auteur: mockUsers[2],
    created_at: new Date('2024-02-12T14:15:00'),
    task_id: '1'
  },
  {
    id: '3',
    contenu: 'Les maquettes sont en cours de finalisation. J\'ai intégré les retours de l\'équipe et je devrais avoir une première version complète d\'ici la fin de la semaine.',
    auteur: mockUsers[2],
    created_at: new Date('2024-02-20T09:45:00'),
    task_id: '2'
  },
  {
    id: '4',
    contenu: 'Excellente progression ! Les designs sont vraiment impressionnants. Hâte de commencer l\'intégration.',
    auteur: mockUsers[1],
    created_at: new Date('2024-02-21T16:20:00'),
    task_id: '2'
  },
  {
    id: '5',
    contenu: 'L\'architecture technique est définie. Nous utiliserons React avec TypeScript pour le frontend et Node.js pour le backend.',
    auteur: mockUsers[0],
    created_at: new Date('2024-02-16T11:00:00'),
    task_id: '5'
  }
];

// Mock history entries for demonstration
const mockHistoryEntries: TaskHistoryEntry[] = [
  {
    id: 'h1',
    action: 'created',
    description: 'Tâche créée par Marie Dupont',
    auteur: mockUsers[0],
    created_at: new Date('2024-02-01T09:00:00'),
    task_id: '1'
  },
  {
    id: 'h2',
    action: 'assigned',
    description: 'Pierre Martin assigné à la tâche par Marie Dupont',
    auteur: mockUsers[0],
    created_at: new Date('2024-02-01T09:15:00'),
    task_id: '1',
    details: { field: 'utilisateurs', new_value: mockUsers[1] }
  },
  {
    id: 'h3',
    action: 'status_changed',
    description: 'Statut changé de "Non débutée" vers "En cours" par Pierre Martin',
    auteur: mockUsers[1],
    created_at: new Date('2024-02-05T14:30:00'),
    task_id: '1',
    details: { field: 'etat', old_value: 'non_debutee', new_value: 'en_cours' }
  },
  {
    id: 'h4',
    action: 'comment_added',
    description: 'Commentaire ajouté par Marie Dupont',
    auteur: mockUsers[0],
    created_at: new Date('2024-02-11T10:30:00'),
    task_id: '1'
  },
  {
    id: 'h5',
    action: 'status_changed',
    description: 'Statut changé de "En cours" vers "Clôturée" par Pierre Martin',
    auteur: mockUsers[1],
    created_at: new Date('2024-02-12T16:45:00'),
    task_id: '1',
    details: { field: 'etat', old_value: 'en_cours', new_value: 'cloturee' }
  },
  // Task 2 history
  {
    id: 'h6',
    action: 'created',
    description: 'Tâche créée par Marie Dupont',
    auteur: mockUsers[0],
    created_at: new Date('2024-02-15T10:00:00'),
    task_id: '2'
  },
  {
    id: 'h7',
    action: 'assigned',
    description: 'Sophie Lemoine assignée à la tâche par Marie Dupont',
    auteur: mockUsers[0],
    created_at: new Date('2024-02-15T10:15:00'),
    task_id: '2',
    details: { field: 'utilisateurs', new_value: mockUsers[2] }
  },
  {
    id: 'h8',
    action: 'status_changed',
    description: 'Statut changé de "Non débutée" vers "En cours" par Sophie Lemoine',
    auteur: mockUsers[2],
    created_at: new Date('2024-02-18T09:00:00'),
    task_id: '2',
    details: { field: 'etat', old_value: 'non_debutee', new_value: 'en_cours' }
  },
  {
    id: 'h9',
    action: 'comment_added',
    description: 'Commentaire ajouté par Sophie Lemoine',
    auteur: mockUsers[2],
    created_at: new Date('2024-02-20T09:45:00'),
    task_id: '2'
  }
];

export const mockProjects: Project[] = [
  {
    id: '1',
    nom: 'Refonte Site Web',
    type_projet: 'Développement Web',
    budget_initial: 25000,
    devise: 'EUR',
    description: 'Modernisation complète du site web de l\'entreprise avec une nouvelle interface utilisateur, amélioration des performances et optimisation SEO.',
    responsable_id: '1', // Marie Dupont
    prestataire_externe: 'WebDev Solutions',
    nouvelles_fonctionnalites: 'Interface utilisateur moderne et responsive\nOptimisation SEO avancée\nIntégration d\'un système de chat en direct\nTableau de bord analytique\nGestion des utilisateurs améliorée',
    avantages: 'Amélioration de l\'expérience utilisateur\nAugmentation du trafic web de 40%\nRéduction du temps de chargement de 60%\nMeilleure visibilité sur les moteurs de recherche\nInterface mobile optimisée',
    departement: 'IT',
    date_debut: new Date('2024-01-15'),
    date_fin: new Date('2025-08-08'), // Dans 3 jours pour tester les alertes
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-02-15'),
    taches: [
      {
        id: '1',
        nom: 'Analyse des besoins',
        description: 'Analyser les besoins fonctionnels et techniques pour la refonte du site web. Identifier les points d\'amélioration et définir les objectifs.',
        scenario_execution: '1. Organiser des entretiens avec les parties prenantes\n2. Analyser le site actuel et identifier les problèmes\n3. Définir les objectifs de la refonte\n4. Rédiger le cahier des charges\n5. Valider avec l\'équipe projet',
        criteres_acceptation: '- Cahier des charges validé par toutes les parties prenantes\n- Liste des fonctionnalités prioritaires établie\n- Budget et planning définis\n- Contraintes techniques identifiées',
        etat: 'en_cours',
        date_realisation: new Date('2024-02-10'),
        projet_id: '1',
        utilisateurs: [mockUsers[0], mockUsers[1]],
        commentaires: mockComments.filter(c => c.task_id === '1'),
        history: mockHistoryEntries.filter(h => h.task_id === '1')
      },
      {
        id: '2',
        nom: 'Design UI/UX',
        description: 'Concevoir l\'interface utilisateur et l\'expérience utilisateur du nouveau site web en respectant les bonnes pratiques d\'accessibilité.',
        scenario_execution: '1. Créer les wireframes des pages principales\n2. Développer la charte graphique\n3. Concevoir les maquettes haute fidélité\n4. Réaliser les tests utilisateurs\n5. Itérer sur les designs selon les retours',
        criteres_acceptation: '- Maquettes validées pour toutes les pages\n- Charte graphique approuvée\n- Tests utilisateurs réalisés avec succès\n- Design responsive pour mobile et desktop\n- Respect des standards d\'accessibilité WCAG',
        etat: 'en_cours',
        date_realisation: new Date('2024-02-25'),
        projet_id: '1',
        utilisateurs: [mockUsers[2]],
        commentaires: mockComments.filter(c => c.task_id === '2'),
        history: mockHistoryEntries.filter(h => h.task_id === '2')
      },
      {
        id: '3',
        nom: 'Développement Frontend',
        description: 'Développer l\'interface utilisateur du site web en utilisant les technologies modernes et en respectant les maquettes fournies.',
        scenario_execution: '1. Mettre en place l\'environnement de développement\n2. Intégrer les maquettes en HTML/CSS/JS\n3. Implémenter les fonctionnalités interactives\n4. Optimiser les performances\n5. Tester sur différents navigateurs',
        criteres_acceptation: '- Site conforme aux maquettes\n- Fonctionnalités interactives opérationnelles\n- Performance optimisée (score Lighthouse > 90)\n- Compatible avec les navigateurs principaux\n- Code validé et documenté',
        etat: 'non_debutee',
        date_realisation: new Date('2024-03-15'),
        projet_id: '1',
        utilisateurs: [mockUsers[1], mockUsers[3]],
        commentaires: [],
        history: [
          {
            id: 'h10',
            action: 'created',
            description: 'Tâche créée par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-22T11:00:00'),
            task_id: '3'
          }
        ]
      },
      {
        id: '4',
        nom: 'Tests et recette',
        description: 'Effectuer les tests complets du site web et valider le bon fonctionnement de toutes les fonctionnalités avant la mise en production.',
        scenario_execution: '1. Élaborer le plan de tests\n2. Exécuter les tests fonctionnels\n3. Effectuer les tests de performance\n4. Valider l\'accessibilité\n5. Corriger les anomalies détectées\n6. Valider la recette utilisateur',
        criteres_acceptation: '- Tous les tests fonctionnels passent\n- Performance conforme aux exigences\n- Aucun bug bloquant\n- Accessibilité validée\n- Recette utilisateur approuvée',
        etat: 'non_debutee',
        date_realisation: new Date('2024-03-30'),
        projet_id: '1',
        utilisateurs: [mockUsers[4]],
        commentaires: [],
        history: [
          {
            id: 'h11',
            action: 'created',
            description: 'Tâche créée par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-23T14:30:00'),
            task_id: '4'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    nom: 'Application Mobile',
    type_projet: 'Développement Mobile',
    budget_initial: 35000,
    devise: 'EUR',
    description: 'Développement d\'une application mobile native pour iOS et Android permettant aux clients d\'accéder aux services de l\'entreprise.',
    responsable_id: '2', // Pierre Martin
    prestataire_externe: 'MobileTech Corp',
    nouvelles_fonctionnalites: 'Application native iOS et Android\nNotifications push personnalisées\nMode hors ligne\nIntégration avec l\'API existante\nInterface utilisateur intuitive\nSystème de géolocalisation',
    avantages: 'Accessibilité mobile pour tous les clients\nAugmentation de l\'engagement utilisateur\nNouveau canal de vente\nExpérience utilisateur optimisée\nCompétitivité accrue sur le marché mobile',
    departement: 'Design',
    date_debut: new Date('2024-02-01'),
    date_fin: new Date('2025-08-02'), // Date dépassée pour tester l'alerte de dépassement
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-02-15'),
    taches: [
      {
        id: '5',
        nom: 'Spécifications techniques',
        description: 'Définir l\'architecture technique de l\'application mobile et les spécifications détaillées pour le développement.',
        scenario_execution: '1. Analyser les besoins techniques\n2. Choisir les technologies appropriées\n3. Définir l\'architecture de l\'application\n4. Rédiger les spécifications techniques\n5. Valider avec l\'équipe de développement',
        criteres_acceptation: '- Architecture technique validée\n- Technologies sélectionnées et justifiées\n- Spécifications détaillées rédigées\n- Plan de développement établi',
        etat: 'en_cours',
        date_realisation: new Date('2024-02-15'),
        projet_id: '2',
        utilisateurs: [mockUsers[0]],
        commentaires: mockComments.filter(c => c.task_id === '5'),
        history: [
          {
            id: 'h12',
            action: 'created',
            description: 'Tâche créée par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-01T09:00:00'),
            task_id: '5'
          },
          {
            id: 'h13',
            action: 'status_changed',
            description: 'Statut changé de "Non débutée" vers "En cours" par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-05T10:00:00'),
            task_id: '5',
            details: { field: 'etat', old_value: 'non_debutee', new_value: 'en_cours' }
          },
          {
            id: 'h14',
            action: 'status_changed',
            description: 'Statut changé de "En cours" vers "Clôturée" par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-15T17:00:00'),
            task_id: '5',
            details: { field: 'etat', old_value: 'en_cours', new_value: 'cloturee' }
          }
        ]
      },
      {
        id: '6',
        nom: 'Développement iOS',
        description: 'Développer la version iOS de l\'application mobile en utilisant Swift et les frameworks natifs Apple.',
        scenario_execution: '1. Configurer l\'environnement Xcode\n2. Implémenter les écrans principaux\n3. Intégrer les APIs backend\n4. Optimiser les performances\n5. Tester sur différents appareils iOS',
        criteres_acceptation: '- Application fonctionnelle sur iOS\n- Interface conforme aux guidelines Apple\n- Intégration API complète\n- Tests réussis sur iPhone et iPad\n- Soumission App Store prête',
        etat: 'en_cours',
        date_realisation: new Date('2024-03-20'),
        projet_id: '2',
        utilisateurs: [mockUsers[2], mockUsers[3]],
        commentaires: [],
        history: [
          {
            id: 'h15',
            action: 'created',
            description: 'Tâche créée par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-16T09:00:00'),
            task_id: '6'
          },
          {
            id: 'h16',
            action: 'assigned',
            description: 'Sophie Lemoine assignée à la tâche par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-16T09:15:00'),
            task_id: '6',
            details: { field: 'utilisateurs', new_value: mockUsers[2] }
          },
          {
            id: 'h17',
            action: 'assigned',
            description: 'Jean Moreau assigné à la tâche par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-16T09:20:00'),
            task_id: '6',
            details: { field: 'utilisateurs', new_value: mockUsers[3] }
          }
        ]
      },
      {
        id: '7',
        nom: 'Développement Android',
        description: 'Développer la version Android de l\'application mobile en utilisant Kotlin et les frameworks natifs Google.',
        scenario_execution: '1. Configurer l\'environnement Android Studio\n2. Implémenter les écrans principaux\n3. Intégrer les APIs backend\n4. Optimiser les performances\n5. Tester sur différents appareils Android',
        criteres_acceptation: '- Application fonctionnelle sur Android\n- Interface conforme aux Material Design guidelines\n- Intégration API complète\n- Tests réussis sur différentes versions Android\n- Publication Play Store prête',
        etat: 'en_cours',
        date_realisation: new Date('2024-03-25'),
        projet_id: '2',
        utilisateurs: [mockUsers[1], mockUsers[4]],
        commentaires: [],
        history: [
          {
            id: 'h18',
            action: 'created',
            description: 'Tâche créée par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-17T10:00:00'),
            task_id: '7'
          }
        ]
      }
    ]
  },
  {
    id: '3',
    nom: 'Migration Base de Données',
    type_projet: 'Infrastructure',
    budget_initial: 15000,
    devise: 'EUR',
    description: 'Migration de l\'ancienne base de données vers une nouvelle infrastructure cloud avec amélioration des performances et de la sécurité.',
    responsable_id: '4', // Jean Moreau
    nouvelles_fonctionnalites: 'Infrastructure cloud moderne\nSauvegardes automatisées\nSécurité renforcée\nPerformances optimisées\nScalabilité améliorée\nMonitoring en temps réel',
    avantages: 'Réduction des coûts d\'infrastructure de 30%\nAmélioration des performances de 50%\nSécurité des données renforcée\nDisponibilité 99.9%\nSauvegarde automatique\nScalabilité selon les besoins',
    date_debut: new Date('2024-02-10'),
    date_fin: new Date('2024-03-15'),
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-02-15'),
    taches: [
      {
        id: '8',
        nom: 'Audit de la base existante',
        description: 'Effectuer un audit complet de la base de données actuelle pour identifier les problèmes et les opportunités d\'amélioration.',
        scenario_execution: '1. Analyser la structure actuelle\n2. Identifier les problèmes de performance\n3. Évaluer la sécurité\n4. Documenter les dépendances\n5. Proposer des améliorations',
        criteres_acceptation: '- Rapport d\'audit complet\n- Problèmes identifiés et priorisés\n- Recommandations d\'amélioration\n- Plan de migration proposé',
        etat: 'cloturee',
        date_realisation: new Date('2024-02-20'),
        projet_id: '3',
        utilisateurs: [mockUsers[3]],
        commentaires: [],
        history: [
          {
            id: 'h19',
            action: 'created',
            description: 'Tâche créée par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-10T09:00:00'),
            task_id: '8'
          },
          {
            id: 'h20',
            action: 'status_changed',
            description: 'Statut changé de "Non débutée" vers "Clôturée" par Jean Moreau',
            auteur: mockUsers[3],
            created_at: new Date('2024-02-20T16:00:00'),
            task_id: '8',
            details: { field: 'etat', old_value: 'non_debutee', new_value: 'cloturee' }
          }
        ]
      },
      {
        id: '9',
        nom: 'Planification de la migration',
        description: 'Élaborer un plan détaillé pour la migration de la base de données vers la nouvelle infrastructure.',
        scenario_execution: '1. Définir la stratégie de migration\n2. Planifier les étapes de migration\n3. Identifier les risques\n4. Préparer les scripts de migration\n5. Valider le plan avec les équipes',
        criteres_acceptation: '- Plan de migration détaillé\n- Scripts de migration préparés\n- Risques identifiés et mitigés\n- Planning validé par toutes les équipes',
        etat: 'cloturee',
        date_realisation: new Date('2024-02-25'),
        projet_id: '3',
        utilisateurs: [mockUsers[0], mockUsers[3]],
        commentaires: [],
        history: [
          {
            id: 'h21',
            action: 'created',
            description: 'Tâche créée par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-21T09:00:00'),
            task_id: '9'
          }
        ]
      },
      {
        id: '10',
        nom: 'Exécution de la migration',
        description: 'Exécuter la migration de la base de données selon le plan établi en minimisant les interruptions de service.',
        scenario_execution: '1. Préparer l\'environnement cible\n2. Effectuer une migration test\n3. Planifier la fenêtre de maintenance\n4. Exécuter la migration en production\n5. Valider l\'intégrité des données',
        criteres_acceptation: '- Migration réalisée sans perte de données\n- Temps d\'arrêt respecté\n- Performances améliorées\n- Intégrité des données validée\n- Rollback possible si nécessaire',
        etat: 'cloturee',
        date_realisation: new Date('2024-03-05'),
        projet_id: '3',
        utilisateurs: [mockUsers[3], mockUsers[4]],
        commentaires: [],
        history: [
          {
            id: 'h22',
            action: 'created',
            description: 'Tâche créée par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-02-26T09:00:00'),
            task_id: '10'
          }
        ]
      },
      {
        id: '11',
        nom: 'Tests de validation',
        description: 'Effectuer des tests complets pour valider le bon fonctionnement de la nouvelle base de données.',
        scenario_execution: '1. Exécuter les tests fonctionnels\n2. Valider les performances\n3. Tester la sécurité\n4. Vérifier les sauvegardes\n5. Former les équipes',
        criteres_acceptation: '- Tous les tests fonctionnels passent\n- Performances conformes aux objectifs\n- Sécurité renforcée\n- Procédures de sauvegarde opérationnelles\n- Équipes formées',
        etat: 'cloturee',
        date_realisation: new Date('2024-03-10'),
        projet_id: '3',
        utilisateurs: [mockUsers[1], mockUsers[2]],
        commentaires: [],
        history: [
          {
            id: 'h23',
            action: 'created',
            description: 'Tâche créée par Marie Dupont',
            auteur: mockUsers[0],
            created_at: new Date('2024-03-06T09:00:00'),
            task_id: '11'
          }
        ]
      }
    ]
  }
];