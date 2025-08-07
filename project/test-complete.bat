@echo off
echo 🧪 Test complet de l'application...

echo.
echo 🛑 Arrêt de tous les serveurs...
npx kill-port 3000 2>nul
npx kill-port 5173 2>nul

echo.
echo ⏳ Attente de 3 secondes...
timeout /t 3 /nobreak > nul

echo.
echo 🚀 Démarrage du backend...
cd backend
start "Backend Working" cmd /k "node server-working.js"

echo.
echo ⏳ Attente du démarrage du backend (8 secondes)...
timeout /t 8 /nobreak > nul

echo.
echo 🎨 Démarrage du frontend...
cd ..
start "Frontend" cmd /k "npm run dev"

echo.
echo ✅ Application démarrée !
echo.
echo 🌐 URLs:
echo    - Frontend: http://localhost:5173
echo    - Backend Test: http://localhost:3000/api/test
echo    - Backend Health: http://localhost:3000/api/health
echo.
echo 📧 Comptes de test:
echo    - marie.dupont@example.com / password123 (SUPER_ADMIN)
echo    - pierre.martin@example.com / password123 (ADMIN)
echo.
echo 🧪 Tests à effectuer:
echo    1. Ouvrir http://localhost:5173
echo    2. Se connecter avec un compte de test
echo    3. Aller sur "PV de Réunion" (bouton violet)
echo    4. Cliquer "Ajouter un PV"
echo    5. Vérifier que les projets s'affichent
echo    6. Créer un PV de test
echo.
echo ⚠️ Si vous voyez encore "Backend non disponible":
echo    Attendez quelques secondes que le serveur termine son démarrage
echo.
pause
