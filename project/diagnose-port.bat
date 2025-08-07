@echo off
echo 🔍 Diagnostic des ports...

echo.
echo 📡 Vérification du port 3000...
netstat -ano | findstr :3000
if %errorlevel% == 0 (
    echo ✅ Port 3000 est utilisé par un processus
    echo.
    echo 🔧 Pour libérer le port, vous pouvez :
    echo 1. Arrêter le processus avec Ctrl+C dans le terminal
    echo 2. Ou utiliser: npx kill-port 3000
) else (
    echo ❌ Port 3000 n'est pas utilisé
    echo    Le serveur n'est probablement pas démarré
)

echo.
echo 📡 Vérification des autres ports Node.js...
netstat -ano | findstr node
if %errorlevel% == 0 (
    echo ✅ Processus Node.js détectés
) else (
    echo ❌ Aucun processus Node.js détecté
)

echo.
echo 📡 Test de connectivité localhost...
ping -n 1 localhost > nul
if %errorlevel% == 0 (
    echo ✅ Localhost accessible
) else (
    echo ❌ Problème avec localhost
)

echo.
pause
