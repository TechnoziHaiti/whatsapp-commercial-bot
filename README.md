# Technozi AI Co-Pilot v2 — Assistant Commercial & Réceptionniste WhatsApp

Documentation technique et opérationnelle complète du bot commercial intelligent de **Technozi Haïti** (*"Faster & Easier"*), propulsé par **Google Gemini 3.5 Flash-Lite**, orchestré avec **n8n**, et connecté à WhatsApp via **Evolution API v2**.

---

## Sommaire

1. [Vue d'Ensemble & Mission du Bot](#1-vue-densemble--mission-du-bot)
2. [Architecture Technique & Infrastructure](#2-architecture-technique--infrastructure)
3. [Règles Métier & Comportement de l'IA (Le Cerveau)](#3-règles-métier--comportement-de-lia-le-cerveau)
4. [Gestion de la Prise en Main Humaine & Équipe Interne](#4-gestion-de-la-prise-en-main-humaine--équipe-interne)
5. [Sécurité de la Connexion WhatsApp (Page QR Code Sécurisée)](#5-sécurité-de-la-connexion-whatsapp-page-qr-code-sécurisée)
6. [Structure Détaillée du Workflow n8n (13 Nœuds)](#6-structure-détaillée-du-workflow-n8n-13-nœuds)
7. [Fichiers & Organisation du Répertoire](#7-fichiers--organisation-du-répertoire)
8. [Guide de Déploiement & Mise à Jour](#8-guide-de-déploiement--mise-à-jour)
9. [Commandes de Test & Simulation](#9-commandes-de-test--simulation)
10. [Maintenance & Dépannage (Troubleshooting)](#10-maintenance--dépannage-troubleshooting)

---

## 1. Vue d'Ensemble & Mission du Bot

- **Nom officiel :** Technozi AI Co-Pilot v2 (*Pitonbot*)
- **Entreprise :** Technozi Haïti (*"Faster & Easier"*)
- **Numéro WhatsApp officiel connecté :** `+509 37 03 0009`
- **Site Web :** `https://technozi-ht.com`
- **E-mail commercial :** `sales@technozi-ht.com`
- **Serveur de production :** VPS Bluehost (`50.6.4.254`), domaine `https://bot.technozi-ht.com`

### Philosophie Fondamentale : "Réceptionniste Collecteur" (Sans Base de Stock)
Le bot **n'est pas connecté à un inventaire de stock en direct**. Pour éviter toute promesse commerciale erronée ou hallucination de prix/disponibilité :
1. **Il est STRICTEMENT IMPOSSIBLE pour l'IA d'affirmer « nous avons ceci » ou « nous n'avons pas cela ».**
2. Le bot agit exactement comme un réceptionniste courtois à l'accueil de l'entreprise : il connaît le fonctionnement (horaires, liens, devis/proforma, applications mobiles), informe le client que l'équipe va vérifier la disponibilité, et **recueille méthodiquement les 5 à 7 informations indispensables** avant de dresser un récapitulatif complet pour l'administration.

---

## 2. Architecture Technique & Infrastructure

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   SMARTPHONE CLIENT                                    │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │  (WhatsApp Baileys Protocol)
                                             ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      SERVEUR VPS BLUEHOST (50.6.4.254 - Caddy SSL)                     │
 │                                                                                        │
 │  ┌─────────────────────────┐       ┌─────────────────┐       ┌──────────────────────┐  │
 │  │      EVOLUTION API      │◄─────►│      REDIS      │◄─────►│      POSTGRESQL      │  │
 │  │ (Passerelle v2.3.7 QR)  │       │ (Sessions/Lock) │       │   (États Instances)  │  │
 │  └────────────┬────────────┘       └─────────────────┘       └──────────────────────┘  │
 │               │  HTTP Webhook (MESSAGES_UPSERT & CONNECTION_UPDATE)                    │
 │               ▼                                                                        │
 │  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
 │  │                         N8N WORKFLOW (Technozi AI Co-Pilot v2)                   │  │
 │  │                                                                                  │  │
 │  │  • Filtre Anti-Spam / Anti-Doublon / Détection Prise en main Humaine             │  │
 │  │  • Silence Total pour l'Équipe Interne (Administratrice, Collègues)              │  │
 │  │  • Routage Instantané du Menu Rapide 1-5 (Sans appel IA)                         │  │
 │  │  • Suivi Calendaire Haïti & Mémoire Cumulative                                   │  │
 │  └────────────────────────┬─────────────────────────────────────────────────────────┘  │
 └───────────────────────────┼────────────────────────────────────────────────────────────┘
                             │  Appel API HTTPS
                             ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                     GOOGLE GEMINI 3.5 FLASH-LITE (Cerveau IA)                         │
 │                                                                                        │
 │  • Température 0.25 | Max 1024 Tokens | Sans Thinking pour latence ultra-courte        │
 │  • Isolation stricte des 4 langues : Kreyòl, Français, Anglais, Espagnol               │
 │  • Collecte en puces courtes & Récapitulatif d'administration modifiable en direct     │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Règles Métier & Comportement de l'IA (Le Cerveau)

### A. Le Menu Rapide Instantané (1 Seule Bulle — Zéro Latence)
Quand un utilisateur salue pour la première fois (`Bonjour`, `Bonjou`, `Hello`, `Hola`), tape `/reset`, ou demande explicitement `menu` / `opsyon` :
- Le bot répond **instantanément en 1 seule bulle** (sans appeler l'API Gemini pour économiser les quotas et répondre en 50 ms) :
```text
👋 *Technozi Haïti* — Comment pouvons-nous vous aider ?

*1* · 📱 Télécharger l'App
*2* · 🌐 Site Web Officiel
*3* · 🕒 Nos Horaires
*4* · 📋 Demander un Devis
*5* · 🧾 Demander une Proforma

_Répondez *1–5* ou écrivez directement votre besoin._
```
*(Disponible à l'identique en Kreyòl, Anglais et Espagnol).*

### B. Les 7 Informations Recueillies (Demandes Commerciales)
Dès qu'un client exprime un besoin produit ou choisit l'option 4 (*Devis*) ou 5 (*Proforma*) :
1. **Nom & Prénom (ou Entreprise)**
2. **E-mail**
3. **Numéro de téléphone**
4. **Produit(s) ou Service(s)**
5. **Quantité**
6. **Type de document souhaité** (*Devis* ou *Proforma*)
7. **Zone de livraison en Haïti**

Le bot annonce en 1 phrase courte que l'équipe va vérifier la disponibilité, puis liste en puces sobres (`•`) **uniquement les éléments encore manquants**.

### C. Isolation Stricte des Langues (Zéro Mélange)
Le bot détecte dynamiquement la langue du client et s'y verrouille :
- **Kreyòl Haïtien (`kr`) :** Vocabulaire authentique (*"Tanpri voye m"*, *"Nou pral verifye sa ak ekip la"*, *"an Ayiti"*).  
  ⚠️ **Règle absolue :** Le pays Haïti s'écrit toujours **`Ayiti`** (*« an Ayiti »*), **JAMAIS** *« an Ayisyen »*, **JAMAIS** *« bay m »* et **JAMAIS** *« Noté »* en français.
- **Français (`fr`) :** Zéro mot créole (*"Noté —"*, *"en Haïti"*, *"devis"*, *"proforma"*).
- **Anglais (`en`) :** Concis et naturel (*"Quote"*, *"Proforma Invoice"*, *"delivery area in Haiti"*).
- **Espagnol (`es`) :** Neutre et professionnel (*"Cotización"*, *"Factura Proforma"*, *"zona de entrega en Haití"*).

### D. Conscience du Jour Calendaire (Fuseau `America/Port-au-Prince`)
- Le bot compare la date du jour en Haïti (`YYYY-MM-DD`).
- **Nouveau Jour (`isNewDay: true`) :** L'ancien historique est clos pour repartir sur une session propre.
- **Même Journée en cours (`isNewDay: false`) :** Il est **strictement interdit** au bot de répéter *« Que puis-je faire pour vous aujourd'hui ? »*, *« Comment puis-je vous aider aujourd'hui ? »*, *« jodi a »*, *« today »* ou *« Bienvenue »* en plein milieu d'une conversation déjà entamée.

### E. Règle Anti-Attribution d'Anciennes Entreprises
Si une entreprise (ex. *Matelec*, *EyesSmart*, *Digitech*) a été évoquée dans des messages antérieurs mais n'est pas reprécisée pour la nouvelle demande :
- **Interdiction formelle d'affirmer d'office** que le devis est pour cette entreprise.
- Le bot doit **obligatoirement demander confirmation** :  
  *« Èske se pou [Ansyen Antrepriz] toujou, oubyen se pou yon lòt moun / antrepriz ? »*

### F. Clôture & Modification du Récapitulatif en Direct
Dès que les informations sont réunies, le bot génère le récapitulatif officiel :
```text
📋 *Récapitulatif pour l'administration Technozi*

• Nom / Entreprise : Octacore
• E-mail : contact@octacore.ht
• Téléphone : +509 3875 6867
• Produit(s) & Quantité : 5 Kits Solaires 5kVA
• Type : Devis
• Zone de livraison en Haïti : Pétion-Ville

L'équipe vérifie et prend le relais rapidement. Si vous souhaitez modifier une information, signalez-le-nous.
```
Si le client remarque une erreur (ex. *"Non, changez la quantité à 8"*), le bot met immédiatement à jour la fiche et renvoie le récapitulatif complet corrigé.

---

## 4. Gestion de la Prise en Main Humaine & Équipe Interne

Le bot opère en mode **Co-Pilote** sur le même compte WhatsApp que les conseillers humains :

### 1. Numéros de l'Équipe Interne (Silence Total du Bot)
Pour éviter que l'IA n'interfère dans les discussions internes entre l'administratrice et l'employée tenant le smartphone, les numéros suivants sont **définitivement exclus** :
- `+509 46 40 5968` (Administratrice Technozi)
- `+509 48 86 1464` (Équipe Interne)
- `+509 37 03 0009` (Numéro Technozi Bot lui-même)

Quand l'un de ces numéros envoie un message : **le bot fait un `return []` immédiat (silence radio complet)**.

### 2. Détection de Prise en Main Manuelle (`fromMe: true`)
Dès qu'un conseiller humain répond directement depuis le smartphone WhatsApp ou WhatsApp Web à un client :
- Le bot s'arrête automatiquement et entre en **pause pendant 60 minutes**.
- Il ne coupe pas la parole au conseiller.

### 3. Commandes Spéciales sur WhatsApp
- **`/ia` ou `/bot` :** Relance immédiatement l'IA sur la discussion sans attendre la fin des 60 minutes.
- **`/reset` :** Réinitialise totalement la session du client et renvoie le menu d'accueil en 1 bulle.

---

## 5. Sécurité de la Connexion WhatsApp (Page QR Code Sécurisée)

- **URL de connexion :** `https://bot.technozi-ht.com/webhook/connect`
- **Code PIN d'administration :** `3703` *(ou secours `technozi2026`)*

### Fonctionnement de la protection :
1. **Écran de verrouillage par défaut :** N'importe qui ouvrant ce lien voit un écran sombre avec un cadenas : **AUCUN QR code n'est exposé publiquement**.
2. **Déverrouillage :** L'administrateur entre le PIN `3703` et clique sur *Déverrouiller le QR Code*.
3. **Affichage dynamique :** Le QR Code live s'affiche et s'actualise toutes les 12 secondes jusqu'au scan.
4. **Statut Connecté :** Une fois scanné, la page affiche :  
   `✅ WhatsApp Technozi est Connecté ! (+509 37 03 0009)` avec un bouton `🔒 Verrouiller la page`.

---

## 6. Structure Détaillée du Workflow n8n (13 Nœuds)

Fichier source : [workflows/technozi_ai_copilot_v2.json](file:///c:/Users/RK_Piton/Documents/whatsapp-commercial-bot/workflows/technozi_ai_copilot_v2.json)

| N° | Nom du Nœud | Type | Rôle Exact |
|:---|:---|:---|:---|
| **1** | `Page Web QR Code (GET)` | Webhook | Point d'entrée HTTP GET pour `/webhook/connect`. |
| **2** | `Récupérer QR Evolution` | HTTP Request | Interroge l'API locale Evolution pour obtenir le QR code base64 ou le statut d'ouverture. |
| **3** | `Afficher Page HTML QR` | Respond to Webhook | Valide le PIN `3703`. Si invalide → écran cadenas. Si valide → page HTML dark mode avec QR Code live. |
| **4** | `Webhook Messages Evolution` | Webhook | Reçoit en direct les événements `messages.upsert` et `connection.update` d'Evolution API. |
| **5** | `1. Filtre & Détecteur Humain` | Code (JS) | • Ignore statuts, groupes et chaînes.<br>• Ignore les messages vieux de plus de 180s.<br>• Bloque les doublons (`msgId`).<br>• Met l'IA en silence total pour l'équipe (`4640-5968`, `4886-1464`).<br>• Détecte la réponse humaine (`fromMe`) et applique la pause de 60 min.<br>• Suit le jour calendaire d'Haïti et calcule `isNewDay`.<br>• Détecte la langue active (`kr`, `fr`, `en`, `es`). |
| **6** | `Est-ce une alerte technique ?` | If | Vérifie si WhatsApp vient d'envoyer un événement de déconnexion. |
| **7** | `Alerte Développeur (Email)` | Email Send (SMTP) | Envoie une alerte immédiate à `pitonrodjy@gmail.com` en cas de déconnexion de l'instance. |
| **8** | `Salut simple / Menu ?` | If | Vérifie si le message est un simple salut (`Bonjour`), un `/reset` ou une demande de `menu`. |
| **9** | `Menu Rapide Instantané (1 Bulle)` | Code (JS) | Génère le menu officiel 1–5 dans la langue du client en une seule bulle (zéro appel Gemini). |
| **10** | `Afficher 'En train d'écrire...'` | HTTP Request | Envoie la présence `composing` sur WhatsApp pour faire patienter le client de façon naturelle. |
| **11** | `2. Cerveau IA Gemini (Gratuit)` | HTTP Request | Appelle Google Gemini 3.5 Flash-Lite avec le prompt système complet et l'historique conversationnel (retry 3x, timeout 30s). |
| **12** | `3. Parser Réponse IA` | Code (JS) | • Concatène proprement les fragments texte sans couper de mot.<br>• Remplace les astérisques de liste par des puces `•`.<br>• Corrige le gras WhatsApp.<br>• Supprime toute fuite de balise système.<br>• Sauvegarde l'historique de discussion. |
| **13** | `4. Envoyer Réponse WhatsApp` | HTTP Request | Poste le message final au client via l'endpoint `/message/sendText/technozi` d'Evolution API. |

---

## 7. Fichiers & Organisation du Répertoire

```text
whatsapp-commercial-bot/
├── deploy/
│   ├── docker-compose.yml       # Configuration Caddy, n8n, Evolution API, Postgres, Redis
│   └── Caddyfile                # Reverse proxy HTTPS (bot.technozi-ht.com)
├── scripts/
│   ├── generate-evolution-workflow.js # Générateur maître du workflow n8n JSON
│   ├── generate-workflow.js           # Générateur alternatif (Meta Cloud API historique)
│   └── send-order-email.py            # Utilitaire d'envoi d'e-mail autonome
├── workflows/
│   └── technozi_ai_copilot_v2.json    # JSON prêt à être importé dans n8n
├── .env                         # Variables secrètes (API keys, SMTP, identifiants)
├── README.md                    # La présente documentation exhaustive
└── package.json                 # Dépendances Node.js et scripts utilitaires
```

---

## 8. Guide de Déploiement & Mise à Jour

### Étape 1 : Modifier ou reconfigurer les règles
Toute modification du comportement de l'IA, des numéros de téléphone ou des messages se fait dans [scripts/generate-evolution-workflow.js](file:///c:/Users/RK_Piton/Documents/whatsapp-commercial-bot/scripts/generate-evolution-workflow.js).

### Étape 2 : Régénérer le fichier JSON
Dans le terminal du projet :
```powershell
node scripts/generate-evolution-workflow.js
```
Cette commande reconstruit automatiquement [workflows/technozi_ai_copilot_v2.json](file:///c:/Users/RK_Piton/Documents/whatsapp-commercial-bot/workflows/technozi_ai_copilot_v2.json) en s'assurant qu'aucune clé privée n'est injectée dans le code public.

### Étape 3 : Tester avant de déployer
Exécuter la suite complète de tests unitaires :
```powershell
node C:\Users\RK_Piton\.gemini\antigravity\brain\012fbcf3-0269-43fc-8b1a-23f8398d01b4\scratch\test_workflow.js
```
Le résultat doit afficher : `ALL_TESTS_PASSED_SUCCESSFULLY`.

### Étape 4 : Importer dans n8n
1. Ouvrez l'interface n8n : `https://bot.technozi-ht.com`
2. Ouvrez le workflow **Technozi AI Co-Pilot v2**.
3. Cliquez sur le menu `...` en haut à droite → **Import from File** et choisissez `workflows/technozi_ai_copilot_v2.json`.
4. Dans le nœud **`2. Cerveau IA Gemini (Gratuit)`**, remplacez `VOTRE_CLE_GEMINI_ICI` par votre clé API Google Gemini réelle.
5. Dans **`Alerte Développeur (Email)`**, vérifiez la sélection du compte SMTP.
6. Cliquez sur **Save** et activez le switch en vert (**Active**).

---

## 9. Commandes de Test & Simulation

### Simulation Complète d'Échanges Réels
Pour tester le comportement de bout en bout contre l'API Gemini sans consommer de messages WhatsApp :
```powershell
node C:\Users\RK_Piton\.gemini\antigravity\brain\012fbcf3-0269-43fc-8b1a-23f8398d01b4\scratch\simulate_real_wf.js
```

### Scénario de Test sur Smartphone
Depuis un téléphone extérieur (ex. `+509 38 75 6867` ou un téléphone tiers) :
1. Envoyez `/reset` → vérifiez la réception du menu 1-5 en 1 bulle.
2. Envoyez `On frijidè m bezwen` → vérifiez que le bot note *Frijidè* et demande les informations manquantes en puces.
3. Envoyez `Nom antrepriz lan se octacore, numero an se 38756867, email lan se test@octacore.ht, zone nan se Petion ville, map pran on seul` → vérifiez qu'il demande seulement de choisir entre *Devi* ou *Pwofòma*.
4. Envoyez `Devi` → vérifiez l'affichage immédiat du `📋 *Rezime pou administrasyon Technozi a*`.
5. Envoyez `Bonjour` → vérifiez qu'il répond en continuité sans répéter *"aujourd'hui"*.

---

## 10. Maintenance & Dépannage (Troubleshooting)

### A. Si la session WhatsApp se déconnecte
1. Ouvrez `https://bot.technozi-ht.com/webhook/connect`.
2. Tapez le code PIN `3703` et validez.
3. Scannez le QR Code depuis WhatsApp sur le smartphone Technozi (**Appareils connectés → Connecter un appareil**).
4. Dès que la page affiche la confirmation verte, l'IA reprend le service instantanément.

### B. Si Evolution API freeze ou arrête de recevoir les messages
Sur le VPS en SSH (`root@50.6.4.254`) :
```bash
# Vider le cache Redis et redémarrer la passerelle
docker exec deploy-redis-1 redis-cli FLUSHDB
docker restart deploy-redis-1 deploy-evolution-api-1
```

### C. Vérifier les conteneurs en cours d'exécution
```bash
docker ps
docker logs --tail 50 deploy-evolution-api-1
```

---

*Développé avec rigueur pour Technozi Haïti — Architecture modulaire, robuste et maintenable.*
