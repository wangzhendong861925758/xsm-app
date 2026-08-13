import https from 'https';

const body = JSON.stringify({
  model: 'deepseek-v4-pro',
  messages: [{ role: 'user', content: '你好，请回复"API正常"' }],
  temperature: 0.3,
  max_tokens: 50,
});

const req = https.request({
  hostname: 'token.xinhankr.com',
  path: '/v1/chat/completions',
  port: 443,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-ed1d4eb3a72434bbdef5dfc9fdca43321357e0cdea559d4e',
    'Content-Length': Buffer.byteLength(body),
    'User-Agent': 'Mozilla/5.0',
  },
  timeout: 30000,
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.slice(0, 500));
  });
});

req.on('error', e => console.error('Error:', e.message));
req.on('timeout', () => { req.destroy(); console.error('Timeout'); });
req.write(body);
req.end();
