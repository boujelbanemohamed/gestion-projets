@echo off
echo 🚀 Déploiement du schéma Supabase mis à jour
echo.

echo 📋 Instructions de déploiement :
echo.
echo 1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard
echo 2. Sélectionnez votre projet : obdadipsbbrlwetkuyui
echo 3. Cliquez sur "SQL Editor" dans le menu de gauche
echo 4. Copiez le contenu du fichier supabase-schema.sql
echo 5. Collez-le dans l'éditeur SQL
echo 6. Cliquez sur "Run" pour exécuter le script
echo.
echo ✅ Ce script va :
echo    - Créer les tables si elles n'existent pas
echo    - Ajouter les policies RLS nécessaires
echo    - Créer le trigger de synchronisation automatique
echo    - Insérer les données de test (départements)
echo.
echo ⚠️  ATTENTION : Ce script est idempotent (peut être exécuté plusieurs fois)
echo.

echo 📁 Fichier du schéma : supabase-schema.sql
echo.
echo 🔍 Vérifiez que le fichier contient bien :
echo    - Les tables : departments, users, projects, tasks, etc.
echo    - Les policies RLS pour users
echo    - Le trigger handle_new_user
echo    - Les données de test
echo.

pause
echo.
echo 🎯 Après avoir exécuté le script SQL :
echo    1. Testez la création d'un membre dans l'interface
echo    2. Vérifiez qu'il peut se connecter
echo    3. Utilisez le bouton "Synchroniser les utilisateurs" si nécessaire
echo.
echo ✅ Déploiement terminé !
pause
