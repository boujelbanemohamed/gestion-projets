# Guide de Déploiement - GestionProjet

## 🚀 Configuration pour Netlify, Supabase et GitHub

### 1. **Configuration GitHub**

#### Étape 1: Initialiser le repository Git
```bash
git init
git add .
git commit -m "Initial commit - GestionProjet"
```

#### Étape 2: Créer un repository sur GitHub
1. Allez sur https://github.com
2. Cliquez sur "New repository"
3. Nommez-le "gestionprojet" ou "project-management-platform"
4. Ne cochez PAS "Initialize this repository with a README"
5. Cliquez sur "Create repository"

#### Étape 3: Connecter votre projet local
```bash
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git branch -M main
git push -u origin main
```

### 2. **Configuration Supabase**

#### Étape 1: Créer un projet Supabase
1. Allez sur https://supabase.com
2. Cliquez sur "New Project"
3. Choisissez votre organisation
4. Nommez votre projet (ex: "gestionprojet")
5. Créez un mot de passe pour la base de données
6. Choisissez une région proche de vous
7. Cliquez sur "Create new project"

#### Étape 2: Récupérer les clés d'API
1. Dans votre projet Supabase, allez dans "Settings" > "API"
2. Copiez :
   - **Project URL** (ex: `https://your-project.supabase.co`)
   - **anon public** key

#### Étape 3: Configurer la base de données
1. Allez dans "SQL Editor"
2. Exécutez le script SQL de `supabase-schema.sql`
3. Ou utilisez les migrations dans le dossier `supabase/migrations/`

### 3. **Configuration Netlify**

#### Étape 1: Connecter votre repository GitHub
1. Allez sur https://netlify.com
2. Cliquez sur "New site from Git"
3. Choisissez "GitHub"
4. Sélectionnez votre repository
5. Configurez les paramètres de build :
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

#### Étape 2: Configurer les variables d'environnement
Dans Netlify, allez dans "Site settings" > "Environment variables" et ajoutez :

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_USE_SUPABASE=true
VITE_USE_MOCK_DATA=false
```

#### Étape 3: Configurer les redirections
Netlify utilisera automatiquement le fichier `netlify.toml` pour :
- Les redirections SPA
- Les en-têtes de sécurité
- La configuration de cache

### 4. **Variables d'Environnement à Configurer**

#### Pour Netlify (Production)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_USE_SUPABASE=true
VITE_USE_MOCK_DATA=false
```

#### Pour le développement local
Créez un fichier `.env.local` :
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_USE_SUPABASE=true
VITE_USE_MOCK_DATA=false
```

### 5. **Scripts de Déploiement**

#### Déploiement automatique
Une fois configuré, chaque push sur la branche `main` déclenchera automatiquement un déploiement sur Netlify.

#### Déploiement manuel
```bash
# Build local
npm run build

# Déployer sur Netlify (si CLI installé)
netlify deploy --prod
```

### 6. **Vérification du Déploiement**

#### Tests à effectuer
1. ✅ L'application se charge correctement
2. ✅ L'authentification fonctionne
3. ✅ Les projets peuvent être créés/modifiés
4. ✅ Les tâches fonctionnent
5. ✅ Les PV de réunion sont accessibles
6. ✅ Le dashboard affiche les données

#### URLs importantes
- **Frontend**: https://your-app.netlify.app
- **Backend API**: https://your-project.supabase.co
- **Dashboard Supabase**: https://app.supabase.com/project/your-project

### 7. **Sécurité et Bonnes Pratiques**

#### Variables sensibles
- ✅ Ne jamais commiter les clés API dans le code
- ✅ Utiliser les variables d'environnement Netlify
- ✅ Limiter les permissions des clés Supabase

#### Monitoring
- Surveiller les logs Netlify
- Surveiller l'utilisation Supabase
- Configurer des alertes si nécessaire

### 8. **Résolution de Problèmes**

#### Problèmes courants
1. **Build échoue**: Vérifier les dépendances dans `package.json`
2. **Variables d'environnement**: Vérifier la configuration Netlify
3. **CORS**: Configurer les origines autorisées dans Supabase
4. **Base de données**: Vérifier les migrations et les permissions

#### Support
- Documentation Netlify: https://docs.netlify.com
- Documentation Supabase: https://supabase.com/docs
- Issues GitHub: Créer une issue dans votre repository
