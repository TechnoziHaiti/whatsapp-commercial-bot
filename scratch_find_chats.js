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
  const chats = await post('/chat/findChats/technozi', {});
  console.log("Chats count:", Array.isArray(chats) ? chats.length : chats);
  if (Array.isArray(chats)) {
    console.log("Top 5 chats:", chats.slice(0, 5));
  }
}

main().catch(console.error);
