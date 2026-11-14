#!/usr/bin/env bash
# ==============================================================================
# Technozi AI Co-Pilot — Watchdog & Auto-Guérison WhatsApp
# Surveillance automatique du conteneur Evolution API et de la session Baileys
# ==============================================================================

LOG_FILE="/var/log/technozi_watchdog.log"
API_KEY="technozi_evolution_key_2026"
BASE_URL="https://bot.technozi-ht.com/evolution"
CONTAINER_NAME="deploy-evolution-api-1"

# Fonction d'écriture horodatée dans le log
log_msg() {
    local LEVEL="$1"
    local MSG="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$LEVEL] $MSG" >> "$LOG_FILE"
}

# 1. Vérification de l'état de connexion HTTP
HTTP_CODE=$(curl -k -s -o /tmp/technozi_state.json -w "%{http_code}" --max-time 10 "$BASE_URL/instance/connectionState/technozi" -H "apikey: $API_KEY" 2>/dev/null)

if [ "$HTTP_CODE" != "200" ]; then
    log_msg "WARN" "Evolution API HTTP $HTTP_CODE (non réactif). Tentative de relance du conteneur..."
    docker restart "$CONTAINER_NAME" > /dev/null 2>&1
    exit 0
fi

STATE=$(grep -o '"state":"[^"]*"' /tmp/technozi_state.json 2>/dev/null | head -n 1 | cut -d':' -f2 | tr -d '"')

# 2. Si la session n'est pas "open" (ex: "close", "connecting", etc.)
if [ "$STATE" != "open" ]; then
    log_msg "WARN" "Session WhatsApp 'technozi' à l'état '$STATE'. Tentative de reconnexion douce..."
    curl -k -s --max-time 15 "$BASE_URL/instance/connect/technozi" -H "apikey: $API_KEY" > /dev/null 2>&1
    sleep 8
    
    # Re-vérification après reconnexion douce
    CHECK_AGAIN=$(curl -k -s --max-time 10 "$BASE_URL/instance/connectionState/technozi" -H "apikey: $API_KEY" 2>/dev/null)
    NEW_STATE=$(echo "$CHECK_AGAIN" | grep -o '"state":"[^"]*"' | head -n 1 | cut -d':' -f2 | tr -d '"')
    
    if [ "$NEW_STATE" != "open" ]; then
        log_msg "CRIT" "Reconnexion douce échouée (toujours '$NEW_STATE'). Auto-restart du conteneur..."
        docker restart "$CONTAINER_NAME" > /dev/null 2>&1
        exit 0
    else
        log_msg "INFO" "Reconnexion douce réussie (état rétabli à 'open')."
    fi
fi

# 3. Détection des corruptions de flux Baileys / Signal pre-keys dans les logs récents (dernières 3 minutes)
FATAL_ERRORS=$(docker logs --since 3m "$CONTAINER_NAME" 2>&1 | grep -E "preKeyId|Stream Errored \(bad-mac\)|Stream Errored \(conflict\)|Stream Errored \(connection-lost\)")

if [ -n "$FATAL_ERRORS" ]; then
    log_msg "CRIT" "Corruption cryptographique ou erreur de flux détectée dans les logs Baileys. Auto-restart préventif..."
    docker restart "$CONTAINER_NAME" > /dev/null 2>&1
    exit 0
fi

# 4. Rotation automatique du fichier de log pour ne jamais saturer le disque (max 1000 lignes)
if [ -f "$LOG_FILE" ] && [ $(wc -l < "$LOG_FILE") -gt 1000 ]; then
    tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

exit 0
