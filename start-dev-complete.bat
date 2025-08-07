@echo off
echo 🚀 Démarrage complet de l'application...

echo.
echo 📊 Étape 1: Configuration du backend...
cd backend

echo   📦 Installation des dépendances...
call npm install

echo   🗄️ Migration de la base de données...
call node run-migration.js

echo   🌱 Insertion des données de test...
call npx knex seed:run

echo.
echo 🔧 Étape 2: Démarrage du backend...
start "Backend Server" cmd /k "npm run dev"

echo.
echo ⏳ Attente du démarrage du backend (8 secondes)...
timeout /t 8 /nobreak > nul

echo.
echo 🎨 Étape 3: Démarrage du frontend...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Application démarrée !
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3000
echo 📧 Comptes de test :
echo    - marie.dupont@example.com (SUPER_ADMIN)
echo    - pierre.martin@example.com (ADMIN)
echo    - sophie.lemoine@example.com (UTILISATEUR)
echo 🔑 Mot de passe : password123
echo.
echo ⚠️ Si vous voyez "Backend non disponible", attendez quelques secondes
echo    que le serveur backend termine son démarrage.
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause > nul
