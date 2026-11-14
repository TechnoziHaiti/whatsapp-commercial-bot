const https = require('https');

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
  const conn = await get('/instance/connect/technozi');
  console.log("Connect response:", conn);
}

main().catch(console.error);
