#!/bin/bash
set -e

echo "=========================================================="
echo "  🚀 Installation Automatisée de n8n pour Technozi Haïti"
echo "=========================================================="

# Mise à jour système
sudo apt-get update && sudo apt-get upgrade -y

# Installation de Docker et Docker Compose
if ! command -v docker &> /dev/null; then
    echo "📦 Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

echo "🚀 Lancement des conteneurs n8n et Caddy (SSL HTTPS)..."
cd "$(dirname "$0")"
docker compose up -d

echo ""
echo "=========================================================="
echo "  🎉 SERVEUR N8N EN LIGNE AVEC SUCCÈS !"
echo "=========================================================="
echo "🌐 URL d'accès sécurisé : https://bot.technozi-ht.com"
echo "=========================================================="
