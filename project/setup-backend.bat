@echo off
echo 🚀 Configuration complète du backend...

cd backend

echo.
echo 📦 Installation des dépendances...
npm install

echo.
echo 📊 Exécution de la migration PV de réunion...
node run-migration.js

echo.
echo 🌱 Insertion des données de test...
npx knex seed:run

echo.
echo ✅ Backend configuré avec succès !
echo.
echo 📧 Comptes de test disponibles :
echo    - marie.dupont@example.com (SUPER_ADMIN)
echo    - pierre.martin@example.com (ADMIN)  
echo    - sophie.lemoine@example.com (UTILISATEUR)
echo    - jean.moreau@example.com (UTILISATEUR)
echo    - alice.rousseau@example.com (UTILISATEUR)
echo 🔑 Mot de passe pour tous : password123
echo.
echo 🔧 Pour démarrer le serveur : npm run dev
echo.
pause
