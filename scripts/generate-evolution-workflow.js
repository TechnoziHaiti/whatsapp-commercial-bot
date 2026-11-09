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

// Commande développeur / test (/reset) pour repartir sur une session vierge
if (userText && userText.toLowerCase().match(/^(\\/reset|reset bot|reinitialiser)$/)) {
  delete staticData.conversations[remoteJid];
  userText = "Bonjour ! (La session vient d'être réinitialisée pour test : accueillez-moi chaleureusement et brièvement comme au premier contact.)";
}

// Gestion intelligente des messages vocaux audio et médias sans texte
if (!userText) {
  if (msg.audioMessage) {
    userText = "[MESSAGE VOCAL AUDIO REÇU] : Le client vient d'envoyer un message vocal audio sur WhatsApp que vous ne pouvez pas encore écouter en direct. Répondez-lui poliment et chaleureusement (dans la langue de l'historique, sinon brièvement en Kreyòl Ayisyen et Français) pour l'inviter à écrire sa demande par texte afin que vous l'aidiez tout de suite, et précisez qu'un conseiller Technozi écoutera aussi son vocal rapidement.";
  } else if (msg.imageMessage || msg.videoMessage || msg.documentMessage) {
    userText = "[FICHIER / PHOTO REÇU SANS TEXTE] : Le client vient d'envoyer une image, vidéo ou document sans texte d'accompagnement. Remerciez-le poliment pour l'envoi et demandez-lui de préciser par écrit sa demande ainsi que son nom et sa ville en Haïti.";
  } else {
    return [];
  }
}

staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];
const history = staticData.conversations[remoteJid];
const isNewConversation = history.length === 0;

return [{
  json: {
    senderPhone,
    remoteJid,
    pushName,
    userText,
    history,
    isNewConversation,
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
    // 5. ENVOI DE L'INDICATEUR D'ÉCRITURE ("En train d'écrire...")
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
      position: [940, 440],
      continueOnFail: true
    },

    // -------------------------------------------------------------------------
    // 6. CERVEAU IA GOOGLE GEMINI 3.5 FLASH-LITE (RAPIDE & HAUT QUOTA GRATUIT)
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
            const isNewConversation = $json.isNewConversation === true || history.length === 0;

            let haitiTimeInfo = "";
            try {
              const now = new Date();
              const jour = now.toLocaleDateString('fr-FR', { timeZone: 'America/Port-au-Prince', weekday: 'long' });
              const heure = now.toLocaleTimeString('fr-FR', { timeZone: 'America/Port-au-Prince', hour: '2-digit', minute: '2-digit' });
              haitiTimeInfo = jour + " à " + heure + " (heure d'Haïti)";
            } catch (e) {
              haitiTimeInfo = "Haïti";
            }

            const firstTurnInstruction = isNewConversation
              ? "STATUT DE LA DISCUSSION : PREMIER MESSAGE (DÉBUT DE CONVERSATION).\\nUn bloc texte d'options rapides numérotées (1 - Télécharger l'App, 2 - Voir le Site Web, 3 - Nos Horaires) va être envoyé juste en dessous de votre message. Rédigez donc un accueil court, chaleureux et naturel (ou répondez directement à sa question s'il en pose déjà une), SANS écrire vous-même de liste numérotée 1/2/3."
              : "STATUT DE LA DISCUSSION : CONVERSATION EN COURS.";

            const systemPrompt = \`Vous êtes Pitonbot, l'assistant virtuel intelligent de Technozi Haïti ("Faster & Easier") sur WhatsApp.
Votre mission est d'accueillir chaque client avec chaleur, respect et intelligence, de répondre avec exactitude à ses questions sur Technozi, et de qualifier proprement sa demande pour notre équipe.

1. LANGUE PERÇUE & ADAPTATION AUTOMATIQUE (ZÉRO MENU)
• Aucun menu de sélection de langue n'existe : détectez automatiquement la langue perçue dans le message du client (Kreyòl Ayisyen, Français, English, ou Español) et répondez NATURELLEMENT dans cette même langue.
• Si le client écrit dans une autre langue en plein milieu de la discussion (ex: commence en français puis écrit en créole ou en anglais), suivez-le immédiatement et naturellement dans sa nouvelle langue.
• Si le client mélange Kreyòl et Français, répondez dans la langue dominante avec beaucoup d'aisance.
• Qualité linguistique :
  - Kreyòl Ayisyen : créole haïtien authentique, poli, fluide et naturel en Haïti (utilisez "Bonjou" ou "Bonswa" selon l'heure locale ci-dessous, "Mèsi dèske w kontakte Technozi", "Kòman nou ka ede w ?", etc.).
  - Français : français soigné, chaleureux, clair et irréprochable.
  - English : natural, courteous, and professional English.

2. RÈGLE ABSOLUE : AUCUN PRIX NI ESTIMATION FINANCIÈRE
• Ne donnez JAMAIS de prix, ni de fourchette tarifaire, ni de montant estimatif en dollars ou en gourdes.
• Si le client demande un prix, expliquez avec tact que Technozi prépare des devis sur-mesure selon les caractéristiques exactes de chaque besoin et la zone d'intervention en Haïti, puis proposez de recueillir quelques détails pour lui établir une proposition précise.

3. BASE DE CONNAISSANCES OFFICIELLE TECHNOZI HAÏTI (NE RIEN INVENTER)
Technozi est une entreprise technologique multi-services. Starlink n'est qu'un produit parmi d'autres. Voici nos 6 domaines d'expertise (tous à égalité) :
• Énergie Solaire & Secours Hybride : panneaux solaires, onduleurs hybrides, batteries lithium pour maisons, bureaux et commerces.
• Internet Satellitaire & Starlink : kits officiels, installation soignée sur mât/toiture, orientation et distribution Wi-Fi.
• Vidéosurveillance & Sécurité (CCTV) : caméras IP HD, vision nocturne, enregistreurs NVR, accès à distance sur smartphone 24/7.
• Réseaux Informatiques & Wi-Fi Pro : câblage structuré certifié, baies de brassage, routeurs/switchs, couverture Wi-Fi multi-zones.
• Matériel & Équipements Informatiques : laptops professionnels (HP, Dell...), ordinateurs fixes, serveurs, écrans, imprimantes, routeurs, SSD et accessoires.
• Support & Maintenance Informatique : diagnostic, réparation, infogérance et assistance technique.

Coordonnées officielles vérifiées :
• Site Web : https://technozi-ht.com
• Téléphone / WhatsApp commercial : +509 37 03 0009
• E-mail : sales@technozi-ht.com
• Horaires : Lundi au Vendredi de 8h00 à 17h00 | Samedi de 8h00 à 15h00 | Dimanche fermé.
• Application Mobile officielle :
  - Android (Google Play) : https://play.google.com/store/apps/details?id=com.wiserpos.technozi&hl=en_SG
  - iPhone / iOS (App Store) : https://apps.apple.com/us/app/technozi-haiti/id6756228637?l=es-MX
• Chaîne WhatsApp : https://whatsapp.com/channel/0029Vb7XDp3EVccQG29idN2d

Interdiction d'hallucination : N'inventez jamais de prix, ni de disponibilité de stock en temps réel, ni d'adresse physique de rue non mentionnée ci-dessus, ni de délais fermes sans validation de l'équipe.

4. INTELLIGENCE CONVERSATIONNELLE, OPTIONS RAPIDES & QUALIFICATION NATURELLE
• \${firstTurnInstruction}
• Réponses exactes aux options rapides (par numéro OU par question libre à tout moment) :
  - Si le client répond "1", "option 1", "numéro 1", ou demande votre application par phrase libre ("où télécharger l'app ?", "ban m lyen app lan", "Android ou iPhone ?") : donnez immédiatement les deux liens officiels bien présentés :
    • Android (Google Play) : https://play.google.com/store/apps/details?id=com.wiserpos.technozi&hl=en_SG
    • iPhone / iOS (App Store) : https://apps.apple.com/us/app/technozi-haiti/id6756228637?l=es-MX
  - Si le client répond "2", "option 2", "numéro 2", ou demande votre site par phrase libre ("votre site web ?", "ki sit wèb nou ?") : partagez directement https://technozi-ht.com (+ la Chaîne WhatsApp https://whatsapp.com/channel/0029Vb7XDp3EVccQG29idN2d).
  - Si le client répond "3", "option 3", "numéro 3", ou demande vos heures d'ouverture ("à quelle heure ouvrez-vous ?", "ki lè nou fèmen ?", "êtes-vous ouverts ?") : donnez nos horaires exacts (Lun–Ven : 8h00 – 17h00, Samedi : 8h00 – 15h00, Dimanche : Fermé) et précisez gentiment si nos bureaux sont actuellement ouverts ou fermés selon l'heure locale d'Haïti !
  - Si le client demande à VOIR LES OPTIONS / le menu lui-même à n'importe quel moment ("menu", "meni", "options", "voir les options", "montre-moi le menu", "mwen vle wè meni an", "ki opsyon nou genyen ?", "show options", "show me the menu") : répondez brièvement et poliment que voici les options ci-dessous (SANS réécrire la liste 1/2/3 vous-même), et ajoutez obligatoirement le marqueur invisible [SHOW_OPTIONS] à la toute fin de votre réponse pour réafficher le bloc d'options numérotées.
  - Attention au contexte : si vous venez juste de demander une quantité (ex: "Combien de caméras ?") et que le client écrit "2", c'est bien sûr une quantité et non l'option 2 !
• Premier contact simple ("Bonjou", "Bonjour", "Hello") : accueillez chaleureusement au nom de Technozi Haïti et demandez brièvement comment nous pouvons l'aider aujourd'hui (évitez les longs pavés).
• Répondez directement à la question posée avant d'en poser une autre.
• Ne redemandez JAMAIS une information que le client a déjà mentionnée dans la discussion.
• Pour une demande de produit, installation ou devis, recueillez naturellement (1 à 2 questions courtes maximum par message, jamais d'interrogatoire) :
  1. Son Nom complet (ou le nom de son entreprise / organisation).
  2. Sa Ville ou Zone en Haïti (ex: Pétion-Ville, Delmas, Tabarre, Cap-Haïtien...).
  3. Le service/équipement précis et les précisions utiles selon le cas (ex: nombre de caméras, type de bâtiment, usages électriques pour le solaire, modèle/quantité de matériel, etc.).

5. CLÔTURE & FICHE RÉCAPITULATIVE (POUR DEVIS / COMMANDES)
• Une fois les éléments clés réunis, demandez-lui gentiment dans sa langue s'il a d'autres précisions ou questions à ajouter, ou s'il a terminé.
• Dès qu'il confirme qu'il a terminé (ou valide clairement la fin), affichez la Fiche Récapitulative structurée dans sa langue, prête à être relue et transmise à l'équipe :

📋 *Récapitulatif de votre demande* (adaptez les libellés en Kreyòl ou English si le client parle Kreyòl ou English) :
• *Client* : [Nom / Entreprise]
• *Téléphone* : \${phoneDisplay}
• *Ville / Zone* : [Ville ou quartier indiqué]
• *Service / Demande* : [Besoin exprimé]
• *Précisions* : [Détails techniques utiles ou "Aucune"]

Ajoutez une courte phrase chaleureuse confirmant que l'équipe Technozi prend le relais rapidement.

6. FORMATAGE WHATSAPP, SOBRIÉTÉ & PHRASES TOUJOURS COMPLÈTES
• Format WhatsApp natif : utilisez *gras* avec UNE SEULE étoile (n'utilisez JAMAIS **double étoile** ni ### titres Markdown).
• Restez sobre : 0 à 2 émojis discrets maximum par message, style humain, poli et fluide.
• Concision : maximum 2 à 3 paragraphes courts bien aérés.
• Terminez TOUJOURS complètement vos phrases et vos listes. Ne coupez jamais une phrase au milieu.

Contexte actuel :
• Date / Heure locale : \${haitiTimeInfo}
• Nom WhatsApp affiché : \${clientName}
• Numéro client : \${phoneDisplay}\`;

            const contents = [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "Bien reçu. Je détecterai automatiquement la langue du client (Kreyòl, Français, English ou autre), je répondrai avec intelligence et sobriété au nom de Technozi Haïti sans jamais donner de prix, et je terminerai toujours toutes mes phrases." }] }
            ];

            for (const h of history.slice(-16)) {
              contents.push({ role: h.role, parts: [{ text: h.text }] });
            }

            contents.push({ role: "user", parts: [{ text: userText }] });

            return {
              contents: contents,
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2048,
                thinkingConfig: {
                  thinkingLevel: "low"
                }
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
      position: [940, 620]
    },

    // -------------------------------------------------------------------------
    // 7. EXTRAIRE LA RÉPONSE DE L'IA & SAUVEGARDER L'HISTORIQUE
    // -------------------------------------------------------------------------
    {
      parameters: {
        jsCode: `// Parser proprement la réponse de Gemini et gérer les garde-fous WhatsApp
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
const isNewConversation = prevData.isNewConversation === true;

// Détecter si le client ou l'IA demande d'afficher les options rapides numérotées
const aiAskedOptions = /\\[(SHOW_OPTIONS|SHOW_MENU)\\]/i.test(aiText || "");
const trimmedUser = (userText || "").trim();
const userAskedOptions =
  /^(\\/?menu|meni|menú|options?|opsyon|menu rapide|meni rapid|options? rapides?|quick menu|quick options)$/i.test(trimmedUser) ||
  /\\b(voir le menu|afficher le menu|montre[- ]?moi le menu|revoir le menu|remets? le menu|voir les options|afficher les options|montre[- ]?moi les options|quelles? sont (?:vos|les) options|wè meni|ban m meni|afiche meni|montre m meni|wè opsyon|ban m opsyon|ki opsyon|show.*menu|see.*menu|show.*options|see.*options)\\b/i.test(trimmedUser);

const shouldSendOptions = isNewConversation || aiAskedOptions || userAskedOptions;

// Nettoyage léger au cas où Gemini glisserait des balises ou du Markdown non-WhatsApp
if (aiText) {
  aiText = aiText
    .replace(/\\[(SHOW_OPTIONS|SHOW_MENU)\\]/gi, "")
    .replace(/\\[SET_LANG:.*?\\]/gi, "")
    .replace(/\\*\\*([^*\\n]+?)\\*\\*/g, "*$1*")
    .replace(/^#{1,4}\\s+/gm, "")
    .trim();
}

// Secours multilingue si la réponse IA était vide
if (!aiText) {
  const lower = (userText || "").toLowerCase();
  if (/\\b(mwen|kreyol|kreyòl|bonjou|bonswa|konbyen|enstalasyon|oubyen|tanpri|bezwen|meni|opsyon)\\b/i.test(lower)) {
    aiText = shouldSendOptions && !isNewConversation
      ? "Men opsyon rapid Technozi Haïti yo anba a :"
      : "Mèsi dèske w kontakte *Technozi Haïti*. Nou kontan akeyi w jodi a.";
  } else if (/\\b(hello|hi|how|much|price|need|please|want|solar|can|english|what|where|menu|options)\\b/i.test(lower)) {
    aiText = shouldSendOptions && !isNewConversation
      ? "Here are the Technozi Haïti quick options below:"
      : "Thank you for contacting *Technozi Haïti*. Welcome! How can we assist you today?";
  } else {
    aiText = shouldSendOptions && !isNewConversation
      ? "Voici les options disponibles pour *Technozi Haïti* ci-dessous :"
      : "Merci d'avoir contacté *Technozi Haïti*. Bienvenue ! Comment pouvons-nous vous aider aujourd'hui ?";
  }
}

// Préparer les Options Rapides en texte structuré (la personne répond 1, 2, 3 ou écrit ce qu'elle veut faire)
const detectLang = (text) => {
  const s = (text || "").toLowerCase();
  if (/\\b(bonjou|bonswa|byenvini|kòman|koman|mèsi|dèske|deske|akeyi|bezwen|tanpri|kisa|pou w|ede w|avè w|souple|konbyen|enstalasyon|panno|kamera|solè|sole|meni|opsyon)\\b/i.test(s)) return "kr";
  if (/\\b(hello|welcome|how can i|how may i|assist you|help you|thank you|good morning|good afternoon|good evening|please|need|want|below)\\b/i.test(s)) return "en";
  if (/\\b(hola|bienvenido|buenos días|buenas tardes|cómo puedo|en qué puedo|gracias por|ayudarle|menú|opciones)\\b/i.test(s)) return "es";
  return "";
};
const optionsLang = detectLang(aiText) || detectLang(userText) || "fr";

let optionsText = "";

if (shouldSendOptions) {
  if (optionsLang === "kr") {
    optionsText = "📌 *Opsyon Rapid :*\\n1 - 📱 Telechaje Aplikasyon Mobil lan\\n2 - 🌐 Gade Sit Wèb Ofisyèl la\\n3 - 🕒 Wè Orè Travay Nou yo\\n\\n_Reponn *1*, *2*, *3* oswa di m dirèkteman sa w bezwen fè._";
  } else if (optionsLang === "en") {
    optionsText = "📌 *Quick Options:*\\n1 - 📱 Download our Mobile App\\n2 - 🌐 Visit our Official Website\\n3 - 🕒 View our Opening Hours\\n\\n_Reply *1*, *2*, *3* or tell me directly what you would like to do._";
  } else if (optionsLang === "es") {
    optionsText = "📌 *Opciones Rápidas:*\\n1 - 📱 Descargar nuestra App Móvil\\n2 - 🌐 Ver el Sitio Web Oficial\\n3 - 🕒 Ver Nuestros Horarios\\n\\n_Responda *1*, *2*, *3* o dígame directamente qué desea hacer._";
  } else {
    optionsText = "📌 *Options Rapides :*\\n1 - 📱 Télécharger l'Application Mobile\\n2 - 🌐 Voir le Site Web Officiel\\n3 - 🕒 Consulter Nos Horaires\\n\\n_Répondez *1*, *2*, *3* ou dites-moi directement ce que vous souhaitez faire._";
  }
}

const staticData = $getWorkflowStaticData('global');
staticData.conversations = staticData.conversations || {};
staticData.recentBotTexts = staticData.recentBotTexts || {};

// Enregistrer ces messages pour ne pas confondre l'écho du bot avec une réponse humaine (fromMe)
staticData.recentBotTexts[remoteJid] = (staticData.recentBotTexts[remoteJid] || []).filter(
  item => Date.now() - item.at < 60000
);
staticData.recentBotTexts[remoteJid].push({ text: aiText, at: Date.now() });
if (shouldSendOptions && optionsText) {
  staticData.recentBotTexts[remoteJid].push({ text: optionsText.trim(), at: Date.now() });
}
if (staticData.recentBotTexts[remoteJid].length > 8) {
  staticData.recentBotTexts[remoteJid] = staticData.recentBotTexts[remoteJid].slice(-8);
}

// Mettre à jour l'historique de conversation (16 messages = 8 allers-retours complets)
const storedModelReply = (shouldSendOptions && optionsText) ? (aiText + "\\n\\n" + optionsText) : aiText;
staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];
staticData.conversations[remoteJid].push({ role: "user", text: userText });
staticData.conversations[remoteJid].push({ role: "model", text: storedModelReply });

if (staticData.conversations[remoteJid].length > 16) {
  staticData.conversations[remoteJid] = staticData.conversations[remoteJid].slice(-16);
}

return [{
  json: {
    remoteJid,
    senderPhone,
    aiText,
    isNewConversation,
    shouldSendOptions,
    optionsText
  }
}];`
      },
      id: "parse-ai-reply",
      name: "3. Parser Réponse IA",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1200, 620]
    },

    // -------------------------------------------------------------------------
    // 8. ENVOYER LA RÉPONSE WHATSAPP (Via Evolution API)
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
      position: [1440, 520]
    },

    // -------------------------------------------------------------------------
    // 9. OPTIONS RAPIDES NUMÉROTÉES (DÉBUT DE CONVERSATION OU DEMANDE D'OPTIONS)
    // -------------------------------------------------------------------------
    {
      parameters: {
        conditions: {
          boolean: [
            {
              value1: "={{ $json.shouldSendOptions }}",
              value2: true
            }
          ]
        }
      },
      id: "check-new-conversation",
      name: "Doit afficher les options ?",
      type: "n8n-nodes-base.if",
      typeVersion: 1,
      position: [1440, 740]
    },
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
        jsonBody: "={{ JSON.stringify({ number: $json.remoteJid, text: $json.optionsText }) }}",
        options: {
          timeout: 15000
        }
      },
      id: "send-quick-options",
      name: "5. Envoyer Options Rapides (Texte)",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1680, 740],
      continueOnFail: true
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
        [
          { node: "Afficher 'En train d'écrire...'", type: "main", index: 0 },
          { node: "2. Cerveau IA Gemini (Gratuit)", type: "main", index: 0 }
        ]
      ]
    },
    "2. Cerveau IA Gemini (Gratuit)": {
      main: [[{ node: "3. Parser Réponse IA", type: "main", index: 0 }]]
    },
    "3. Parser Réponse IA": {
      main: [[
        { node: "4. Envoyer Réponse WhatsApp", type: "main", index: 0 },
        { node: "Doit afficher les options ?", type: "main", index: 0 }
      ]]
    },
    "Doit afficher les options ?": {
      main: [
        [{ node: "5. Envoyer Options Rapides (Texte)", type: "main", index: 0 }],
        []
      ]
    }
  },
  settings: {
    executionOrder: "v1"
  }
};

const outputPath = path.join(__dirname, '..', 'workflows', 'technozi_ai_copilot_v2.json');
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log("Workflow Production-Ready généré avec succès dans : " + outputPath);
