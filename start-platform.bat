@echo off
echo 🚀 Démarrage de la Plateforme de Gestion de Projets
echo.

echo 🛑 Arrêt des processus existants...
npx kill-port 3000 2>nul
npx kill-port 5173 2>nul
npx kill-port 8002 2>nul

echo.
echo ⏳ Attente de 3 secondes...
timeout /t 3 /nobreak > nul

echo.
echo 🔧 Démarrage du Backend...
cd backend
start "Backend API" cmd /k "npm run dev"

echo.
echo ⏳ Attente du démarrage du backend (8 secondes)...
timeout /t 8 /nobreak > nul

echo.
echo 🎨 Démarrage du Frontend...
cd ..
start "Frontend React" cmd /k "npm run dev"

echo.
echo ✅ Plateforme démarrée avec succès !
echo.
echo 🌐 URLs disponibles:
echo    - Frontend: http://localhost:5173 ou http://localhost:8002
echo    - Backend API: http://localhost:3000/api
echo    - Test Backend: http://localhost:3000/api/test
echo    - Santé Backend: http://localhost:3000/api/health
echo.
echo 📧 Comptes de test:
echo    - marie.dupont@example.com / password123 (SUPER_ADMIN)
echo    - pierre.martin@example.com / password123 (ADMIN)
echo.
echo 🎯 Fonctionnalités disponibles:
echo    ✅ Gestion des projets
echo    ✅ Gestion des tâches
echo    ✅ PV de réunion avec filtrage par projet
echo    ✅ Dashboard avec statistiques
echo    ✅ Gestion des utilisateurs et départements
echo.
echo ⚠️ Notes importantes:
echo    - Gardez les deux fenêtres de terminal ouvertes
echo    - Le backend utilise un fichier JSON pour la persistance
echo    - Les données sont sauvegardées automatiquement
echo.
pause
