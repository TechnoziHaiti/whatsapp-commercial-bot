const https = require('https');

function get(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'bot.technozi-ht.com',
      path: path
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
  const res = await get('/api/v1/executions?limit=3');
  console.log("n8n executions API:", res);
}

main().catch(console.error);
