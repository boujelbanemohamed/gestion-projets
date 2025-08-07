@echo off
echo 🚀 Démarrage de l'application de gestion de projet...

echo.
echo 📊 Étape 1: Migration de la base de données...
cd backend
node run-migration.js

echo.
echo 🔧 Étape 2: Démarrage du backend...
start "Backend Server" cmd /k "npm run dev"

echo.
echo ⏳ Attente du démarrage du backend (5 secondes)...
timeout /t 5 /nobreak > nul

echo.
echo 🎨 Étape 3: Démarrage du frontend...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Application démarrée !
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3000
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause > nul
