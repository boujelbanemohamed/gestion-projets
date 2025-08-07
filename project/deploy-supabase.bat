@echo off
echo 🚀 Déploiement vers Supabase
echo ===============================

echo.
echo 📋 Vérifications préalables...

REM Vérifier si les variables d'environnement sont configurées
if not exist .env.local (
    echo ❌ Fichier .env.local non trouvé
    echo 💡 Créez le fichier .env.local avec vos clés Supabase
    echo.
    echo Exemple de contenu :
    echo VITE_SUPABASE_URL=https://your-project.supabase.co
    echo VITE_SUPABASE_ANON_KEY=your-anon-key
    echo VITE_USE_SUPABASE=true
    echo.
    pause
    exit /b 1
)

echo ✅ Fichier .env.local trouvé

echo.
echo 📦 Installation des dépendances Supabase...
npm install @supabase/supabase-js

echo.
echo 🔍 Test de connexion Supabase...
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
  console.log('❌ VITE_SUPABASE_URL non configuré');
  process.exit(1);
}

if (!supabaseKey || supabaseKey === 'your-anon-key') {
  console.log('❌ VITE_SUPABASE_ANON_KEY non configuré');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

supabase.from('users').select('count').limit(1).then(({ data, error }) => {
  if (error) {
    console.log('❌ Erreur de connexion:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Connexion Supabase réussie !');
  }
}).catch(err => {
  console.log('❌ Erreur:', err.message);
  process.exit(1);
});
"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Échec du test de connexion
    echo 💡 Vérifiez vos clés Supabase dans .env.local
    echo.
    pause
    exit /b 1
)

echo.
echo 🗄️ Migration des données existantes...
if exist backend\app-data.json (
    echo 📄 Données locales trouvées, migration...
    node migrate-to-supabase.js
) else (
    echo ℹ️ Aucune donnée locale à migrer
)

echo.
echo 🎨 Build de l'application...
npm run build

echo.
echo ✅ Déploiement Supabase terminé !
echo.
echo 🌐 Votre application est maintenant configurée pour Supabase
echo.
echo 📋 Prochaines étapes :
echo 1. Testez l'application localement : npm run dev
echo 2. Vérifiez l'authentification avec vos comptes Supabase
echo 3. Testez la création/modification de PV de réunion
echo 4. Déployez en production sur Vercel/Netlify
echo.
echo 🔗 URLs utiles :
echo - Dashboard Supabase : https://app.supabase.com
echo - Documentation : https://supabase.com/docs
echo.
pause
