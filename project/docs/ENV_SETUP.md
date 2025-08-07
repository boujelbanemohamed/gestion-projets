# Configuration des Variables d'Environnement

## 🎯 Vue d'ensemble

Ce guide vous explique comment configurer les variables d'environnement pour connecter votre application à Supabase.

## 📋 Étapes de configuration

### 1. **Récupérer les clés Supabase**

1. Connectez-vous à votre [dashboard Supabase](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **"Settings"** (⚙️) dans le menu de gauche
4. Cliquez sur **"API"**
5. Vous verrez deux informations importantes :
   - **Project URL** : `https://votre-projet.supabase.co`
   - **anon public** : Une longue clé commençant par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. **Créer le fichier .env**

1. À la racine de votre projet, créez un fichier `.env`
2. Copiez le contenu de `.env.example`
3. Remplacez les valeurs par vos vraies clés :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdHJlLXByb2pldCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc4ODk2NDAwLCJleHAiOjE5OTQ0NzI0MDB9.votre-signature
```

### 3. **Vérifier la configuration**

1. Redémarrez votre serveur de développement :
```bash
npm run dev
```

2. Ouvrez la console du navigateur (F12)
3. Si tout fonctionne, vous ne devriez voir aucune erreur de connexion Supabase

### 4. **Configuration pour la production**

#### **Netlify**
1. Allez dans votre dashboard Netlify
2. Sélectionnez votre site
3. Allez dans **"Site settings"** > **"Environment variables"**
4. Ajoutez :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé anonyme

#### **Vercel**
1. Allez dans votre dashboard Vercel
2. Sélectionnez votre projet
3. Allez dans **"Settings"** > **"Environment Variables"**
4. Ajoutez les mêmes variables

#### **Autres plateformes**
Consultez la documentation de votre plateforme pour ajouter des variables d'environnement.

## 🔐 Sécurité

### ✅ **Ce qui est sûr**
- La clé `anon` peut être exposée côté client
- Elle est limitée par les politiques RLS de Supabase
- Les utilisateurs ne peuvent accéder qu'aux données autorisées

### ⚠️ **Important**
- **JAMAIS** exposer la clé `service_role` côté client
- Toujours utiliser HTTPS en production
- Configurer les domaines autorisés dans Supabase

## 🔧 Dépannage

### **Erreur : "Variables d'environnement Supabase manquantes"**
- Vérifiez que le fichier `.env` existe
- Vérifiez que les noms des variables sont corrects (`VITE_` est obligatoire)
- Redémarrez le serveur de développement

### **Erreur de connexion à Supabase**
- Vérifiez que l'URL est correcte (sans `/` à la fin)
- Vérifiez que la clé anonyme est complète
- Vérifiez que votre projet Supabase est actif

### **Variables non reconnues**
- Les variables doivent commencer par `VITE_` pour être accessibles côté client
- Redémarrez le serveur après modification du `.env`

## 📝 Exemple complet

Voici un exemple de fichier `.env` correctement configuré :

```env
# Configuration Supabase
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3ODg5NjQwMCwiZXhwIjoxOTk0NDcyNDAwfQ.signature-here

# Optionnel : Configuration pour le développement
VITE_APP_ENV=development
```

## 🚀 Prochaines étapes

Une fois les variables configurées :

1. ✅ Testez la connexion en démarrant l'application
2. ✅ Vérifiez que l'authentification fonctionne
3. ✅ Testez la création d'un compte utilisateur
4. ✅ Vérifiez l'accès aux données selon les rôles

## 📞 Support

Si vous rencontrez des problèmes :
- Vérifiez les logs de la console navigateur
- Consultez les logs Supabase dans le dashboard
- Vérifiez que les migrations ont été exécutées
- Assurez-vous que RLS est activé sur toutes les tables