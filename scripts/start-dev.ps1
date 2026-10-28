# Lanceur tout-en-un pour n8n et le tunnel ngrok
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
node ./scripts/start-all.js
