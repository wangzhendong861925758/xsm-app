import https from 'https';

const key = 'sk-ed1d4eb3a72434bbdef5dfc9fdca43321357e0cdea559d4e';
const body = JSON.stringify({
  model: 'deepseek-v4-pro',
  messages: [{ role: 'user', content: '你好，请回复"连接成功"四个字' }],
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
    'Authorization': `Bearer ${key}`,
    'Content-Length': Buffer.byteLength(body),
    'User-Agent': 'Mozilla/5.0',
  },
  timeout: 30000,
}, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    console.log('BODY:', data.slice(0, 1000));
  });
});

req.on('error', (e) => console.log('ERROR:', e.code, e.message));
req.on('timeout', () => { req.destroy(); console.log('TIMEOUT'); });
req.write(body);
req.end();
