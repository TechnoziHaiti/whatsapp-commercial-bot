const https = require('https');

function del(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'bot.technozi-ht.com',
      path: '/evolution' + path,
      method: 'DELETE',
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
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const res = await del('/instance/logout/technozi');
  console.log("Logout response:", res);
}

main().catch(console.error);
