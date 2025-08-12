@echo off
echo 🧪 Test de Déploiement - GestionProjet
echo.

echo 📋 État actuel:
echo ✅ Repository GitHub: boujelbanemohamed/gestion-projets
echo ✅ Site Netlify: https://clinquant-croissant-1fa49a.netlify.app/
echo ✅ Supabase: https://obdadipsbbrlwetkuyui.supabase.co
echo.

echo 🏗️ Test de build local...
call npm run build
if %errorlevel% equ 0 (
    echo ✅ Build local réussi
) else (
    echo ❌ Erreur de build local
)

echo.
echo 🌐 Test de l'application en production...
echo URL: https://clinquant-croissant-1fa49a.netlify.app/
echo.

echo 📊 Vérification des variables d'environnement Netlify...
echo Les variables suivantes doivent être configurées dans Netlify:
echo.
echo VITE_SUPABASE_URL=https://obdadipsbbrlwetkuyui.supabase.co
echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODgxMjMsImV4cCI6MjA3MDA2NDEyM30.jracnTOp7Y0QBTbt7qjY4076aBqh3pq7DR-rU_U33fo
echo VITE_USE_SUPABASE=true
echo VITE_USE_MOCK_DATA=false
echo.

echo 🎯 Actions à effectuer:
echo 1. Allez sur https://app.netlify.com
echo 2. Sélectionnez votre site: clinquant-croissant-1fa49a
echo 3. Allez dans Site settings > Environment variables
echo 4. Ajoutez les 4 variables ci-dessus
echo 5. Redéployez le site
echo.

echo 🔗 Testez votre application:
echo https://clinquant-croissant-1fa49a.netlify.app/
echo.

pause
