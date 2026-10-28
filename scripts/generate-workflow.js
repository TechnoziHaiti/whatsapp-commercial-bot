const fs = require('fs');
const path = require('path');

// Identifiants Meta & Constantes
const WHATSAPP_PHONE_NUMBER_ID = '1340656225805341';
const WHATSAPP_TOKEN = 'EAAQDPR4aMgUBSzdBxlx04ZAYdUWWABbgk5KfZBIkFCfew8crHxRGoRBZAe6OsYCnaZB1YWIApAcZAujieo66ZBEz9B7B8trXyoZAVGMPXHEdoZAkedB8UvbOPJEIkkArjCktBCy5wrIHBej2vJrIlGwCOL6nDAXQrUrgoxnct2PYkKHrLXRautMwVZAEEWLkcqQZDZD';

const workflow = {
  name: "Technozi Commercial Bot v1",
  nodes: [
    {
      parameters: {
        httpMethod: "GET",
        path: "whatsapp",
        responseMode: "responseNode",
        options: {}
      },
      id: "webhook-get",
      name: "Webhook GET (Verification Meta)",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [240, 200],
      webhookId: "whatsapp-get"
    },
    {
      parameters: {
        respondWith: "text",
        responseBody: "={{ $json.query['hub.challenge'] }}",
        options: {}
      },
      id: "respond-webhook",
      name: "Respond to Webhook",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [460, 200]
    },
    {
      parameters: {
        httpMethod: "POST",
        path: "whatsapp",
        responseMode: "onReceived",
        options: {}
      },
      id: "webhook-post",
      name: "Webhook POST (Messages Entrants)",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [240, 420],
      webhookId: "whatsapp-post"
    },
    {
      parameters: {
        jsCode: `// Filtrer et parser le message WhatsApp entrant
const body = $input.item.json.body || $input.item.json;

const entry = body.entry?.[0];
const changes = entry?.changes?.[0];
const value = changes?.value;
const messages = value?.messages;

// 1. Ignorer les statuts d'envoi/lecture (sent, delivered, read)
if (!messages || messages.length === 0) {
  return [];
}

const message = messages[0];
const contact = value.contacts?.[0];
const senderPhone = message.from;
const senderName = contact?.profile?.name || "Client";
const messageId = message.id;

// 2. Ignorer les réactions (emojis sur messages)
if (message.type === "reaction") {
  return [];
}

// 3. Ignorer les messages trop anciens (retries tardifs de Meta > 10 min)
const msgTimestamp = Number(message.timestamp) * 1000;
if (msgTimestamp && (Date.now() - msgTimestamp > 10 * 60 * 1000)) {
  return [];
}

// 4. Déduplication stricte des messages (protection contre les retries automatiques de Meta)
const staticData = $getWorkflowStaticData('global');
staticData.processedIds = staticData.processedIds || [];
if (messageId && staticData.processedIds.includes(messageId)) {
  return [];
}

if (messageId) {
  staticData.processedIds.push(messageId);
  if (staticData.processedIds.length > 500) {
    staticData.processedIds.shift();
  }
}

let userText = "";
let msgType = message.type;

if (message.type === "interactive") {
  const interactive = message.interactive;
  if (interactive.type === "button_reply") {
    userText = interactive.button_reply.id;
  } else if (interactive.type === "list_reply") {
    userText = interactive.list_reply.id;
  }
} else if (message.type === "text") {
  userText = (message.text?.body || "").trim();
} else {
  return [];
}

return [{
  json: {
    senderPhone,
    senderName,
    userText,
    msgType,
    messageId,
    timestamp: message.timestamp
  }
}];`
      },
      id: "filter-parse",
      name: "1. Filtrer & Extraire Message",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [480, 420]
    },
    {
      parameters: {
        jsCode: `// Cerveau Conversationnel Multilingue & Machine d'État - Technozi Bot
const senderPhone = $input.item.json.senderPhone;
const senderName = $input.item.json.senderName;
const rawText = $input.item.json.userText;
const userText = rawText.trim();
const userLower = userText.toLowerCase();

const staticData = $getWorkflowStaticData('global');
staticData.sessions = staticData.sessions || {};

let session = staticData.sessions[senderPhone] || {
  step: 'AWAIT_LANGUAGE',
  lang: '',
  data: {
    typeDemande: 'materiel',
    clientName: senderName,
    clientEmail: '',
    phone: senderPhone,
    produit: '',
    reference: '',
    quantite: '',
    projet: '',
    batiment: '',
    zone: '',
    remarques: ''
  },
  lastActive: Date.now()
};

// Expiration de session après 30 minutes d'inactivité
if (Date.now() - session.lastActive > 30 * 60 * 1000) {
  session.step = 'AWAIT_LANGUAGE';
  session.lang = '';
  session.data = {
    typeDemande: 'materiel',
    clientName: senderName,
    clientEmail: '',
    phone: senderPhone,
    produit: '',
    reference: '',
    quantite: '',
    projet: '',
    batiment: '',
    zone: '',
    remarques: ''
  };
}
session.lastActive = Date.now();

// Réinitialisation si l'utilisateur demande explicitement la langue ou un redémarrage
if (userLower === 'lang' || userLower === 'langue' || userLower === 'language' || userLower === 'idioma' || userText === 'opt_lang' || userLower === 'chanje lang' || userLower === 'changer de langue') {
  session.step = 'AWAIT_LANGUAGE';
} else if (userLower === 'reset' || userLower === 'recommencer' || userLower === 'restart') {
  session.step = 'AWAIT_LANGUAGE';
  session.lang = '';
} else if (userLower === 'menu' || userLower === 'meni' || userLower === 'accueil' || userLower === 'bonjour' || userLower === 'bonjou' || userLower === 'salut' || userLower === 'hello' || userLower === 'hi' || userLower === 'hola' || userLower === 'start' || userText === 'btn_menu') {
  if (!session.lang) {
    session.step = 'AWAIT_LANGUAGE';
  } else {
    session.step = 'WELCOME';
  }
} else if (userText === 'btn_playstore' || userText === 'btn_appstore' || userText === 'btn_app' || userText === 'opt_app') {
  if (!session.lang) session.lang = 'fr';
  session.step = 'AWAIT_MENU_CHOICE';
}

let whatsappPayload = {};
let shouldSendEmail = false;
let emailData = {};

// Helpers
function isLikelyEmail(str) {
  const s = (str || "").trim().replace(/[.,;:!?]+$/, "");
  return /^[^\\s@]+@[^\\s@]+/.test(s);
}

const DOMAIN_TYPOS = {
  // Gmail
  "gnail.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmeil.com": "gmail.com",
  "gmaul.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmaol.com": "gmail.com",
  "gmai.fr": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmaill.fr": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmail.cpm": "gmail.com",
  "gmail.coom": "gmail.com",

  // Hotmail
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "hotmaik.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.cm": "hotmail.com",
  "hotmail.cpm": "hotmail.com",
  "hotmail.fr": "hotmail.fr",

  // Outlook
  "outloo.com": "outlook.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlock.com": "outlook.com",
  "outlool.com": "outlook.com",
  "outlook.con": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.cm": "outlook.com",
  "outlook.cpm": "outlook.com",

  // Yahoo
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahou.com": "yahoo.com",
  "yaho.fr": "yahoo.fr",
  "yahooo.fr": "yahoo.fr",
  "yahoo.con": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yaho.co": "yahoo.com",

  // iCloud
  "iclou.com": "icloud.com",
  "icoud.com": "icloud.com",
  "iclaud.com": "icloud.com",
  "icloud.con": "icloud.com",
  "icloud.co": "icloud.com",

  // Technozi
  "technozi.com": "technozi-ht.com",
  "technozi.ht": "technozi-ht.com",
  "technozi-ht.fr": "technozi-ht.com",
  "technozi-ht.con": "technozi-ht.com"
};

function autoCorrectEmail(rawEmail) {
  let email = (rawEmail || "").trim().replace(/[.,;:!?]+$/, "");
  if (!email.includes("@")) return email;

  const parts = email.split("@");
  if (parts.length !== 2) return email;

  const user = parts[0].trim();
  let domain = parts[1].toLowerCase().trim();

  // Si pas de point du tout (ex: user@gnail ou user@gmail)
  if (!domain.includes(".")) {
    domain = domain + ".com";
  }

  // 1. Dictionnaire direct exact
  if (DOMAIN_TYPOS[domain]) {
    return user + "@" + DOMAIN_TYPOS[domain];
  }

  // 2. Découpage nom et extension
  const domainParts = domain.split(".");
  const domPrefix = domainParts[0];
  let domExt = domainParts.slice(1).join(".");

  // Normaliser extension mal tapée
  if (/^(con|cpm|comm|coom|cmo|copm)$/i.test(domExt)) {
    domExt = "com";
  } else if (/^(th|hyt|hyti)$/i.test(domExt)) {
    domExt = "ht";
  }

  const normalizedDomain = domPrefix + "." + domExt;
  if (DOMAIN_TYPOS[normalizedDomain]) {
    return user + "@" + DOMAIN_TYPOS[normalizedDomain];
  }

  // 3. Familles de messageries connues (fautes de frappe sur le nom de domaine)
  const GMAIL_NAMES = ['gmail', 'gnail', 'gmai', 'gmial', 'gamil', 'gmaill', 'gmeil', 'gmaul', 'gmal', 'gmaol', 'gmaik', 'gmqil', 'gemail', 'gmael', 'googlemail'];
  const HOTMAIL_NAMES = ['hotmail', 'hotmial', 'hotmai', 'hotmaill', 'hotamil', 'hotmaik', 'hotmal', 'otmail', 'hotmeil'];
  const OUTLOOK_NAMES = ['outlook', 'outloo', 'outlok', 'outllok', 'outlock', 'outlool', 'outllook', 'outlokk'];
  const YAHOO_NAMES = ['yahoo', 'yaho', 'yahooo', 'yahou', 'yahoou', 'yhoo'];
  const ICLOUD_NAMES = ['icloud', 'iclou', 'icoud', 'iclaud', 'iclould', 'iclod'];
  const TECHNOZI_NAMES = ['technozi', 'technozi-ht', 'technozie', 'teknozi', 'technozy'];

  if (GMAIL_NAMES.includes(domPrefix)) {
    return user + "@gmail.com";
  }
  if (HOTMAIL_NAMES.includes(domPrefix)) {
    return user + "@" + (domExt === 'fr' ? 'hotmail.fr' : 'hotmail.com');
  }
  if (OUTLOOK_NAMES.includes(domPrefix)) {
    return user + "@" + (domExt === 'fr' ? 'outlook.fr' : 'outlook.com');
  }
  if (YAHOO_NAMES.includes(domPrefix)) {
    return user + "@" + (domExt === 'fr' ? 'yahoo.fr' : 'yahoo.com');
  }
  if (ICLOUD_NAMES.includes(domPrefix)) {
    return user + "@icloud.com";
  }
  if (TECHNOZI_NAMES.includes(domPrefix)) {
    return user + "@technozi-ht.com";
  }

  return user + "@" + normalizedDomain;
}

// ========================================================
// DICTIONNAIRE I18N (FRANÇAIS, KREYÒL, ENGLISH, ESPAÑOL)
// ========================================================
const I18N = {
  fr: {
    langName: "Français",
    welcome: (name) => "Bonjour " + name + " !\\n\\nJe suis *Pitonbot*, l'assistant virtuel de Technozi ! Bienvenue chez *Technozi* (Faster & Easier), votre partenaire en solutions technologiques et énergétiques.\\n\\nComment pouvons-nous vous aider aujourd'hui ?",
    menuButton: "📋 Menu Principal",
    secQuotes: "🛒 Devis & Commandes",
    rowMateriel: { title: "📦 Achat Matériel IT", desc: "Laptops, ordinateurs, routeurs, pièces" },
    rowInstal: { title: "🛠️ Devis Installation", desc: "Solaire, Starlink, Caméras CCTV, Réseau" },
    secInfo: "ℹ️ Découverte & Infos",
    rowServices: { title: "🏢 Nos 6 Expertises", desc: "Découvrir tous les services de Technozi" },
    rowContact: { title: "📍 Contact & Horaires", desc: "Site officiel, adresse et téléphone" },
    rowLang: { title: "🌐 Changer de Langue", desc: "Kreyòl, English, Español..." },
    errHint: "\\n\\n_(💡 Si vous avez commis une erreur, vous pourrez la modifier dans les options à la fin)_",
    cancelBtn: "❌ Annuler",
    confirmBtn: "✅ Confirmer",
    modifyBtn: "✏️ Modifier",
    cancelledMsg: "Demande annulée.",
    emailCorrected: (em) => "✅ _E-mail noté et corrigé : *" + em + "*_\\n\\n",
    stepProduit: "📦 *ACHAT DE MATÉRIEL IT (1/7)*\\n\\nQuel matériel ou équipement recherchez-vous ?\\n\\n_(Ex: Laptop Dell Core i7, Routeur Wi-Fi, Écran, Disque SSD... et tapez 'annuler' pour stopper à tout moment)_",
    stepRef: "🏷️ *(2/7) Marque, Modèle ou Référence :*\\nAvez-vous une marque, un modèle ou une référence précise en tête ?\\n_(Ex: Dell Latitude, HP LaserJet, Cisco, TP-Link... ou tapez 'Aucune' si vous souhaitez un conseil)_",
    stepQty: "🔢 *(3/7) Quantité souhaitée :*\\nCombien d'unités souhaitez-vous commander ?\\n_(Veuillez répondre avec un chiffre, ex: 1, 2, 5, 10)_",
    stepNom: (name) => "👤 *(4/7) Nom complet & Entreprise :*\\nQuel est votre nom et prénom, et éventuellement le nom de votre entreprise ?\\n_(Tapez 'Moi' pour utiliser votre nom WhatsApp : " + name + ")_",
    stepEmail: "📧 *(5/7) Adresse e-mail :*\\nQuelle est votre adresse e-mail pour recevoir votre devis et le suivi de commande ?\\n_(Ex: contact@exemple.com - ou tapez 'Aucune' si vous n'en avez pas)_",
    stepZone: "📍 *(6/7) Commune ou Zone de livraison :*\\nDans quelle zone ou ville souhaitez-vous la livraison ?\\n_(Ex: Pétion-Ville, Delmas, Port-au-Prince, Cap-Haïtien...)_",
    stepRemarques: "💬 *(7/7) Précisions ou remarques éventuelles :*\\nAvez-vous des détails supplémentaires à préciser pour votre commande ?\\n_(Ex: urgence, accessoire spécifique... ou tapez 'Rien' pour terminer)_",
    stepInstalProjet: "🛠️ *DEVIS INSTALLATION & PROJETS TECHNIQUES (1/5)*\\n\\nPour quelle installation ou projet technique souhaitez-vous un devis ?\\n\\n_(Ex: Système Solaire Hybride 5kVA, Pose antenne Starlink, Caméras de surveillance CCTV, Câblage réseau bureau... et tapez 'annuler' pour stopper)_",
    stepInstalBatiment: "🏢 *(2/5) Type de bâtiment :*\\nDans quel type d'environnement aura lieu l'intervention ?\\n_(Ex: Résidence privée, Commerce, Bureau, École, Entrepôt...)_",
    stepInstalZone: "📍 *(3/5) Ville ou Commune de l'installation :*\\nDans quelle ville ou zone doit être réalisée l'intervention ?\\n_(Ex: Pétion-Ville, Tabarre, Delmas, Cap-Haïtien...)_",
    stepInstalNom: (name) => "👤 *(4/5) Nom & Entreprise :*\\nQuel est votre nom complet et/ou le nom de votre entreprise ?\\n_(Tapez 'Moi' pour utiliser votre nom WhatsApp : " + name + ")_",
    stepInstalEmail: "📧 *(5/5) Adresse e-mail :*\\nÀ quelle adresse e-mail souhaitez-vous recevoir l'étude ou le devis technique ?\\n_(Ex: contact@exemple.com - ou tapez 'Aucune' si vous n'en avez pas)_",
    recapTitleInstal: "📋 *RÉCAPITULATIF DE VOTRE PROJET TECHNIQUE*\\n",
    recapTitleMateriel: "📋 *RÉCAPITULATIF DE VOTRE COMMANDE MATÉRIEL*\\n",
    recapLabels: {
      ref: "🆔 Référence : ", client: "👤 Client : ", phone: "📞 Téléphone : ", email: "📧 E-mail : ",
      projet: "🛠️ Projet : ", batiment: "🏢 Bâtiment : ", zone: "📍 Zone : ", produit: "📦 Produit : ",
      refModel: "🏷️ Réf/Marque : ", qty: "🔢 Quantité : ", remarques: "💬 Remarques : ",
      qInstal: "Confirmez-vous l'envoi de cette étude technique à nos ingénieurs ?",
      qMateriel: "Confirmez-vous l'envoi de cette demande à notre équipe commerciale ?"
    },
    confirmSuccess: (isInstal, name, cmdId, phone, clientEmail) => {
      const emailPart = (clientEmail && clientEmail !== 'Non renseigné') ? " ou par votre adresse e-mail : " + clientEmail : "";
      return "🎉 *Merci " + name + " !*\\n\\nVotre demande d'" + (isInstal ? "étude technique" : "commande") + " *" + cmdId + "* a été transmise avec succès à notre équipe de Technozi.\\n\\nOn va évaluer votre dossier et on vous contactera sur votre numéro WhatsApp : + " + phone + emailPart + ".\\n\\nÀ très bientôt chez Technozi !";
    },
    servicesHeader: "🏢 Nos 6 Expertises Métiers",
    servicesBody: "Voici les solutions proposées par *Technozi Haïti* :\\n\\n1️⃣ ☀️ *Énergie Solaire Hybride*\\nOnduleurs, batteries lithium et panneaux pour une autonomie totale.\\n\\n2️⃣ 🛰️ *Internet Satellite Starlink*\\nVente de kits, fixation sur mât, orientation et distribution Wi-Fi.\\n\\n3️⃣ 📹 *Vidéosurveillance (CCTV)*\\nCaméras IP HD, vision nocturne, enregistreur NVR et accès smartphone 24/7.\\n\\n4️⃣ 🌐 *Réseaux Informatiques & Wi-Fi*\\nCâblage structuré certifié, baies de brassage et switchs manageables.\\n\\n5️⃣ 💻 *Vente Matériel Informatique*\\nLaptops pros, ordinateurs fixes, serveurs et pièces détachées.\\n\\n6️⃣ 🔧 *Support & Maintenance IT*\\nContrats d'infogérance, maintenance préventive et assistance rapide.\\n\\n👉 *Que souhaitez-vous faire ?*",
    contactHeader: "📍 Contact & Informations",
    contactBody: "Voici les coordonnées officielles de *Technozi Haïti* :\\n\\n🌐 *Site Web :* https://technozi-ht.com\\n📢 *Chaîne WhatsApp :* https://whatsapp.com/channel/0029Vb7XDp3EVccQG29idN2d\\n📞 *Téléphone commercial :* +509 37 03 0009\\n📧 *E-mail officiel :* sales@technozi-ht.com\\n\\n🕒 *Horaires d'ouverture :*\\n• Lundi au Vendredi : 8h00 - 17h00\\n• Samedi : 8h00 - 15h00 (3h PM)\\n\\n🚀 *Technozi - Faster & Easier !*",
    btnDownloadApp: "📱 Télécharger App",
    rowApp: { title: "📱 Télécharger l'App", desc: "Disponible sur Android et iPhone" },
    appChoiceHeader: "📱 Application Technozi",
    appChoiceBody: "📱 *Télécharger l'Application Mobile Technozi*\\n\\nInstallez notre application mobile officielle pour effectuer vos commandes, suivre vos devis et accéder à tous nos services en un clic !\\n\\n👉 *Choisissez votre plateforme ci-dessous :*",
    btnPlayStore: "🤖 Google Play",
    btnAppStore: "🍏 App Store",
    playStoreMsg: "🤖 *Application Technozi sur Google Play (Android)*\\n\\nVoici votre lien direct pour télécharger l'application :\\n\\n👉 https://play.google.com/store/apps/details?id=com.wiserpos.technozi&hl=en_SG\\n\\n_(Cliquez sur le lien bleu ci-dessus pour ouvrir le Play Store)_",
    appStoreMsg: "🍏 *Application Technozi sur l'App Store (iPhone / iOS)*\\n\\nVoici votre lien direct pour télécharger l'application :\\n\\n👉 https://apps.apple.com/us/app/technozi-haiti/id6756228637?l=es-MX\\n\\n_(Cliquez sur le lien bleu ci-dessus pour ouvrir l'App Store)_",
    modifyTitle: "✏️ Modifier un champ",
    modifyBody: (name) => name + ", quel élément souhaitez-vous corriger avant l'envoi ?",
    modifyBtnList: "Choisir l'élément"
  },
  ht: {
    langName: "Kreyòl Ayisyen",
    welcome: (name) => "Bonjou " + name + " !\\n\\nMwen se *Pitonbot*, asistan vityèl Technozi a ! Byenveni nan *Technozi* (Faster & Easier), patnè ou nan solisyon teknoloji ak enèji solè.\\n\\nKouman nou ka ede w jodi a ?",
    menuButton: "📋 Meni Prensipal",
    secQuotes: "🛒 Devis & Kòmand",
    rowMateriel: { title: "📦 Achte Materyèl IT", desc: "Laptops, òdinatè, routeur, pyès IT" },
    rowInstal: { title: "🛠️ Devis Enstalasyon", desc: "Solè, Starlink, Kamera CCTV, Rezo" },
    secInfo: "ℹ️ Enfòmasyon",
    rowServices: { title: "🏢 6 Ekspertiz Nou yo", desc: "Dekouvri tout sèvis Technozi yo" },
    rowContact: { title: "📍 Kontak & Orè", desc: "Sit ofisyèl, adrès ak telefòn" },
    rowLang: { title: "🌐 Chanje Lang", desc: "Français, English, Español..." },
    errHint: "\\n\\n_(💡 Si w te fè yon erè, w ap ka modifye l nan opsyon yo nan fen an)_",
    cancelBtn: "❌ Anile",
    confirmBtn: "✅ Konfime",
    modifyBtn: "✏️ Modifye",
    cancelledMsg: "Demann anile.",
    emailCorrected: (em) => "✅ _Adrès imèl anrejistre epi korije : *" + em + "*_\\n\\n",
    stepProduit: "📦 *ACHTE MATERYÈL IT (1/7)*\\n\\nKi materyèl oswa ekipman w ap chèche ?\\n\\n_(Egzanp: Laptop Dell Core i7, Routeur Wi-Fi, Ekran, Disk SSD... epi tape 'anile' pou kanpe nenpòt lè)_",
    stepRef: "🏷️ *(2/7) Mak, Modèl oswa Referans :*\\nÈske w gen yon mak, yon modèl oswa yon referans presi nan tèt ou ?\\n_(Egzanp: Dell Latitude, HP LaserJet, Cisco, TP-Link... oswa tape 'Okenn' si w vle konsèy)_",
    stepQty: "🔢 *(3/7) Kantite ou bezwen :*\\nKonbyen inite ou ta renmen kòmande ?\\n_(Tanpri reponn ak yon chif, egzanp: 1, 2, 5, 10)_",
    stepNom: (name) => "👤 *(4/7) Non konplè & Antrepriz :*\\nKi non ak siyati ou, ak non antrepriz ou si genyen ?\\n_(Tape 'Mwen' pou sèvi ak non WhatsApp ou : " + name + ")_",
    stepEmail: "📧 *(5/7) Adrès imèl :*\\nKi adrès imèl ou pou n voye devis ofisyèl la ak swivi kòmand ou ?\\n_(Egzanp: kontak@egzanp.com - oswa tape 'Okenn' si w pa genyen)_",
    stepZone: "📍 *(6/7) Komin oswa Zòn livrezon :*\\nNan ki zòn oswa vil ou ta renmen resevwa livrezon an ?\\n_(Egzanp: Petyonvil, Dèlma, Pòtoprens, Okap...)_",
    stepRemarques: "💬 *(7/7) Detay oswa remak anplis :*\\nÈske w gen lòt detay ou ta renmen presize pou kòmand la ?\\n_(Egzanp: ijans, akseswa espesyal... oswa tape 'Ryen' pou fini)_",
    stepInstalProjet: "🛠️ *DEVIS ENSTALASYON & PWOJÈ TEKNIK (1/5)*\\n\\nKi enstalasyon oswa pwojè teknik ou bezwen yon devis pou li ?\\n\\n_(Egzanp: Sistèm Solè Ibrid 5kVA, Enstalasyon antèn Starlink, Kamera siveyans CCTV, Filaj rezo biwo... epi tape 'anile' pou kanpe)_",
    stepInstalBatiment: "🏢 *(2/5) Tip batiman :*\\nNan ki kalite anviwònman enstalasyon an ap fèt ?\\n_(Egzanp: Kay prive, Boutik/Komès, Biwo, Lekòl, Depo...)_",
    stepInstalZone: "📍 *(3/5) Vil oswa Komin enstalasyon an :*\\nNan ki vil oswa zòn entèvansyon an dwe fèt ?\\n_(Egzanp: Petyonvil, Taba, Dèlma, Okap...)_",
    stepInstalNom: (name) => "👤 *(4/5) Non & Antrepriz :*\\nKi non konplè ou ak/oswa non antrepriz ou ?\\n_(Tape 'Mwen' pou sèvi ak non WhatsApp ou : " + name + ")_",
    stepInstalEmail: "📧 *(5/5) Adrès imèl :*\\nNan ki adrès imèl ou ta renmen resevwa etid oswa devis teknik la ?\\n_(Egzanp: kontak@egzanp.com - oswa tape 'Okenn' si w pa genyen)_",
    recapTitleInstal: "📋 *REKAPITILATIF PWOJÈ TEKNIK OU A*\\n",
    recapTitleMateriel: "📋 *REKAPITILATIF KÒMAND MATERYÈL OU A*\\n",
    recapLabels: {
      ref: "🆔 Referans : ", client: "👤 Kliyan : ", phone: "📞 Telefòn : ", email: "📧 Imèl : ",
      projet: "🛠️ Pwojè : ", batiment: "🏢 Batiman : ", zone: "📍 Zòn : ", produit: "📦 Pwodwi : ",
      refModel: "🏷️ Mak/Modèl : ", qty: "🔢 Kantite : ", remarques: "💬 Remak : ",
      qInstal: "Èske w konfime voye etid teknik sa a bay ekip enjenyè Technozi ?",
      qMateriel: "Èske w konfime voye demann sa a bay ekip komèsyal Technozi ?"
    },
    confirmSuccess: (isInstal, name, cmdId, phone, clientEmail) => {
      const emailPart = (clientEmail && clientEmail !== 'Non renseigné') ? " oswa nan adrès imèl ou : " + clientEmail : "";
      return "🎉 *Mèsi " + name + " !*\\n\\nDemann " + (isInstal ? "etid teknik" : "kòmand") + " ou a *" + cmdId + "* transmèt bay ekip Technozi a avèk siksè.\\n\\nNou pral evalye dosye w la epi n ap kontakte w sou nimewo WhatsApp ou : + " + phone + emailPart + ".\\n\\nNa wè talè nan Technozi !";
    },
    servicesHeader: "🏢 6 Ekspertiz Nou yo",
    servicesBody: "Men solisyon pwofesyonèl *Technozi Haïti* ofri :\\n\\n1️⃣ ☀️ *Enèji Solè Ibrid*\\nOndilè, batri lityòm ak panno pou otonomi kouran total.\\n\\n2️⃣ 🛰️ *Entènèt Satelit Starlink*\\nVant kit, enstalasyon sou ma, oryantasyon ak distribisyon Wi-Fi.\\n\\n3️⃣ 📹 *Kamera Siveyans (CCTV)*\\nKamera IP HD, vizyon lannwit, anrejistrè NVR ak aksè sou telefòn 24/7.\\n\\n4️⃣ 🌐 *Rezo Enfòmatik & Wi-Fi*\\nFilaj estriktire sètifye, switch ak sekirite rezo.\\n\\n5️⃣ 💻 *Vant Materyèl Enfòmatik*\\nLaptops pro, òdinatè biwo, sèvè ak pyès detache.\\n\\n6️⃣ 🔧 *Sipò & Mentnans IT*\\nKontra mentnans, asistans rapid ak reparasyon.\\n\\n👉 *Kisa ou ta renmen fè ?*",
    contactHeader: "📍 Kontak & Orè",
    contactBody: "Men kowòdone ofisyèl *Technozi Haïti* :\\n\\n🌐 *Sit Wèb :* https://technozi-ht.com\\n📢 *Chèn WhatsApp :* https://whatsapp.com/channel/0029Vb7XDp3EVccQG29idN2d\\n📞 *Telefòn Komèsyal :* +509 37 03 0009\\n📧 *Imèl Ofisyèl :* sales@technozi-ht.com\\n\\n🕒 *Orè Travay :*\\n• Lendi pou Vandredi : 8h00 AM - 5h00 PM\\n• Samdi : 8h00 AM - 3h00 PM (15h00)\\n• Dimanch : Fèmen\\n\\n🚀 *Technozi - Faster & Easier !*",
    btnDownloadApp: "📱 Telechaje App",
    rowApp: { title: "📱 Telechaje App", desc: "Disponib sou Android ak iPhone" },
    appChoiceHeader: "📱 Aplikasyon Technozi",
    appChoiceBody: "📱 *Telechaje Aplikasyon Mobil Technozi*\\n\\nEnstale aplikasyon ofisyèl nou an pou w ka pase kòmand, swiv devis ou yo ak jwenn tout sèvis nou yo pi fasil sou telefòn ou !\\n\\n👉 *Chwazi platfòm telefòn ou anba a :*",
    btnPlayStore: "🤖 Google Play",
    btnAppStore: "🍏 App Store",
    playStoreMsg: "🤖 *Aplikasyon Technozi sou Google Play (Android)*\\n\\nMen lyen dirèk la pou w telechaje aplikasyon an :\\n\\n👉 https://play.google.com/store/apps/details?id=com.wiserpos.technozi&hl=en_SG\\n\\n_(Klike sou lyen ble anlè a pou w ouvri Play Store la)_",
    appStoreMsg: "🍏 *Aplikasyon Technozi sou App Store (iPhone / iOS)*\\n\\nMen lyen dirèk la pou w telechaje aplikasyon an :\\n\\n👉 https://apps.apple.com/us/app/technozi-haiti/id6756228637?l=es-MX\\n\\n_(Klike sou lyen ble anlè a pou w ouvri App Store la)_",
    modifyTitle: "✏️ Modifye yon chan",
    modifyBody: (name) => name + ", ki eleman ou ta renmen korije anvan voye a ?",
    modifyBtnList: "Chwazi eleman an"
  },
  en: {
    langName: "English",
    welcome: (name) => "Hello " + name + " !\\n\\nI am *Pitonbot*, Technozi's virtual assistant! Welcome to *Technozi* (Faster & Easier), your partner in tech and energy solutions.\\n\\nHow can we help you today?",
    menuButton: "📋 Main Menu",
    secQuotes: "🛒 Quotes & Orders",
    rowMateriel: { title: "📦 IT Hardware Purchase", desc: "Laptops, computers, routers, parts" },
    rowInstal: { title: "🛠️ Installation Quote", desc: "Solar, Starlink, CCTV cameras, Network" },
    secInfo: "ℹ️ Discovery & Info",
    rowServices: { title: "🏢 Our 6 Expertise", desc: "Discover all Technozi services" },
    rowContact: { title: "📍 Contact & Hours", desc: "Official website, address and phone" },
    rowLang: { title: "🌐 Change Language", desc: "Kreyòl, Français, Español..." },
    errHint: "\\n\\n_(💡 If you made a mistake, you can edit it in the options at the end)_",
    cancelBtn: "❌ Cancel",
    confirmBtn: "✅ Confirm",
    modifyBtn: "✏️ Edit",
    cancelledMsg: "Request cancelled.",
    emailCorrected: (em) => "✅ _Email noted and corrected: *" + em + "*_\\n\\n",
    stepProduit: "📦 *IT EQUIPMENT PURCHASE (1/7)*\\n\\nWhat hardware or equipment are you looking for?\\n\\n_(Ex: Dell Core i7 Laptop, Wi-Fi Router, Monitor, SSD drive... or type 'cancel' to stop at any time)_",
    stepRef: "🏷️ *(2/7) Brand, Model or Reference:*\\nDo you have a specific brand, model, or reference in mind?\\n_(Ex: Dell Latitude, HP LaserJet, Cisco, TP-Link... or type 'None' if you'd like advice)_",
    stepQty: "🔢 *(3/7) Desired Quantity:*\\nHow many units would you like to order?\\n_(Please reply with a number, ex: 1, 2, 5, 10)_",
    stepNom: (name) => "👤 *(4/7) Full Name & Company:*\\nWhat is your full name and company name if applicable?\\n_(Type 'Me' to use your WhatsApp name: " + name + ")_",
    stepEmail: "📧 *(5/7) Email Address:*\\nWhat is your email address to receive your official quote and order tracking?\\n_(Ex: contact@example.com - or type 'None' if you do not have one)_",
    stepZone: "📍 *(6/7) Delivery City or Area:*\\nIn which city or neighborhood would you like delivery?\\n_(Ex: Pétion-Ville, Delmas, Port-au-Prince, Cap-Haïtien...)_",
    stepRemarques: "💬 *(7/7) Additional notes or remarks:*\\nDo you have any extra details or requirements for your order?\\n_(Ex: urgent, specific accessory... or type 'None' to finish)_",
    stepInstalProjet: "🛠️ *INSTALLATION QUOTE & TECHNICAL PROJECTS (1/5)*\\n\\nWhat installation or technical project would you like a quote for?\\n\\n_(Ex: 5kVA Hybrid Solar System, Starlink antenna setup, CCTV cameras, Office network cabling... or type 'cancel' to stop)_",
    stepInstalBatiment: "🏢 *(2/5) Building Type:*\\nWhat type of environment will the installation take place in?\\n_(Ex: Private residence, Retail/Store, Office, School, Warehouse...)_",
    stepInstalZone: "📍 *(3/5) Installation City or Area:*\\nIn which city or area should the intervention take place?\\n_(Ex: Pétion-Ville, Tabarre, Delmas, Cap-Haïtien...)_",
    stepInstalNom: (name) => "👤 *(4/5) Name & Company:*\\nWhat is your full name and/or company name?\\n_(Type 'Me' to use your WhatsApp name: " + name + ")_",
    stepInstalEmail: "📧 *(5/5) Email Address:*\\nAt which email address would you like to receive the technical quote or assessment?\\n_(Ex: contact@example.com - or type 'None' if you do not have one)_",
    recapTitleInstal: "📋 *SUMMARY OF YOUR TECHNICAL PROJECT*\\n",
    recapTitleMateriel: "📋 *SUMMARY OF YOUR EQUIPMENT ORDER*\\n",
    recapLabels: {
      ref: "🆔 Reference: ", client: "👤 Customer: ", phone: "📞 Phone: ", email: "📧 Email: ",
      projet: "🛠️ Project: ", batiment: "🏢 Building: ", zone: "📍 Area: ", produit: "📦 Product: ",
      refModel: "🏷️ Brand/Model: ", qty: "🔢 Quantity: ", remarques: "💬 Remarks: ",
      qInstal: "Do you confirm sending this technical assessment to our engineers?",
      qMateriel: "Do you confirm sending this request to our sales team?"
    },
    confirmSuccess: (isInstal, name, cmdId, phone, clientEmail) => {
      const emailPart = (clientEmail && clientEmail !== 'Non renseigné') ? " or via your email address: " + clientEmail : "";
      return "🎉 *Thank you " + name + " !*\\n\\nYour " + (isInstal ? "technical study" : "order") + " request *" + cmdId + "* has been successfully forwarded to the Technozi team.\\n\\nWe will evaluate your file and reach out to you on your WhatsApp number: + " + phone + emailPart + ".\\n\\nSee you soon at Technozi!";
    },
    servicesHeader: "🏢 Our 6 Core Solutions",
    servicesBody: "Here are the solutions offered by *Technozi Haïti* :\\n\\n1️⃣ ☀️ *Hybrid Solar Energy*\\nInverters, lithium batteries & solar panels for total autonomy.\\n\\n2️⃣ 🛰️ *Starlink Satellite Internet*\\nKit sales, mast mounting & pro Wi-Fi distribution.\\n\\n3️⃣ 📹 *Video Surveillance (CCTV)*\\nHD IP cameras, night vision & 24/7 smartphone access.\\n\\n4️⃣ 🌐 *IT Networks & Wi-Fi*\\nStructured cabling, patch panels & managed switches.\\n\\n5️⃣ 💻 *IT Hardware Sales*\\nBusiness laptops, desktops, servers & spare parts.\\n\\n6️⃣ 🔧 *IT Support & Maintenance*\\nManaged IT services & fast responsive support.\\n\\n👉 *What would you like to do?*",
    contactHeader: "📍 Contact & Hours",
    contactBody: "Official contact details for *Technozi Haïti* :\\n\\n🌐 *Website:* https://technozi-ht.com\\n📢 *WhatsApp Channel:* https://whatsapp.com/channel/0029Vb7XDp3EVccQG29idN2d\\n📞 *Sales Phone:* +509 37 03 0009\\n📧 *Official Email:* sales@technozi-ht.com\\n\\n🕒 *Business Hours:*\\n• Monday to Friday: 8:00 AM - 5:00 PM\\n• Saturday: 8:00 AM - 3:00 PM\\n• Sunday: Closed\\n\\n🚀 *Technozi - Faster & Easier !*",
    btnDownloadApp: "📱 Download App",
    rowApp: { title: "📱 Download Mobile App", desc: "Available on Android and iPhone" },
    appChoiceHeader: "📱 Technozi Mobile App",
    appChoiceBody: "📱 *Download Technozi Mobile App*\\n\\nInstall our official app to place orders, track your quotes, and access all our tech solutions right from your phone!\\n\\n👉 *Choose your platform below :*",
    btnPlayStore: "🤖 Google Play",
    btnAppStore: "🍏 App Store",
    playStoreMsg: "🤖 *Technozi App on Google Play (Android)*\\n\\nHere is your direct link to download the app:\\n\\n👉 https://play.google.com/store/apps/details?id=com.wiserpos.technozi&hl=en_SG\\n\\n_(Click the blue link above to open Google Play Store)_",
    appStoreMsg: "🍏 *Technozi App on the App Store (iPhone / iOS)*\\n\\nHere is your direct link to download the app:\\n\\n👉 https://apps.apple.com/us/app/technozi-haiti/id6756228637?l=es-MX\\n\\n_(Click the blue link above to open App Store)_",
    modifyTitle: "✏️ Edit an element",
    modifyBody: (name) => name + ", which element would you like to edit before sending?",
    modifyBtnList: "Select element"
  },
  es: {
    langName: "Español",
    welcome: (name) => "¡Hola " + name + " !\\n\\n¡Soy *Pitonbot*, el asistente virtual de Technozi! Bienvenido a *Technozi* (Faster & Easier), su socio en soluciones tecnológicas y energéticas.\\n\\n¿Cómo podemos ayudarle hoy?",
    menuButton: "📋 Menú Principal",
    secQuotes: "🛒 Cotizaciones",
    rowMateriel: { title: "📦 Compra Equipos IT", desc: "Laptops, computadoras, routers, piezas" },
    rowInstal: { title: "🛠️ Cotización Instal", desc: "Solar, Starlink, Cámaras CCTV, Red" },
    secInfo: "ℹ️ Información",
    rowServices: { title: "🏢 6 Especialidades", desc: "Descubrir todos los servicios de Technozi" },
    rowContact: { title: "📍 Contacto y Horarios", desc: "Sitio oficial, dirección y teléfono" },
    rowLang: { title: "🌐 Cambiar Idioma", desc: "Kreyòl, Français, English..." },
    errHint: "\\n\\n_(💡 Si cometió un error, podrá modificarlo en las opciones al final)_",
    cancelBtn: "❌ Cancelar",
    confirmBtn: "✅ Confirmar",
    modifyBtn: "✏️ Modificar",
    cancelledMsg: "Solicitud cancelada.",
    emailCorrected: (em) => "✅ _Correo anotado y corregido: *" + em + "*_\\n\\n",
    stepProduit: "📦 *COMPRA DE EQUIPOS IT (1/7)*\\n\\n¿Qué equipo o material está buscando?\\n\\n_(Ej: Laptop Dell Core i7, Router Wi-Fi, Monitor, Disco SSD... o escriba 'cancelar' para detenerse)_",
    stepRef: "🏷️ *(2/7) Marca, Modelo o Referencia:*\\n¿Tiene una marca, modelo o referencia específica en mente?\\n_(Ej: Dell Latitude, HP LaserJet, Cisco, TP-Link... o escriba 'Ninguna' si desea asesoría)_",
    stepQty: "🔢 *(3/7) Cantidad deseada:*\\n¿Cuántas unidades desea pedir?\\n_(Por favor responda con un número, ej: 1, 2, 5, 10)_",
    stepNom: (name) => "👤 *(4/7) Nombre completo y Empresa:*\\n¿Cuál es su nombre completo y el nombre de su empresa si aplica?\\n_(Escriba 'Yo' para usar su nombre de WhatsApp: " + name + ")_",
    stepEmail: "📧 *(5/7) Correo electrónico:*\\n¿Cuál es su correo electrónico para recibir su cotización oficial y seguimiento?\\n_(Ej: contacto@ejemplo.com - o escriba 'Ninguno' si no tiene)_",
    stepZone: "📍 *(6/7) Ciudad o Zona de entrega:*\\n¿En qué zona o ciudad desea recibir la entrega?\\n_(Ej: Pétion-Ville, Delmas, Port-au-Prince, Cap-Haïtien...)_",
    stepRemarques: "💬 *(7/7) Observaciones o detalles adicionales:*\\n¿Tiene algún detalle adicional o requisito para su pedido?\\n_(Ej: urgente, accesorio específico... o escriba 'Ninguno' para finalizar)_",
    stepInstalProjet: "🛠️ *COTIZACIÓN INSTALACIÓN Y PROYECTOS TÉCNICOS (1/5)*\\n\\n¿Para qué instalación o proyecto técnico desea una cotización?\\n\\n_(Ej: Sistema Solar Híbrido 5kVA, Antena Starlink, Cámaras CCTV, Cableado de red... o escriba 'cancelar' para detener)_",
    stepInstalBatiment: "🏢 *(2/5) Tipo de edificio:*\\n¿En qué tipo de entorno se realizará el trabajo?\\n_(Ej: Residencia privada, Comercio, Oficina, Escuela, Almacén...)_",
    stepInstalZone: "📍 *(3/5) Ciudad o Zona de la instalación:*\\n¿En qué ciudad o zona se realizará el trabajo?\\n_(Ej: Pétion-Ville, Tabarre, Delmas, Cap-Haïtien...)_",
    stepInstalNom: (name) => "👤 *(4/5) Nombre y Empresa:*\\n¿Cuál es su nombre completo y/o el nombre de su empresa?\\n_(Escriba 'Yo' para usar su nombre de WhatsApp: " + name + ")_",
    stepInstalEmail: "📧 *(5/5) Correo electrónico:*\\n¿A qué dirección de correo le gustaría recibir el estudio o cotización técnica?\\n_(Ej: contacto@ejemplo.com - o escriba 'Ninguno' si no tiene)_",
    recapTitleInstal: "📋 *RESUMEN DE SU PROYECTO TÉCNICO*\\n",
    recapTitleMateriel: "📋 *RESUMEN DE SU PEDIDO DE EQUIPOS*\\n",
    recapLabels: {
      ref: "🆔 Referencia: ", client: "👤 Cliente: ", phone: "📞 Teléfono: ", email: "📧 Correo: ",
      projet: "🛠️ Proyecto: ", batiment: "🏢 Edificio: ", zone: "📍 Zona: ", produit: "📦 Producto: ",
      refModel: "🏷️ Marca/Modelo: ", qty: "🔢 Cantidad: ", remarques: "💬 Observaciones: ",
      qInstal: "¿Confirma el envío de este estudio técnico a nuestros ingenieros?",
      qMateriel: "¿Confirma el envío de esta solicitud a nuestro equipo comercial?"
    },
    confirmSuccess: (isInstal, name, cmdId, phone, clientEmail) => {
      const emailPart = (clientEmail && clientEmail !== 'Non renseigné') ? " o por su correo electrónico: " + clientEmail : "";
      return "🎉 *¡Gracias " + name + " !*\\n\\nSu solicitud de " + (isInstal ? "estudio técnico" : "pedido") + " *" + cmdId + "* ha sido transmitida con éxito a nuestro equipo de Technozi.\\n\\nVamos a evaluar su expediente y nos comunicaremos con usted a su número de WhatsApp: + " + phone + emailPart + ".\\n\\n¡Hasta pronto en Technozi!";
    },
    servicesHeader: "🏢 Nuestras 6 Soluciones",
    servicesBody: "Estas son las soluciones que ofrece *Technozi Haïti* :\\n\\n1️⃣ ☀️ *Energía Solar Híbrida*\\nInversores, baterías de litio y paneles para autonomía total.\\n\\n2️⃣ 🛰️ *Internet Satelital Starlink*\\nVenta de kits, montaje y distribución Wi-Fi profesional.\\n\\n3️⃣ 📹 *Videovigilancia (CCTV)*\\nCámaras IP HD, visión nocturna y acceso móvil 24/7.\\n\\n4️⃣ 🌐 *Redes Informáticas y Wi-Fi*\\nCableado estructurado, racks y switches administrables.\\n\\n5️⃣ 💻 *Venta de Equipos IT*\\nLaptops profesionales, computadoras de escritorio y piezas.\\n\\n6️⃣ 🔧 *Soporte y Mantenimiento IT*\\nPlanes de mantenimiento y asistencia técnica rápida.\\n\\n👉 *¿Qué desea hacer?*",
    contactHeader: "📍 Contacto y Horarios",
    contactBody: "Datos oficiales de contacto de *Technozi Haïti* :\\n\\n🌐 *Sitio Web:* https://technozi-ht.com\\n📢 *Canal de WhatsApp:* https://whatsapp.com/channel/0029Vb7XDp3EVccQG29idN2d\\n📞 *Teléfono Comercial:* +509 37 03 0009\\n📧 *Correo Oficial:* sales@technozi-ht.com\\n\\n🕒 *Horarios de Atención:*\\n• Lunes a Viernes: 8:00 AM - 5:00 PM\\n• Sábado: 8:00 AM - 3:00 PM (15h00)\\n• Domingo: Cerrado\\n\\n🚀 *Technozi - Faster & Easier !*",
    btnDownloadApp: "📱 Descargar App",
    rowApp: { title: "📱 Descargar App", desc: "Disponible en Android e iPhone" },
    appChoiceHeader: "📱 Aplicación Technozi",
    appChoiceBody: "📱 *Descargar la Aplicación Móvil Technozi*\\n\\n¡Instale nuestra app oficial para realizar pedidos, seguir sus cotizaciones y acceder a todos nuestros servicios!\\n\\n👉 *Seleccione su plataforma abajo :*",
    btnPlayStore: "🤖 Google Play",
    btnAppStore: "🍏 App Store",
    playStoreMsg: "🤖 *Aplicación Technozi en Google Play (Android)*\\n\\nAquí tiene el enlace directo para descargar la aplicación:\\n\\n👉 https://play.google.com/store/apps/details?id=com.wiserpos.technozi&hl=en_SG\\n\\n_(Haga clic en el enlace azul de arriba para abrir Play Store)_",
    appStoreMsg: "🍏 *Aplicación Technozi en App Store (iPhone / iOS)*\\n\\nAquí tiene el enlace directo para descargar la aplicación:\\n\\n👉 https://apps.apple.com/us/app/technozi-haiti/id6756228637?l=es-MX\\n\\n_(Haga clic en el enlace azul de arriba para abrir App Store)_",
    modifyTitle: "✏️ Modificar un campo",
    modifyBody: (name) => name + ", ¿qué elemento desea corregir antes de enviar?",
    modifyBtnList: "Seleccionar elemento"
  }
};

function getLanguagePayload(phone, name) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: "🌐 Technozi Haïti"
      },
      body: {
        text: "Bonjour " + name + " ! / Bonjou " + name + " !\\n\\nVeuillez choisir votre langue de service :\\nTanpri chwazi lang sèvis ou a :\\nPlease choose your preferred language :\\nPor favor seleccione su idioma de servicio :"
      },
      footer: {
        text: "Kreyòl • Français • English • Español"
      },
      action: {
        button: "🌐 Chwazi / Choisir",
        sections: [
          {
            title: "🌐 Langues / Lang",
            rows: [
              {
                id: "lang_ht",
                title: "🇭🇹 Kreyòl Ayisyen",
                description: "Kontinye an Kreyòl"
              },
              {
                id: "lang_fr",
                title: "🇫🇷 Français",
                description: "Continuer en Français"
              },
              {
                id: "lang_en",
                title: "🇺🇸 English",
                description: "Continue in English"
              },
              {
                id: "lang_es",
                title: "🇪🇸 Español",
                description: "Continuar en Español"
              }
            ]
          }
        ]
      }
    }
  };
}

function getWelcomeListPayload(phone, name, lang, customBodyText) {
  const L = I18N[lang] || I18N.fr;
  const bodyText = customBodyText || L.welcome(name);
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: "👋 Technozi Haïti"
      },
      body: {
        text: bodyText
      },
      footer: {
        text: (L.menuButton || "Menu").substring(0, 60)
      },
      action: {
        button: (L.menuButton || "Menu").substring(0, 20),
        sections: [
          {
            title: (L.secQuotes || "Devis").substring(0, 24),
            rows: [
              {
                id: "opt_materiel",
                title: L.rowMateriel.title.substring(0, 24),
                description: L.rowMateriel.desc.substring(0, 72)
              },
              {
                id: "opt_installation",
                title: L.rowInstal.title.substring(0, 24),
                description: L.rowInstal.desc.substring(0, 72)
              }
            ]
          },
          {
            title: (L.secInfo || "Infos").substring(0, 24),
            rows: [
              {
                id: "opt_services",
                title: L.rowServices.title.substring(0, 24),
                description: L.rowServices.desc.substring(0, 72)
              },
              {
                id: "opt_contact",
                title: L.rowContact.title.substring(0, 24),
                description: L.rowContact.desc.substring(0, 72)
              },
              {
                id: "opt_app",
                title: (L.rowApp ? L.rowApp.title : "📱 Télécharger App").substring(0, 24),
                description: (L.rowApp ? L.rowApp.desc : "Play Store & App Store").substring(0, 72)
              },
              {
                id: "opt_lang",
                title: L.rowLang.title.substring(0, 24),
                description: L.rowLang.desc.substring(0, 72)
              }
            ]
          }
        ]
      }
    }
  };
}

function getRecapPayload(sess, phone) {
  const L = I18N[sess.lang] || I18N.fr;
  const isInstal = sess.data.typeDemande === 'installation';
  let recapText = "";

  if (isInstal) {
    recapText = L.recapTitleInstal +
      "────────────────────\\n" +
      L.recapLabels.ref + "*" + sess.data.cmdId + "*\\n" +
      L.recapLabels.client + "*" + sess.data.clientName + "*\\n" +
      L.recapLabels.phone + "*+" + phone + "*\\n" +
      L.recapLabels.email + "*" + sess.data.clientEmail + "*\\n" +
      L.recapLabels.projet + "*" + sess.data.projet + "*\\n" +
      L.recapLabels.batiment + "*" + sess.data.batiment + "*\\n" +
      L.recapLabels.zone + "*" + sess.data.zone + "*\\n" +
      "────────────────────\\n\\n" +
      L.recapLabels.qInstal;
  } else {
    recapText = L.recapTitleMateriel +
      "────────────────────\\n" +
      L.recapLabels.ref + "*" + sess.data.cmdId + "*\\n" +
      L.recapLabels.client + "*" + sess.data.clientName + "*\\n" +
      L.recapLabels.email + "*" + sess.data.clientEmail + "*\\n" +
      L.recapLabels.phone + "*+" + phone + "*\\n" +
      L.recapLabels.produit + "*" + sess.data.produit + "*\\n" +
      L.recapLabels.refModel + "*" + sess.data.reference + "*\\n" +
      L.recapLabels.qty + "*" + sess.data.quantite + "*\\n" +
      L.recapLabels.zone + "*" + sess.data.zone + "*\\n" +
      L.recapLabels.remarques + "*" + sess.data.remarques + "*\\n" +
      "────────────────────\\n\\n" +
      L.recapLabels.qMateriel;
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: recapText },
      action: {
        buttons: [
          { type: "reply", reply: { id: "btn_confirm", title: (L.confirmBtn || "").substring(0, 20) } },
          { type: "reply", reply: { id: "btn_modify", title: (L.modifyBtn || "").substring(0, 20) } },
          { type: "reply", reply: { id: "btn_cancel", title: (L.cancelBtn || "").substring(0, 20) } }
        ]
      }
    }
  };
}

function getModifyListPayload(sess, phone, name) {
  const L = I18N[sess.lang] || I18N.fr;
  const isInstal = sess.data.typeDemande === 'installation';
  let rows = [];

  if (isInstal) {
    rows = [
      { id: "mod_inst_projet", title: L.recapLabels.projet.trim(), description: (sess.data.projet || "").substring(0, 70) },
      { id: "mod_inst_batiment", title: L.recapLabels.batiment.trim(), description: (sess.data.batiment || "").substring(0, 70) },
      { id: "mod_inst_zone", title: L.recapLabels.zone.trim(), description: (sess.data.zone || "").substring(0, 70) },
      { id: "mod_inst_nom", title: L.recapLabels.client.trim(), description: (sess.data.clientName || "").substring(0, 70) },
      { id: "mod_inst_email", title: L.recapLabels.email.trim(), description: (sess.data.clientEmail || "").substring(0, 70) }
    ];
  } else {
    rows = [
      { id: "mod_produit", title: L.recapLabels.produit.trim(), description: (sess.data.produit || "").substring(0, 70) },
      { id: "mod_reference", title: L.recapLabels.refModel.trim(), description: (sess.data.reference || "").substring(0, 70) },
      { id: "mod_quantite", title: L.recapLabels.qty.trim(), description: "Qté : " + sess.data.quantite },
      { id: "mod_nom", title: L.recapLabels.client.trim(), description: (sess.data.clientName || "").substring(0, 70) },
      { id: "mod_email", title: L.recapLabels.email.trim(), description: (sess.data.clientEmail || "").substring(0, 70) },
      { id: "mod_zone", title: L.recapLabels.zone.trim(), description: (sess.data.zone || "").substring(0, 70) },
      { id: "mod_remarques", title: L.recapLabels.remarques.trim(), description: (sess.data.remarques || "Aucune").substring(0, 70) }
    ];
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: L.modifyTitle
      },
      body: {
        text: L.modifyBody(name)
      },
      footer: {
        text: L.modifyBtnList
      },
      action: {
        button: (L.modifyBtnList || "Modifier").substring(0, 20),
        sections: [
          {
            title: (L.modifyTitle || "Champs").substring(0, 24),
            rows: rows.map(r => ({ ...r, title: (r.title || "").substring(0, 24), description: (r.description || "").substring(0, 72) }))
          }
        ]
      }
    }
  };
}

// Variables d'aide langue et annulation
const L = I18N[session.lang] || I18N.fr;
const isCancel = userLower === 'annuler' || userLower === 'anile' || userLower === 'cancel' || userLower === 'cancelar' || userLower === 'stop' || userLower === 'quitter';

// ========================================================
// 0. ÉTAPE SÉLECTION DE LA LANGUE (KREYÒL, FRANÇAIS, ENGLISH, ESPAÑOL)
// ========================================================
if (session.step === 'AWAIT_LANGUAGE' || !session.lang) {

  let chosenLang = '';
  if (userText === 'lang_ht' || userLower.includes('kreyol') || userLower.includes('kreyòl') || userLower.includes('creole') || userLower === '1' || userLower === 'ht') {
    chosenLang = 'ht';
  } else if (userText === 'lang_fr' || userLower.includes('francais') || userLower.includes('français') || userLower.includes('french') || userLower === '2' || userLower === 'fr') {
    chosenLang = 'fr';
  } else if (userText === 'lang_en' || userLower.includes('anglais') || userLower.includes('english') || userText === '3' || userLower === 'en') {
    chosenLang = 'en';
  } else if (userText === 'lang_es' || userLower.includes('espagnol') || userLower.includes('espanol') || userLower.includes('español') || userLower.includes('spanish') || userText === '4' || userLower === 'es') {
    chosenLang = 'es';
  }

  if (chosenLang) {
    session.lang = chosenLang;
    session.step = 'AWAIT_MENU_CHOICE';
    whatsappPayload = getWelcomeListPayload(senderPhone, senderName, chosenLang);
  } else {
    whatsappPayload = getLanguagePayload(senderPhone, senderName);
    session.step = 'AWAIT_LANGUAGE';
  }

// ========================================================
// 1. ÉTAPE ACCUEIL : ENVOI DU MENU LISTE
// ========================================================
} else if (session.step === 'WELCOME' || session.step === 'START') {
  whatsappPayload = getWelcomeListPayload(senderPhone, senderName, session.lang);
  session.step = 'AWAIT_MENU_CHOICE';

// ========================================================
// 2. ÉTAPE CHOIX DU MENU
// ========================================================
} else if (session.step === 'AWAIT_MENU_CHOICE') {

  // A. CLIC DIRECT SUR GOOGLE PLAY STORE
  if (userText === 'btn_playstore' || userLower.includes('playstore') || userLower.includes('google play') || userLower.includes('android')) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: L.playStoreMsg
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "btn_appstore", title: (L.btnAppStore || "🍏 App Store").substring(0, 20) } },
            { type: "reply", reply: { id: "btn_menu", title: (L.menuButton || "").substring(0, 20) } }
          ]
        }
      }
    };
    session.step = 'AWAIT_MENU_CHOICE';

  // B. CLIC DIRECT SUR APPLE APP STORE
  } else if (userText === 'btn_appstore' || userLower.includes('appstore') || userLower.includes('apple') || userLower.includes('iphone') || userLower.includes('ios')) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: L.appStoreMsg
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "btn_playstore", title: (L.btnPlayStore || "🤖 Google Play").substring(0, 20) } },
            { type: "reply", reply: { id: "btn_menu", title: (L.menuButton || "").substring(0, 20) } }
          ]
        }
      }
    };
    session.step = 'AWAIT_MENU_CHOICE';

  // C. CHOIX APPLICATION MOBILE (MENU OU BOUTON CONTACT)
  } else if (userText === 'btn_app' || userText === 'opt_app' || userLower.includes('telecharge') || userLower.includes('telechaje') || userLower.includes('download') || userLower.includes('descarga') || userLower.includes('application') || userLower.includes('aplikasyon')) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: (L.appChoiceHeader || "📱 App Technozi").substring(0, 60)
        },
        body: {
          text: L.appChoiceBody
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "btn_playstore", title: (L.btnPlayStore || "🤖 Google Play").substring(0, 20) } },
            { type: "reply", reply: { id: "btn_appstore", title: (L.btnAppStore || "🍏 App Store").substring(0, 20) } },
            { type: "reply", reply: { id: "btn_menu", title: (L.menuButton || "").substring(0, 20) } }
          ]
        }
      }
    };
    session.step = 'AWAIT_MENU_CHOICE';

  // D. CHOIX LANGUE
  } else if (userText === 'opt_lang' || userLower === 'lang' || userLower === 'langue' || userLower === 'language' || userLower === 'idioma' || userLower === 'chanje lang' || userLower === '5') {
    whatsappPayload = getLanguagePayload(senderPhone, senderName);
    session.step = 'AWAIT_LANGUAGE';

  // E. CHOIX 1 : ACHAT MATÉRIEL IT
  } else if (userText === 'opt_materiel' || userLower.includes('materiel') || userLower.includes('matériel') || userLower.includes('materyel') || userLower.includes('hardware') || userLower.includes('equipo') || userLower.includes('laptop') || userLower.includes('ordinateur') || userLower === '1') {
    session.data.typeDemande = 'materiel';
    whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepProduit + L.errHint
      }
    };
    session.step = 'AWAIT_PRODUIT';

  // F. CHOIX 2 : DEVIS INSTALLATION & SERVICES TECHNIQUES
  } else if (userText === 'opt_installation' || userLower.includes('installation') || userLower.includes('enstalasyon') || userLower.includes('instalacion') || userLower.includes('solaire') || userLower.includes('sole') || userLower.includes('solar') || userLower.includes('starlink') || userLower.includes('camera') || userLower.includes('caméra') || userLower.includes('kamera') || userLower.includes('cctv') || userLower.includes('reseau') || userLower.includes('rezo') || userLower.includes('red') || userLower === '2') {
    session.data.typeDemande = 'installation';
    whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepInstalProjet + L.errHint
      }
    };
    session.step = 'AWAIT_INSTAL_PROJET';

  // G. CHOIX 3 : DÉCOUVERTE DES 6 SERVICES MÉTIERS
  } else if (userText === 'opt_services' || userLower.includes('service') || userLower.includes('sevis') || userLower.includes('sèvis') || userLower.includes('servicio') || userLower.includes('expertise') || userLower.includes('catalogue') || userLower === '3') {
    whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: L.servicesHeader
        },
        body: {
          text: L.servicesBody
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "opt_materiel", title: (L.rowMateriel.title || "").substring(0, 20) } },
            { type: "reply", reply: { id: "opt_installation", title: (L.rowInstal.title || "").substring(0, 20) } },
            { type: "reply", reply: { id: "btn_menu", title: (L.menuButton || "").substring(0, 20) } }
          ]
        }
      }
    };
    session.step = 'AWAIT_MENU_CHOICE';

  // H. CHOIX 4 : CONTACT & HORAIRES
  } else if (userText === 'opt_contact' || userLower.includes('contact') || userLower.includes('kontak') || userLower.includes('contacto') || userLower.includes('adresse') || userLower.includes('adres') || userLower.includes('direccion') || userLower.includes('horaire') || userLower.includes('horario') || userLower.includes('orè') || /\b(ore|sit|site)\b/i.test(userLower) || userLower === '4') {
    whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: L.contactHeader
        },
        body: {
          text: L.contactBody
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "btn_app", title: (L.btnDownloadApp || "📱 Télécharger App").substring(0, 20) } },
            { type: "reply", reply: { id: "btn_menu", title: (L.menuButton || "").substring(0, 20) } }
          ]
        }
      }
    };
    session.step = 'AWAIT_MENU_CHOICE';

  // MESSAGE NON COMPRIS : RÉPONSE PÉDAGOGIQUE PERSONNALISÉE
  } else {
    whatsappPayload = getWelcomeListPayload(senderPhone, senderName, session.lang);
  }

// ========================================================
// FLUX 1 : ACHAT MATÉRIEL (ÉTAPES 1 À 7)
// ========================================================
} else if (session.step === 'AWAIT_PRODUIT') {

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else if (rawText === '[Autre format]' || userText.length < 2) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepProduit + L.errHint
      }
    };
  } else {
    session.data.produit = userText;
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepRef + L.errHint
      }
    };
    session.step = 'AWAIT_REF';
  }

} else if (session.step === 'AWAIT_REF') {

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else {
    const isNone = userLower.includes('aucun') || userLower.includes('okenn') || userLower.includes('none') || userLower.includes('ningun') || userLower.includes('non') || userLower.includes('pas d');
    session.data.reference = isNone ? 'Non spécifié' : userText;
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepQty + L.errHint
      }
    };
    session.step = 'AWAIT_QTY';
  }

} else if (session.step === 'AWAIT_QTY') {

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else {
    const cleanQty = userText.trim().replace(',', '.');
    const parsedNum = Number(cleanQty);
    if (!isNaN(parsedNum) && parsedNum > 0) {
      session.data.quantite = cleanQty;
      whatsappPayload = {
        messaging_product: "whatsapp",
        to: senderPhone,
        type: "text",
        text: {
          body: L.stepNom(senderName) + L.errHint
        }
      };
      session.step = 'AWAIT_NOM';
    } else {
      whatsappPayload = {
        messaging_product: "whatsapp",
        to: senderPhone,
        type: "text",
        text: {
          body: L.stepQty + L.errHint
        }
      };
    }
  }

} else if (session.step === 'AWAIT_NOM') {

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else if (rawText === '[Autre format]' || userText.length < 2) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepNom(senderName) + L.errHint
      }
    };
  } else {
    const isUseMyName = userLower === 'moi' || userLower === 'mwen' || userLower === 'me' || userLower === 'yo' || userLower === 'yo mismo';
    session.data.clientName = isUseMyName ? senderName : userText;
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepEmail + L.errHint
      }
    };
    session.step = 'AWAIT_EMAIL';
  }

} else if (session.step === 'AWAIT_EMAIL') {

  const isNoEmail = userLower.includes('aucun') || userLower.includes('okenn') || userLower.includes('none') || userLower.includes('ningun') || userLower.includes('pas d') || userLower.includes('non') || userLower.includes('pa gen') || userLower.includes('sans') || userLower.includes('rien') || userLower.includes('nada');

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else if (!isLikelyEmail(userText) && !isNoEmail) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepEmail + L.errHint
      }
    };
  } else {
    const cleanInput = userText.trim().replace(/[.,;:!?]+$/, '');
    const finalEmail = isNoEmail ? 'Non renseigné' : autoCorrectEmail(cleanInput);
    session.data.clientEmail = finalEmail;
    const correctionMsg = (!isNoEmail && finalEmail.toLowerCase() !== cleanInput.toLowerCase())
      ? L.emailCorrected(finalEmail)
      : "";
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: correctionMsg + L.stepZone + L.errHint
      }
    };
    session.step = 'AWAIT_ZONE';
  }

} else if (session.step === 'AWAIT_ZONE') {

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else if (rawText === '[Autre format]' || userText.length < 2) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepZone + L.errHint
      }
    };
  } else {
    session.data.zone = userText;
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepRemarques + L.errHint
      }
    };
    session.step = 'AWAIT_REMARQUES';
  }

} else if (session.step === 'AWAIT_REMARQUES') {

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else {
    const isNone = userLower.includes('aucun') || userLower.includes('okenn') || userLower.includes('none') || userLower.includes('ningun') || userLower.includes('non') || userLower.includes('rien') || userLower.includes('ryen') || userLower.includes('nada');
    session.data.remarques = isNone ? 'Aucune' : userText;

    const cmdId = "CMD-" + Math.floor(100000 + Math.random() * 900000);
    session.data.cmdId = cmdId;

    whatsappPayload = getRecapPayload(session, senderPhone);
    session.step = 'AWAIT_CONFIRMATION';
  }

// ========================================================
// FLUX 2 : PROJET INSTALLATION TECHNIQUE (ÉTAPES 1 À 5)
// ========================================================
} else if (session.step === 'AWAIT_INSTAL_PROJET') {

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else if (rawText === '[Autre format]' || userText.length < 2) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepInstalProjet + L.errHint
      }
    };
  } else {
    session.data.projet = userText;
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepInstalBatiment + L.errHint
      }
    };
    session.step = 'AWAIT_INSTAL_BATIMENT';
  }

} else if (session.step === 'AWAIT_INSTAL_BATIMENT') {

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else if (rawText === '[Autre format]' || userText.length < 2) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepInstalBatiment + L.errHint
      }
    };
  } else {
    session.data.batiment = userText;
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepInstalZone + L.errHint
      }
    };
    session.step = 'AWAIT_INSTAL_ZONE';
  }

} else if (session.step === 'AWAIT_INSTAL_ZONE') {

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else if (rawText === '[Autre format]' || userText.length < 2) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepInstalZone + L.errHint
      }
    };
  } else {
    session.data.zone = userText;
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepInstalNom(senderName) + L.errHint
      }
    };
    session.step = 'AWAIT_INSTAL_NOM';
  }

} else if (session.step === 'AWAIT_INSTAL_NOM') {

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else if (rawText === '[Autre format]' || userText.length < 2) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepInstalNom(senderName) + L.errHint
      }
    };
  } else {
    const isUseMyName = userLower === 'moi' || userLower === 'mwen' || userLower === 'me' || userLower === 'yo' || userLower === 'yo mismo';
    session.data.clientName = isUseMyName ? senderName : userText;
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepInstalEmail + L.errHint
      }
    };
    session.step = 'AWAIT_INSTAL_EMAIL';
  }

} else if (session.step === 'AWAIT_INSTAL_EMAIL') {

  const isNoEmail = userLower.includes('aucun') || userLower.includes('okenn') || userLower.includes('none') || userLower.includes('ningun') || userLower.includes('pas d') || userLower.includes('non') || userLower.includes('pa gen') || userLower.includes('sans') || userLower.includes('rien') || userLower.includes('nada');

  if (isCancel) {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: { buttons: [{ type: "reply", reply: { id: "btn_menu", title: L.menuButton } }] }
      }
    };
  } else if (!isLikelyEmail(userText) && !isNoEmail) {
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: {
        body: L.stepInstalEmail + L.errHint
      }
    };
  } else {
    const cleanInput = userText.trim().replace(/[.,;:!?]+$/, '');
    const finalEmail = isNoEmail ? 'Non renseigné' : autoCorrectEmail(cleanInput);
    session.data.clientEmail = finalEmail;
    const cmdId = "TECH-" + Math.floor(100000 + Math.random() * 900000);
    session.data.cmdId = cmdId;

    whatsappPayload = getRecapPayload(session, senderPhone);
    session.step = 'AWAIT_CONFIRMATION';
  }

// ========================================================
// ÉTAPE DE CONFIRMATION AVEC OPTIONS (CONFIRMER, MODIFIER, ANNULER)
// ========================================================
} else if (session.step === 'AWAIT_CONFIRMATION') {

  if (userText === 'btn_confirm' || userLower.includes('oui') || userLower.includes('wi') || userLower.includes('yes') || userLower.includes('si') || userLower.includes('confirm') || userLower.includes('konfim') || userLower === '1') {
    shouldSendEmail = true;
    const isInstal = session.data.typeDemande === 'installation';

    emailData = {
      typeDemande: session.data.typeDemande,
      cmdId: session.data.cmdId,
      clientName: session.data.clientName,
      clientEmail: session.data.clientEmail,
      phone: senderPhone,
      lang: session.lang || 'fr',
      projet: session.data.projet || '',
      batiment: session.data.batiment || '',
      produit: session.data.produit || '',
      reference: session.data.reference || '',
      quantite: session.data.quantite || '',
      zone: session.data.zone || '',
      remarques: session.data.remarques || '',
      date: new Date().toLocaleString("fr-FR", { timeZone: "America/Port-au-Prince" })
    };

    const confirmMsg = L.confirmSuccess(isInstal, session.data.clientName, session.data.cmdId, senderPhone, session.data.clientEmail);

    whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: confirmMsg },
        action: {
          buttons: [
            { type: "reply", reply: { id: "btn_menu", title: (L.menuButton || "").substring(0, 20) } }
          ]
        }
      }
    };
    session.step = 'WELCOME';

  } else if (userText === 'btn_modify' || userLower.includes('modif') || userLower.includes('modify') || userLower.includes('edit') || userLower.includes('corrige') || userLower === '2') {
    whatsappPayload = getModifyListPayload(session, senderPhone, senderName);
    session.step = 'AWAIT_MODIFY_FIELD';

  } else if (userText === 'btn_cancel' || isCancel || userLower === '3') {
    session.step = 'WELCOME';
    whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: senderPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: L.cancelledMsg },
        action: {
          buttons: [
            { type: "reply", reply: { id: "btn_menu", title: (L.menuButton || "").substring(0, 20) } }
          ]
        }
      }
    };
  } else {
    whatsappPayload = getRecapPayload(session, senderPhone);
  }

// ========================================================
// ÉTAPE DE SÉLECTION DU CHAMP À MODIFIER
// ========================================================
} else if (session.step === 'AWAIT_MODIFY_FIELD') {

  if (userText === 'mod_produit') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepProduit } };
    session.step = 'EDIT_PRODUIT';
  } else if (userText === 'mod_reference') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepRef } };
    session.step = 'EDIT_REFERENCE';
  } else if (userText === 'mod_quantite') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepQty } };
    session.step = 'EDIT_QUANTITE';
  } else if (userText === 'mod_nom') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepNom(senderName) } };
    session.step = 'EDIT_NOM';
  } else if (userText === 'mod_email') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepEmail } };
    session.step = 'EDIT_EMAIL';
  } else if (userText === 'mod_zone') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepZone } };
    session.step = 'EDIT_ZONE';
  } else if (userText === 'mod_remarques') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepRemarques } };
    session.step = 'EDIT_REMARQUES';
  } else if (userText === 'mod_inst_projet') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepInstalProjet } };
    session.step = 'EDIT_INST_PROJET';
  } else if (userText === 'mod_inst_batiment') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepInstalBatiment } };
    session.step = 'EDIT_INST_BATIMENT';
  } else if (userText === 'mod_inst_zone') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepInstalZone } };
    session.step = 'EDIT_INST_ZONE';
  } else if (userText === 'mod_inst_nom') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepInstalNom(senderName) } };
    session.step = 'EDIT_INST_NOM';
  } else if (userText === 'mod_inst_email') {
    whatsappPayload = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: L.stepInstalEmail } };
    session.step = 'EDIT_INST_EMAIL';
  } else {
    whatsappPayload = getModifyListPayload(session, senderPhone, senderName);
  }

// ========================================================
// PRISE EN COMPTE DU CHAMP MODIFIÉ -> RETOUR AU RÉCAPITULATIF
// ========================================================
} else if (session.step === 'EDIT_PRODUIT') {
  session.data.produit = userText;
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else if (session.step === 'EDIT_REFERENCE') {
  session.data.reference = userText;
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else if (session.step === 'EDIT_QUANTITE') {
  const cleanQty = userText.trim().replace(',', '.');
  const parsedNum = Number(cleanQty);
  if (!isNaN(parsedNum) && parsedNum > 0) {
    session.data.quantite = cleanQty;
    whatsappPayload = getRecapPayload(session, senderPhone);
    session.step = 'AWAIT_CONFIRMATION';
  } else {
    whatsappPayload = {
      messaging_product: "whatsapp",
      to: senderPhone,
      type: "text",
      text: { body: L.stepQty }
    };
  }

} else if (session.step === 'EDIT_NOM') {
  session.data.clientName = userText;
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else if (session.step === 'EDIT_EMAIL') {
  const isNoEmail = userLower.includes('aucun') || userLower.includes('okenn') || userLower.includes('none') || userLower.includes('ningun') || userLower.includes('pas d');
  const cleanInput = userText.trim().replace(/[.,;:!?]+$/, '');
  session.data.clientEmail = isNoEmail ? 'Non renseigné' : autoCorrectEmail(cleanInput);
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else if (session.step === 'EDIT_ZONE') {
  session.data.zone = userText;
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else if (session.step === 'EDIT_REMARQUES') {
  session.data.remarques = userText;
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else if (session.step === 'EDIT_INST_PROJET') {
  session.data.projet = userText;
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else if (session.step === 'EDIT_INST_BATIMENT') {
  session.data.batiment = userText;
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else if (session.step === 'EDIT_INST_ZONE') {
  session.data.zone = userText;
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else if (session.step === 'EDIT_INST_NOM') {
  session.data.clientName = userText;
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else if (session.step === 'EDIT_INST_EMAIL') {
  const isNoEmail = userLower.includes('aucun') || userLower.includes('okenn') || userLower.includes('none') || userLower.includes('ningun') || userLower.includes('pas d');
  const cleanInput = userText.trim().replace(/[.,;:!?]+$/, '');
  session.data.clientEmail = isNoEmail ? 'Non renseigné' : autoCorrectEmail(cleanInput);
  whatsappPayload = getRecapPayload(session, senderPhone);
  session.step = 'AWAIT_CONFIRMATION';

} else {
  whatsappPayload = getWelcomeListPayload(senderPhone, senderName, session.lang);
  session.step = 'AWAIT_MENU_CHOICE';
}

// ========================================================
// FORMATAGE DE L'E-MAIL DE SYNTHÈSE COMMERCIAL POUR TECHNOZI
// ========================================================
let emailSubject = "";
let emailBody = "";

if (shouldSendEmail) {
  const langDisplay = {
    ht: "🇭🇹 Kreyòl Ayisyen",
    fr: "🇫🇷 Français",
    en: "🇺🇸 English",
    es: "🇪🇸 Español"
  }[emailData.lang || 'fr'] || "🇫🇷 Français";

  if (emailData.typeDemande === 'installation') {
    emailSubject = \`[PROJET TECHNIQUE TECHNOZI] \${emailData.cmdId} - \${emailData.projet} (\${emailData.clientName})\`;
    emailBody = \`NOUVELLE DEMANDE DE PROJET TECHNIQUE TECHNOZI
==================================================
Référence    : \${emailData.cmdId}
Date & Heure : \${emailData.date}
Langue Client: \${langDisplay}

COORDONNÉES DU CLIENT
--------------------------------------------------
Nom Client   : \${emailData.clientName}
E-mail       : \${emailData.clientEmail}
Téléphone    : +\${emailData.phone}

LIENS D'ACTION IMMÉDIATE
--------------------------------------------------
• Répondre sur WhatsApp : https://wa.me/\${emailData.phone}
• Écrire par E-mail     : mailto:\${emailData.clientEmail}

DÉTAILS DU PROJET TECHNIQUE
--------------------------------------------------
Type Projet  : \${emailData.projet}
Type Bâtiment: \${emailData.batiment}
Ville / Zone : \${emailData.zone}
==================================================
Transmis automatiquement par Pitonbot (Technozi WhatsApp Bot)\`;
  } else {
    emailSubject = \`[COMMANDE MATÉRIEL TECHNOZI] \${emailData.cmdId} - \${emailData.produit} (\${emailData.clientName})\`;
    emailBody = \`NOUVELLE COMMANDE DE MATÉRIEL IT TECHNOZI
==================================================
Référence    : \${emailData.cmdId}
Date & Heure : \${emailData.date}
Langue Client: \${langDisplay}

COORDONNÉES DU CLIENT
--------------------------------------------------
Nom Client   : \${emailData.clientName}
E-mail       : \${emailData.clientEmail}
Téléphone    : +\${emailData.phone}

LIENS D'ACTION IMMÉDIATE
--------------------------------------------------
• Répondre sur WhatsApp : https://wa.me/\${emailData.phone}
• Écrire par E-mail     : mailto:\${emailData.clientEmail}

DÉTAILS DU MATÉRIEL DEMANDÉ
--------------------------------------------------
Produit      : \${emailData.produit}
Référence    : \${emailData.reference}
Quantité     : \${emailData.quantite}
Zone Livr.   : \${emailData.zone}
Remarques    : \${emailData.remarques}
==================================================
Transmis automatiquement par Pitonbot (Technozi WhatsApp Bot)\`;
  }
}

return [{
  json: {
    senderPhone,
    whatsappPayload,
    shouldSendEmail,
    emailData,
    emailSubject,
    emailBody,
    emailDestination: "sales@technozi-ht.com"
  }
}];`
      },
      id: "brain-session",
      name: "2. Cerveau & Machine d'État",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [720, 420]
    },
    {
      parameters: {
        method: "POST",
        url: `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Authorization", value: `Bearer ${WHATSAPP_TOKEN}` },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify($json.whatsappPayload) }}",
        options: {}
      },
      id: "send-whatsapp",
      name: "3. Envoyer Réponse WhatsApp",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [980, 420]
    },
    {
      parameters: {
        jsCode: "const brainData = $('2. Cerveau & Machine d\\'État').item.json;\nif (brainData && brainData.shouldSendEmail === true) {\n  return [{ json: brainData }];\n}\nreturn [];"
      },
      id: "if-email",
      name: "4. Doit Envoyer Email ?",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1220, 420]
    },
    {
      parameters: {
        fromEmail: "sales@technozi-ht.com",
        toEmail: "={{ $('2. Cerveau & Machine d\\'État').item.json.emailDestination }}",
        subject: "={{ $('2. Cerveau & Machine d\\'État').item.json.emailSubject }}",
        emailFormat: "text",
        text: "={{ $('2. Cerveau & Machine d\\'État').item.json.emailBody }}",
        options: {}
      },
      credentials: {
        smtp: {
          id: "kJkckSErhAAeGSci",
          name: "SMTP account"
        }
      },
      id: "send-email-smtp",
      name: "5. Expédier Email Commercial (SMTP)",
      type: "n8n-nodes-base.emailSend",
      typeVersion: 2.1,
      position: [1460, 340]
    }
  ],
  connections: {
    "Webhook GET (Verification Meta)": {
      main: [
        [
          { node: "Respond to Webhook", type: "main", index: 0 }
        ]
      ]
    },
    "Webhook POST (Messages Entrants)": {
      main: [
        [
          { node: "1. Filtrer & Extraire Message", type: "main", index: 0 }
        ]
      ]
    },
    "1. Filtrer & Extraire Message": {
      main: [
        [
          { node: "2. Cerveau & Machine d'État", type: "main", index: 0 }
        ]
      ]
    },
    "2. Cerveau & Machine d'État": {
      main: [
        [
          { node: "3. Envoyer Réponse WhatsApp", type: "main", index: 0 }
        ]
      ]
    },
    "3. Envoyer Réponse WhatsApp": {
      main: [
        [
          { node: "4. Doit Envoyer Email ?", type: "main", index: 0 }
        ]
      ]
    },
    "4. Doit Envoyer Email ?": {
      main: [
        [
          { node: "5. Expédier Email Commercial (SMTP)", type: "main", index: 0 }
        ]
      ]
    }
  },
  settings: {
    executionOrder: "v1"
  }
};

const outputPath = path.join(__dirname, '..', 'workflows', 'technozi_commercial_bot_v1.json');
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2), 'utf-8');
console.log('Workflow multilingue généré dans :', outputPath);
