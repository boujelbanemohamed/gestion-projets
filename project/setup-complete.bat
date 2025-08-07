@echo off
echo 🚀 Configuration complète du projet...

echo.
echo 📊 Étape 1: Vérification de PostgreSQL...
pg_isready -h localhost -p 5432 > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ PostgreSQL est accessible
) else (
    echo ❌ PostgreSQL n'est pas accessible
    echo.
    echo 🔧 Solutions possibles:
    echo 1. Installer PostgreSQL: https://www.postgresql.org/download/
    echo 2. Démarrer le service PostgreSQL
    echo 3. Utiliser Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
    echo.
    echo ⚠️ Le projet nécessite PostgreSQL pour fonctionner.
    echo Voulez-vous continuer avec SQLite à la place ? (o/n)
    set /p choice=
    if /i "%choice%"=="o" (
        echo 🔄 Configuration pour SQLite...
        goto sqlite_setup
    ) else (
        echo ❌ Configuration annulée. Installez PostgreSQL et relancez ce script.
        pause
        exit /b 1
    )
)

:postgres_setup
echo.
echo 📊 Étape 2: Configuration PostgreSQL...
cd backend

echo   📦 Installation des dépendances...
call npm install

echo   🗄️ Création de la base de données...
createdb -h localhost -U postgres project_management 2>nul
if %errorlevel% == 0 (
    echo ✅ Base de données créée
) else (
    echo ⚠️ Base de données existe déjà ou erreur de création
)

echo   📋 Exécution des migrations...
call npx knex migrate:latest
call node run-migration.js

echo   🌱 Insertion des données de test...
call npx knex seed:run

goto start_servers

:sqlite_setup
echo.
echo 📊 Étape 2: Configuration SQLite...
cd backend

echo   📝 Modification de la configuration pour SQLite...
echo module.exports = { > knexfile.js
echo   development: { >> knexfile.js
echo     client: 'sqlite3', >> knexfile.js
echo     connection: { filename: './dev.sqlite3' }, >> knexfile.js
echo     useNullAsDefault: true, >> knexfile.js
echo     migrations: { directory: './migrations' }, >> knexfile.js
echo     seeds: { directory: './seeds' } >> knexfile.js
echo   } >> knexfile.js
echo }; >> knexfile.js

echo   📦 Installation des dépendances SQLite...
call npm install sqlite3

echo   📋 Exécution des migrations...
call npx knex migrate:latest
call node run-migration.js

echo   🌱 Insertion des données de test...
call npx knex seed:run

:start_servers
echo.
echo 🔧 Étape 3: Démarrage des serveurs...
echo   🔧 Démarrage du backend...
start "Backend Server" cmd /k "npm run dev"

echo   ⏳ Attente du démarrage du backend (10 secondes)...
timeout /t 10 /nobreak > nul

echo   🎨 Démarrage du frontend...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Configuration terminée !
echo.
echo 🌐 URLs de test:
echo    - Frontend: http://localhost:5173
echo    - Backend Test: http://localhost:3000/api/projects/test
echo    - API Projets: http://localhost:3000/api/projects/all
echo.
echo 📧 Comptes de test:
echo    - marie.dupont@example.com / password123 (SUPER_ADMIN)
echo    - pierre.martin@example.com / password123 (ADMIN)
echo.
echo 🧪 Pour tester: Ouvrez http://localhost:3000/api/projects/test
echo    Si vous voyez du JSON, le backend fonctionne !
echo.
pause
