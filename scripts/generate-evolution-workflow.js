const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Identifiants & Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'CLE_GEMINI_PLACEHOLDER';
const EVOLUTION_API_KEY = 'technozi_evolution_key_2026';
const DEVELOPER_EMAIL = 'pitonrodjy@gmail.com';
const SALES_EMAIL = 'sales@technozi-ht.com';

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
      position: [420, 160],
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
      position: [640, 160]
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
      position: [200, 420],
      webhookId: "evolution-whatsapp"
    },
    {
      parameters: {
        jsCode: `// Filtrer et analyser le message entrant d'Evolution API
const body = $input.item.json.body || $input.item.json;

// 1. Gestion des événements de déconnexion
const eventType = body.event;
if (eventType === "connection.update") {
  const state = body.data?.state || body.data?.status;
  if (state === "close" || state === "disconnected") {
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

// 2. Traitement des messages
if (eventType !== "messages.upsert") {
  return [];
}

const data = body.data;
if (!data) return [];

const key = data.key;
if (!key) return [];

const remoteJid = key.remoteJid || "";

// Ignorer les messages de statut WhatsApp (stories) et les groupes
if (remoteJid.includes("@broadcast") || remoteJid.includes("@g.us")) {
  return [];
}

const senderPhone = remoteJid.replace("@s.whatsapp.net", "").replace(/[^0-9]/g, "");
const pushName = data.pushName || "Client";
const fromMe = key.fromMe === true;

// Détection de la mémoire globale
const staticData = $getWorkflowStaticData('global');
staticData.pausedUntil = staticData.pausedUntil || {};
staticData.conversations = staticData.conversations || {};

// =========================================================================
// RÈGLE D'OR : SI LE MESSAGE VIENT DE MOI (HUMAIN SUR LE SMARTPHONE)
// ON MET L'IA EN PAUSE PENDANT 30 MINUTES POUR LAISSER L'HUMAIN DISCUTER !
// =========================================================================
if (fromMe) {
  staticData.pausedUntil[remoteJid] = Date.now() + (30 * 60 * 1000); // 30 min de silence
  return [];
}

// SI LA CONVERSATION EST ENCORE EN COURS DE PRISE EN MAIN HUMAINE : NE PAS RÉPONDRE
if (staticData.pausedUntil[remoteJid] && Date.now() < staticData.pausedUntil[remoteJid]) {
  return [];
}

// Extraction du texte envoyé par le client
const msg = data.message;
if (!msg) return [];

let userText = msg.conversation || 
               msg.extendedTextMessage?.text || 
               msg.imageMessage?.caption || 
               msg.videoMessage?.caption || 
               msg.buttonsResponseMessage?.selectedButtonId || 
               msg.listResponseMessage?.singleSelectReply?.selectedRowId || 
               "";

userText = (userText || "").trim();
if (!userText) return [];

// Anti-doublon d'ID de message
staticData.processedIds = staticData.processedIds || [];
const msgId = key.id;
if (msgId && staticData.processedIds.includes(msgId)) {
  return [];
}
if (msgId) {
  staticData.processedIds.push(msgId);
  if (staticData.processedIds.length > 500) staticData.processedIds.shift();
}

// Historique de discussion pour Gemini
staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];
const history = staticData.conversations[remoteJid];

return [{
  json: {
    senderPhone,
    remoteJid,
    pushName,
    userText,
    history,
    isSystemAlert: false
  }
}];`
      },
      id: "filter-human-check",
      name: "1. Filtre & Détecteur Humain",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [440, 420]
    },

    // -------------------------------------------------------------------------
    // 3. AIGUILLAGE : ALERTE DÉCONNEXION OU CERVEAU IA
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
      position: [680, 420]
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
      position: [920, 260]
    },

    // -------------------------------------------------------------------------
    // 5. APPEL IA GOOGLE GEMINI 1.5 FLASH (GRATUIT)
    // -------------------------------------------------------------------------
    {
      parameters: {
        method: "POST",
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
            const history = $json.history || [];

            const systemPrompt = \`Ou se Pitonbot, asistan komèsyal entèlijan ofisyèl Technozi Haïti (Faster & Easier).
Misyon w se ede kliyan yo avèk jantiyès, pwofesyonalis ak efikasite nan lang yo prefere (Kreyòl Ayisyen oswa Français).

ENFÒMASYON SOU TECHNOZI :
• Slogan : Faster & Easier
• Sit Wèb : https://technozi-ht.com
• Telefòn komèsyal : +509 37 03 0009
• E-mail : sales@technozi-ht.com
• Orè : Lendi-Vandredi 8h-17h, Samdi 8h-15h
• 6 Gwo Sèvis Nou yo :
  1. Enèji Solè Ibrid (Ondilè, batri lityòm, panno)
  2. Entènèt Satelit Starlink (Vant kit estanda & enstalasyon pro)
  3. Kamera Siveyans CCTV (HD, vizyon nwit, aksè telefòn 24/7)
  4. Rezo Enfòmatik & Wi-Fi (Filaj sètifye, switch)
  5. Vant Materyèl Enfòmatik (Laptops pro, PC biwo, pyès)
  6. Sipò & Mentnans IT (Kontra mentnans, reparasyon)
• Aplikasyon mobil : Disponib sou Play Store ak App Store.

RÈG POU REPONS OU :
1. PALE NATIRÈLMAN : Reponn kliyan an nan lang li pale a (si l pale Kreyòl, reponn an Kreyòl dous ak pwofesyonèl; si l pale Français, reponn an Français).
2. DEMANN STARLINK : Si kliyan an di li bezwen yon Starlink, eksplike li ke nou vann kit la epi nou ka fè enstalasyon an tou si li vle. Mande l kisa li prefere.
3. DEMANN PROFORMA OUBYEN DEVIS : Si kliyan an mande yon proforma oswa yon devis, mande l jantiyeman non konplè oswa non antrepriz la, yon adrès imèl, ak vil/zòn kote l ye a pou ekip komèsyal la ka voye proforma ofisyèl la ba li.
4. PA FÈ ENTEWOGATWA : Pa di "Kesyon 1/7" oswa "2/5". Poze kesyon yo tankou yon moun k ap pale nan telefòn.
5. DEKLANCHE EMAIL : Lè ou fin gen tout enfòmasyon yo pou yon kòmand oswa yon proforma (Non, Ekipman/Sèvis, Zòn, Imèl si posib), mete nan tout fen repons ou an baliz sa a egzakteman :
[ENVOYER_EMAIL: {"client":"Non","produit":"Pwodwi","zone":"Zòn","email":"Imèl","type":"devis"}]
(Baliz sa a ap sèvi pou voye fich la bay ekip komèsyal la, kliyan an pap wè l).

Non kliyan an nan WhatsApp : \${clientName}
Nimewo telefòn : +\${phone}\`;

            // Construire les messages de contenu
            const contents = [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "Konprann 100%! Mwen pare pou m sèvi kliyan Technozi yo avèk entèlijans ak rapidite." }] }
            ];

            // Ajouter l'historique récent (4 derniers échanges)
            for (const h of history.slice(-4)) {
              contents.push({ role: h.role, parts: [{ text: h.text }] });
            }

            // Message actuel du client
            contents.push({ role: "user", parts: [{ text: userText }] });

            return {
              contents: contents,
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 800
              }
            };
          })()
        }}`,
        options: {
          timeout: 20000
        }
      },
      id: "call-gemini",
      name: "2. Cerveau IA Gemini (Gratuit)",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [920, 520]
    },

    // -------------------------------------------------------------------------
    // 6. EXTRAIRE LA RÉPONSE ET FORMATER L'ENVOI WHATSAPP
    // -------------------------------------------------------------------------
    {
      parameters: {
        jsCode: `// Parser la réponse de Gemini
const geminiRes = $input.item.json;
const candidate = geminiRes.candidates?.[0];
let aiText = candidate?.content?.parts?.[0]?.text || "Mèsi pou mesaj ou a. Ekip Technozi a resevwa l epi n ap reponn ou touswit !";

const prevData = $('1. Filtre & Détecteur Humain').item.json;
const remoteJid = prevData.remoteJid;
const senderPhone = prevData.senderPhone;
const userText = prevData.userText;

// Vérifier si un devis/proforma complet doit être envoyé par email
let shouldSendEmail = false;
let emailPayload = null;

const emailMatch = aiText.match(/\\[ENVOYER_EMAIL:\\s*(\\{.*?\\})\\]/s);
if (emailMatch) {
  try {
    emailPayload = JSON.parse(emailMatch[1]);
    shouldSendEmail = true;
  } catch (e) {}
  // Nettoyer la balise pour ne pas l'afficher au client WhatsApp
  aiText = aiText.replace(/\\[ENVOYER_EMAIL:.*?\\]/s, "").trim();
}

// Mettre à jour l'historique de conversation
const staticData = $getWorkflowStaticData('global');
staticData.conversations = staticData.conversations || {};
staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];

staticData.conversations[remoteJid].push({ role: "user", text: userText });
staticData.conversations[remoteJid].push({ role: "model", text: aiText });

// Garder maximum les 10 derniers échanges en mémoire
if (staticData.conversations[remoteJid].length > 10) {
  staticData.conversations[remoteJid] = staticData.conversations[remoteJid].slice(-10);
}

return [{
  json: {
    remoteJid,
    senderPhone,
    aiText,
    shouldSendEmail,
    emailPayload
  }
}];`
      },
      id: "parse-ai-reply",
      name: "3. Parser Réponse IA",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1160, 520]
    },

    // -------------------------------------------------------------------------
    // 7. ENVOYER LA RÉPONSE WHATSAPP VIA LA PASSERELLE EVOLUTION
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
        jsonBody: `={
          "number": "{{ $json.remoteJid }}",
          "text": "{{ $json.aiText }}"
        }`,
        options: {
          timeout: 15000
        }
      },
      id: "send-evolution-whatsapp",
      name: "4. Envoyer Réponse WhatsApp",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1400, 520]
    },

    // -------------------------------------------------------------------------
    // 8. VÉRIFIER SI UN EMAIL COMMERCIAL DOIT ÊTRE ENVOYÉ
    // -------------------------------------------------------------------------
    {
      parameters: {
        conditions: {
          boolean: [
            {
              value1: "={{ $('3. Parser Réponse IA').item.json.shouldSendEmail }}",
              value2: true
            }
          ]
        }
      },
      id: "if-send-commercial-email",
      name: "Doit envoyer Email Commercial ?",
      type: "n8n-nodes-base.if",
      typeVersion: 1,
      position: [1640, 520]
    },

    // -------------------------------------------------------------------------
    // 9. EXPÉDIER L'EMAIL DE PROFORMA/COMMANDE À SALES@TECHNOZI-HT.COM
    // -------------------------------------------------------------------------
    {
      parameters: {
        fromEmail: "sales@technozi-ht.com",
        toEmail: SALES_EMAIL,
        subject: "={{ `[PROFORMA / COMMANDE TECHNOZI] - ` + ($('3. Parser Réponse IA').item.json.emailPayload?.client || 'Client') }}",
        emailFormat: "html",
        html: `={{
          \`<h2>NOUVELLE DEMANDE COMMERCIALE (IA TECHNOZI)</h2>
          <hr>
          <p><b>Client :</b> \${$('3. Parser Réponse IA').item.json.emailPayload?.client || 'Non renseigné'}</p>
          <p><b>Téléphone :</b> +\${$('3. Parser Réponse IA').item.json.senderPhone}</p>
          <p><b>E-mail :</b> \${$('3. Parser Réponse IA').item.json.emailPayload?.email || 'Non renseigné'}</p>
          <p><b>Produit / Service :</b> \${$('3. Parser Réponse IA').item.json.emailPayload?.produit || 'Non renseigné'}</p>
          <p><b>Zone / Ville :</b> \${$('3. Parser Réponse IA').item.json.emailPayload?.zone || 'Non renseigné'}</p>
          <hr>
          <p><b>Action immédiate :</b></p>
          <p><a href="https://wa.me/\${$('3. Parser Réponse IA').item.json.senderPhone}" style="background:#00a884;color:white;padding:10px 18px;text-decoration:none;border-radius:8px;display:inline-block;">Répondre directement sur WhatsApp</a></p>\`
        }}`,
        options: {}
      },
      credentials: {
        smtp: {
          id: "kJkckSErhAAeGSci",
          name: "SMTP account"
        }
      },
      id: "send-sales-email",
      name: "5. Expédier Email Commercial",
      type: "n8n-nodes-base.emailSend",
      typeVersion: 2.1,
      position: [1880, 500]
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
        [{ node: "2. Cerveau IA Gemini (Gratuit)", type: "main", index: 0 }]
      ]
    },
    "2. Cerveau IA Gemini (Gratuit)": {
      main: [[{ node: "3. Parser Réponse IA", type: "main", index: 0 }]]
    },
    "3. Parser Réponse IA": {
      main: [[{ node: "4. Envoyer Réponse WhatsApp", type: "main", index: 0 }]]
    },
    "4. Envoyer Réponse WhatsApp": {
      main: [[{ node: "Doit envoyer Email Commercial ?", type: "main", index: 0 }]]
    },
    "Doit envoyer Email Commercial ?": {
      main: [[{ node: "5. Expédier Email Commercial", type: "main", index: 0 }]]
    }
  },
  settings: {
    executionOrder: "v1"
  }
};

const outputPath = path.join(__dirname, '..', 'workflows', 'technozi_ai_copilot_v2.json');
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log("Nouveau Workflow IA Généré avec succès dans : " + outputPath);
