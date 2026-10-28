# Lanceur de tunnel ngrok pour exposer n8n vers l'extérieur (Meta WhatsApp Cloud API)
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
$ngrok = Join-Path $projectRoot "tools\ngrok.exe"
if (-not (Test-Path $ngrok)) {
    $ngrok = Join-Path $projectRoot "ngrok.exe"
}

if (-not (Test-Path $ngrok)) {
    Write-Host "[ERREUR] ngrok.exe introuvable dans tools\ngrok.exe ni dans ngrok.exe" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Ouverture du Tunnel HTTPS ngrok vers n8n (Port 5678)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

& $ngrok http 5678
