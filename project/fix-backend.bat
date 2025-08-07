@echo off
echo 🔧 Correction du backend...

cd backend

echo.
echo 📦 Installation de SQLite3...
npm install sqlite3

echo.
echo 🗄️ Configuration de la base de données SQLite...
copy knexfile-sqlite.js knexfile.js

echo.
echo 📋 Exécution des migrations...
npx knex migrate:latest

echo.
echo 🚀 Exécution de la migration PV...
node run-migration.js

echo.
echo 🌱 Insertion des données de test...
npx knex seed:run

echo.
echo ✅ Backend configuré avec SQLite !
echo.
echo 🔧 Démarrage du serveur...
npm run dev
