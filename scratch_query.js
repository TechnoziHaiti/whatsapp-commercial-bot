const https = require('https');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'bot.technozi-ht.com',
      path: '/evolution' + path,
      method: 'POST',
      headers: {
        'apikey': 'technozi_evolution_key_2026',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch (e) { resolve(buf); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'bot.technozi-ht.com',
      path: '/evolution' + path,
      headers: {
        'apikey': 'technozi_evolution_key_2026'
      }
    }, res => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch (e) { resolve(buf); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log("Checking connectionState...");
  const conn = await get('/instance/connectionState/technozi');
  console.log("Connection:", conn);

  console.log("\nChecking findMessages...");
  const msgs = await post('/chat/findMessages/technozi', {
    where: {
      key: {
        remoteJid: '50938756867@s.whatsapp.net'
      }
    },
    take: 5
  });
  console.log("Messages found:", JSON.stringify(msgs, null, 2));
}

main().catch(console.error);
