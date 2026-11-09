const fs = require('fs');
const path = require('path');

// Identifiants & Configuration
// Pour dépôt public : placeholder sécurisé (la vraie clé reste dans le .env secret et n8n)
const GEMINI_API_KEY = 'VOTRE_CLE_GEMINI_ICI';
const EVOLUTION_API_KEY = 'technozi_evolution_key_2026';
const DEVELOPER_EMAIL = 'pitonrodjy@gmail.com';

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
            const b64 = data?.base64 || data?.qrcode?.base64 || "";
            const isConnected = data?.instance?.status === "open" || data?.status === "open" || data?.state === "open";
            
            if (isConnected) {
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
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="badge">✅</div>
                  <h1>WhatsApp Technozi est Connecté !</h1>
                  <p>L'assistant IA est en ligne et surveille vos messages 24h/24.<br><br>Vous pouvez discuter normalement depuis votre téléphone.</p>
                </div>
              </body>
              </html>\`;
            }

            if (!b64) {
              return \`<!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta http-equiv="refresh" content="5">
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
              <meta http-equiv="refresh" content="12">
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
    staticData.pausedUntil[remoteJid] = Date.now() + (15 * 60 * 1000); // Pause IA de 15 minutes
    // Mémoriser brièvement la réponse humaine pour la continuité si l'IA reprend plus tard
    if (extractedText) {
      staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];
      staticData.conversations[remoteJid].push({
        role: "model",
        text: "[Réponse envoyée par un conseiller humain Technozi] : " + extractedText
      });
      if (staticData.conversations[remoteJid].length > 16) {
        staticData.conversations[remoteJid] = staticData.conversations[remoteJid].slice(-16);
      }
      staticData.lastActive[remoteJid] = Date.now();
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
const pushName = (data.pushName || "").trim() || "Client";

// Expiration automatique de la mémoire de discussion après 12h d'inactivité
if (staticData.lastActive[remoteJid] && (Date.now() - staticData.lastActive[remoteJid] > 12 * 60 * 60 * 1000)) {
  delete staticData.conversations[remoteJid];
}
staticData.lastActive[remoteJid] = Date.now();

let userText = extractedText;
let isResetCommand = false;

// Commande développeur / test (/reset) pour repartir sur une session vierge
if (userText && userText.toLowerCase().match(/^(\\/reset|reset bot|reinitialiser)$/)) {
  delete staticData.conversations[remoteJid];
  isResetCommand = true;
  userText = "Bonjour";
}

// Gestion intelligente des messages vocaux audio et médias sans texte
if (!userText) {
  if (msg.audioMessage) {
    userText = "[MESSAGE VOCAL AUDIO REÇU] : Le client a envoyé un vocal WhatsApp impossible à écouter ici. Invitez-le en 1 phrase courte (dans sa langue, sinon Kreyòl & Français) à écrire sa demande par texte et précisez qu'un conseiller l'écoutera.";
  } else if (msg.imageMessage || msg.videoMessage || msg.documentMessage) {
    userText = "[FICHIER / PHOTO REÇU SANS TEXTE] : Le client a envoyé un média sans texte. Demandez-lui en 1 phrase courte de préciser par écrit son besoin ainsi que son nom et sa ville en Haïti.";
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
  if (/\\b(bonjou|bonswa|sak pase|kòman|koman|mwen|konbyen|koute|enstalasyon|bezwen|nan|pou|devi|pwofòma|tanpri|mèsi|pa gen|lòt|biwo|meni|opsyon|kamera|panno|oubyen|rezime|wi|kote|epitou)\\b|solè(?![a-zà-ÿ])/i.test(s)) return "kr";
  if (/\\b(hello|hi|hey|yes|yeah|good morning|good afternoon|good evening|how much|what are|do you|can you|i need|we need|i want|we want|quote|proforma invoice|price|pricing|cost|opening|website|download|please|thanks|thank you|nothing else|that's all|show.*menu|show.*options)\\b/i.test(s)) return "en";
  if (/\\b(hola|buenos|buenas|cotización|necesito|quiero|cuánto|cuanto|gracias|por favor|horarios|sitio web|descargar|nada más|eso es todo)\\b|menú(?![a-zà-ÿ])/i.test(s)) return "es";
  if (/\\b(bonjour|bonsoir|salut|oui|non|devis|combien|coûte|coute|installation|besoin|je veux|nous voulons|voudrais|souhaite|merci|rien d'autre|c'est tout|horaires?|télécharger|application|site web|voir|afficher|s'il vous plaît|svp)\\b/i.test(s)) return "fr";
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
  (isNewConversation && /^(bonjou|bonswa|sak pase|bonjour|bonsoir|salut|hello|hi|hey|hola|buenos d[ií]as|good morning|good afternoon|good evening)[!.,?\\s]*$/i.test(trimmedLower));
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
if (staticData.conversations[remoteJid].length > 16) {
  staticData.conversations[remoteJid] = staticData.conversations[remoteJid].slice(-16);
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
            const activeLangCode = $json.activeLang || "fr";
            const langNames = { kr: "Kreyòl Ayisyen", en: "English", es: "Español", fr: "Français" };
            const activeLangLabel = langNames[activeLangCode] || "Français";

            let haitiTimeInfo = "";
            try {
              const now = new Date();
              const jour = now.toLocaleDateString('fr-FR', { timeZone: 'America/Port-au-Prince', weekday: 'long' });
              const heure = now.toLocaleTimeString('fr-FR', { timeZone: 'America/Port-au-Prince', hour: '2-digit', minute: '2-digit' });
              haitiTimeInfo = jour + " à " + heure + " (heure d'Haïti)";
            } catch (e) {
              haitiTimeInfo = "Haïti";
            }

            const systemPrompt = \`Vous êtes Pitonbot, l'assistant WhatsApp de Technozi Haïti ("Faster & Easier").

1. LANGUE OBLIGATOIRE (ZÉRO MÉLANGE)
Répondez EXCLUSIVEMENT dans la langue indiquée par [LANGUE ACTIVE] (ou dans la nouvelle langue si le client vient d'en changer avec ses propres mots), sans JAMAIS mélanger des mots d'une autre langue :
• En Français : utilisez "devis", "proforma" (jamais de mot créole).
• En Kreyòl Ayisyen : créole haïtien simple et naturel ("Bonjou", "Bonswa", "kit Starlink", "zòn enstalasyon an", "kamera", "panno solè", "devi", "pwofòma"). Évitez les calques compliqués.
• En English : natural concise English ("Quote", "Proforma Invoice").
• En Español : español claro y directo ("Cotización", "Factura Proforma").

2. STYLE — ULTRA-DIRECT, SEC ET TRANCHANT
• 1 à 2 phrases courtes maximum par réponse (sauf liens, horaires ou récapitulatif final).
• INTERDIT : formules de politesse longues ("C'est un plaisir...", "Merci de nous avoir contactés", "N'hésitez surtout pas..."). Allez droit au but.
• Ne redemandez JAMAIS une information déjà donnée dans la discussion, ni le numéro de téléphone (vous l'avez déjà : \${phoneDisplay}).
• Format WhatsApp : *gras* avec UNE SEULE étoile (jamais **double étoile**, jamais ###). 0 à 1 émoji max par message.

3. RÈGLE ABSOLUE : ZÉRO PRIX NI ESTIMATION
• Ne donnez JAMAIS de prix, fourchette ou montant estimatif.
• Si le client demande un prix : répondez en 1 phrase que les tarifs varient selon le besoin exact et la zone en Haïti, puis demandez uniquement l'information manquante.

4. BASE OFFICIELLE TECHNOZI HAÏTI (6 SERVICES À ÉGALITÉ)
Services : Énergie Solaire & Secours Hybride (panneaux, onduleurs, batteries lithium), Internet Starlink & installation, Vidéosurveillance CCTV/IP, Réseaux & Wi-Fi Pro, Matériel IT (laptops HP/Dell, PC, serveurs, imprimantes, routeurs, SSD), Support & Maintenance IT.
• Site Web : https://technozi-ht.com
• Tél / WhatsApp : +509 37 03 0009 | Email : sales@technozi-ht.com
• Horaires : Lun–Ven 8h00–17h00 | Samedi 8h00–15h00 | Dimanche fermé.
• App Android : https://play.google.com/store/apps/details?id=com.wiserpos.technozi&hl=en_SG
• App iOS (iPhone) : https://apps.apple.com/us/app/technozi-haiti/id6756228637?l=es-MX
• Chaîne WhatsApp : https://whatsapp.com/channel/0029Vb7XDp3EVccQG29idN2d
Interdiction d'inventer des prix, stocks en temps réel ou adresse de rue.

5. OPTIONS 1–5 (DEVIS ET PROFORMA SÉPARÉS)
• Option *1* (ou demande sur l'app) : donnez directement les 2 liens (Android + iOS) sans paragraphe autour.
• Option *2* (ou demande sur le site) : donnez directement https://technozi-ht.com + Chaîne WhatsApp.
• Option *3* (ou horaires) : donnez les horaires exacts + précisez si nos bureaux sont actuellement ouverts ou fermés selon l'heure locale d'Haïti ci-dessous.
• Option *4* (*Devis* — projet, installation ou estimation) : demandez uniquement ce qui manque parmi Nom/Entreprise, Ville/Zone en Haïti, et besoin technique/détails.
• Option *5* (*Proforma* — facture proforma officielle d'achat) : demandez uniquement ce qui manque parmi Nom/Entreprise à facturer, Ville/Zone, articles/modèles & quantités exactes, plus e-mail facultatif pour envoi PDF (sinon WhatsApp).
• Si vous venez juste de demander une quantité (ex: "Combien de caméras ?") et que le client répond "4" ou "5", c'est une quantité et non l'option du menu !
• Si le client demande à revoir le menu / les options : 1 courte phrase + [SHOW_OPTIONS].

6. RÈGLE IMPÉRATIVE DE CLÔTURE — TOUJOURS FINIR AVEC UN RÉCAPITULATIF COMPLET DE TOUT
• Dès que vous avez les infos essentielles (Nom/Entreprise + Ville/Zone + Besoin) ET que le client indique qu'il n'a rien à ajouter ("c'est tout", "rien d'autre", "oui", "merci", "pa gen lòt detay", "se sa", "non mèsi", "that's all") : **NE REPOSEZ PLUS AUCUNE QUESTION DE CONFIRMATION**. Générez IMMÉDIATEMENT le Récapitulatif complet de tout ce qui a été convenu.
• À la fin de toute demande commerciale (devis, proforma, commande, installation ou support), terminez TOUJOURS par le Récapitulatif complet structuré, sans oublier aucun détail mentionné (entreprise, téléphone, e-mail si donné, ville, type de demande, articles/quantités, précisions), 100 % dans la langue du client :

Libellés selon langue :
- Français Devis : 📋 *Récapitulatif complet de votre demande* (Client / Entreprise, Téléphone, Ville / Zone, Type, Besoin & Précisions)
- Français Proforma : 🧾 *Récapitulatif complet — Demande de Proforma* (Client / Entreprise, Téléphone, Email, Ville / Zone, Articles & Quantités, Précisions)
- Kreyòl Devi : 📋 *Rezime konplè demann ou an* (Kliyan / Antrepriz, Telefòn, Vil / Zòn, Kalite, Bezwen & Presizyon)
- Kreyòl Pwofòma : 🧾 *Rezime konplè — Demann Pwofòma* (Kliyan / Antrepriz, Telefòn, Imèl, Vil / Zòn, Atik & Kantite, Presizyon)
- English Quote : 📋 *Complete Request Summary* (Client / Company, Phone, City / Area, Type, Request & Details)
- English Proforma : 🧾 *Proforma Request Summary* (Client / Company, Phone, Email, City / Area, Items & Quantities, Notes)

Ajoutez juste en dessous 1 phrase courte confirmant que l'équipe Technozi prend le relais rapidement.

Contexte actuel :
• Date / Heure locale Haïti : \${haitiTimeInfo}
• Nom WhatsApp affiché : \${clientName}
• Numéro WhatsApp client : \${phoneDisplay}\`;

            const contents = [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "Compris. Réponses ultra-directes en 1–2 phrases max dans la langue exacte du client, options 4 (Devis) et 5 (Proforma) distinctes, et récapitulatif final complet systématique." }] }
            ];

            for (const h of history.slice(-16)) {
              contents.push({ role: h.role, parts: [{ text: h.text }] });
            }

            contents.push({ role: "user", parts: [{ text: "[LANGUE ACTIVE OBLIGATOIRE : " + activeLangLabel + "]\\n" + userText }] });

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
          timeout: 60000
        }
      },
      retryOnFail: true,
      maxTries: 2,
      waitBetweenTries: 1500,
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

let aiText = (visibleParts.join("\\n") || candidate?.content?.parts?.[0]?.text || "").trim();

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

// Nettoyage Markdown non-WhatsApp
if (aiText) {
  aiText = aiText
    .replace(/\\[(SHOW_OPTIONS|SHOW_MENU)\\]/gi, "")
    .replace(/\\[SET_LANG:.*?\\]/gi, "")
    .replace(/\\*\\*([^*\\n]+?)\\*\\*/g, "*$1*")
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
    aiText = "Tanpri presize demann ou a (non w, vil ou, ak ekipman w bezwen an) pou ekip Technozi a ka ede w rapidman.";
  } else if (activeLang === "en") {
    aiText = "Please share your request details (name, city in Haiti, and what you need) so Technozi can assist you right away.";
  } else if (activeLang === "es") {
    aiText = "Por favor indique su nombre, ciudad en Haití y lo que necesita para atenderle de inmediato.";
  } else {
    aiText = "Précisez votre besoin (nom, ville en Haïti et demande) pour que l'équipe Technozi vous réponde rapidement.";
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

// Mettre à jour l'historique de conversation (16 messages = 8 allers-retours complets)
staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];
staticData.conversations[remoteJid].push({ role: "user", text: userText });
staticData.conversations[remoteJid].push({ role: "model", text: aiText });

if (staticData.conversations[remoteJid].length > 16) {
  staticData.conversations[remoteJid] = staticData.conversations[remoteJid].slice(-16);
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
