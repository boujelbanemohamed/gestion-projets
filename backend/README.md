# Backend API - Plateforme de Gestion de Projets

API REST complète pour la plateforme de gestion de projets construite avec Node.js, Express, TypeScript et PostgreSQL.

## 🚀 Fonctionnalités

- **Authentification JWT** avec système de rôles
- **API REST complète** pour tous les modules
- **Base de données PostgreSQL** avec migrations
- **Temps réel** avec Socket.IO
- **Upload de fichiers** avec validation
- **Système de logs** avec Winston
- **Rate limiting** et sécurité
- **Validation** avec Joi
- **Tests** avec Jest

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 13+
- npm ou yarn

## 🔧 Installation

1. **Cloner et installer les dépendances**
```bash
cd backend
npm install
```

2. **Configurer la base de données**
```bash
# Créer la base de données PostgreSQL
createdb project_management

# Copier le fichier d'environnement
cp .env.example .env

# Modifier les variables dans .env
```

3. **Exécuter les migrations et seeds**
```bash
npm run migrate
npm run seed
```

4. **Démarrer le serveur**
```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

## 🗄️ Structure de la base de données

### Tables principales :
- `departements` - Départements de l'entreprise
- `users` - Utilisateurs avec authentification
- `projets` - Projets avec départements
- `taches` - Tâches assignables
- `tache_utilisateurs` - Liaison many-to-many
- `commentaires` - Commentaires sur les tâches
- `*_attachments` - Pièces jointes
- `tache_history` - Historique des modifications

## 🔐 Authentification

### Endpoints d'authentification :
```
POST /api/auth/register - Inscription
POST /api/auth/login - Connexion
GET /api/auth/me - Profil utilisateur
PUT /api/auth/password - Changer mot de passe
```

### Système de rôles :
- **SUPER_ADMIN** : Accès total + gestion des rôles
- **ADMIN** : Accès complet sauf gestion des rôles
- **UTILISATEUR** : Accès limité aux projets assignés

## 📡 API Endpoints

### Projets
```
GET /api/projects - Liste des projets
GET /api/projects/:id - Détails d'un projet
POST /api/projects - Créer un projet (Admin)
PUT /api/projects/:id - Modifier un projet (Admin)
DELETE /api/projects/:id - Supprimer un projet (Admin)
GET /api/projects/:id/stats - Statistiques du projet
```

### Tâches
```
GET /api/tasks/project/:projectId - Tâches d'un projet
GET /api/tasks/:id - Détails d'une tâche
POST /api/tasks - Créer une tâche
PUT /api/tasks/:id - Modifier une tâche
DELETE /api/tasks/:id - Supprimer une tâche (Admin)
```

### Utilisateurs
```
GET /api/users - Liste des utilisateurs (Admin)
GET /api/users/:id - Détails d'un utilisateur
POST /api/users - Créer un utilisateur (Admin)
PUT /api/users/:id - Modifier un utilisateur (Admin)
DELETE /api/users/:id - Supprimer un utilisateur (Admin)
```

### Départements
```
GET /api/departments - Liste des départements
POST /api/departments - Créer un département (Admin)
PUT /api/departments/:id - Modifier un département (Admin)
DELETE /api/departments/:id - Supprimer un département (Admin)
```

### Commentaires
```
GET /api/comments/task/:taskId - Commentaires d'une tâche
POST /api/comments - Ajouter un commentaire
DELETE /api/comments/:id - Supprimer un commentaire
```

### Upload
```
POST /api/uploads/project/:id - Upload pour projet
POST /api/uploads/task/:id - Upload pour tâche
POST /api/uploads/comment/:id - Upload pour commentaire
DELETE /api/uploads/:id - Supprimer un fichier
```

## 🔄 Temps Réel

Socket.IO events :
- `project:created` - Nouveau projet
- `project:updated` - Projet modifié
- `project:deleted` - Projet supprimé
- `task:created` - Nouvelle tâche
- `task:updated` - Tâche modifiée
- `task:deleted` - Tâche supprimée
- `comment:added` - Nouveau commentaire

## 🛡️ Sécurité

- **Helmet** pour les headers de sécurité
- **Rate limiting** pour prévenir les abus
- **Validation** de toutes les entrées
- **Hachage bcrypt** pour les mots de passe
- **JWT** pour l'authentification
- **CORS** configuré

## 📊 Logs et Monitoring

- **Winston** pour les logs structurés
- **Health check** endpoint : `GET /api/health`
- **Logs d'erreurs** détaillés
- **Métriques** de performance

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec coverage
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 🚀 Déploiement

### Variables d'environnement requises :
```env
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
JWT_SECRET=your-jwt-secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

### Docker (optionnel) :
```bash
# Build
docker build -t project-management-api .

# Run
docker run -p 3000:3000 --env-file .env project-management-api
```

## 📝 Comptes de test

Après avoir exécuté les seeds :
- **marie.dupont@example.com** (SUPER_ADMIN)
- **pierre.martin@example.com** (ADMIN)
- **sophie.lemoine@example.com** (UTILISATEUR)
- **jean.moreau@example.com** (UTILISATEUR)
- **alice.rousseau@example.com** (UTILISATEUR)

**Mot de passe pour tous :** `password123`

## 🔧 Scripts disponibles

```bash
npm run dev          # Serveur de développement avec hot reload
npm run build        # Build TypeScript vers JavaScript
npm start            # Démarrer le serveur de production
npm run migrate      # Exécuter les migrations
npm run migrate:rollback # Annuler la dernière migration
npm run seed         # Insérer les données de test
npm test             # Lancer les tests
npm run lint         # Vérifier le code avec ESLint
npm run lint:fix     # Corriger automatiquement les erreurs ESLint
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
- Vérifier les logs dans `logs/app.log`
- Consulter la documentation de l'API
- Ouvrir une issue sur GitHub