# Guide de Déploiement - Variables d'Environnement

## 🚀 Configuration des variables d'environnement pour le déploiement

### 📋 Variables requises

Votre application nécessite ces variables d'environnement :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🌐 Netlify

### Méthode 1 : Interface Web
1. Connectez-vous à [Netlify](https://app.netlify.com)
2. Sélectionnez votre site
3. Allez dans **"Site settings"**
4. Cliquez sur **"Environment variables"** dans le menu de gauche
5. Cliquez sur **"Add a variable"**
6. Ajoutez chaque variable :
   - **Key** : `VITE_SUPABASE_URL`
   - **Value** : `https://votre-projet.supabase.co`
   - Cliquez **"Create variable"**
7. Répétez pour `VITE_SUPABASE_ANON_KEY`
8. Redéployez votre site

### Méthode 2 : Netlify CLI
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Ajouter les variables
netlify env:set VITE_SUPABASE_URL "https://votre-projet.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "votre-clé-anonyme"

# Redéployer
netlify deploy --prod
```

### Méthode 3 : Fichier netlify.toml
Créez un fichier `netlify.toml` à la racine :

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_SUPABASE_URL = "https://votre-projet.supabase.co"
  VITE_SUPABASE_ANON_KEY = "votre-clé-anonyme"
```

---

## ▲ Vercel

### Méthode 1 : Interface Web
1. Connectez-vous à [Vercel](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **"Settings"**
4. Cliquez sur **"Environment Variables"**
5. Ajoutez chaque variable :
   - **Name** : `VITE_SUPABASE_URL`
   - **Value** : `https://votre-projet.supabase.co`
   - **Environment** : Production, Preview, Development
6. Cliquez **"Save"**
7. Répétez pour `VITE_SUPABASE_ANON_KEY`
8. Redéployez depuis l'onglet **"Deployments"**

### Méthode 2 : Vercel CLI
```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Ajouter les variables
vercel env add VITE_SUPABASE_URL production
# Entrez votre URL quand demandé

vercel env add VITE_SUPABASE_ANON_KEY production
# Entrez votre clé quand demandé

# Redéployer
vercel --prod
```

### Méthode 3 : Fichier vercel.json
```json
{
  "env": {
    "VITE_SUPABASE_URL": "https://votre-projet.supabase.co",
    "VITE_SUPABASE_ANON_KEY": "votre-clé-anonyme"
  }
}
```

---

## 🔥 Firebase Hosting

### Avec Firebase CLI
```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Configurer les variables (dans firebase.json)
{
  "hosting": {
    "public": "dist",
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }]
  }
}

# Build avec variables
VITE_SUPABASE_URL="https://votre-projet.supabase.co" \
VITE_SUPABASE_ANON_KEY="votre-clé" \
npm run build

# Déployer
firebase deploy
```

---

## 🌊 Surge.sh

```bash
# Installer Surge
npm install -g surge

# Build avec variables
VITE_SUPABASE_URL="https://votre-projet.supabase.co" \
VITE_SUPABASE_ANON_KEY="votre-clé" \
npm run build

# Déployer
surge dist votre-domaine.surge.sh
```

---

## 📦 GitHub Pages

### Avec GitHub Actions
Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

Puis ajoutez vos secrets dans **Settings** > **Secrets and variables** > **Actions**.

---

## 🐳 Docker

### Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Variables d'environnement pour le build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Build et déploiement
```bash
# Build avec variables
docker build \
  --build-arg VITE_SUPABASE_URL="https://votre-projet.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="votre-clé" \
  -t mon-app .

# Run
docker run -p 80:80 mon-app
```

---

## ☁️ Autres plateformes

### Render
1. Connectez votre repo GitHub
2. Dans **Environment** :
   - `VITE_SUPABASE_URL` = votre URL
   - `VITE_SUPABASE_ANON_KEY` = votre clé
3. Build Command : `npm run build`
4. Publish Directory : `dist`

### Railway
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Ajouter variables
railway variables set VITE_SUPABASE_URL="https://votre-projet.supabase.co"
railway variables set VITE_SUPABASE_ANON_KEY="votre-clé"

# Déployer
railway up
```

### Heroku (pour apps statiques)
```bash
# Installer Heroku CLI
# Créer buildpack pour sites statiques

# Ajouter variables
heroku config:set VITE_SUPABASE_URL="https://votre-projet.supabase.co"
heroku config:set VITE_SUPABASE_ANON_KEY="votre-clé"

# Déployer
git push heroku main
```

---

## ✅ Vérification du déploiement

Après déploiement, vérifiez que :

1. **Les variables sont bien chargées** :
   - Ouvrez la console du navigateur (F12)
   - Tapez : `console.log(import.meta.env.VITE_SUPABASE_URL)`
   - Vous devriez voir votre URL Supabase

2. **La connexion Supabase fonctionne** :
   - Testez la connexion/inscription
   - Vérifiez qu'aucune erreur n'apparaît dans la console

3. **Les fonctionnalités marchent** :
   - Créez un compte de test
   - Testez les principales fonctionnalités

---

## 🔒 Sécurité

### ✅ Bonnes pratiques
- Utilisez HTTPS en production
- Configurez les domaines autorisés dans Supabase
- La clé `anon` peut être exposée côté client
- Activez RLS sur toutes vos tables Supabase

### ⚠️ À éviter
- Ne jamais exposer la clé `service_role`
- Ne pas commiter les fichiers `.env` dans Git
- Ne pas utiliser de variables sensibles côté client

---

## 🆘 Dépannage

### Variables non reconnues
- Vérifiez que les noms commencent par `VITE_`
- Redéployez après avoir ajouté les variables
- Vérifiez la casse (sensible aux majuscules/minuscules)

### Erreurs de connexion Supabase
- Vérifiez l'URL (sans `/` à la fin)
- Vérifiez que la clé est complète
- Testez la connexion depuis votre dashboard Supabase

### Build qui échoue
- Vérifiez que toutes les variables requises sont définies
- Consultez les logs de build de votre plateforme
- Testez le build en local avec les mêmes variables

---

## 📞 Support

Si vous rencontrez des problèmes :
- Consultez les logs de votre plateforme de déploiement
- Vérifiez la configuration Supabase
- Testez en local avec les mêmes variables d'environnement