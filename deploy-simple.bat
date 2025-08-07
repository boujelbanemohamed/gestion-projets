@echo off
echo 🚀 Déploiement Simplifié - Gestion de Projets
echo =============================================

echo.
echo 📦 Vérification du build...
if not exist dist (
    echo ❌ Build non trouvé, création en cours...
    npm run build
    if %errorlevel% neq 0 (
        echo ❌ Échec du build
        pause
        exit /b 1
    )
) else (
    echo ✅ Build trouvé dans le dossier dist/
)

echo.
echo 🌐 Options de Déploiement :
echo.
echo 1. 📁 Netlify (Drag & Drop - Le plus simple)
echo    - Allez sur https://netlify.com
echo    - Glissez-déposez le dossier 'dist' sur la page
echo    - Votre site sera en ligne en 30 secondes !
echo.
echo 2. 🚀 Vercel (Interface Web)
echo    - Allez sur https://vercel.com
echo    - Cliquez "Add New" → "Project"
echo    - Uploadez le dossier 'dist'
echo.
echo 3. 🔧 GitHub Pages (Gratuit)
echo    - Poussez votre code sur GitHub
echo    - Activez GitHub Pages dans les settings
echo.

echo 📋 Après le déploiement :
echo.
echo 1. ✅ Copiez l'URL de votre site (ex: https://amazing-site-123.netlify.app)
echo.
echo 2. 🔧 Dans Supabase Dashboard → Authentication → Settings :
echo    - Site URL : https://votre-site.netlify.app
echo    - Redirect URLs : https://votre-site.netlify.app/**
echo.
echo 3. 🧪 Testez votre application :
echo    - Connexion avec boujelbane@gmail.com
echo    - Création de PV de réunion
echo    - Gestion des membres
echo.

echo 🎯 RECOMMANDATION : Utilisez Netlify pour commencer !
echo.
echo 📂 Votre dossier à déployer : %CD%\dist
echo.
echo 🌐 Ouvrir Netlify dans le navigateur ?
set /p choice="Voulez-vous ouvrir Netlify ? (o/n): "
if /i "%choice%"=="o" (
    start https://netlify.com
    echo ✅ Netlify ouvert dans votre navigateur
    echo 💡 Glissez-déposez le dossier 'dist' sur la page !
)

echo.
echo ✅ Préparation terminée !
echo 📁 Dossier à déployer : dist/
echo 🌐 Taille du build : 
dir dist /s /-c | find "File(s)"

echo.
pause
