@echo off
echo 🚀 Déploiement en Production sur Supabase + Vercel
echo ===================================================

echo.
echo 📋 Vérifications préalables...

REM Vérifier si le build existe
if not exist dist (
    echo ❌ Dossier dist non trouvé
    echo 💡 Exécution du build de production...
    npm run build
    if %errorlevel% neq 0 (
        echo ❌ Échec du build
        pause
        exit /b 1
    )
) else (
    echo ✅ Build de production trouvé
)

echo.
echo 🔧 Installation de Vercel CLI (si nécessaire)...
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installation de Vercel CLI...
    npm install -g vercel
) else (
    echo ✅ Vercel CLI déjà installé
)

echo.
echo 🌐 Déploiement sur Vercel...
echo.
echo 📝 Instructions pour le déploiement :
echo 1. Exécutez : vercel --prod
echo 2. Suivez les instructions :
echo    - Set up and deploy? [Y/n] : Y
echo    - Which scope? : Votre compte
echo    - Link to existing project? [y/N] : N
echo    - Project name : gestion-projets-supabase
echo    - Directory : ./
echo    - Override settings? [y/N] : N
echo.
echo 3. Une fois déployé, copiez l'URL de production
echo 4. Mettez à jour les URLs dans Supabase Authentication
echo.

echo 🎯 Commandes à exécuter :
echo.
echo vercel --prod
echo.

echo 📋 Après le déploiement :
echo.
echo 1. Copiez l'URL de production (ex: https://gestion-projets-supabase.vercel.app)
echo.
echo 2. Dans Supabase Dashboard → Authentication → Settings :
echo    - Site URL : https://votre-app.vercel.app
echo    - Redirect URLs : https://votre-app.vercel.app/**
echo.
echo 3. Testez l'application en production
echo.
echo 4. Vérifiez que l'authentification fonctionne
echo.

echo ✅ Préparation terminée !
echo 💡 Exécutez maintenant : vercel --prod
echo.
pause
