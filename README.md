# Chatbot Commercial WhatsApp - Technozi (Phase 2)

Chatbot commercial automatisé pour WhatsApp Cloud API, orchestré avec **n8n** sous Node.js (Windows), avec recueil guidé des besoins clients, gestion d'état de session locale, et transmission normée par e-mail à `sales@technozi-ht.com`.

---

## 1. Contexte & Informations du Projet

- **Dossier de travail :** `C:\Users\RK_Piton\Documents\whatsapp-commercial-bot` (100% autonome).
- **Numéro WhatsApp cible (Production) :** `+509 37 03 0009` *(ne pas toucher pendant les tests : migration finale via code OTP)*.
- **Numéro de test sandbox (Meta) :** `+1 (555) 629-1089` *(utilisé exclusivement pendant toute la phase de développement et de validation)*.
- **E-mail de transmission commerciale :** `sales@technozi-ht.com`.
- **Environnement d'exécution :** Node.js v24.11.1 sous Windows (sans Docker).

---

## 2. Architecture & Explication Détaillée des Nœuds du Workflow

Le workflow est structuré en deux chaînes indépendantes et complémentaires :

```text
LIGNE 1 : SÉCURITÉ & VÉRIFICATION INITIALE META (GET)
[Webhook GET (Meta)] ────────► [Respond to Webhook]
(Vérifie le jeton secret)      (Renvoie le hub.challenge)

LIGNE 2 : LOGIQUE CONVERSATIONNELLE & COMMERCIALE (POST)
[Webhook POST] ──► [1. Filtrer & Extraire] ──► [2. Cerveau & Sessions] ──► [3. Envoyer WhatsApp]
(Écoute messages)   (Élimine les bruits)        (Gère la discussion)        (Répond au client)
                                                        │
                                                        ▼
                                             [4. Doit Envoyer Email ?]
                                                        │ (Si confirmation)
                                                        ▼
                                             [5. Formater Email Commercial]
                                             (Fiche vers sales@technozi-ht.com)
```

---

### **A. Ligne du haut : La passerelle de sécurité (Handshake)**

#### 1. `Webhook GET (Verification Meta)`
- **Rôle :** Porte d'entrée de sécurité pour Meta.
- **Fonctionnement :** Lorsque vous enregistrez l'URL du webhook dans la console Meta for Developers, Meta envoie une requête `GET` avec un challenge de vérification pour s'assurer que le serveur vous appartient.

#### 2. `Respond to Webhook`
- **Rôle :** Répondeur de validation.
- **Fonctionnement :** Il extrait et renvoie instantanément à Meta la valeur `hub.challenge`. C'est cette réponse immédiate qui valide la connexion avec la coche verte dans Meta.

---

### **B. Ligne du bas : Le Bot Conversationnel & Commercial**

#### 3. `Webhook POST (Messages Entrants)`
- **Rôle :** L'oreille du bot.
- **Fonctionnement :** Dès qu'un client envoie un message texte ou clique sur un bouton interactif sur WhatsApp, Meta transmet le contenu JSON en temps réel à ce nœud.

#### 4. `1. Filtrer & Extraire Message` (Nœud Code JavaScript)
- **Rôle :** Trieur et nettoyeur de données.
- **Fonctionnement :** Meta envoie au même Webhook à la fois les messages des clients et les notifications techniques (messages distribués, lus). Ce nœud :
  - Filtre et ignore les accusés de lecture/remise techniques.
  - Extrait le numéro de téléphone réel de l'expéditeur (`from`), le nom de son profil WhatsApp (`name`), et le message (texte saisi ou identifiant du bouton cliqué).

#### 5. `2. Cerveau & Machine d'État` (Nœud Code JavaScript)
- **Rôle :** Le cerveau et la mémoire de session du bot.
- **Fonctionnement :** 
  - Gère l'historique de chaque client sans base de données externe grâce à la mémoire interne n8n (`$getWorkflowStaticData`).
  - **Accueil / Menu :** Présente le message de bienvenue et 3 boutons interactifs WhatsApp :
    - 📝 *Demande de devis*
    - ℹ️ *Infos produits*
    - 👤 *Parler à un agent*
  - **Recueil guidé (7 étapes) :**
    1. Produit / Matériel recherché
    2. Référence ou Marque (ou "Aucune")
    3. Quantité souhaitée
    4. Nom complet / Entreprise (avec raccourci "Moi")
    5. Adresse E-mail du client (avec possibilité "Aucune")
    6. Commune ou Zone de livraison (Pétion-Ville, Delmas, etc.)
    7. Remarques ou précisions éventuelles
  - **Récapitulatif & Validation :** Génère un identifiant unique (ex: `CMD-748921`) et affiche la fiche complète avec deux boutons : `[✅ Confirmer]` et `[❌ Annuler]`.
  - **Commandes universelles :** Les mots `menu`, `recommencer`, `annuler` réinitialisent la session à tout moment.

#### 6. `3. Envoyer Réponse WhatsApp` (Nœud HTTP Request)
- **Rôle :** La voix du bot.
- **Fonctionnement :** Il appelle l'API WhatsApp Cloud officielle de Meta (`POST /v21.0/{PHONE_NUMBER_ID}/messages`) avec votre jeton d'authentification pour afficher directement les messages et boutons interactifs sur le smartphone du client.

#### 7. `4. Doit Envoyer Email ?` (Nœud If)
- **Rôle :** L'aiguilleur de décision.
- **Fonctionnement :** Vérifie si le client vient de cliquer sur `✅ Confirmer` :
  - Si le client est en cours de discussion : le workflow s'arrête ici sans envoyer d'e-mail.
  - Dès que le client confirme : il active la branche d'envoi d'e-mail.

#### 8. `5. Formater Email Commercial` (Nœud Code JavaScript)
- **Rôle :** Le secrétaire commercial.
- **Fonctionnement :** Rédige et structure la fiche récapitulative destinée à `sales@technozi-ht.com` contenant :
  - L'identifiant de la demande (`CMD-XXXXXX`).
  - La date et l'heure précises.
  - Les coordonnées complètes du client et un lien WhatsApp direct `https://wa.me/XXXXXXXX` permettant aux commerciaux de répondre en 1 clic.
  - L'ensemble du besoin exprimé (produit, référence, quantité, zone de livraison, remarques).

---

## 3. Guide de Démarrage Rapide

### 1. Variables d'environnement (`.env`)
Le fichier unique [`.env`](file:///c:/Users/RK_Piton/Documents/whatsapp-commercial-bot/.env) regroupe toute la configuration :
```env
WHATSAPP_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=1340656225805341
WHATSAPP_BUSINESS_ACCOUNT_ID=1123766086856094
WEBHOOK_VERIFY_TOKEN=technozi_secret_token_2026
EMAIL_DESTINATION=sales@technozi-ht.com
```

### 2. Commandes disponibles (dans le terminal VS Code)

- **Lancer n8n (Terminal 1) :**
  ```powershell
  npm start
  ```
  *Interface accessible sur : `http://localhost:5678`*

- **Lancer le tunnel HTTPS Cloudflare (Terminal 2) :**
  ```powershell
  npm run tunnel
  ```
  *Génère l'URL publique `https://xxxx.trycloudflare.com` nécessaire pour Meta.*

---

## 4. Procédure de Test sur Smartphone

1. Dans n8n, assurez-vous que le workflow est activé (**Published** en haut à droite).
2. Ouvrez WhatsApp sur votre smartphone.
3. Envoyez **« Bonjour »** au numéro de test Meta :  
   👉 **`+1 (555) 629-1089`**
4. Suivez le parcours interactif, testez les boutons, effectuez une fausse demande commerciale et vérifiez la confirmation finale.
