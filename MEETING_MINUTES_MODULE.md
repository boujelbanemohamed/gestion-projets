# 📋 Module PV de Réunion - Documentation

## 🎯 Vue d'ensemble

Le module PV de Réunion permet la gestion centralisée des Procès-Verbaux de réunion dans l'application de gestion de projet. Il offre une solution complète pour uploader, organiser, et consulter les PV associés aux projets.

## ✨ Fonctionnalités

### 🔐 Gestion des Permissions
- **SUPER_ADMIN & ADMIN** : Accès complet (création, modification, suppression)
- **UTILISATEUR** : Accès lecture seule aux PV des projets assignés

### 📁 Gestion des Fichiers
- **Upload** : PDF, Word, Excel, Texte (max 10MB)
- **Téléchargement** sécurisé avec vérification des permissions
- **Stockage** organisé dans `uploads/meeting-minutes/`

### 🔗 Association Multi-Projets
- Un PV peut être associé à plusieurs projets
- Gestion flexible des associations
- Vue par projet disponible

## 🏗️ Architecture

### 📊 Base de Données

#### Table `pv_reunions`
```sql
- id (UUID, PK)
- titre (VARCHAR(255))
- date_reunion (DATE)
- description (TEXT, optionnel)
- nom_fichier (VARCHAR(255))
- chemin_fichier (VARCHAR(500))
- taille_fichier (INTEGER)
- type_mime (VARCHAR(100))
- uploaded_by (UUID, FK vers users)
- created_at, updated_at (TIMESTAMP)
```

#### Table `pv_projets` (Many-to-Many)
```sql
- id (UUID, PK)
- pv_id (UUID, FK vers pv_reunions)
- projet_id (UUID, FK vers projets)
- created_at (TIMESTAMP)
```

### 🛣️ API Endpoints

#### Gestion des PV
- `GET /api/meeting-minutes` - Liste avec pagination et filtres
- `GET /api/meeting-minutes/:id` - Détail d'un PV
- `POST /api/meeting-minutes` - Création avec upload
- `PUT /api/meeting-minutes/:id` - Modification (métadonnées)
- `DELETE /api/meeting-minutes/:id` - Suppression complète

#### Vues spécialisées
- `GET /api/meeting-minutes/project/:projectId` - PV d'un projet
- `GET /api/meeting-minutes/:id/download` - Téléchargement sécurisé

### 🎨 Interface Utilisateur

#### Page Principale (`/meeting-minutes`)
- **Liste** des PV avec informations détaillées
- **Filtres** : recherche, projet, dates
- **Actions** : télécharger, modifier, supprimer
- **Pagination** pour les grandes listes

#### Modals
- **CreateMeetingMinutesModal** : Création avec upload
- **EditMeetingMinutesModal** : Modification des métadonnées

#### Vue Projet
- **ProjectMeetingMinutes** : PV associés au projet (lecture seule)
- Intégré dans le détail du projet

## 🚀 Installation et Configuration

### 1. Migration Base de Données
```bash
cd project/backend
node run-migration.js
```

### 2. Dossier Upload
Le dossier `uploads/meeting-minutes/` est créé automatiquement lors du premier upload.

### 3. Permissions
Les permissions sont automatiquement configurées dans `PermissionService`.

## 📝 Utilisation

### 🔧 Pour les Administrateurs

#### Créer un PV
1. Aller sur "PV de Réunion" dans le menu
2. Cliquer "Ajouter un PV"
3. Remplir le formulaire :
   - Titre (obligatoire)
   - Date de réunion (obligatoire)
   - Description (optionnel)
   - Sélectionner les projets (obligatoire)
   - Uploader le fichier (obligatoire)
4. Valider

#### Modifier un PV
1. Cliquer sur l'icône "Modifier" dans la liste
2. Modifier les informations (sauf le fichier)
3. Valider

#### Supprimer un PV
1. Cliquer sur l'icône "Supprimer"
2. Confirmer la suppression
3. Le fichier et toutes les associations sont supprimés

### 👥 Pour les Utilisateurs

#### Consulter les PV
1. **Vue globale** : "PV de Réunion" (PV des projets assignés)
2. **Vue projet** : Bouton "PV de Réunion Projet" dans le détail

#### Télécharger un PV
1. Cliquer sur l'icône "Télécharger"
2. Le fichier se télécharge automatiquement

## 🔍 Filtres et Recherche

### Filtres Disponibles
- **Recherche textuelle** : titre et description
- **Projet** : PV associés à un projet spécifique
- **Période** : date de début et fin

### Tri
- Par défaut : date de réunion (plus récent en premier)

## 🔒 Sécurité

### Contrôles d'Accès
- **Upload** : Vérification du type MIME
- **Taille** : Limite de 10MB par fichier
- **Permissions** : Contrôle par rôle utilisateur
- **Téléchargement** : Vérification des droits d'accès

### Types de Fichiers Autorisés
- PDF (application/pdf)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- Texte (.txt)

## 📊 Statistiques et Métriques

### Informations Affichées
- Nombre total de PV par projet
- Taille des fichiers
- Utilisateur ayant uploadé
- Date de création

## 🔧 Maintenance

### Nettoyage des Fichiers
Les fichiers sont automatiquement supprimés lors de la suppression d'un PV.

### Sauvegarde
Inclure le dossier `uploads/meeting-minutes/` dans les sauvegardes.

## 🐛 Dépannage

### Problèmes Courants

#### Upload échoue
- Vérifier la taille du fichier (< 10MB)
- Vérifier le type de fichier autorisé
- Vérifier les permissions du dossier uploads

#### PV non visible
- Vérifier les permissions utilisateur
- Vérifier l'association aux projets
- Vérifier les filtres appliqués

#### Téléchargement échoue
- Vérifier que le fichier existe sur le serveur
- Vérifier les permissions d'accès
- Vérifier la configuration du serveur web

## 🔄 Évolutions Futures

### Fonctionnalités Prévues
- **Versioning** : Gestion des versions de PV
- **Notifications** : Alertes lors d'ajout de nouveaux PV
- **Templates** : Modèles de PV prédéfinis
- **Signature électronique** : Validation des PV
- **Export** : Export en lot des PV

### Améliorations Techniques
- **Preview** : Aperçu des fichiers PDF
- **OCR** : Recherche dans le contenu des fichiers
- **Compression** : Optimisation automatique des fichiers
- **CDN** : Distribution des fichiers via CDN

## 📞 Support

Pour toute question ou problème concernant le module PV de Réunion, contactez l'équipe de développement.
