import os
import sys
import json
import base64
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# Charger .env manuellement
env_path = Path(__file__).parent.parent / '.env'
env_vars = {}
if env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env_vars[k.strip()] = v.strip().strip('"').strip("'")

smtp_host = env_vars.get('SMTP_HOST', 'smtp.gmail.com')
smtp_port = int(env_vars.get('SMTP_PORT', 587))
smtp_user = env_vars.get('SMTP_USER', 'pitonrodjy@gmail.com')
smtp_pass = env_vars.get('SMTP_PASS', '')
email_dest = env_vars.get('EMAIL_DESTINATION', 'pitonrodjy@gmail.com')

# Récupérer les données de la commande
data = {}
if len(sys.argv) > 1:
    raw = sys.argv[1].strip()
    try:
        # Essayer base64 d'abord
        decoded = base64.b64decode(raw).decode('utf-8')
        data = json.loads(decoded)
    except Exception:
        try:
            data = json.loads(raw)
        except Exception as e:
            print("Erreur parsing JSON/base64:", e)

if not data:
    print("Aucune donnee de commande recue.")
    sys.exit(1)

cmd_id = data.get('cmdId', 'CMD-INCONNU')
client_name = data.get('clientName', 'Client')
client_email = data.get('clientEmail', 'Non renseigne')
phone = data.get('phone', '')
produit = data.get('produit', '')
reference = data.get('reference', '')
quantite = data.get('quantite', '')
zone = data.get('zone', '')
remarques = data.get('remarques', '')
date_str = data.get('date', '')

subject = f"[DEMANDE COMMERCIALE WHATSAPP] {cmd_id} - {client_name}"

body_text = f"""NOUVELLE DEMANDE COMMERCIALE REÇUE SUR WHATSAPP
==================================================
Référence    : {cmd_id}
Date & Heure : {date_str}

COORDONNÉES DU CLIENT
--------------------------------------------------
Nom Client   : {client_name}
E-mail       : {client_email}
Téléphone    : +{phone}

LIENS D'ACTION IMMÉDIATE
--------------------------------------------------
• Répondre sur WhatsApp : https://wa.me/{phone}
• Écrire par E-mail     : mailto:{client_email}

DÉTAILS DU BESOIN EXPRIMÉ
--------------------------------------------------
Produit      : {produit}
Référence    : {reference}
Quantité     : {quantite}
Zone livr.   : {zone}
Remarques    : {remarques}
==================================================
Transmis automatiquement par Technozi WhatsApp Bot
"""

msg = MIMEMultipart()
msg['From'] = f"Technozi Commercial <{smtp_user}>"
msg['To'] = email_dest
msg['Subject'] = subject
msg.attach(MIMEText(body_text, 'plain', 'utf-8'))

try:
    if smtp_port == 465:
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    else:
        ctx = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls(context=ctx)
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    print(f"EMAIL_ENVOYE_AVEC_SUCCES: {cmd_id} vers {email_dest}")
except Exception as e:
    print(f"ERREUR_ENVOI_EMAIL: {e}")
    sys.exit(1)
