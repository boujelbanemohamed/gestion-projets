# Plateforme de Gestion de Projets

Une application moderne de gestion de projets construite avec React, TypeScript, Tailwind CSS et Supabase.

## 🚀 Fonctionnalités

- **Gestion des projets** : Créer, modifier et suivre l'avancement des projets
- **Gestion des tâches** : Système complet de tâches avec assignation, commentaires et pièces jointes
- **Vues multiples** : Kanban, Liste et Gantt pour visualiser les tâches
- **Gestion des équipes** : Départements, membres et système de rôles (Super Admin, Admin, Utilisateur)
- **Tableau de bord performance** : Suivi des performances par membre et département
- **Authentification sécurisée** : Système d'authentification avec Supabase
- **Upload de fichiers** : Pièces jointes pour projets, tâches et commentaires
- **Export Excel** : Export des données de projets
- **Interface responsive** : Design adaptatif pour tous les appareils

## 🛠️ Technologies

- **Frontend** : React 18, TypeScript, Tailwind CSS
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Stockage** : Supabase Storage
- **Icons** : Lucide React
- **Build** : Vite
- **Export** : XLSX

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte Supabase

## 🔧 Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd project-management-platform
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer Supabase**
   - Créez un projet sur [Supabase](https://supabase.com)
   - Cliquez sur le bouton "Connect to Supabase" dans l'interface
   - Ou configurez manuellement les variables d'environnement

4. **Démarrer l'application**
```bash
npm run dev
```

## 🗄️ Configuration de la base de données

L'application utilise Supabase avec le schéma suivant :

### Tables principales :
- `departements` - Départements de l'entreprise
- `users` - Utilisateurs avec système de rôles
- `projets` - Projets avec départements assignés
- `taches` - Tâches avec assignations multiples
- `commentaires` - Commentaires sur les tâches
- `*_attachments` - Pièces jointes pour projets, tâches et commentaires
- `tache_history` - Historique des modifications

### Système de rôles :
- **Super Admin** : Accès total + gestion des rôles
- **Admin** : Accès complet sauf gestion des rôles
- **Utilisateur** : Accès limité aux projets assignés

## 🚀 Déploiement

### Option 1 : Netlify (Recommandé)
```bash
npm run build
# Déployez le dossier dist/ sur Netlify
```

### Option 2 : Vercel
```bash
npm run build
# Déployez avec Vercel CLI ou interface web
```

### Option 3 : Autres plateformes
L'application est une SPA statique qui peut être déployée sur n'importe quelle plateforme supportant les sites statiques.

## 📁 Structure du projet

```
src/
├── components/          # Composants React
├── hooks/              # Hooks personnalisés
├── services/           # Services API Supabase
├── types/              # Types TypeScript
├── utils/              # Utilitaires
├── data/               # Données de démonstration
└── App.tsx             # Composant principal
```

## 🔐 Sécurité

- Authentification sécurisée avec Supabase Auth
- Row Level Security (RLS) activé sur toutes les tables
- Validation des permissions côté client et serveur
- Tokens JWT pour l'authentification

## 📊 Fonctionnalités avancées

- **Diagramme de Gantt** : Visualisation temporelle des tâches
- **Tableau Kanban** : Gestion visuelle des tâches par statut
- **Historique des tâches** : Suivi complet des modifications
- **Système de commentaires** : Communication sur les tâches
- **Gestion des pièces jointes** : Upload et gestion de fichiers
- **Filtres avancés** : Recherche et filtrage multi-critères
- **Export Excel** : Export des données pour analyse

## 🎨 Design

Interface moderne avec :
- Design system cohérent
- Animations et micro-interactions
- Mode responsive
- Accessibilité WCAG
- Thème professionnel

## 🔧 Développement

### Scripts disponibles :
```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Aperçu du build
npm run lint         # Linting du code
```

### Ajout de nouvelles fonctionnalités :
1. Créer les types TypeScript dans `src/types/`
2. Ajouter les services API dans `src/services/`
3. Créer les composants dans `src/components/`
4. Mettre à jour le schéma Supabase si nécessaire

## 📝 Licence

Ce projet est sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation Supabase
- Vérifier les logs de la console pour le débogage