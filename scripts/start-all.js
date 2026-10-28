const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// 1. Charger les variables d'environnement depuis .env
const envFile = path.join(projectRoot, '.env');
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  }
}

// 2. Configurer la persistance n8n dans .n8n/
process.env.N8N_USER_FOLDER = path.join(projectRoot, '.n8n');
process.env.N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS = 'false';

console.log('\x1b[36m==============================================================\x1b[0m');
console.log('\x1b[36m  Technozi WhatsApp Commercial Bot - Mode Tout-en-Un (Dev)\x1b[0m');
console.log('\x1b[36m==============================================================\x1b[0m');
console.log('📁 Dossier de données n8n : ' + process.env.N8N_USER_FOLDER);

// 3. Lancer n8n via PowerShell start-n8n.ps1
console.log('\x1b[35m[n8n]\x1b[0m Démarrage du serveur n8n...');
const n8n = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', path.join(projectRoot, 'scripts', 'start-n8n.ps1')], {
  env: process.env,
  cwd: projectRoot
});

n8n.stdout.on('data', (data) => {
  const str = data.toString();
  for (const line of str.split('\n')) {
    if (line.trim()) {
      console.log('\x1b[35m[n8n]\x1b[0m ' + line.trim());
    }
  }
});

n8n.stderr.on('data', (data) => {
  const str = data.toString();
  for (const line of str.split('\n')) {
    if (line.trim() && !line.includes('DeprecationWarning')) {
      console.error('\x1b[31m[n8n-err]\x1b[0m ' + line.trim());
    }
  }
});

n8n.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error('\x1b[31m[n8n] Arrêté avec code : ' + code + '\x1b[0m');
  }
});

// 4. Lancer ngrok
let ngrokPath = path.join(projectRoot, 'tools', 'ngrok.exe');
if (!fs.existsSync(ngrokPath)) {
  ngrokPath = path.join(projectRoot, 'ngrok.exe');
}
if (!fs.existsSync(ngrokPath)) {
  console.error('\x1b[31m[ERREUR] ngrok.exe introuvable dans ' + path.join(projectRoot, 'tools', 'ngrok.exe') + ' ni dans la racine ' + path.join(projectRoot, 'ngrok.exe') + '\x1b[0m');
  process.exit(1);
}

console.log('\x1b[34m[ngrok]\x1b[0m Lancement du tunnel HTTPS vers le port 5678...');
const ngrok = spawn(ngrokPath, ['http', '5678', '--log=stdout', '--log-format=json'], {
  env: process.env,
  cwd: projectRoot
});

ngrok.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error('\x1b[31m[ngrok] Arrêté avec code : ' + code + '\x1b[0m');
  }
});

// 5. Attendre que n8n ET ngrok soient tous les deux prêts
let attempts = 0;
let n8nReady = false;
let ngrokReady = false;
let publicUrl = '';

const checkServices = setInterval(() => {
  attempts++;

  // Vérifier n8n (sur le port 5678)
  if (!n8nReady) {
    const reqN8n = http.get('http://127.0.0.1:5678/healthz', (res) => {
      if (res.statusCode === 200) {
        n8nReady = true;
      }
    });
    reqN8n.on('error', () => {});
  }

  // Vérifier ngrok (sur le port 4040)
  if (!ngrokReady) {
    const reqNgrok = http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          const tunnel = json.tunnels?.[0];
          if (tunnel && tunnel.public_url) {
            ngrokReady = true;
            publicUrl = tunnel.public_url;
          }
        } catch (e) {}
      });
    });
    reqNgrok.on('error', () => {});
  }

  // Si les deux sont opérationnels, afficher le grand message vert
  if (n8nReady && ngrokReady) {
    clearInterval(checkServices);
    console.log('\n\x1b[32m==============================================================\x1b[0m');
    console.log('\x1b[32m  🎉 TOUS LES SERVICES SONT OPÉRATIONNELS !\x1b[0m');
    console.log('\x1b[32m==============================================================\x1b[0m');
    console.log('🧠 Interface locale n8n : \x1b[36mhttp://localhost:5678\x1b[0m');
    console.log('🌉 Tunnel public ngrok   : \x1b[33m' + publicUrl + '\x1b[0m');
    console.log('🔗 URL Webhook WhatsApp  : \x1b[33m' + publicUrl + '/webhook/whatsapp\x1b[0m');
    console.log('\x1b[90m(Appuyez sur Ctrl+C à tout moment pour arrêter n8n et le tunnel)\x1b[0m\n');
  }
}, 1000);

// 6. Gestion propre de l'arrêt (Ctrl+C)
function cleanup() {
  console.log('\n\x1b[33mArrêt de n8n et du tunnel ngrok...\x1b[0m');
  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      if (n8n.pid) execSync(`taskkill /PID ${n8n.pid} /F /T`, { stdio: 'ignore' });
      execSync('taskkill /IM ngrok.exe /F /T', { stdio: 'ignore' });
    } catch (e) {}
  } else {
    try { n8n.kill('SIGTERM'); } catch (e) {}
    try { ngrok.kill('SIGTERM'); } catch (e) {}
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
