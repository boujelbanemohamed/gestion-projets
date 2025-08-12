@echo off
echo 🔄 Synchronisation avec la branche main

echo 📥 Fetch des dernières modifications...
git fetch --prune
if %errorlevel% neq 0 goto :error

echo 🔄 Pull des dernières modifications de main...
git pull origin main --no-edit
if %errorlevel% neq 0 goto :error

echo ✅ Synchronisation terminée avec succès
echo 📊 État actuel:
git status --short
echo.
echo 🌿 Branche actuelle:
git branch --show-current
echo.
echo 📈 Derniers commits:
git log --oneline -5
echo.
pause
exit /b 0

:error
echo ❌ Une erreur est survenue lors de la synchronisation.
pause
exit /b 1
