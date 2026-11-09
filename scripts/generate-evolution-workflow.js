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

// Helper SHA-256 autonome (sans require) pour décoder les votes de sondages WhatsApp s'ils arrivent hachés
function utf8Bytes(str) {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      out.push(code);
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(++i);
      const cp = 0x10000 + (((code & 0x3ff) << 10) | (next & 0x3ff));
      out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return out;
}
function sha256DigestBytes(bytes) {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const msgBytes = bytes.slice();
  const bitLen = msgBytes.length * 8;
  msgBytes.push(0x80);
  while ((msgBytes.length % 64) !== 56) msgBytes.push(0);
  const hi = Math.floor(bitLen / 4294967296);
  const lo = bitLen >>> 0;
  msgBytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255);
  msgBytes.push((lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
  const rrot = (v, n) => (v >>> n) | (v << (32 - n));
  for (let i = 0; i < msgBytes.length; i += 64) {
    const w = new Array(64);
    for (let j = 0; j < 16; j++) {
      w[j] = (msgBytes[i + j * 4] << 24) | (msgBytes[i + j * 4 + 1] << 16) | (msgBytes[i + j * 4 + 2] << 8) | msgBytes[i + j * 4 + 3];
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rrot(w[j - 15], 7) ^ rrot(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rrot(w[j - 2], 17) ^ rrot(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let j = 0; j < 64; j++) {
      const S1 = rrot(e, 6) ^ rrot(e, 11) ^ rrot(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const t1 = (h + S1 + ch + K[j] + w[j]) | 0;
      const S0 = rrot(a, 2) ^ rrot(a, 13) ^ rrot(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  const out = [];
  for (const x of H) out.push((x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255);
  return out;
}
function bytesToHex(bytes) {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}
function bytesToBase64(bytes) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let res = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    res += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] +
      (i + 1 < bytes.length ? chars[(n >> 6) & 63] : '=') +
      (i + 2 < bytes.length ? chars[n & 63] : '=');
  }
  return res;
}

const POLL_CHOICES = [
  { id: "menu_app", text: "📱 Télécharger l'App Mobile" },
  { id: "menu_site", text: "🌐 Voir le Site Web Officiel" },
  { id: "menu_horaires", text: "🕒 Consulter Nos Horaires" },
  { id: "menu_app", text: "📱 Telechaje App Mobil lan" },
  { id: "menu_site", text: "🌐 Gade Sit Wèb Ofisyèl la" },
  { id: "menu_horaires", text: "🕒 Wè Orè Travay Nou yo" },
  { id: "menu_app", text: "📱 Download Mobile App" },
  { id: "menu_site", text: "🌐 Visit Official Website" },
  { id: "menu_horaires", text: "🕒 View Opening Hours" },
  { id: "menu_app", text: "📱 Descargar App Móvil" },
  { id: "menu_site", text: "🌐 Ver Sitio Web Oficial" },
  { id: "menu_horaires", text: "🕒 Ver Nuestros Horarios" }
];
const POLL_LOOKUP = {};
for (const c of POLL_CHOICES) {
  const digest = sha256DigestBytes(utf8Bytes(c.text));
  POLL_LOOKUP[c.text.toLowerCase()] = c.id;
  POLL_LOOKUP[bytesToBase64(digest)] = c.id;
  POLL_LOOKUP[bytesToHex(digest)] = c.id;
}
function resolvePollOption(val) {
  if (!val) return "";
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (POLL_LOOKUP[trimmed]) return POLL_LOOKUP[trimmed];
    if (POLL_LOOKUP[trimmed.toLowerCase()]) return POLL_LOOKUP[trimmed.toLowerCase()];
    const lower = trimmed.toLowerCase();
    if (/\\b(app|mobil|android|iphone|telechaje|télécharger|download|descargar)\\b/i.test(lower)) return "menu_app";
    if (/\\b(site|sit wèb|website|sitio|technozi-ht)\\b/i.test(lower)) return "menu_site";
    if (/\\b(horaire|horarios|hours|orè|lè biwo)\\b/i.test(lower)) return "menu_horaires";
    return "";
  }
  let byteArr = null;
  if (Array.isArray(val)) byteArr = val;
  else if (val && val.type === "Buffer" && Array.isArray(val.data)) byteArr = val.data;
  else if (val && typeof val === "object" && typeof val[0] === "number") {
    byteArr = [];
    for (let k = 0; typeof val[k] === "number"; k++) byteArr.push(val[k]);
  }
  if (byteArr && byteArr.length > 0) {
    const b64 = bytesToBase64(byteArr);
    const hx = bytesToHex(byteArr);
    return POLL_LOOKUP[b64] || POLL_LOOKUP[hx] || "";
  }
  return "";
}
function mapMenuActionText(actionId) {
  if (actionId === "menu_app") {
    return "[CLIC SUR MENU : Télécharger l'Application Mobile] — Répondez dans la langue utilisée précédemment dans l'historique (ou en Français par défaut) en donnant immédiatement les deux liens directs Google Play (Android) et App Store (iPhone).";
  }
  if (actionId === "menu_site") {
    return "[CLIC SUR MENU : Voir le Site Web Officiel] — Répondez dans la langue utilisée précédemment dans l'historique (ou en Français par défaut) en partageant directement le lien officiel https://technozi-ht.com et la Chaîne WhatsApp.";
  }
  if (actionId === "menu_horaires") {
    return "[CLIC SUR MENU : Consulter Nos Horaires] — Répondez dans la langue utilisée précédemment dans l'historique (ou en Français par défaut) en donnant nos horaires d'ouverture et si nos bureaux sont actuellement ouverts ou fermés.";
  }
  return "";
}

// 2. Gestion des clics sur Sondage WhatsApp (messages.update)
if (eventType === "messages.update" || eventType === "messages_update") {
  const updates = Array.isArray(body.data) ? body.data : (body.data ? [body.data] : []);
  for (const upd of updates) {
    if (!upd) continue;
    const pollUpdates = upd.pollUpdates || upd.update?.pollUpdates || [];
    if (!Array.isArray(pollUpdates) || pollUpdates.length === 0) continue;

    let remoteJid = upd.remoteJid || upd.key?.remoteJid || "";
    if (
      !remoteJid ||
      remoteJid === "status@broadcast" ||
      remoteJid.includes("@broadcast") ||
      remoteJid.includes("@g.us") ||
      remoteJid.includes("@newsletter")
    ) {
      continue;
    }

    let matchedActionId = "";
    let voteTs = "";
    let pollCreationId = upd.keyId || upd.key?.id || "";

    // Format agrégé : [{ name: "...", voters: [...] }]
    const aggregateHit = pollUpdates.find(pu => pu && pu.name && Array.isArray(pu.voters) && pu.voters.length > 0);
    if (aggregateHit) {
      matchedActionId = resolvePollOption(aggregateHit.name);
      voteTs = String(upd.messageTimestamp || Date.now());
    } else {
      // Format brut Baileys : [{ pollCreationMessageKey, vote: { selectedOptions, name }, senderTimestampMs }]
      for (let idx = pollUpdates.length - 1; idx >= 0; idx--) {
        const pu = pollUpdates[idx];
        if (!pu) continue;
        if (pu.pollCreationMessageKey?.id) pollCreationId = pu.pollCreationMessageKey.id;
        if (pu.senderTimestampMs) voteTs = String(pu.senderTimestampMs);
        const candidates = [];
        if (pu.vote?.name) candidates.push(pu.vote.name);
        if (pu.optionName) candidates.push(pu.optionName);
        if (Array.isArray(pu.vote?.selectedOptions)) candidates.push(...pu.vote.selectedOptions);
        if (Array.isArray(pu.selectedOptions)) candidates.push(...pu.selectedOptions);
        for (const c of candidates) {
          const hit = resolvePollOption(c);
          if (hit) { matchedActionId = hit; break; }
        }
        if (matchedActionId) break;
      }
    }

    if (!matchedActionId) continue;

    const dedupVoteId = "poll:" + pollCreationId + ":" + voteTs + ":" + matchedActionId;
    if (staticData.processedIds.includes(dedupVoteId)) continue;
    staticData.processedIds.push(dedupVoteId);
    if (staticData.processedIds.length > 500) staticData.processedIds.shift();

    if (staticData.pausedUntil[remoteJid] && Date.now() < staticData.pausedUntil[remoteJid]) {
      continue;
    }

    const phoneJid = (upd.remoteJidAlt && upd.remoteJidAlt.includes("@s.whatsapp.net"))
      ? upd.remoteJidAlt
      : (upd.key?.remoteJidAlt && upd.key.remoteJidAlt.includes("@s.whatsapp.net"))
      ? upd.key.remoteJidAlt
      : remoteJid;
    const senderPhone = phoneJid.includes("@s.whatsapp.net")
      ? phoneJid.replace("@s.whatsapp.net", "").replace(/[^0-9]/g, "")
      : "";
    const pushName = (upd.pushName || "").trim() || "Client";

    if (staticData.lastActive[remoteJid] && (Date.now() - staticData.lastActive[remoteJid] > 12 * 60 * 60 * 1000)) {
      delete staticData.conversations[remoteJid];
    }
    staticData.lastActive[remoteJid] = Date.now();
    staticData.conversations[remoteJid] = staticData.conversations[remoteJid] || [];
    const history = staticData.conversations[remoteJid];

    return [{
      json: {
        senderPhone,
        remoteJid,
        pushName,
        userText: mapMenuActionText(matchedActionId),
        history,
        isNewConversation: false,
        isMenuSelection: true,
        isSystemAlert: false
      }
    }];
  }
  return [];
}

// 3. Traitement des messages entrants normaux (messages.upsert)
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

// Extraire l'identifiant cliqué s'il s'agit d'un menu interactif (sondage, liste ou bouton)
let listRowId = (
  msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
  msg.listResponseMessage?.rowId ||
  msg.buttonsResponseMessage?.selectedButtonId ||
  ""
).trim();

if (!listRowId && msg.pollUpdateMessage) {
  const puList = msg.pollUpdateMessage.pollUpdates || [];
  for (const pu of puList) {
    const candidates = [pu?.vote?.name, pu?.optionName, ...(pu?.vote?.selectedOptions || []), ...(pu?.selectedOptions || [])];
    for (const c of candidates) {
      const hit = resolvePollOption(c);
      if (hit) { listRowId = hit; break; }
    }
    if (listRowId) break;
  }
  if (!listRowId && msg.pollUpdateMessage.vote?.selectedOptions) {
    for (const c of msg.pollUpdateMessage.vote.selectedOptions) {
      const hit = resolvePollOption(c);
      if (hit) { listRowId = hit; break; }
    }
  }
}

// Extraire le texte du message (y compris légendes photo/vidéo/document et position GPS)
let extractedText =
  msg.conversation ||
  msg.extendedTextMessage?.text ||
  msg.imageMessage?.caption ||
  msg.videoMessage?.caption ||
  msg.documentMessage?.caption ||
  msg.buttonsResponseMessage?.selectedDisplayText ||
  msg.listResponseMessage?.title ||
  listRowId ||
  "";

if (listRowId) {
  extractedText = mapMenuActionText(listRowId) || extractedText;
}

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
const isMenuSelection = listRowId === "menu_app" || listRowId === "menu_site" || listRowId === "menu_horaires";

return [{
  json: {
    senderPhone,
    remoteJid,
    pushName,
    userText,
    history,
    isNewConversation,
    isMenuSelection,
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
        jsonBody: "={{ JSON.stringify({ number: $json.remoteJid, presence: 'composing', delay: 8000 }) }}",
        options: {
          timeout: 500
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
    // 6. CERVEAU IA GOOGLE GEMINI 3.5 FLASH (DÉTECTION LANGUE PERÇUE & PRO)
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
              ? "STATUT DE LA DISCUSSION : PREMIER MESSAGE (DÉBUT DE CONVERSATION).\\nUn menu interactif CLIQUABLE (Télécharger l'App, Voir le Site Web, Nos Horaires) va être envoyé juste en dessous de votre message. Rédigez donc un accueil court, chaleureux et naturel (ou répondez directement à sa question s'il en pose déjà une), SANS écrire vous-même de liste numérotée 1/2/3."
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

4. INTELLIGENCE CONVERSATIONNELLE, MENU RAPIDE & QUALIFICATION NATURELLE
• \${firstTurnInstruction}
• Réponses exactes aux infos du Menu Rapide (par clic OU par question libre à tout moment) :
  - Si le client clique sur "Télécharger l'App", tape "1", ou demande votre application par phrase libre ("où télécharger l'app ?", "ban m lyen app lan", "Android ou iPhone ?") : donnez immédiatement les deux liens officiels bien présentés :
    • Android (Google Play) : https://play.google.com/store/apps/details?id=com.wiserpos.technozi&hl=en_SG
    • iPhone / iOS (App Store) : https://apps.apple.com/us/app/technozi-haiti/id6756228637?l=es-MX
  - Si le client clique sur "Voir le Site Web", tape "2", ou demande votre site par phrase libre ("votre site web ?", "ki sit wèb nou ?") : partagez directement https://technozi-ht.com (+ la Chaîne WhatsApp https://whatsapp.com/channel/0029Vb7XDp3EVccQG29idN2d).
  - Si le client clique sur "Nos Horaires", tape "3", ou demande vos heures d'ouverture ("à quelle heure ouvrez-vous ?", "ki lè nou fèmen ?", "êtes-vous ouverts ?") : donnez nos horaires exacts (Lun–Ven : 8h00 – 17h00, Samedi : 8h00 – 15h00, Dimanche : Fermé) et précisez gentiment si nos bureaux sont actuellement ouverts ou fermés selon l'heure locale d'Haïti !
  - Si le client demande à VOIR LE MENU lui-même à n'importe quel moment ("menu", "meni", "montre-moi le menu", "je veux voir le menu", "mwen vle wè meni an", "show me the menu", "voir vos options") : répondez brièvement et poliment que voici le menu ci-dessous, et ajoutez obligatoirement le marqueur invisible [SHOW_MENU] à la toute fin de votre réponse pour réafficher le menu cliquable.
  - Attention au contexte : si vous venez juste de demander une quantité (ex: "Combien de caméras ?") et que le client écrit "2", c'est bien sûr une quantité et non l'option 2 du menu !
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
                maxOutputTokens: 2048
              }
            };
          })()
        }}`,
        options: {
          timeout: 20000
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
const isMenuSelection = prevData.isMenuSelection === true;

// Détecter si le client ou l'IA demande explicitement d'afficher le menu cliquable
const aiAskedMenu = /\\[SHOW_MENU\\]/i.test(aiText || "");
const trimmedUser = (userText || "").trim();
const userAskedMenu =
  /^(\\/?menu|meni|menú|menu rapide|meni rapid|quick menu|options|opsyon)$/i.test(trimmedUser) ||
  /\\b(voir le menu|afficher le menu|montre[- ]?moi le menu|revoir le menu|remets? le menu|wè meni|ban m meni|afiche meni|montre m meni|show.*menu|see.*menu|open.*menu)\\b/i.test(trimmedUser);

const shouldSendMenu = (isNewConversation && !isMenuSelection) || aiAskedMenu || userAskedMenu;

// Nettoyage léger au cas où Gemini glisserait des balises ou du Markdown non-WhatsApp
if (aiText) {
  aiText = aiText
    .replace(/\\[SHOW_MENU\\]/gi, "")
    .replace(/\\[SET_LANG:.*?\\]/gi, "")
    .replace(/\\*\\*([^*\\n]+?)\\*\\*/g, "*$1*")
    .replace(/^#{1,4}\\s+/gm, "")
    .trim();
}

// Secours multilingue si la réponse IA était vide
if (!aiText) {
  const lower = (userText || "").toLowerCase();
  if (/\\b(mwen|kreyol|kreyòl|bonjou|bonswa|konbyen|enstalasyon|oubyen|tanpri|bezwen|meni)\\b/i.test(lower)) {
    aiText = shouldSendMenu && !isNewConversation
      ? "Men meni rapid Technozi Haïti a anba a :"
      : "Mèsi dèske w kontakte *Technozi Haïti*. Nou kontan akeyi w jodi a.";
  } else if (/\\b(hello|hi|how|much|price|need|please|want|solar|can|english|what|where|menu)\\b/i.test(lower)) {
    aiText = shouldSendMenu && !isNewConversation
      ? "Here is the Technozi Haïti quick menu below:"
      : "Thank you for contacting *Technozi Haïti*. Welcome! How can we assist you today?";
  } else {
    aiText = shouldSendMenu && !isNewConversation
      ? "Voici le menu rapide de *Technozi Haïti* ci-dessous :"
      : "Merci d'avoir contacté *Technozi Haïti*. Bienvenue ! Comment pouvons-nous vous aider aujourd'hui ?";
  }
}

// Préparer le Menu Cliquable Natif par Sondage (sendPoll — Choix A) et un texte de secours
const detectLang = (text) => {
  const s = (text || "").toLowerCase();
  if (/\\b(bonjou|bonswa|byenvini|kòman|koman|mèsi|dèske|deske|akeyi|bezwen|tanpri|kisa|pou w|ede w|avè w|souple|konbyen|enstalasyon|panno|kamera|solè|sole|meni)\\b/i.test(s)) return "kr";
  if (/\\b(hello|welcome|how can i|how may i|assist you|help you|thank you|good morning|good afternoon|good evening|please|need|want|below)\\b/i.test(s)) return "en";
  if (/\\b(hola|bienvenido|buenos días|buenas tardes|cómo puedo|en qué puedo|gracias por|ayudarle|menú)\\b/i.test(s)) return "es";
  return "";
};
const menuLang = detectLang(aiText) || detectLang(userText) || "fr";

let pollPayload = null;
let fallbackMenuText = "";

if (shouldSendMenu) {
  if (menuLang === "kr") {
    pollPayload = {
      number: remoteJid,
      name: "📌 Meni Rapid Technozi — Klike sou yon opsyon :",
      selectableCount: 1,
      values: [
        "📱 Telechaje App Mobil lan",
        "🌐 Gade Sit Wèb Ofisyèl la",
        "🕒 Wè Orè Travay Nou yo"
      ]
    };
    fallbackMenuText = "📌 *Meni Rapid :*\\n1 - 📱 Telechaje Aplikasyon Mobil lan\\n2 - 🌐 Gade Sit Wèb Ofisyèl la\\n3 - 🕒 Wè Orè Travay Nou yo\\n\\n_Reponn *1*, *2* oswa *3*._";
  } else if (menuLang === "en") {
    pollPayload = {
      number: remoteJid,
      name: "📌 Technozi Quick Menu — Tap an option:",
      selectableCount: 1,
      values: [
        "📱 Download Mobile App",
        "🌐 Visit Official Website",
        "🕒 View Opening Hours"
      ]
    };
    fallbackMenuText = "📌 *Quick Menu:*\\n1 - 📱 Download our Mobile App\\n2 - 🌐 Visit our Official Website\\n3 - 🕒 View our Opening Hours\\n\\n_Reply *1*, *2* or *3*._";
  } else if (menuLang === "es") {
    pollPayload = {
      number: remoteJid,
      name: "📌 Menú Rápido Technozi — Toque una opción:",
      selectableCount: 1,
      values: [
        "📱 Descargar App Móvil",
        "🌐 Ver Sitio Web Oficial",
        "🕒 Ver Nuestros Horarios"
      ]
    };
    fallbackMenuText = "📌 *Menú Rápido:*\\n1 - 📱 Descargar nuestra App Móvil\\n2 - 🌐 Ver el Sitio Web Oficial\\n3 - 🕒 Ver Nuestros Horarios\\n\\n_Responda *1*, *2* o *3*._";
  } else {
    pollPayload = {
      number: remoteJid,
      name: "📌 Menu Rapide Technozi — Touchez une option :",
      selectableCount: 1,
      values: [
        "📱 Télécharger l'App Mobile",
        "🌐 Voir le Site Web Officiel",
        "🕒 Consulter Nos Horaires"
      ]
    };
    fallbackMenuText = "📌 *Menu Rapide :*\\n1 - 📱 Télécharger l'Application Mobile\\n2 - 🌐 Voir le Site Web Officiel\\n3 - 🕒 Consulter Nos Horaires\\n\\n_Répondez *1*, *2* ou *3*._";
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
if (shouldSendMenu && fallbackMenuText) {
  staticData.recentBotTexts[remoteJid].push({ text: fallbackMenuText, at: Date.now() });
}
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
    aiText,
    isNewConversation,
    shouldSendMenu,
    pollPayload,
    fallbackMenuText
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
    // 9. MENU CLIQUABLE (DÉBUT DE CONVERSATION OU DEMANDE DU MENU)
    // -------------------------------------------------------------------------
    {
      parameters: {
        conditions: {
          boolean: [
            {
              value1: "={{ $json.shouldSendMenu }}",
              value2: true
            }
          ]
        }
      },
      id: "check-new-conversation",
      name: "Doit afficher le menu ?",
      type: "n8n-nodes-base.if",
      typeVersion: 1,
      position: [1440, 740]
    },
    {
      parameters: {
        method: "POST",
        url: "http://evolution-api:8080/message/sendPoll/technozi",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "apikey", value: EVOLUTION_API_KEY },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify($json.pollPayload) }}",
        options: {
          timeout: 15000
        }
      },
      id: "send-clickable-menu",
      name: "5. Envoyer Menu Cliquable",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1680, 740],
      continueOnFail: true
    },
    {
      parameters: {
        conditions: {
          boolean: [
            {
              value1: "={{ Boolean($json.error) }}",
              value2: true
            }
          ]
        }
      },
      id: "check-menu-failed",
      name: "Menu Cliquable Échoué ?",
      type: "n8n-nodes-base.if",
      typeVersion: 1,
      position: [1920, 740]
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
        jsonBody: `={{
          (() => {
            let p = null;
            for (const n of ['3. Parser Réponse IA', '3. Parser Réponse IA1', '3. Parser Réponse IA2']) {
              try {
                const it = $(n).item;
                if (it && it.json && it.json.remoteJid) { p = it.json; break; }
              } catch (e) {}
            }
            return JSON.stringify({
              number: p ? p.remoteJid : '',
              text: p ? p.fallbackMenuText : ''
            });
          })()
        }}`,
        options: {
          timeout: 15000
        }
      },
      id: "send-menu-fallback-text",
      name: "5b. Envoyer Menu Texte (Secours)",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [2160, 740],
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
        { node: "Doit afficher le menu ?", type: "main", index: 0 }
      ]]
    },
    "Doit afficher le menu ?": {
      main: [
        [{ node: "5. Envoyer Menu Cliquable", type: "main", index: 0 }],
        []
      ]
    },
    "5. Envoyer Menu Cliquable": {
      main: [[{ node: "Menu Cliquable Échoué ?", type: "main", index: 0 }]]
    },
    "Menu Cliquable Échoué ?": {
      main: [
        [{ node: "5b. Envoyer Menu Texte (Secours)", type: "main", index: 0 }],
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
