Write-Host "🚀 Démarrage du serveur ultra-simple..." -ForegroundColor Green

# Aller dans le dossier backend
Set-Location backend

# Vérifier que le fichier existe
if (Test-Path "server-ultra-simple.js") {
    Write-Host "✅ Fichier trouvé, démarrage du serveur..." -ForegroundColor Green
    node server-ultra-simple.js
} else {
    Write-Host "❌ Fichier server-ultra-simple.js non trouvé" -ForegroundColor Red
    Write-Host "📍 Répertoire actuel: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "📁 Fichiers disponibles:" -ForegroundColor Yellow
    Get-ChildItem *.js | Select-Object Name
}
