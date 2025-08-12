@echo off
echo 🚀 Push automatique sur la branche Cursor

REM Sauvegarde de la branche courante
for /f "tokens=*" %%b in ('git branch --show-current') do set CURRENT_BRANCH=%%b

echo 📥 Pull des dernières modifications de main...
git fetch --prune
if %errorlevel% neq 0 goto :error

REM Stage et commit
echo 📝 Stage et commit des changements...
git add -A
if %errorlevel% neq 0 goto :error

git commit -m "chore(cursor): auto-push from script" || echo Rien à committer

REM Créer/met à jour la branche Cursor
echo 🔄 Création/mise à jour de la branche Cursor...
git checkout -B Cursor
if %errorlevel% neq 0 goto :error

echo 📤 Pull des dernières modifications de main dans Cursor...
git pull origin main --no-edit
if %errorlevel% neq 0 goto :error

echo 🚀 Push sur la branche Cursor...
git push -u origin Cursor
if %errorlevel% neq 0 goto :error

echo ✅ Push Cursor terminé avec succès

echo 🔁 Retour sur la branche d'origine: %CURRENT_BRANCH%
if not "%CURRENT_BRANCH%"=="" git checkout %CURRENT_BRANCH%
exit /b 0

:error
echo ❌ Une erreur est survenue.
exit /b 1
