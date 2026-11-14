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

async function main() {
  const res = await post('/webhook/set/technozi', {
    webhook: {
      enabled: true,
      url: "http://n8n:5678/webhook/evolution-whatsapp",
      webhookByEvents: false,
      events: ["INVALID_EVENT_NAME"]
    }
  });
  console.log("Response:", JSON.stringify(res, null, 2));
}

main().catch(console.error);
