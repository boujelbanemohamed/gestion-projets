# Guide de Déploiement - Backend + Frontend

Ce guide vous explique comment déployer l'application complète (backend + frontend) en production.

## 🏗️ Architecture de Déploiement

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   PostgreSQL    │
│   (React/Vite)  │────│   (Node.js)     │────│   Database      │
│   Port: 80/443  │    │   Port: 3000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Options de Déploiement

### Option 1 : Docker Compose (Recommandé)

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd project-management
```

2. **Configurer l'environnement**
```bash
# Backend
cd backend
cp .env.example .env
# Modifier les variables dans .env

# Frontend
cd ../frontend
cp .env.example .env
# Modifier VITE_API_URL avec l'URL de votre serveur
```

3. **Déployer avec Docker**
```bash
cd backend
docker-compose up -d
```

### Option 2 : Déploiement Séparé

#### Backend (API)

1. **Serveur VPS/Cloud**
```bash
# Sur votre serveur
git clone <votre-repo>
cd project-management/backend

# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Configurer la base de données
sudo -u postgres createdb project_management
sudo -u postgres createuser --interactive

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Modifier les variables

# Exécuter les migrations
npm run migrate
npm run seed

# Build et démarrer
npm run build
npm start
```

2. **Avec PM2 (Process Manager)**
```bash
npm install -g pm2

# Créer ecosystem.config.js
module.exports = {
  apps: [{
    name: 'project-management-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};

# Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Frontend (React)

1. **Build et déploiement statique**
```bash
cd frontend

# Configurer l'API URL
echo "VITE_API_URL=https://votre-api.com/api" > .env

# Build
npm run build

# Le dossier dist/ contient les fichiers statiques
```

2. **Déployer sur Netlify**
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Déployer
netlify deploy --prod --dir=dist
```

3. **Déployer sur Vercel**
```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel --prod
```

### Option 3 : Services Cloud

#### Backend sur Railway/Render

1. **Railway**
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Déployer
railway up
```

2. **Render**
- Connecter votre repo GitHub
- Configurer les variables d'environnement
- Déployer automatiquement

#### Frontend sur Netlify/Vercel

Connectez votre repo GitHub et configurez :
- Build command: `npm run build`
- Publish directory: `dist`
- Variables d'environnement: `VITE_API_URL`

## 🔧 Configuration de Production

### Variables d'Environnement Backend

```env
# Base de données
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=project_management

# JWT
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum
JWT_EXPIRES_IN=24h

# Serveur
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com

# Uploads
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf

# Logs
LOG_LEVEL=info
```

### Variables d'Environnement Frontend

```env
VITE_API_URL=https://your-api-domain.com/api
VITE_WS_URL=https://your-api-domain.com
VITE_APP_ENV=production
```

## 🛡️ Sécurité en Production

### Backend

1. **HTTPS obligatoire**
```bash
# Avec Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-api-domain.com
```

2. **Firewall**
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw enable
```

3. **Variables d'environnement sécurisées**
- Utilisez des secrets forts (256 bits minimum)
- Ne jamais commiter les fichiers `.env`
- Utilisez des services de gestion de secrets en production

### Frontend

1. **Variables d'environnement**
- Seules les variables `VITE_*` sont exposées côté client
- Ne jamais exposer de secrets côté frontend

## 📊 Monitoring et Logs

### Backend

1. **Logs avec Winston**
```javascript
// Les logs sont automatiquement écrits dans logs/
// Configurez la rotation des logs en production
```

2. **Health Check**
```bash
curl https://your-api-domain.com/api/health
```

3. **Monitoring avec PM2**
```bash
pm2 monit
pm2 logs
pm2 status
```

### Base de Données

1. **Sauvegardes automatiques**
```bash
# Script de sauvegarde
#!/bin/bash
pg_dump -h localhost -U postgres project_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Crontab pour sauvegardes quotidiennes
0 2 * * * /path/to/backup-script.sh
```

## 🔄 CI/CD avec GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend
          npm ci
          
      - name: Run tests
        run: |
          cd backend
          npm test
          
      - name: Build
        run: |
          cd backend
          npm run build
          
      - name: Deploy to server
        # Votre logique de déploiement

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install and build
        run: |
          cd frontend
          npm ci
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './frontend/dist'
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🧪 Tests en Production

1. **Tests de santé**
```bash
# API Health
curl https://your-api.com/api/health

# Frontend
curl https://your-frontend.com

# Base de données
psql -h your-db-host -U your-user -d project_management -c "SELECT 1;"
```

2. **Tests fonctionnels**
- Connexion/inscription
- Création de projets
- Assignation de tâches
- Upload de fichiers
- Temps réel (WebSocket)

## 📞 Support et Maintenance

### Logs à surveiller
- Erreurs 500 dans l'API
- Échecs de connexion à la base de données
- Erreurs d'authentification
- Uploads qui échouent

### Métriques importantes
- Temps de réponse API
- Utilisation CPU/RAM
- Espace disque
- Connexions simultanées

### Sauvegardes
- Base de données : quotidienne
- Fichiers uploadés : hebdomadaire
- Configuration : à chaque déploiement

---

🎉 **Votre application est maintenant prête pour la production !**

Pour toute question ou problème, consultez les logs et n'hésitez pas à ouvrir une issue sur le repository.