@echo off
echo 🔍 Vérification de l'état du déploiement - GestionProjet
echo.

echo 📋 Vérification Git...
git status --porcelain
if %errorlevel% equ 0 (
    echo ✅ Repository Git configuré
    git remote -v
) else (
    echo ❌ Problème avec Git
)

echo.
echo 📦 Vérification des dépendances...
if exist node_modules (
    echo ✅ Dossier node_modules présent
) else (
    echo ❌ Dossier node_modules manquant - exécutez: npm install
)

echo.
echo 🏗️ Test de build...
call npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Build réussi
) else (
    echo ❌ Erreur de build
)

echo.
echo 🔑 Vérification des variables d'environnement...
if exist .env.local (
    echo ✅ Fichier .env.local présent
    echo 📝 Contenu (sans les clés sensibles):
    findstr /V "ANON_KEY" .env.local
) else (
    echo ❌ Fichier .env.local manquant
    echo 💡 Copiez env.example vers .env.local
)

echo.
echo 🌐 Vérification de la configuration Netlify...
if exist netlify.toml (
    echo ✅ Fichier netlify.toml présent
) else (
    echo ❌ Fichier netlify.toml manquant
)

echo.
echo 📊 Vérification de la configuration Supabase...
if exist src/lib/supabase.ts (
    echo ✅ Configuration Supabase présente
) else (
    echo ❌ Configuration Supabase manquante
)

echo.
echo 🎯 Résumé de l'état:
echo.
echo 📋 Prochaines actions recommandées:
echo    1. Créez un repository GitHub si pas encore fait
echo    2. Créez un projet Supabase et récupérez vos clés
echo    3. Modifiez .env.local avec vos vraies clés Supabase
echo    4. Connectez votre repository à Netlify
echo    5. Configurez les variables d'environnement dans Netlify
echo.
echo 📖 Guide complet: deploy-setup.md
echo.
pause
