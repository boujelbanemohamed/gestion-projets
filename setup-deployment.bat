@echo off
echo 🚀 Configuration du Déploiement - GestionProjet
echo.

echo 📋 Vérification des prérequis...
echo.

echo 🔍 Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js détecté

echo 🔍 Vérification de Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git n'est pas installé. Veuillez l'installer depuis https://git-scm.com
    pause
    exit /b 1
)
echo ✅ Git détecté

echo.
echo 📦 Installation des dépendances...
call npm install

echo.
echo 🔧 Configuration Git...
if not exist .git (
    echo Initialisation du repository Git...
    git init
    git add .
    git commit -m "Initial commit - GestionProjet"
    echo ✅ Repository Git initialisé
) else (
    echo ✅ Repository Git déjà initialisé
)

echo.
echo 🏗️ Test de build...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build. Vérifiez les erreurs ci-dessus.
    pause
    exit /b 1
)
echo ✅ Build réussi

echo.
echo 📝 Configuration des variables d'environnement...
if not exist .env.local (
    echo Création du fichier .env.local...
    copy env.example .env.local
    echo ✅ Fichier .env.local créé
    echo ⚠️ IMPORTANT: Modifiez .env.local avec vos vraies clés Supabase
) else (
    echo ✅ Fichier .env.local existe déjà
)

echo.
echo 🎯 Configuration terminée !
echo.
echo 📋 Prochaines étapes:
echo    1. Créez un repository sur GitHub
echo    2. Créez un projet sur Supabase
echo    3. Configurez les variables d'environnement dans Netlify
echo    4. Connectez votre repository à Netlify
echo.
echo 📖 Consultez le fichier deploy-setup.md pour les instructions détaillées
echo.
echo 🔑 Variables d'environnement à configurer:
echo    VITE_SUPABASE_URL=https://your-project.supabase.co
echo    VITE_SUPABASE_ANON_KEY=your-anon-key-here
echo    VITE_USE_SUPABASE=true
echo    VITE_USE_MOCK_DATA=false
echo.
pause
