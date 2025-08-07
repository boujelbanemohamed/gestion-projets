# 📚 Documentation API - Plateforme de Gestion de Projets

## 🌐 Base URL
```
http://localhost:3000/api
```

## 🔐 Authentification
Toutes les routes protégées nécessitent un header d'authentification :
```
Authorization: Bearer <token>
```

## 📋 Routes Disponibles

### **🔑 Authentification**

#### POST `/auth/login`
Connexion utilisateur
```json
{
  "email": "marie.dupont@example.com",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "message": "Connexion réussie",
  "user": {
    "id": 1,
    "email": "marie.dupont@example.com",
    "nom": "Dupont",
    "prenom": "Marie",
    "role": "SUPER_ADMIN"
  },
  "token": "fake-token-for-testing"
}
```

### **📊 Projets**

#### GET `/projects/all`
Liste tous les projets (sans authentification)

#### GET `/projects`
Liste des projets avec pagination (authentifié)

### **📝 PV de Réunion**

#### GET `/meeting-minutes`
Liste tous les PV de réunion
- **Query params** : `projet_id` pour filtrer par projet

#### GET `/meeting-minutes/:id`
Récupère un PV spécifique

#### POST `/meeting-minutes`
Crée un nouveau PV
```json
{
  "titre": "PV Réunion Projet",
  "date_reunion": "2025-08-06",
  "description": "Description détaillée du PV",
  "projets": ["1", "2"]
}
```

#### PUT `/meeting-minutes/:id`
Modifie un PV existant

#### DELETE `/meeting-minutes/:id`
Supprime un PV

#### GET `/meeting-minutes/:id/download`
Télécharge un PV au format PDF

#### GET `/projects/:projectId/meeting-minutes`
Récupère les PV d'un projet spécifique

### **🔧 Utilitaires**

#### GET `/test`
Test de fonctionnement de l'API

#### GET `/health`
Vérification de l'état du serveur

## 📊 Format des Données

### **PV de Réunion**
```json
{
  "id": 1,
  "titre": "PV de Réunion",
  "date_reunion": "2025-08-06",
  "description": "Description du PV",
  "projets": [
    {
      "id": "1",
      "nom": "Refonte Site Web"
    }
  ],
  "file_name": "PV_Reunion.pdf",
  "taille_fichier": 51200,
  "created_by": 1,
  "created_at": "2025-08-06T12:00:00.000Z",
  "uploaded_by_nom": "Marie",
  "uploaded_by_prenom": "Dupont"
}
```

### **Projet**
```json
{
  "id": 1,
  "nom": "Refonte Site Web",
  "description": "Modernisation du site web",
  "statut": "en_cours"
}
```

## ⚠️ Codes d'Erreur

- **400** : Données invalides
- **401** : Non authentifié
- **403** : Non autorisé
- **404** : Ressource non trouvée
- **500** : Erreur serveur

## 🧪 Tests

### Test de Connectivité
```bash
curl http://localhost:3000/api/test
```

### Test d'Authentification
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marie.dupont@example.com","password":"password123"}'
```

### Test de Création de PV
```bash
curl -X POST http://localhost:3000/api/meeting-minutes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token-for-testing" \
  -d '{"titre":"Test PV","date_reunion":"2025-08-06","description":"Test de création","projets":["1"]}'
```
