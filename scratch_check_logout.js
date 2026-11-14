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
  console.log("Checking /instance/connectionState/technozi...");
  const conn = await get('/instance/connectionState/technozi');
  console.log("Conn:", conn);
}

main().catch(console.error);
