@echo off
echo 🚀 Déploiement en Production - GestionProjet
echo.

echo 📋 Vérification de l'état actuel...
git status --porcelain
if %errorlevel% neq 0 (
    echo ❌ Erreur Git
    pause
    exit /b 1
)

echo.
echo 🔄 Ajout des nouveaux fichiers...
git add .

echo.
echo 💾 Commit des changements...
git commit -m "Configuration déploiement Netlify/Supabase - %date% %time%"

echo.
echo 📤 Push vers GitHub...
git push origin main

echo.
echo ✅ Déploiement déclenché !
echo.
echo 🌐 Votre application sera disponible sur Netlify dans quelques minutes
echo 📊 Vérifiez les logs de déploiement sur Netlify
echo.
echo 🔑 N'oubliez pas de configurer les variables d'environnement dans Netlify:
echo    VITE_SUPABASE_URL=https://your-project.supabase.co
echo    VITE_SUPABASE_ANON_KEY=your-anon-key-here
echo    VITE_USE_SUPABASE=true
echo    VITE_USE_MOCK_DATA=false
echo.
pause
