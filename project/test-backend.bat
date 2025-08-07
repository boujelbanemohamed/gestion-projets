@echo off
echo 🔍 Test de connectivité du backend...

echo.
echo 📡 Test 1: Vérification du serveur principal...
curl -s http://localhost:3000/api/projects/all > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend accessible sur http://localhost:3000
) else (
    echo ❌ Backend non accessible sur http://localhost:3000
    echo    Solution: Démarrez le backend avec 'npm run dev' dans le dossier backend
)

echo.
echo 📡 Test 2: Vérification des PV de réunion...
curl -s http://localhost:3000/api/meeting-minutes > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ API PV de réunion fonctionnelle
) else (
    echo ❌ API PV de réunion non accessible
    echo    Solution: Exécutez la migration avec 'node run-migration.js'
)

echo.
echo 🌐 URLs de test:
echo    - Projets: http://localhost:3000/api/projects/all
echo    - PV: http://localhost:3000/api/meeting-minutes
echo    - Frontend: http://localhost:5173
echo.
pause
