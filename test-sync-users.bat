@echo off
echo 🧪 Test de synchronisation des utilisateurs Supabase
echo.

echo 📋 Vérification des dépendances...
if not exist "node_modules" (
    echo ❌ node_modules non trouvé
    echo 📦 Installation des dépendances...
    npm install @supabase/supabase-js
) else (
    echo ✅ Dépendances trouvées
)

echo.
echo 🚀 Exécution du test de synchronisation...
node test-sync-users.js

echo.
echo ✅ Test terminé !
pause
