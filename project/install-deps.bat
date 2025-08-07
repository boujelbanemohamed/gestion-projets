@echo off
echo 📦 Installation des dépendances manquantes...

cd backend

echo.
echo 🔍 Vérification des dépendances...
npm list jsonwebtoken > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ jsonwebtoken manquant, installation...
    npm install jsonwebtoken
) else (
    echo ✅ jsonwebtoken déjà installé
)

npm list cors > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ cors manquant, installation...
    npm install cors
) else (
    echo ✅ cors déjà installé
)

npm list express > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ express manquant, installation...
    npm install express
) else (
    echo ✅ express déjà installé
)

echo.
echo ✅ Toutes les dépendances sont installées !
echo.
echo 🚀 Démarrage du serveur...
node server-working.js
