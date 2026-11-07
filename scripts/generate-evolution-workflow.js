const fs = require('fs');
const path = require('path');

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
// ON MET L'IA EN PAUSE PENDANT 15 MINUTES POUR LAISSER L'HUMAIN DISCUTER !
// =========================================================================
if (fromMe) {
  staticData.pausedUntil[remoteJid] = Date.now() + (15 * 60 * 1000); // 15 min de silence
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
    // 5. APPEL IA GOOGLE GEMINI 3.5 FLASH (GRATUIT, TRILINGUE, PRO & SANS PRIX)
    // -------------------------------------------------------------------------
    {
      parameters: {
        method: "POST",
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

            const systemPrompt = \`Vous êtes l'assistant d'accueil et de qualification officiel de Technozi Haïti (Faster & Easier).
Votre rôle est d'accueillir chaque client avec une extrême gentillesse, un profond respect et un grand professionnalisme, d'écouter attentivement sa demande, et de noter proprement ses doléances pour l'équipe Technozi.

RÈGLE D'OR N°1 : TRILINGUE NATUREL (Français, Kreyòl Ayisyen, English)
Détectez automatiquement la langue du client et répondez toujours dans sa langue :
• S'il parle Kreyòl : répondez en Kreyòl Ayisyen fluide, très poli et professionnel.
• S'il parle Français : répondez en Français soigné, chaleureux et irréprochable.
• S'il parle Anglais : répondez en English professionnel, courtois et impeccable.

RÈGLE D'OR N°2 : AUCUN PRIX NI TARIF FIXE
NE DONNEZ JAMAIS DE PRIX ou d'estimation financière.
Si le client demande un prix, expliquez-lui avec beaucoup de courtoisie que Technozi établit des devis sur-mesure selon la nature exacte de chaque projet et sa zone géographique en Haïti. Proposez-lui de recueillir ses détails pour que l'équipe Technozi prépare sa proposition exacte.

RÈGLE D'OR N°3 : TOUS LES SERVICES DE TECHNOZI SONT ÉGAUX
Technozi est une entreprise technologique multi-services. Starlink n'est pas le seul produit. Le client est libre de demander ce qu'il souhaite :
• Énergie Solaire & Systèmes de Secours (Onduleurs hybrides, batteries lithium, panneaux solaires)
• Internet Satellitaire & Starlink (Kits officiels et installations soignées sur mât/toiture)
• Caméras de Sécurité & Surveillance (Systèmes CCTV HD, vision nocturne, accès distant)
• Réseaux Informatiques & Wi-Fi (Câblage structuré certifié, Wi-Fi professionnel)
• Matériel & Équipements Informatiques (Laptops professionnels, ordinateurs de bureau, accessoires)
• Support & Maintenance Informatique (Assistance technique, diagnostics, réparations)
• Toute autre doléance ou demande technologique.

RÈGLE D'OR N°4 : STYLE & SOBRIÉTÉ (Pas d'avalanche d'émojis ni de monotonie)
• Soyez chaleureux et très poli, sans réponses robotiques copier-coller.
• Évitez l'accumulation d'icônes : au maximum 1 ou 2 émojis discrets par message.
• Privilégiez des phrases claires et bien aérées avec des puces (•).

RÈGLE D'OR N°5 : RECUEIL DES COORDONNÉES
Recueillez poliment auprès du client au fil de la discussion :
1. Son Nom complet (ou Nom de son entreprise/organisation).
2. Sa Ville / Zone géographique en Haïti (ex: Pétion-Ville, Delmas, Cap-Haïtien, etc.).
3. Sa demande / doléance précise.

RÈGLE D'OR N°6 : VÉRIFICATION DE FIN & FICHE RÉCAPITULATIVE
1. Une fois que vous avez répondu à ses questions et noté son besoin :
Demandez-lui gentiment s'il a terminé ou s'il souhaite ajouter d'autres précisions :
• FR : "Avez-vous d'autres précisions ou questions à ajouter, ou avons-nous fait le tour de votre demande ?"
• KR : "Èske w gen yon lòt presizyon oswa kesyon ou ta renmen ajoute, oswa èske nou kouvri tout sa w te bezwen ?"
• EN : "Do you have any other details or questions to add, or have we covered everything you need?"

2. Dès que le client confirme qu'il a terminé ("C'est bon", "Non c'est tout", "M fini", "That's all", "Oui j'ai terminé", etc.) :
Affichez immédiatement la FICHE RÉCAPITULATIVE structurée suivante :

📋 Récapitulatif de votre demande :
• Client : [Nom ou Entreprise]
• Téléphone : +\${phone}
• Ville / Zone : [Localisation indiquée]
• Service / Demande : [Doléance précise exprimée par le client]
• Précisions : [Détails ou contraintes particulières, ou "Aucune"]

Merci beaucoup ! Vos informations sont bien enregistrées. Notre équipe Technozi révise votre dossier pour vous recontacter très rapidement.

(Adaptez le texte du récapitulatif en Créole ou en Anglais si la conversation est en Créole ou en Anglais).

Coordonnées du client :
Nom WhatsApp : \${clientName}
Numéro : +\${phone}\`;

            // Construire les messages de contenu
            const contents = [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "Bien reçu et parfaitement compris. Je suis prêt à accueillir et qualifier chaque client de Technozi avec excellence, sobriété, et sans jamais donner de prix." }] }
            ];

            // Ajouter l'historique récent (6 derniers échanges)
            for (const h of history.slice(-6)) {
              contents.push({ role: h.role, parts: [{ text: h.text }] });
            }

            // Message actuel du client
            contents.push({ role: "user", parts: [{ text: userText }] });

            return {
              contents: contents,
              generationConfig: {
                temperature: 0.35,
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
    // 6. EXTRAIRE LA RÉPONSE DE L'IA
    // -------------------------------------------------------------------------
    {
      parameters: {
        jsCode: `// Parser la réponse de Gemini
const geminiRes = $input.item.json;
const candidate = geminiRes.candidates?.[0];
let aiText = candidate?.content?.parts?.[0]?.text || "Merci pour votre message. L'équipe Technozi a bien reçu votre demande et vous répondra très rapidement.";

const prevData = $('1. Filtre & Détecteur Humain').item.json;
const remoteJid = prevData.remoteJid;
const senderPhone = prevData.senderPhone;
const userText = prevData.userText;

// Mettre à jour l'historique de conversation
const staticData = $getWorkflowStaticData('global');
staticData.conversations = staticData.conversations || {};
staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];

staticData.conversations[remoteJid].push({ role: "user", text: userText });
staticData.conversations[remoteJid].push({ role: "model", text: aiText });

// Garder maximum les 12 derniers échanges en mémoire
if (staticData.conversations[remoteJid].length > 12) {
  staticData.conversations[remoteJid] = staticData.conversations[remoteJid].slice(-12);
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
      position: [1160, 520]
    },

    // -------------------------------------------------------------------------
    // 7. ENVOYER LA RÉPONSE WHATSAPP (Via Evolution API avec Body Parameters)
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
      position: [1400, 520]
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
    }
  },
  settings: {
    executionOrder: "v1"
  }
};

const outputPath = path.join(__dirname, '..', 'workflows', 'technozi_ai_copilot_v2.json');
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log("Nouveau Workflow IA Généré avec succès dans : " + outputPath);
