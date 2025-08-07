@echo off
echo 🧹 Nettoyage complet et redémarrage...

echo.
echo 🛑 Arrêt de tous les processus sur les ports 3000 et 3001...
npx kill-port 3000 2>nul
npx kill-port 3001 2>nul

echo.
echo ⏳ Attente de 5 secondes pour libérer les ports...
timeout /t 5 /nobreak > nul

echo.
echo 📍 Navigation vers le dossier backend...
cd backend

echo.
echo 🚀 Démarrage du serveur ultra-simple sur le port 3001...
echo.
echo ✅ Le serveur va démarrer sur http://localhost:3001
echo ✅ L'application frontend est configurée pour ce port
echo.

node server-ultra-simple.js
