@echo off
echo 🔧 Correction de la synchronisation des utilisateurs
echo.

echo 📋 Instructions de correction :
echo.
echo 1. Exécuter le script SQL dans Supabase Dashboard
echo 2. Exécuter le script Node.js pour corriger les métadonnées
echo 3. Tester la connexion
echo.

echo 🚀 Étape 1 : Script SQL
echo.
echo Allez sur votre dashboard Supabase : https://supabase.com/dashboard
echo Sélectionnez votre projet : obdadipsbbrlwetkuyui
echo Cliquez sur "SQL Editor" dans le menu de gauche
echo Copiez le contenu du fichier fix-user-roles.sql
echo Collez-le dans l'éditeur SQL
echo Cliquez sur "Run" pour exécuter le script
echo.
echo Ce script va :
echo    - Corriger les rôles 'UTILISATEUR' vers 'USER'
echo    - Créer un trigger de synchronisation automatique
echo    - Vérifier les incohérences
echo.
pause

echo.
echo 🚀 Étape 2 : Correction des métadonnées auth.users
echo.

echo 📋 Vérification des dépendances...
if not exist "node_modules" (
    echo ❌ node_modules non trouvé
    echo 📦 Installation des dépendances...
    npm install @supabase/supabase-js
) else (
    echo ✅ Dépendances trouvées
)

echo.
echo 🔧 Exécution de la correction des métadonnées...
node fix-auth-metadata.js

echo.
echo ✅ Correction terminée !
echo.
echo 🧪 Étape 3 : Test de connexion
echo.
echo Maintenant, testez la connexion dans votre application :
echo 1. Ouvrez votre application
echo 2. Essayez de vous connecter
echo 3. Vérifiez que l'erreur 400 a disparu
echo 4. Vérifiez que les rôles sont correctement affichés
echo.
echo Si le problème persiste, utilisez le bouton "Synchroniser les utilisateurs"
echo dans la section "Gestion des membres" de votre application.
echo.
pause
