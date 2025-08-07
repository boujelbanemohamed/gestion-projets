@echo off
echo 🔧 Démarrage du backend fonctionnel...

cd backend

echo.
echo 🛑 Arrêt de tous les processus sur le port 3000...
npx kill-port 3000 2>nul

echo.
echo ⏳ Attente de 3 secondes...
timeout /t 3 /nobreak > nul

echo.
echo 📦 Vérification des dépendances...
if not exist node_modules (
    echo Installation des dépendances...
    npm install
)

echo.
echo 🚀 Démarrage du serveur de remplacement...
echo.
echo ✅ Ce serveur remplace temporairement le serveur TypeScript
echo ✅ Il contient toutes les routes nécessaires pour l'application
echo ✅ Comptes de test disponibles :
echo    - marie.dupont@example.com / password123 (SUPER_ADMIN)
echo    - pierre.martin@example.com / password123 (ADMIN)
echo.

node server-working.js
