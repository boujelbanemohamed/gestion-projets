@echo off
echo 🔍 Diagnostic complet du backend...

echo.
echo 📡 Test 1: Vérification du port 3000...
netstat -an | findstr :3000 > nul
if %errorlevel% == 0 (
    echo ✅ Port 3000 est utilisé
    netstat -an | findstr :3000
) else (
    echo ❌ Port 3000 n'est pas utilisé
    echo    Le backend n'est probablement pas démarré
)

echo.
echo 📡 Test 2: Test de connectivité HTTP...
curl -s http://localhost:3000/api/test > temp_response.txt 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend accessible
    echo Réponse:
    type temp_response.txt
) else (
    echo ❌ Backend non accessible
    echo Erreur:
    type temp_response.txt
)

echo.
echo 📡 Test 3: Test de l'API projets...
curl -s http://localhost:3000/api/projects/test > temp_response2.txt 2>&1
if %errorlevel% == 0 (
    echo ✅ API projets accessible
    echo Réponse:
    type temp_response2.txt
) else (
    echo ❌ API projets non accessible
    echo Erreur:
    type temp_response2.txt
)

echo.
echo 📡 Test 4: Test de l'API PV de réunion...
curl -s http://localhost:3000/api/meeting-minutes > temp_response3.txt 2>&1
if %errorlevel% == 0 (
    echo ✅ API PV accessible (peut nécessiter authentification)
    echo Réponse:
    type temp_response3.txt
) else (
    echo ❌ API PV non accessible
    echo Erreur:
    type temp_response3.txt
)

echo.
echo 🔧 Solutions possibles:
echo 1. Si port 3000 non utilisé: Démarrez le backend avec "npm run dev"
echo 2. Si backend non accessible: Vérifiez les erreurs dans le terminal
echo 3. Si API non accessible: Problème de configuration des routes
echo.

del temp_response.txt temp_response2.txt temp_response3.txt 2>nul

pause
