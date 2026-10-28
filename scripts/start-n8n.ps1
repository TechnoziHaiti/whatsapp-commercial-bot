# Script de démarrage local de n8n avec persistance dans le dossier du projet
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Lancement de n8n - WhatsApp Commercial Bot (Technozi)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Définir le dossier de persistance locale dans le projet
$env:N8N_USER_FOLDER = Join-Path $projectRoot ".n8n"
$env:N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS = "false"

# Charger le fichier .env si présent
$envFile = Join-Path $projectRoot ".env"
if (Test-Path $envFile) {
    Write-Host "[OK] Fichier .env détecté et chargé." -ForegroundColor Green
    Get-Content $envFile | Where-Object { $_ -match '^\s*([^#][^=]+)=(.*)$' } | ForEach-Object {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value, [System.EnvironmentVariableTarget]::Process)
    }
} else {
    Write-Host "[ATTENTION] Aucun fichier .env trouvé. Copiez .env.example vers .env." -ForegroundColor Yellow
}

Write-Host "Persistance des données configurée dans : $($env:N8N_USER_FOLDER)" -ForegroundColor Gray
Write-Host "Démarrage de n8n sur http://localhost:5678 ..." -ForegroundColor Green

& n8n start
