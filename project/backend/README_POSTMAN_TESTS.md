# Tests Postman pour l'API GestionProjet

Ce dossier contient une collection complète de tests Postman automatisés pour toutes les APIs backend de l'application GestionProjet.

## 📁 Structure des fichiers

- `postman_collection.json` - Collection principale avec tests d'authentification, projets et tâches
- `postman_users_departments.json` - Tests pour les utilisateurs et départements
- `postman_comments_uploads.json` - Tests pour les commentaires et uploads de fichiers
- `postman_notifications_expenses.json` - Tests pour les notifications et dépenses
- `postman_performance.json` - Tests pour les APIs de performance

## 🚀 Configuration

### 1. Importation dans Postman

1. Ouvrez Postman
2. Cliquez sur "Import" dans la barre d'outils
3. Importez chaque fichier JSON séparément ou combinez-les en une seule collection

### 2. Configuration des variables d'environnement

Avant d'exécuter les tests, configurez les variables suivantes dans Postman :

```json
{
  "baseUrl": "http://localhost:3000",
  "authToken": "",
  "userId": "",
  "projectId": "",
  "taskId": "",
  "departmentId": "",
  "commentId": "",
  "uploadId": "",
  "notificationId": "",
  "expenseId": ""
}
```

### 3. Ordre d'exécution recommandé

1. **Authentification** - Exécutez d'abord "Login - Success" pour obtenir le token
2. **Création des données de base** - Créez un département, puis un utilisateur
3. **Création d'un projet** - Créez un projet pour tester les fonctionnalités
4. **Création de tâches** - Ajoutez des tâches au projet
5. **Tests des autres fonctionnalités** - Commentaires, uploads, notifications, etc.

## 📋 Tests disponibles

### 🔐 Authentication
- ✅ Login - Success
- ❌ Login - Invalid Credentials
- ✅ Register - Success
- ❌ Register - Email Already Exists

### 📋 Projects
- ✅ Get All Projects
- ✅ Get Project by ID
- ✅ Create Project
- ✅ Update Project
- ✅ Close Project
- ✅ Delete Project

### ✅ Tasks
- ✅ Get All Tasks
- ✅ Get Tasks by Project
- ✅ Get Task by ID
- ✅ Create Task
- ✅ Update Task
- ✅ Update Task Status
- ✅ Delete Task

### 👥 Users & Departments
- ✅ Get All Users
- ✅ Get User by ID
- ✅ Create User
- ✅ Update User
- ✅ Update User Permissions
- ✅ Delete User
- ✅ Get All Departments
- ✅ Get Department by ID
- ✅ Get Department Stats
- ✅ Create Department
- ✅ Update Department
- ✅ Delete Department

### 💬 Comments & 📁 Uploads
- ✅ Get Comments by Task
- ✅ Get Comment by ID
- ✅ Create Comment
- ✅ Update Comment
- ✅ Delete Comment
- ✅ Get Comment Attachments
- ✅ Upload File for Project
- ✅ Upload File for Task
- ✅ Upload File for Comment
- ✅ Get File by ID
- ✅ Download File
- ✅ Get Project Attachments
- ✅ Get Task Attachments
- ✅ Delete File

### 🔔 Notifications & 💰 Expenses
- ✅ Get User Notifications
- ✅ Get Notification by ID
- ✅ Create Notification
- ✅ Mark Notification as Read
- ✅ Mark All Notifications as Read
- ✅ Get Notification Stats
- ✅ Delete Notification
- ✅ Get Project Expenses
- ✅ Get Expense by ID
- ✅ Create Expense
- ✅ Update Expense
- ✅ Get Project Expense Stats
- ✅ Delete Expense

### 📊 Performance Analytics
- ✅ Performance by Department
- ✅ Performance by User
- ✅ Performance by Project
- ✅ Budget Consumption by Project
- ✅ Closed Projects
- ✅ Performance Summary

## 🧪 Exécution des tests

### Exécution manuelle
1. Sélectionnez la collection dans Postman
2. Cliquez sur "Run collection"
3. Configurez les options d'exécution
4. Cliquez sur "Run"

### Exécution automatisée
```bash
# Installer Newman (CLI Postman)
npm install -g newman

# Exécuter les tests
newman run postman_collection.json -e environment.json

# Exécuter avec rapport HTML
newman run postman_collection.json -r html --reporter-html-export results.html
```

## 🔧 Configuration du serveur

Assurez-vous que le serveur backend est en cours d'exécution :

```bash
cd project/backend
npm install
npm start
```

Le serveur doit être accessible sur `http://localhost:3000`

## 📊 Validation des tests

Chaque test vérifie :
- ✅ Code de statut HTTP correct
- ✅ Structure de réponse JSON valide
- ✅ Présence des champs requis
- ✅ Types de données corrects
- ✅ Valeurs attendues

## 🐛 Dépannage

### Erreurs courantes

1. **401 Unauthorized**
   - Vérifiez que le token d'authentification est valide
   - Relancez le test "Login - Success"

2. **404 Not Found**
   - Vérifiez que l'URL de base est correcte
   - Assurez-vous que le serveur est en cours d'exécution

3. **500 Internal Server Error**
   - Vérifiez les logs du serveur
   - Assurez-vous que la base de données est configurée

4. **Tests qui échouent**
   - Vérifiez que les données de test existent
   - Assurez-vous que les variables sont correctement définies

### Logs utiles

```bash
# Vérifier les logs du serveur
tail -f logs/app.log

# Vérifier la base de données
psql -d gestionprojet -c "SELECT * FROM users LIMIT 5;"
```

## 📈 Rapports de performance

Les tests incluent des validations de performance :
- Temps de réponse < 2 secondes
- Taille de réponse < 1MB
- Validation de la structure JSON

## 🔄 Mise à jour des tests

Pour ajouter de nouveaux tests :

1. Créez une nouvelle requête dans Postman
2. Ajoutez les scripts de test
3. Exportez la collection mise à jour
4. Mettez à jour ce README

## 📞 Support

En cas de problème avec les tests :
1. Vérifiez la configuration du serveur
2. Consultez les logs d'erreur
3. Validez la structure de la base de données
4. Testez manuellement les endpoints problématiques 