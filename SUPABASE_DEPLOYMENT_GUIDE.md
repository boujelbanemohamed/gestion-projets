# 🚀 Guide de Déploiement Supabase

## 📋 Étapes de Déploiement

### **1. Création du Projet Supabase**

1. **Allez sur** [supabase.com](https://supabase.com)
2. **Créez un compte** ou connectez-vous
3. **Cliquez "New Project"**
4. **Configurez** :
   - **Organization** : Votre organisation
   - **Name** : `gestion-projets`
   - **Database Password** : Générez un mot de passe fort (GARDEZ-LE !)
   - **Region** : Europe (West)
5. **Cliquez "Create new project"**
6. **Attendez** 2-3 minutes que le projet soit créé

### **2. Configuration de la Base de Données**

#### **Étape 1 : Exécuter le Schema SQL**

1. **Dans Supabase Dashboard** → **SQL Editor**
2. **Copiez-collez** le contenu de `supabase-schema.sql`
3. **Cliquez "Run"** pour créer toutes les tables

#### **Étape 2 : Configurer l'Authentification**

1. **Allez dans Authentication** → **Settings**
2. **Activez** "Enable email confirmations" (optionnel)
3. **Dans "Site URL"**, ajoutez : `http://localhost:5173`
4. **Dans "Redirect URLs"**, ajoutez :
   - `http://localhost:5173/**`
   - `http://localhost:8002/**`

### **3. Configuration du Frontend**

#### **Étape 1 : Récupérer les Clés API**

1. **Dans Supabase Dashboard** → **Settings** → **API**
2. **Copiez** :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### **Étape 2 : Configurer les Variables d'Environnement**

Modifiez le fichier `.env.local` :
```env
# Configuration Supabase (REMPLACEZ PAR VOS VRAIES VALEURS)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Mode Supabase activé
VITE_USE_SUPABASE=true

# API locale (fallback)
VITE_API_URL=http://localhost:3000/api
```

### **4. Création des Utilisateurs de Test**

#### **Dans Supabase Dashboard** → **Authentication** → **Users**

1. **Cliquez "Add user"**
2. **Créez** :
   - **Email** : `marie.dupont@example.com`
   - **Password** : `password123`
   - **Email Confirm** : ✅ (coché)

3. **Répétez** pour :
   - **Email** : `pierre.martin@example.com`
   - **Password** : `password123`

#### **Ajouter les Profils Utilisateurs**

Dans **SQL Editor**, exécutez :
```sql
-- Récupérer les IDs des utilisateurs créés
SELECT id, email FROM auth.users;

-- Insérer les profils (REMPLACEZ les UUIDs par les vrais IDs)
INSERT INTO users (id, email, nom, prenom, role, fonction, departement_id) VALUES
('uuid-marie-dupont', 'marie.dupont@example.com', 'Dupont', 'Marie', 'SUPER_ADMIN', 'Directrice', 1),
('uuid-pierre-martin', 'pierre.martin@example.com', 'Martin', 'Pierre', 'ADMIN', 'Chef de projet', 2);
```

### **5. Test de la Configuration**

#### **Étape 1 : Redémarrer l'Application**

```bash
# Arrêter l'application actuelle
# Puis redémarrer avec :
npm run dev
```

#### **Étape 2 : Vérifier la Connexion**

1. **Ouvrez** l'application
2. **Regardez** le bouton Supabase dans l'interface
3. **Il devrait afficher** "Supabase Connecté" (vert) au lieu de "Configurer Supabase" (orange)

#### **Étape 3 : Tester l'Authentification**

1. **Connectez-vous** avec `marie.dupont@example.com` / `password123`
2. **Vérifiez** que l'authentification fonctionne
3. **Testez** la création de PV de réunion

### **6. Avantages du Déploiement Supabase**

#### **✅ Fonctionnalités Ajoutées :**

1. **Base de Données PostgreSQL** :
   - ✅ Performances optimales
   - ✅ Requêtes complexes
   - ✅ Intégrité référentielle
   - ✅ Backup automatique

2. **Authentification Robuste** :
   - ✅ Gestion des sessions
   - ✅ Tokens JWT sécurisés
   - ✅ Réinitialisation de mot de passe
   - ✅ Confirmation par email

3. **Sécurité Avancée** :
   - ✅ Row Level Security (RLS)
   - ✅ Permissions granulaires
   - ✅ Protection CSRF
   - ✅ Chiffrement des données

4. **Temps Réel** :
   - ✅ Notifications instantanées
   - ✅ Synchronisation en temps réel
   - ✅ Collaboration live

5. **Scalabilité** :
   - ✅ Gestion de milliers d'utilisateurs
   - ✅ Stockage illimité
   - ✅ CDN global
   - ✅ Monitoring intégré

### **7. Migration des Données Existantes**

Si vous avez des données dans `app-data.json` :

```bash
# Script de migration (à créer)
node migrate-to-supabase.js
```

### **8. Déploiement en Production**

#### **Frontend (Vercel/Netlify) :**
```bash
# Build de production
npm run build

# Déploiement sur Vercel
npx vercel --prod

# Ou sur Netlify
npm run build && netlify deploy --prod --dir=dist
```

#### **Variables d'Environnement Production :**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_USE_SUPABASE=true
```

## 🎯 **Actions Immédiates**

### **Pour Commencer :**

1. **Créez un projet Supabase** sur [supabase.com](https://supabase.com)
2. **Exécutez** le script SQL `supabase-schema.sql`
3. **Récupérez** vos clés API
4. **Modifiez** `.env.local` avec vos vraies valeurs
5. **Redémarrez** l'application

### **Ordre des Étapes :**

1. ✅ **Créer le projet Supabase** (5 minutes)
2. ✅ **Exécuter le schema SQL** (2 minutes)
3. ✅ **Configurer les variables d'environnement** (1 minute)
4. ✅ **Créer les utilisateurs de test** (3 minutes)
5. ✅ **Tester l'application** (5 minutes)

## 🎉 **Résultat Final**

Après le déploiement Supabase, vous aurez :

- ✅ **Base de données PostgreSQL** professionnelle
- ✅ **Authentification sécurisée** avec gestion des sessions
- ✅ **Permissions avancées** avec Row Level Security
- ✅ **Notifications en temps réel**
- ✅ **Gestion multi-utilisateurs** complète
- ✅ **Scalabilité** pour des milliers d'utilisateurs
- ✅ **Backup automatique** et monitoring
- ✅ **API REST et GraphQL** automatiques

**Commencez par créer votre projet Supabase et dites-moi quand c'est fait !** 🚀
