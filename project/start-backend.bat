@echo off
echo 🚀 Démarrage du backend...

cd backend

echo.
echo 📊 Vérification de la migration PV de réunion...
node run-migration.js

echo.
echo 🔧 Démarrage du serveur...
npm run dev
