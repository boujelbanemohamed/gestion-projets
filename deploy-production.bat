@echo off
echo 🚀 Déploiement en Production - Gestion Projets
echo ================================================

echo.
echo 📋 Vérification du statut Git...
git status

echo.
echo 🔄 Build de production...
npm run build

echo.
echo ✅ Build terminé avec succès !
echo.
echo 📁 Contenu du dossier dist :
dir dist

echo.
echo 🌐 Déploiement automatique via Netlify...
echo.
echo 📝 Instructions :
echo 1. Allez sur https://app.netlify.com
echo 2. Connectez-vous à votre compte
echo 3. Sélectionnez votre projet
echo 4. Le déploiement devrait se faire automatiquement
echo.
echo 🔍 Vérifiez que le déploiement est terminé
echo.
echo 🎯 URL de production : [Votre URL Netlify]
echo.
pause
