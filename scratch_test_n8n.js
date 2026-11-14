const https = require('https');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'bot.technozi-ht.com',
      path: path,
      method: 'POST',
      headers: {
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
  const payload = {
    event: "messages.upsert",
    instance: "technozi",
    data: {
      key: {
        remoteJid: "50938756867@s.whatsapp.net",
        fromMe: false,
        id: "TEST_SIMUL_" + Date.now()
      },
      pushName: "R.K. Piton",
      message: {
        conversation: "Bonjour"
      },
      messageType: "conversation",
      messageTimestamp: Math.floor(Date.now() / 1000)
    }
  };

  console.log("Sending simulated message to n8n webhook...");
  const res = await post('/webhook/evolution-whatsapp', payload);
  console.log("n8n response:", res);
}

main().catch(console.error);
