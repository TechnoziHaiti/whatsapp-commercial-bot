const fs = require('fs');
const path = require('path');

// Identifiants & Configuration
// Pour dépôt public : placeholder sécurisé (la vraie clé reste dans le .env secret et n8n)
const GEMINI_API_KEY = 'VOTRE_CLE_GEMINI_ICI';
const EVOLUTION_API_KEY = 'technozi_evolution_key_2026';
const DEVELOPER_EMAIL = 'pitonrodjy@gmail.com';
const CONNECT_PIN = '3703';

const workflow = {
  name: "Technozi AI Co-Pilot v2 (Gemini + Evolution)",
  nodes: [
    // -------------------------------------------------------------------------
    // 1. PAGE WEB D'AUTO-CONNEXION QR CODE (GET /webhook/connect)
    // -------------------------------------------------------------------------
    {
      parameters: {
        httpMethod: "GET",
        path: "connect",
        responseMode: "responseNode",
        options: {}
      },
      id: "webhook-qr",
      name: "Page Web QR Code (GET)",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [200, 160],
      webhookId: "connect"
    },
    {
      parameters: {
        method: "GET",
        url: "http://evolution-api:8080/instance/connect/technozi",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "apikey", value: EVOLUTION_API_KEY }
          ]
        },
        options: {
          timeout: 10000
        }
      },
      id: "fetch-qr",
      name: "Récupérer QR Evolution",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [440, 160],
      continueOnFail: true
    },
    {
      parameters: {
        respondWith: "text",
        responseBody: `={{
          (() => {
            const data = $json;

            // Récupérer le code PIN soumis dans la requête URL ou le formulaire
            let reqQuery = {};
            for (const name of ['Page Web QR Code (GET)', 'Page Web QR Code (GET)1', 'Page Web QR Code (GET)2', 'webhook-qr']) {
              try {
                const item = $(name).item;
                if (item && item.json && item.json.query) {
                  reqQuery = item.json.query;
                  break;
                }
              } catch (e) {}
            }

            const inputPin = ((reqQuery && (reqQuery.pin || reqQuery.key || reqQuery.token)) || "").toString().trim();
            const validPins = ["${CONNECT_PIN}", "technozi2026", "37030009"];
            const isAuthorized = validPins.includes(inputPin);

            // 1. ÉCRAN DE VERROUILLAGE SÉCURISÉ (SI CODE PIN ABSENT OU INCORRECT)
            if (!isAuthorized) {
              const hasAttempted = Boolean(inputPin);
              return \`<!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Accès Sécurisé - Technozi WhatsApp</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0b141a; color: #e9edef; text-align: center; }
                  .card { background: #111b21; padding: 35px 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #222d34; max-width: 380px; width: 90%; }
                  .lock-icon { font-size: 48px; margin-bottom: 12px; }
                  h1 { color: #00a884; font-size: 20px; margin: 0 0 8px 0; }
                  p { color: #8696a0; font-size: 14px; margin: 0 0 20px 0; line-height: 1.4; }
                  input[type="password"] { width: 80%; padding: 12px 14px; border-radius: 10px; border: 1px solid #2a3942; background: #182229; color: #e9edef; font-size: 18px; text-align: center; letter-spacing: 2px; margin-bottom: 15px; outline: none; }
                  input[type="password"]:focus { border-color: #00a884; }
                  button { background: #00a884; color: #111b21; border: none; font-weight: bold; font-size: 15px; padding: 12px 24px; border-radius: 10px; cursor: pointer; width: 88%; }
                  button:hover { background: #06cf9c; }
                  .error-msg { background: rgba(241, 92, 109, 0.15); border: 1px solid #f15c6d; color: #f15c6d; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; }
                  .footer { font-size: 12px; color: #667781; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="lock-icon">🔒</div>
                  <h1>Accès Sécurisé Technozi</h1>
                  <p>Cette page est strictement réservée à l'administrateur Technozi pour associer le WhatsApp officiel.</p>
                  \${hasAttempted ? '<div class="error-msg">⚠️ Code secret ou PIN incorrect. Accès refusé.</div>' : ''}
                  <form method="GET" action="/webhook/connect">
                    <input type="password" name="pin" placeholder="Entrez le code PIN" autocomplete="off" autofocus required>
                    <br>
                    <button type="submit">Déverrouiller le QR Code</button>
                  </form>
                  <div class="footer">Technozi Haïti · Sécurité Administrateur</div>
                </div>
              </body>
              </html>\`;
            }

            // 2. ACCÈS AUTORISÉ : AFFICHER LE QR CODE OU LE STATUT CONNECTÉ
            const b64 = data?.base64 || data?.qrcode?.base64 || "";
            const isConnected = data?.instance?.status === "open" || data?.instance?.state === "open" || data?.status === "open" || data?.state === "open";
            const safePinParam = encodeURIComponent(inputPin);

            if (isConnected) {
              const owner = data?.instance?.ownerJid || data?.instance?.wuid || "";
              const phoneDisplay = owner ? (" (+" + owner.replace(/[^0-9]/g, "") + ")") : "";
              return \`<!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Technozi WhatsApp - Connecté</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b141a; color: #e9edef; text-align: center; }
                  .card { background: #111b21; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #222d34; max-width: 420px; }
                  .badge { font-size: 50px; margin-bottom: 10px; }
                  h1 { color: #00a884; font-size: 22px; margin: 0 0 10px 0; }
                  p { color: #8696a0; font-size: 15px; line-height: 1.5; margin: 0; }
                  .logout-btn { display: inline-block; margin-top: 20px; color: #8696a0; font-size: 13px; text-decoration: none; border: 1px solid #222d34; padding: 6px 14px; border-radius: 8px; }
                  .logout-btn:hover { color: #e9edef; border-color: #8696a0; }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="badge">✅</div>
                  <h1>WhatsApp Technozi est Connecté !</h1>
                  <p>L'assistant IA est en ligne et surveille vos messages 24h/24\${phoneDisplay}.<br><br>Vous pouvez discuter normalement depuis votre téléphone.</p>
                  <a href="/webhook/connect" class="logout-btn">🔒 Verrouiller la page</a>
                </div>
              </body>
              </html>\`;
            }

            if (!b64) {
              return \`<!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta http-equiv="refresh" content="5;url=/webhook/connect?pin=\${safePinParam}">
                <title>Initialisation...</title>
                <style>
                  body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b141a; color: #e9edef; text-align: center; }
                  .card { background: #111b21; padding: 30px; border-radius: 16px; border: 1px solid #222d34; }
                  h2 { color: #f15c6d; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h2>⏳ Préparation du QR Code...</h2>
                  <p style="color:#8696a0;">Génération de la session en cours. La page s'actualise dans 5 secondes...</p>
                </div>
              </body>
              </html>\`;
            }

            return \`<!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta http-equiv="refresh" content="12;url=/webhook/connect?pin=\${safePinParam}">
              <title>Scanner WhatsApp - Technozi</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0b141a; color: #e9edef; text-align: center; }
                .card { background: #111b21; padding: 35px 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #222d34; max-width: 380px; width: 90%; }
                h1 { color: #00a884; font-size: 20px; margin: 0 0 8px 0; }
                p { color: #8696a0; font-size: 14px; margin: 0 0 20px 0; line-height: 1.4; }
                .qr-box { background: white; padding: 14px; border-radius: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
                img { width: 250px; height: 250px; display: block; }
                .steps { text-align: left; background: #182229; padding: 14px 18px; border-radius: 12px; margin-top: 20px; font-size: 13px; color: #d1d7db; line-height: 1.6; }
                .steps b { color: #00a884; }
                .footer { font-size: 12px; color: #667781; margin-top: 15px; }
                .lock-link { display: inline-block; margin-top: 10px; color: #8696a0; font-size: 12px; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Connexion WhatsApp Technozi</h1>
                <p>Scannez ce QR Code pour associer l'assistant IA &agrave; votre t&eacute;l&eacute;phone.</p>
                <div class="qr-box">
                  <img src="\${b64}" alt="QR Code WhatsApp">
                </div>
                <div class="steps">
                  1. Ouvrez <b>WhatsApp</b> sur votre t&eacute;l&eacute;phone<br>
                  2. Allez dans <b>R&eacute;glages / Options</b><br>
                  3. Cliquez sur <b>Appareils connect&eacute;s</b><br>
                  4. Touchez <b>Connecter un appareil</b> et scannez !
                </div>
                <div class="footer">Actualisation automatique toutes les 12 secondes</div>
                <div><a href="/webhook/connect" class="lock-link">🔒 Verrouiller la page</a></div>
              </div>
            </body>
            </html>\`;
          })()
        }}`,
        options: {
          responseCode: 200,
          responseHeaders: {
            entries: [
              { name: "Content-Type", value: "text/html; charset=utf-8" }
            ]
          }
        }
      },
      id: "respond-qr-html",
      name: "Afficher Page HTML QR",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [680, 160]
    },

    // -------------------------------------------------------------------------
    // 2. RÉCEPTION DES MESSAGES DEPUIS LA PASSERELLE EVOLUTION
    // -------------------------------------------------------------------------
    {
      parameters: {
        httpMethod: "POST",
        path: "evolution-whatsapp",
        responseMode: "onReceived",
        options: {}
      },
      id: "webhook-evolution",
      name: "Webhook Messages Evolution",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [200, 440],
      webhookId: "evolution-whatsapp"
    },
    {
      parameters: {
        jsCode: `// Filtrer, nettoyer et analyser le message entrant d'Evolution API
const body = $input.item.json.body || $input.item.json;
const staticData = $getWorkflowStaticData('global');
staticData.pausedUntil = staticData.pausedUntil || {};
staticData.conversations = staticData.conversations || {};
staticData.lastActive = staticData.lastActive || {};
staticData.lastDayKey = staticData.lastDayKey || {};
staticData.recentBotTexts = staticData.recentBotTexts || {};
staticData.processedIds = staticData.processedIds || [];

const eventType = (body.event || "").toLowerCase();

// 1. Gestion des événements de connexion / déconnexion
if (eventType === "connection.update" || eventType === "connection_update") {
  const state = (body.data?.state || body.data?.status || "").toLowerCase();
  if (state === "open") {
    delete staticData.lastDisconnectAlert;
    return [];
  }
  if (state === "close" || state === "disconnected") {
    const now = Date.now();
    // Anti-spam alerte : maximum 1 e-mail toutes les 5 minutes
    if (staticData.lastDisconnectAlert && (now - staticData.lastDisconnectAlert < 5 * 60 * 1000)) {
      return [];
    }
    staticData.lastDisconnectAlert = now;
    return [{
      json: {
        isSystemAlert: true,
        alertType: "DISCONNECTION",
        message: "La session WhatsApp s'est déconnectée. Veuillez rescanner le QR code sur https://bot.technozi-ht.com/webhook/connect"
      }
    }];
  }
  return [];
}

// 2. Traitement des messages entrants uniquement (messages.upsert)
if (eventType !== "messages.upsert" && eventType !== "messages_upsert") {
  return [];
}

const data = body.data;
if (!data || !data.key) return [];

const key = data.key;
const remoteJid = key.remoteJid || "";

// Ignorer les statuts WhatsApp, groupes et chaînes/newsletters
if (
  !remoteJid ||
  remoteJid === "status@broadcast" ||
  remoteJid.includes("@broadcast") ||
  remoteJid.includes("@g.us") ||
  remoteJid.includes("@newsletter")
) {
  return [];
}

// Ignorer les messages périmés / rejoués après reconnexion (> 3 minutes d'âge)
const rawTs = data.messageTimestamp;
let msgTsSec = Number(rawTs && typeof rawTs === "object" ? (rawTs.low ?? 0) : rawTs);
if (msgTsSec > 1e12) msgTsSec = Math.floor(msgTsSec / 1000);
if (Number.isFinite(msgTsSec) && msgTsSec > 0) {
  const ageSec = Math.floor(Date.now() / 1000) - msgTsSec;
  if (ageSec > 180) {
    return [];
  }
}

// Anti-doublon strict par ID de message
const msgId = key.id;
if (msgId && staticData.processedIds.includes(msgId)) {
  return [];
}
if (msgId) {
  staticData.processedIds.push(msgId);
  if (staticData.processedIds.length > 500) staticData.processedIds.shift();
}

// Déballer les messages éphémères, vue unique ou modifiés de WhatsApp
let msg = data.message;
if (!msg) return [];
if (msg.ephemeralMessage?.message) msg = msg.ephemeralMessage.message;
if (msg.viewOnceMessage?.message) msg = msg.viewOnceMessage.message;
if (msg.viewOnceMessageV2?.message) msg = msg.viewOnceMessageV2.message;
if (msg.documentWithCaptionMessage?.message) msg = msg.documentWithCaptionMessage.message;
if (msg.editedMessage?.message) msg = msg.editedMessage.message;

// Ignorer les événements techniques silencieux (accusés, réactions, protocoles)
if (msg.protocolMessage || msg.senderKeyDistributionMessage || msg.reactionMessage) {
  return [];
}

// Extraire le texte du message (y compris légendes photo/vidéo/document et position GPS)
let extractedText =
  msg.conversation ||
  msg.extendedTextMessage?.text ||
  msg.imageMessage?.caption ||
  msg.videoMessage?.caption ||
  msg.documentMessage?.caption ||
  "";

if (!extractedText && msg.locationMessage) {
  const loc = msg.locationMessage;
  extractedText = loc.address || loc.name ||
    (loc.degreesLatitude ? \`Position GPS partagée (\${loc.degreesLatitude}, \${loc.degreesLongitude})\` : "");
}

extractedText = (extractedText || "").trim();
const fromMe = key.fromMe === true;

// =========================================================================
// RÈGLE D'OR CO-PILOTE : GESTION DES MESSAGES VENANT DE NOTRE PROPRE NUMÉRO
// =========================================================================
if (fromMe) {
  // Ignorer les échos d'envoi de menus interactifs ou sondages par le bot lui-même
  if (
    msg.listMessage ||
    msg.buttonsMessage ||
    msg.templateMessage ||
    msg.interactiveMessage ||
    msg.pollCreationMessage ||
    msg.pollCreationMessageV2 ||
    msg.pollCreationMessageV3 ||
    msg.pollUpdateMessage
  ) {
    return [];
  }

  // Vérifier si c'est simplement un écho de la réponse texte que le bot vient d'envoyer
  const recentBot = (staticData.recentBotTexts[remoteJid] || []).filter(
    item => Date.now() - item.at < 60000
  );
  staticData.recentBotTexts[remoteJid] = recentBot;

  if (extractedText && recentBot.some(item => item.text === extractedText)) {
    return [];
  }

  // Commande rapide /ia ou /bot depuis le téléphone pour réactiver l'IA immédiatement
  if (extractedText.toLowerCase().match(/^(\\/ia|\\/bot|\\/resume)$/)) {
    delete staticData.pausedUntil[remoteJid];
    return [];
  }

  // Sinon, c'est un vrai humain de Technozi qui a répondu depuis le smartphone ou WhatsApp Web
  const hasRealContent = Boolean(
    extractedText ||
    msg.audioMessage ||
    msg.imageMessage ||
    msg.videoMessage ||
    msg.documentMessage ||
    msg.contactMessage ||
    msg.locationMessage
  );

  if (hasRealContent) {
    staticData.pausedUntil[remoteJid] = Date.now() + (60 * 60 * 1000); // Pause IA de 60 minutes (prise en main humaine)
    // Mémoriser brièvement la réponse humaine pour la continuité si l'IA reprend plus tard
    if (extractedText) {
      staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];
      staticData.conversations[remoteJid].push({
        role: "model",
        text: "[Réponse envoyée par un conseiller humain Technozi] : " + extractedText
      });
      if (staticData.conversations[remoteJid].length > 24) {
        staticData.conversations[remoteJid] = staticData.conversations[remoteJid].slice(-24);
      }
      staticData.lastActive[remoteJid] = Date.now();
      try {
        staticData.lastDayKey[remoteJid] = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Port-au-Prince' });
      } catch (e) {
        staticData.lastDayKey[remoteJid] = new Date().toISOString().slice(0, 10);
      }
    }
  }
  return [];
}

// Si la conversation est en cours de prise en main humaine (< 15 min), l'IA reste silencieuse
if (staticData.pausedUntil[remoteJid] && Date.now() < staticData.pausedUntil[remoteJid]) {
  return [];
}

// Résoudre le numéro de téléphone réel (prise en charge des identifiants @lid récents)
const phoneJid = (key.remoteJidAlt && key.remoteJidAlt.includes("@s.whatsapp.net"))
  ? key.remoteJidAlt
  : remoteJid;
const senderPhone = phoneJid.includes("@s.whatsapp.net")
  ? phoneJid.replace("@s.whatsapp.net", "").replace(/[^0-9]/g, "")
  : "";

// =========================================================================
// RÈGLE ABSOLUE : NUMÉROS INTERNES TECHNOZI IGNORÉS (SILENCE TOTAL DU BOT)
// =========================================================================
const IGNORED_TEAM_NUMBERS = [
  "50946405968", // Administratrice
  "50948861464", // Équipe interne Technozi
  "50937030009"  // Technozi Bot lui-même
];

if (
  IGNORED_TEAM_NUMBERS.some(num =>
    (senderPhone && senderPhone === num) ||
    remoteJid.includes(num) ||
    (key.remoteJidAlt && key.remoteJidAlt.includes(num))
  )
) {
  return [];
}
const pushName = (data.pushName || "").trim() || "Client";

// Suivi du jour calendaire (heure d'Haïti) + expiration après 12h d'inactivité
const nowMs = Date.now();
let haitiDayKey = "";
try {
  haitiDayKey = new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'America/Port-au-Prince' });
} catch (e) {
  haitiDayKey = new Date(nowMs).toISOString().slice(0, 10);
}
const prevDayKey = staticData.lastDayKey[remoteJid] || "";
const prevActiveAt = staticData.lastActive[remoteJid] || 0;
const isCalendarDayChanged = Boolean(prevDayKey && haitiDayKey && prevDayKey !== haitiDayKey);
const isInactiveExpired = Boolean(prevActiveAt && (nowMs - prevActiveAt > 12 * 60 * 60 * 1000));
let isNewDay = !prevDayKey || isCalendarDayChanged;

if (isCalendarDayChanged || isInactiveExpired) {
  delete staticData.conversations[remoteJid];
}
staticData.lastActive[remoteJid] = nowMs;
staticData.lastDayKey[remoteJid] = haitiDayKey;

let userText = extractedText;
let isResetCommand = false;

// Commande développeur / test (/reset) pour repartir sur une session vierge
if (userText && userText.toLowerCase().match(/^(\\/reset|reset bot|reinitialiser)$/)) {
  delete staticData.conversations[remoteJid];
  isResetCommand = true;
  isNewDay = true;
  userText = "Bonjour";
}

// Gestion intelligente des messages vocaux audio et médias sans texte
if (!userText) {
  if (msg.audioMessage) {
    userText = "[MESSAGE VOCAL AUDIO REÇU] : Le client a envoyé un vocal WhatsApp impossible à écouter ici. Invitez-le en 1 phrase courte (dans sa langue, sinon Kreyòl & Français) à écrire sa demande par texte et précisez qu'un conseiller l'écoutera.";
  } else if (msg.imageMessage || msg.videoMessage || msg.documentMessage) {
    userText = "[FICHIER / PHOTO REÇU SANS TEXTE] : Le client a envoyé un média sans texte. Demandez-lui en 1 phrase courte de préciser par écrit son besoin ainsi que son nom et sa ville/zone.";
  } else {
    return [];
  }
}

staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];
const history = staticData.conversations[remoteJid];
const isNewConversation = history.length === 0;

// Détecter la langue active (priorité au dernier message avec mots clairs, sinon historique)
const detectLangCode = (t) => {
  const s = (t || "").toLowerCase();
  if (/\\b(bonjou|rebonjou|bonswa|sak pase|kòman|koman|mwen|mw|mp|map|banm|ekrim|ekri|konprann|raple|konbyen|koute|enstalasyon|bezwen|nan|pou|devi|pwofòma|tanpri|mèsi|pa gen|lòt|biwo|meni|opsyon|kamera|panno|oubyen|rezime|wi|kote|epitou|paske|anpil|kounye|toujou|bagay|materyel|mesye|ayiti|nou|vann|eske|èske|zam|telefòn|telefon|genyen|chèche|sèvis|presize|dakò|erè|chanje|modifye|imèl|kantite|livrezon|nimewo|antrepriz|frijidè|frijide|on seul|yon sèl|zòn)\\b|solè(?![a-zà-ÿ])/i.test(s)) return "kr";
  if (/\\b(hello|hi|hey|yes|yeah|good morning|good afternoon|good evening|how much|what are|do you|can you|i need|we need|i want|we want|quote|proforma invoice|price|pricing|cost|opening|website|download|please|thanks|thank you|nothing else|that's all|show.*menu|show.*options|wrong|change|modify|update|mistake|sell|available|availability|delivery)\\b/i.test(s)) return "en";
  if (/\\b(hola|buenos|buenas|cotización|necesito|quiero|cuánto|cuanto|gracias|por favor|horarios|sitio web|descargar|nada más|eso es todo|cambiar|modificar|error|entrega)\\b|menú(?![a-zà-ÿ])/i.test(s)) return "es";
  if (/\\b(bonjour|rebonjour|bonsoir|salut|oui|non|devis|combien|coûte|coute|installation|besoin|je veux|nous voulons|voudrais|souhaite|merci|rien d'autre|c'est tout|horaires?|télécharger|application|site web|voir|afficher|s'il vous plaît|svp|proposez|vendez|avez|avez-vous|est-ce|nous|vous|votre|quel|quelle|erreur|changer|modifier|quantité|livraison|disponibilité|tarif)\\b/i.test(s)) return "fr";
  return "";
};

let activeLang = detectLangCode(userText);
if (!activeLang) {
  for (let i = history.length - 1; i >= 0; i--) {
    activeLang = detectLangCode(history[i].text);
    if (activeLang) break;
  }
}
activeLang = activeLang || "fr";

const trimmedLower = userText.trim().toLowerCase();
const isSimpleGreeting =
  isResetCommand ||
  (isNewConversation && /^(bonjou|rebonjou|bonswa|sak pase|bonjour|rebonjour|bonsoir|salut|hello|hi|hey|hola|buenos d[ií]as|good morning|good afternoon|good evening)[!.,?\\s]*$/i.test(trimmedLower));
const isMenuCommand =
  /^(\\/?menu|meni|menú|options?|opsyon|menu rapide|meni rapid|options? rapides?|quick menu|quick options)(?:\\s+(?:svp|s'il vous pla[îi]t|please|pls|tanpri|por favor))?[!.,?\\s]*$/i.test(trimmedLower) ||
  /\\b(voir le menu|afficher le menu|montre[- ]?moi le menu|revoir le menu|remets? le menu|donne[- ]?moi le menu|voir les options|afficher les options|montre[- ]?moi les options|quelles? sont (?:vos|les) options|wè meni|ban ?m(?:wen)? meni|afiche meni|montre ?m meni|wè opsyon|ban ?m(?:wen)? opsyon|ki opsyon|show.*menu|see.*menu|show.*options|see.*options)\\b/i.test(trimmedLower);

const isInstantMenu = isSimpleGreeting || isMenuCommand;

return [{
  json: {
    senderPhone,
    remoteJid,
    pushName,
    userText,
    history,
    isNewConversation,
    isNewDay,
    haitiDayKey,
    activeLang,
    isInstantMenu,
    isSystemAlert: false
  }
}];`
      },
      id: "filter-human-check",
      name: "1. Filtre & Détecteur Humain",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [440, 440]
    },

    // -------------------------------------------------------------------------
    // 3. AIGUILLAGE : ALERTE TECHNIQUE
    // -------------------------------------------------------------------------
    {
      parameters: {
        conditions: {
          boolean: [
            {
              value1: "={{ $json.isSystemAlert }}",
              value2: true
            }
          ]
        }
      },
      id: "check-alert",
      name: "Est-ce une alerte technique ?",
      type: "n8n-nodes-base.if",
      typeVersion: 1,
      position: [680, 440]
    },

    // -------------------------------------------------------------------------
    // 4. ALERTE TECHNIQUE PAR E-MAIL (POUR PITONRODJY@GMAIL.COM)
    // -------------------------------------------------------------------------
    {
      parameters: {
        fromEmail: "sales@technozi-ht.com",
        toEmail: DEVELOPER_EMAIL,
        subject: "⚠️ ALERTE SYSTÈME : WhatsApp Technozi déconnecté",
        emailFormat: "html",
        html: `<h2>Alerte Déconnexion WhatsApp</h2>
        <p>La session WhatsApp du bot Technozi s'est déconnectée du serveur.</p>
        <p><b>Action requise :</b> Ouvrez le lien suivant pour rescanner le QR code en 10 secondes :</p>
        <p><a href="https://bot.technozi-ht.com/webhook/connect" style="background:#00a884;color:white;padding:10px 18px;text-decoration:none;border-radius:8px;display:inline-block;">Rescanner le QR Code</a></p>
        <p>Lien direct : https://bot.technozi-ht.com/webhook/connect</p>`,
        options: {}
      },
      credentials: {
        smtp: {
          id: "kJkckSErhAAeGSci",
          name: "SMTP account"
        }
      },
      id: "send-alert-email",
      name: "Alerte Développeur (Email)",
      type: "n8n-nodes-base.emailSend",
      typeVersion: 2.1,
      position: [940, 260]
    },

    // -------------------------------------------------------------------------
    // 5. ROUTAGE RAPIDE : SALUT SIMPLE / MENU VS CONVERSATION IA
    // -------------------------------------------------------------------------
    {
      parameters: {
        conditions: {
          boolean: [
            {
              value1: "={{ $json.isInstantMenu }}",
              value2: true
            }
          ]
        }
      },
      id: "check-instant-menu",
      name: "Salut simple / Menu ?",
      type: "n8n-nodes-base.if",
      typeVersion: 1,
      position: [880, 520]
    },
    {
      parameters: {
        jsCode: `// Générer le menu 1-5 ultra-direct en 1 seule bulle sans appel IA
const data = $input.item.json;
const remoteJid = data.remoteJid;
const senderPhone = data.senderPhone;
const userText = data.userText;
const lang = data.activeLang || "fr";

const menus = {
  kr: "👋 *Technozi Haïti* — Kòman nou ka ede w ?\\n\\n*1* · 📱 Telechaje Aplikasyon an\\n*2* · 🌐 Sit Wèb Ofisyèl la\\n*3* · 🕒 Orè Travay Nou yo\\n*4* · 📋 Mande yon Devi\\n*5* · 🧾 Mande yon Pwofòma\\n\\n_Reponn *1–5* oswa ekri dirèkteman sa w bezwen an._",
  en: "👋 *Technozi Haïti* — How can we help you?\\n\\n*1* · 📱 Download the App\\n*2* · 🌐 Official Website\\n*3* · 🕒 Opening Hours\\n*4* · 📋 Request a Quote\\n*5* · 🧾 Request a Proforma\\n\\n_Reply *1–5* or type your request directly._",
  es: "👋 *Technozi Haïti* — ¿Cómo podemos ayudarle?\\n\\n*1* · 📱 Descargar la App\\n*2* · 🌐 Sitio Web Oficial\\n*3* · 🕒 Nuestros Horarios\\n*4* · 📋 Solicitar Cotización\\n*5* · 🧾 Solicitar Proforma\\n\\n_Responda *1–5* o escriba directamente lo que necesita._",
  fr: "👋 *Technozi Haïti* — Comment pouvons-nous vous aider ?\\n\\n*1* · 📱 Télécharger l'App\\n*2* · 🌐 Site Web Officiel\\n*3* · 🕒 Nos Horaires\\n*4* · 📋 Demander un Devis\\n*5* · 🧾 Demander une Proforma\\n\\n_Répondez *1–5* ou écrivez directement votre besoin._"
};

const aiText = menus[lang] || menus.fr;

const staticData = $getWorkflowStaticData('global');
staticData.conversations = staticData.conversations || {};
staticData.recentBotTexts = staticData.recentBotTexts || {};

staticData.recentBotTexts[remoteJid] = (staticData.recentBotTexts[remoteJid] || []).filter(
  item => Date.now() - item.at < 60000
);
staticData.recentBotTexts[remoteJid].push({ text: aiText, at: Date.now() });
if (staticData.recentBotTexts[remoteJid].length > 8) {
  staticData.recentBotTexts[remoteJid] = staticData.recentBotTexts[remoteJid].slice(-8);
}

staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];
staticData.conversations[remoteJid].push({ role: "user", text: userText });
staticData.conversations[remoteJid].push({ role: "model", text: aiText });
if (staticData.conversations[remoteJid].length > 24) {
  staticData.conversations[remoteJid] = staticData.conversations[remoteJid].slice(-24);
}

return [{
  json: {
    remoteJid,
    senderPhone,
    aiText
  }
}];`
      },
      id: "instant-menu-node",
      name: "Menu Rapide Instantané (1 Bulle)",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1160, 400]
    },

    // -------------------------------------------------------------------------
    // 6. ENVOI DE L'INDICATEUR D'ÉCRITURE ("En train d'écrire...")
    // -------------------------------------------------------------------------
    {
      parameters: {
        method: "POST",
        url: "http://evolution-api:8080/chat/sendPresence/technozi",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "apikey", value: EVOLUTION_API_KEY },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify({ number: $json.remoteJid, presence: 'composing', delay: 20000 }) }}",
        options: {
          timeout: 800
        }
      },
      id: "send-presence-composing",
      name: "Afficher 'En train d'écrire...'",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1160, 560],
      continueOnFail: true
    },

    // -------------------------------------------------------------------------
    // 7. CERVEAU IA GOOGLE GEMINI 3.5 FLASH-LITE (MODE ULTRA-DIRECT)
    // -------------------------------------------------------------------------
    {
      parameters: {
        method: "POST",
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: `={{
          (() => {
            const userText = $json.userText;
            const clientName = $json.pushName || "Client";
            const phone = $json.senderPhone;
            const phoneDisplay = phone ? ("+" + phone) : "Non visible";
            const history = $json.history || [];
            const isNewDay = $json.isNewDay !== false;
            const isOngoingSameDay = !isNewDay && history.length > 0;
            const activeLangCode = $json.activeLang || "fr";
            const langNames = { kr: "Kreyòl", en: "English", es: "Español", fr: "Français" };
            const activeLangLabel = langNames[activeLangCode] || "Français";

            let haitiTimeInfo = "";
            try {
              const now = new Date();
              const dateFull = now.toLocaleDateString('fr-FR', { timeZone: 'America/Port-au-Prince', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
              const heure = now.toLocaleTimeString('fr-FR', { timeZone: 'America/Port-au-Prince', hour: '2-digit', minute: '2-digit' });
              haitiTimeInfo = dateFull + " à " + heure + " (heure d'Haïti)";
            } catch (e) {
              haitiTimeInfo = "Haïti";
            }

            const dayStatusText = isOngoingSameDay
              ? "MÊME CONVERSATION EN COURS AUJOURD'HUI (discussion déjà entamée aujourd'hui : NE DITES PAS 'aujourd'hui', 'jodi a', 'today', 'hoy' ni formule de bienvenue)"
              : "NOUVEAU JOUR (premier échange de la journée avec ce client)";

            const prevClientMsgs = history
              .filter(h => h.role === "user" && h.text)
              .slice(-10)
              .map((h, i) => (i + 1) + ") " + h.text)
              .join(" | ");
            const clientMemoryLine = prevClientMsgs || "Aucun message précédent";

            const systemPrompt = \`Vous êtes Pitonbot, l'assistant réceptionniste WhatsApp de Technozi Haïti ("Faster & Easier").

1. RÈGLE FONDAMENTALE — RÉCEPTIONNISTE COLLECTEUR (SANS BASE DE STOCK)
• Vous connaissez UNIQUEMENT le fonctionnement de l'entreprise (horaires, site, apps, chaîne WhatsApp, devis/proforma) et vous êtes chargé de RECUEILLIR les demandes pour l'administration.
• Vous n'avez AUCUNE base de données produits/stock : il est STRICTEMENT IMPOSSIBLE d'affirmer « nous avons ceci » ou « nous n'avons pas cela » (ne citez aucune liste de produits que l'entreprise vendrait ou ne vendrait pas).
• Les 7 éléments à recueillir sur l'ensemble de la conversation sont :
  1. Nom & Prénom (ou Entreprise)
  2. E-mail
  3. Numéro de téléphone
  4. Produit(s) / Service(s)
  5. Quantité
  6. Type de document souhaité (Devis ou Proforma)
  7. Zone de livraison en Haïti
• **MÉMOIRE CUMULATIVE OBLIGATOIRE (NE RIEN OUBLIER) :**
  - Avant de répondre, relisez TOUS les messages précédents du client (listés ci-dessous et dans l'historique), même s'il y a eu un message incompréhensible entre-temps.
  - Dès que le client mentionne un produit/service (ex. "On frijidè m bezwen", "Samsung S23"), **CONFIRMEZ-LE explicitement dès la 1re ligne** puis annoncez que l'équipe va vérifier, et demandez en bullet points UNIQUEMENT les éléments encore manquants (ne redemandez JAMAIS "Produit" si le produit est déjà donné !).
    - Exemple KR : "Nou note : *Frijidè*. Nou pral verifye sa ak ekip la. Antretan, tanpri voye m sa ki manke yo :"
    - Exemple FR : "Noté pour : *Réfrigérateur*. Nous allons vérifier cela avec l'équipe. Entre-temps, laissez-nous ce qui manque :"
  - Aux messages suivants, rappelez en **1 ligne très courte** tout ce qui est déjà retenu depuis le début (y compris le produit du 1er message !) puis demandez UNIQUEMENT ce qui manque encore. S'il ne reste qu'1 ou 2 infos (ex. juste Devis ou Proforma), posez directement la question courte sans remettre la liste complète.
  - Comprenez les quantités naturelles : en Kreyòl, « on seul » / « yon sèl » / « youn » = Quantité *1*.
  - N'affichez JAMAIS le numéro WhatsApp du chat entre parenthèses dans la liste à remplir (n'utilisez ce numéro que si le client écrit « même numéro » / « menm nimewo a »).
  - **VÉRIFICATION DE L'ENTREPRISE / ANCIEN CONTEXTE (NE JAMAIS AFFIRMER À L'AVEUGLE) :**
    - Si une entreprise, entité ou tiers a été mentionnée dans des messages plus anciens ou plus haut dans le fil (ex. Matelec, EyesSmart, Digitech, etc.), mais que le client ne précise pas clairement ce nom pour sa nouvelle demande :
      **INTERDICTION STRICTE d'affirmer d'office** que la nouvelle demande est pour cette entreprise (ne dites JAMAIS : "Pwofòma pou Matelec ak EyesSmart" sans que le client ne l'ait explicitement dit pour cette commande précise !).
    - Vous DEVEZ demander confirmation poliment en 1 phrase courte :
      - KR : "Èske se pou [Ansyen Antrepriz] toujou, oubyen se pou yon lòt moun / antrepriz ?"
      - FR : "Est-ce toujours pour [Ancienne Entreprise] ou pour une autre personne / entreprise ?"
      - EN : "Is this still for [Previous Company] or for another person / company?"
  - **MESSAGES INTERNES ENTRE COLLÈGUES / FOURNISSEURS :**
    - Si le message semble être une consigne interne entre collaborateurs (ex. "Mande nan Island...", "Di l...", "Rele...", "Madame...", "Voye pran..."), NE CRÉEZ PAS de commande ni de récapitulatif client. Répondez en 1 phrase très courte demandant si ce message s'adresse au service client Technozi ou s'il s'agit d'une instruction interne.
• Exception sécurité uniquement : pour une demande manifestement illégale (ex: armes, drogues), répondez en 1 phrase neutre que Technozi ne traite pas ce type de demande, sans parler de stock.
• Si le message est incompréhensible (charabia ou faute bloquante comme "2 9minitet" ou "Hhbvjbn") : NE DEVINEZ PAS et N'EFFACEZ PAS la mémoire d'avant. Demandez en 1 phrase courte de repréciser clairement.

2. LANGUE OBLIGATOIRE (ZÉRO MÉLANGE)
Répondez EXCLUSIVEMENT dans la langue indiquée par « Langue active obligatoire » ci-dessous (sans JAMAIS recopier d'instructions système ni mélanger des mots d'une autre langue) :
• En Français : utilisez "en Haïti", "Noté —", "devis", "proforma" (zéro mot créole).
• En Kreyòl : créole haïtien simple et naturel ("Mèsi —", "Dakò —", "Nou note :", "Tanpri voye m", "an Ayiti", "zòn livrezon an Ayiti", "devi", "pwofòma"). RÈGLE CRITIQUE : le pays Haïti s'écrit toujours *Ayiti* (« an Ayiti »), JAMAIS « an Ayisyen », JAMAIS « bay m » et JAMAIS « Noté » en français.
• En English : natural concise English ("Noted:", "Quote", "Proforma Invoice", "delivery area in Haiti").
• En Español : español claro y directo ("Anotado:", "Cotización", "Factura Proforma", "zona de entrega en Haití").

3. STYLE — CONTINUITÉ DU JOUR & CONCISION
• **RÈGLE DU JOUR / ANTI-RÉPÉTITION :**
  - Si Statut du jour = *MÊME CONVERSATION EN COURS AUJOURD'HUI* : il est **STRICTEMENT INTERDIT** de dire « Que puis-je faire pour vous aujourd'hui ? », « Comment puis-je vous aider aujourd'hui ? », « aujourd'hui », « jodi a », « today », « hoy » ou « Bienvenue ». Même si le client dit « Bonjour » / « Rebonjour » / « Merci » au milieu du même jour, enchaînez directement (ex. « Rebonjour — » puis poursuivez la collecte en cours, ou demandez simplement ce qu'il souhaite vérifier sans dire « aujourd'hui »).
  - Si Statut du jour = *NOUVEAU JOUR* : vous pouvez saluer brièvement pour la nouvelle journée si adapté.
• Soyez très bref : 1 courte ligne confirmant ce qui est déjà noté + uniquement ce qui manque (jamais de longs paragraphes).
• N'utilisez le prénom du client que s'il s'est présenté lui-même (ne confondez pas le prénom d'un tiers cité dans son message avec le client).
• Zéro prix ni estimation chiffrée. Ne dites "Tapez 4 ou 5" que si le client demande les options, jamais quand il exprime déjà sa demande.
• Format WhatsApp : utilisez toujours « • » pour les puces (jamais « * » en début de puce). N'utilisez *gras* (avec UNE SEULE étoile, jamais **double étoile**, jamais ###) que pour les titres ou le nom du produit, jamais à l'intérieur des bullet points. 0 à 1 émoji sobre max (jamais 🙃).

4. INFOS OFFICIELLES TECHNOZI (FONCTIONNEMENT UNIQUEMENT)
• Site Web : https://technozi-ht.com
• Tél / WhatsApp : +509 37 03 0009 | Email : sales@technozi-ht.com
• Horaires : Lun–Ven 8h00–17h00 | Samedi 8h00–15h00 | Dimanche fermé.
• App Android : https://play.google.com/store/apps/details?id=com.wiserpos.technozi&hl=en_SG
• App iOS (iPhone) : https://apps.apple.com/us/app/technozi-haiti/id6756228637?l=es-MX
• Chaîne WhatsApp : https://whatsapp.com/channel/0029Vb7XDp3EVccQG29idN2d

5. OPTIONS 1–5 (SI LE CLIENT RÉPOND AU MENU)
• Option *1* (ou demande sur l'app) : donnez directement les 2 liens (Android + iOS) sans paragraphe autour.
• Option *2* (ou demande sur le site) : donnez directement https://technozi-ht.com + Chaîne WhatsApp.
• Option *3* (ou horaires) : donnez les horaires exacts + précisez si nos bureaux sont actuellement ouverts ou fermés selon l'heure locale d'Haïti ci-dessous.
• Option *4* (*Devis*) ou Option *5* (*Proforma*) : le type (Devis ou Proforma) est déjà choisi ! Demandez en bullet points courts uniquement les autres infos manquantes (Nom & Prénom / Entreprise, E-mail, Numéro de téléphone, Produit(s), Quantité, Zone de livraison en Haïti).
• Si le client demande à revoir le menu / les options : 1 courte phrase + [SHOW_OPTIONS].

6. CLÔTURE ET MODIFICATION DU RÉCAPITULATIF (POUR L'ADMINISTRATION)
• Dès que vous avez les 7 éléments (Nom/Entreprise, E-mail, Téléphone, Produit(s), Quantité, Devis ou Proforma, Zone de livraison en Haïti) — et que le client ne semble rien ajouter ou valide ("c'est tout", "rien d'autre", "oui", "merci", "pa gen lòt", "se sa", "non mèsi", "that's all", ou s'il vient de fournir la dernière info manquante) : générez IMMÉDIATEMENT le Récapitulatif complet structuré 100 % dans sa langue (avec TOUTES les infos recueillies depuis le début, sans perdre le produit du 1er message) :

Libellés selon langue :
- Français : 📋 *Récapitulatif pour l'administration Technozi* (Nom & Prénom / Entreprise, E-mail, Téléphone, Type : Devis/Proforma, Produit(s) & Quantité, Zone de livraison en Haïti)
- Kreyòl : 📋 *Rezime pou administrasyon Technozi a* (Non & Prenon / Antrepriz, Imèl, Telefòn, Tip : Devi/Pwofòma, Pwodui & Kantite, Zòn livrezon an Ayiti)
- English : 📋 *Summary for Technozi Administration* (Name / Company, Email, Phone, Type: Quote/Proforma, Item(s) & Quantity, Delivery Area in Haiti)

• Ajoutez juste en dessous 1 phrase courte confirmant que l'équipe vérifie et prend le relais rapidement, et précisez en quelques mots que le client peut signaler s'il souhaite modifier une information.
• **CORRECTION APRÈS RÉCAPITULATIF :** Si le client remarque une erreur ou demande une modification après le récapitulatif (ex. changer la quantité, le produit, l'e-mail, le téléphone, la zone, le nom ou Devis/Proforma), appliquez immédiatement la modification en conservant toutes les autres infos intactes et **renvoyez aussitôt le Récapitulatif complet mis à jour**.

Contexte actuel :
• Langue active obligatoire pour cette réponse : \${activeLangLabel}
• Date / Heure locale Haïti : \${haitiTimeInfo}
• Statut du jour : \${dayStatusText}
• Messages précédents du client (à retenir intégralement) : \${clientMemoryLine}
• Nom WhatsApp affiché : \${clientName}
• Numéro WhatsApp du chat (uniquement si "même numéro") : \${phoneDisplay}\`;

            const contents = [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "Compris. Mémoire cumulative stricte de tous les messages client (produit, quantité, coordonnées), respect du statut du jour (jamais 'aujourd'hui' dans un échange déjà en cours le même jour), collecte ultra-courte des seuls éléments manquants, récapitulatif complet et correction immédiate sur demande." }] }
            ];

            for (const h of history.slice(-24)) {
              contents.push({ role: h.role, parts: [{ text: h.text }] });
            }

            contents.push({ role: "user", parts: [{ text: userText }] });

            return {
              contents: contents,
              generationConfig: {
                temperature: 0.25,
                maxOutputTokens: 1024
              }
            };
          })()
        }}`,
        options: {
          timeout: 30000
        }
      },
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 2000,
      continueOnFail: true,
      id: "call-gemini",
      name: "2. Cerveau IA Gemini (Gratuit)",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1400, 720]
    },

    // -------------------------------------------------------------------------
    // 8. EXTRAIRE LA RÉPONSE DE L'IA & SAUVEGARDER L'HISTORIQUE (1 SEULE BULLE)
    // -------------------------------------------------------------------------
    {
      parameters: {
        jsCode: `// Parser la réponse de Gemini et préparer l'envoi WhatsApp en 1 seule bulle propre
const geminiRes = $input.item.json;
const candidate = geminiRes.candidates?.[0];
const parts = candidate?.content?.parts || [];
const visibleParts = parts
  .filter(p => !p.thought && typeof p.text === "string")
  .map(p => p.text);

let aiText = (visibleParts.join("") || candidate?.content?.parts?.[0]?.text || "").trim();

// Récupération sécurisée du nœud filtre (résiste même en cas de renommage n8n ...1)
let prevData = null;
for (const nodeName of ['1. Filtre & Détecteur Humain', '1. Filtre & Détecteur Humain1', '1. Filtre & Détecteur Humain2']) {
  try {
    const item = $(nodeName).item;
    if (item && item.json && item.json.remoteJid) {
      prevData = item.json;
      break;
    }
  } catch (e) {}
}
if (!prevData) {
  throw new Error("Données introuvables depuis '1. Filtre & Détecteur Humain'. Videz les doublons du canevas n8n si nécessaire.");
}

const remoteJid = prevData.remoteJid;
const senderPhone = prevData.senderPhone;
const userText = prevData.userText;
const activeLang = prevData.activeLang || "fr";

const aiAskedOptions = /\\[(SHOW_OPTIONS|SHOW_MENU)\\]/i.test(aiText || "");

// Nettoyage Markdown non-WhatsApp et suppression défensive de toute balise interne
if (aiText) {
  aiText = aiText
    .replace(/\\[(?:LANGUE ACTIVE[^\\]]*|SHOW_OPTIONS|SHOW_MENU|SET_LANG:[^\\]]*)\\]/gi, "")
    .replace(/\\*[ \\t]*\\n[ \\t]*([^\\n*]+?\\*)/g, "*$1")
    .replace(/\\*\\*([^*\\n]+?)\\*\\*/g, "*$1*")
    .replace(/^[ \\t]*[-*][ \\t]+/gm, "• ")
    .replace(/^#{1,4}\\s+/gm, "")
    .trim();
}

const optionBlocks = {
  kr: "*1* · 📱 Telechaje Aplikasyon an\\n*2* · 🌐 Sit Wèb Ofisyèl la\\n*3* · 🕒 Orè Travay Nou yo\\n*4* · 📋 Mande yon Devi\\n*5* · 🧾 Mande yon Pwofòma\\n\\n_Reponn *1–5* oswa ekri dirèkteman sa w bezwen an._",
  en: "*1* · 📱 Download the App\\n*2* · 🌐 Official Website\\n*3* · 🕒 Opening Hours\\n*4* · 📋 Request a Quote\\n*5* · 🧾 Request a Proforma\\n\\n_Reply *1–5* or type your request directly._",
  es: "*1* · 📱 Descargar la App\\n*2* · 🌐 Sitio Web Oficial\\n*3* · 🕒 Nuestros Horarios\\n*4* · 📋 Solicitar Cotización\\n*5* · 🧾 Solicitar Proforma\\n\\n_Responda *1–5* o escriba directamente lo que necesita._",
  fr: "*1* · 📱 Télécharger l'App\\n*2* · 🌐 Site Web Officiel\\n*3* · 🕒 Nos Horaires\\n*4* · 📋 Demander un Devis\\n*5* · 🧾 Demander une Proforma\\n\\n_Répondez *1–5* ou écrivez directement votre besoin._"
};

if (aiAskedOptions) {
  const intro = aiText || (
    activeLang === "kr" ? "👋 *Technozi Haïti* — Men opsyon yo :" :
    activeLang === "en" ? "👋 *Technozi Haïti* — Quick options:" :
    activeLang === "es" ? "👋 *Technozi Haïti* — Opciones rápidas:" :
    "👋 *Technozi Haïti* — Comment pouvons-nous vous aider ?"
  );
  aiText = intro + "\\n\\n" + (optionBlocks[activeLang] || optionBlocks.fr);
}

// Secours multilingue si la réponse IA était vide
if (!aiText) {
  if (activeLang === "kr") {
    aiText = "Nou pral verifye sa ak ekip la. Tanpri voye m enfòmasyon sa yo :\\n• Non & Prenon (oswa Antrepriz)\\n• Imèl\\n• Nimewo telefòn\\n• Pwodui & Kantite (Devi oswa Pwofòma)\\n• Zòn livrezon an Ayiti";
  } else if (activeLang === "en") {
    aiText = "We will check this with our team. Please share:\\n• Full Name / Company\\n• Email\\n• Phone Number\\n• Product(s) & Quantity (Quote or Proforma)\\n• Delivery Area in Haiti";
  } else if (activeLang === "es") {
    aiText = "Verificaremos esto con el equipo. Por favor envíe:\\n• Nombre / Empresa\\n• Correo electrónico\\n• Teléfono\\n• Producto(s) y Cantidad (Cotización o Proforma)\\n• Zona de entrega en Haití";
  } else {
    aiText = "Nous allons vérifier cela avec l'équipe. Laissez-nous ces infos :\\n• Nom & Prénom (ou Entreprise)\\n• E-mail\\n• Numéro de téléphone\\n• Produit(s) & Quantité (Devis ou Proforma)\\n• Zone de livraison en Haïti";
  }
}

const staticData = $getWorkflowStaticData('global');
staticData.conversations = staticData.conversations || {};
staticData.recentBotTexts = staticData.recentBotTexts || {};

// Enregistrer ce message pour ne pas confondre l'écho du bot avec une réponse humaine (fromMe)
staticData.recentBotTexts[remoteJid] = (staticData.recentBotTexts[remoteJid] || []).filter(
  item => Date.now() - item.at < 60000
);
staticData.recentBotTexts[remoteJid].push({ text: aiText, at: Date.now() });
if (staticData.recentBotTexts[remoteJid].length > 8) {
  staticData.recentBotTexts[remoteJid] = staticData.recentBotTexts[remoteJid].slice(-8);
}

// Mettre à jour l'historique de conversation (24 messages = 12 allers-retours complets)
staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];
staticData.conversations[remoteJid].push({ role: "user", text: userText });
staticData.conversations[remoteJid].push({ role: "model", text: aiText });

if (staticData.conversations[remoteJid].length > 24) {
  staticData.conversations[remoteJid] = staticData.conversations[remoteJid].slice(-24);
}

return [{
  json: {
    remoteJid,
    senderPhone,
    aiText
  }
}];`
      },
      id: "parse-ai-reply",
      name: "3. Parser Réponse IA",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1640, 720]
    },

    // -------------------------------------------------------------------------
    // 9. ENVOYER LA RÉPONSE WHATSAPP UNIQUE (Via Evolution API)
    // -------------------------------------------------------------------------
    {
      parameters: {
        method: "POST",
        url: "http://evolution-api:8080/message/sendText/technozi",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "apikey", value: EVOLUTION_API_KEY },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify({ number: $json.remoteJid, text: $json.aiText }) }}",
        options: {
          timeout: 15000
        }
      },
      id: "send-evolution-whatsapp",
      name: "4. Envoyer Réponse WhatsApp",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1900, 560]
    }
  ],
  connections: {
    "Page Web QR Code (GET)": {
      main: [[{ node: "Récupérer QR Evolution", type: "main", index: 0 }]]
    },
    "Récupérer QR Evolution": {
      main: [[{ node: "Afficher Page HTML QR", type: "main", index: 0 }]]
    },
    "Webhook Messages Evolution": {
      main: [[{ node: "1. Filtre & Détecteur Humain", type: "main", index: 0 }]]
    },
    "1. Filtre & Détecteur Humain": {
      main: [[{ node: "Est-ce une alerte technique ?", type: "main", index: 0 }]]
    },
    "Est-ce une alerte technique ?": {
      main: [
        [{ node: "Alerte Développeur (Email)", type: "main", index: 0 }],
        [{ node: "Salut simple / Menu ?", type: "main", index: 0 }]
      ]
    },
    "Salut simple / Menu ?": {
      main: [
        [{ node: "Menu Rapide Instantané (1 Bulle)", type: "main", index: 0 }],
        [
          { node: "Afficher 'En train d'écrire...'", type: "main", index: 0 },
          { node: "2. Cerveau IA Gemini (Gratuit)", type: "main", index: 0 }
        ]
      ]
    },
    "Menu Rapide Instantané (1 Bulle)": {
      main: [[{ node: "4. Envoyer Réponse WhatsApp", type: "main", index: 0 }]]
    },
    "2. Cerveau IA Gemini (Gratuit)": {
      main: [[{ node: "3. Parser Réponse IA", type: "main", index: 0 }]]
    },
    "3. Parser Réponse IA": {
      main: [[{ node: "4. Envoyer Réponse WhatsApp", type: "main", index: 0 }]]
    }
  },
  settings: {
    executionOrder: "v1"
  }
};

const outputPath = path.join(__dirname, '..', 'workflows', 'technozi_ai_copilot_v2.json');
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log("Workflow Production-Ready généré avec succès dans : " + outputPath);
