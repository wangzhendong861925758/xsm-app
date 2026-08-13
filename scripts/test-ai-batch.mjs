import https from 'https';
import { readFileSync } from 'fs';

const API_KEY = 'sk-ed1d4eb3a72434bbdef5dfc9fdca43321357e0cdea559d4e';
const API_HOST = 'token.xinhankr.com';
const API_PATH = '/v1/chat/completions';
const MODEL = 'deepseek-v4-pro';

function callAI(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, messages, temperature: 0.3, max_tokens: 8192 });
    const req = https.request({
      hostname: API_HOST, path: API_PATH, port: 443, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'Mozilla/5.0',
      }, timeout: 120000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error(`API ${res.statusCode}: ${data.slice(0, 300)}`)); return; }
        try { resolve(JSON.parse(data).choices?.[0]?.message?.content || ''); }
        catch(e) { reject(new Error(`JSON err: ${data.slice(0, 150)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body); req.end();
  });
}

// 读取第一个分片的前3道选择题
const questions = JSON.parse(readFileSync('d:/小四门软件/public/data/questions/biology_七年级上册_人教版.json', 'utf8'));
const choiceQs = questions.filter(q => q.type === 'single' || q.type === 'judge').slice(0, 3);

console.log('=== 测试题目 ===');
choiceQs.forEach((q, i) => {
  console.log(`\n${i+1}. [${q.type}] ${q.stem}`);
  q.options.forEach((o, j) => console.log(`   ${String.fromCharCode(65+j)}. ${o}`));
  console.log(`   答案: ${q.answer}`);
  console.log(`   options.length: ${q.options.length}`);
});

const items = choiceQs.map((q, i) => {
  const opts = q.options.map((o, j) => `${String.fromCharCode(65+j)}. ${o}`).join('\n');
  const ans = Array.isArray(q.answer) ? q.answer.join('') : q.answer;
  const typeName = q.type === 'judge' ? '判断题' : '单选题';
  return `${i+1}. [${typeName}] ${q.stem}\n${opts}\n正确答案: ${ans}`;
}).join('\n\n');

const prompt = `你是一位经验丰富的初中生物老师。请为以下3道选择题/判断题，为每个选项生成针对性的解析。

要求：
1. 错误选项：1句话说明选该选项为什么错、错在哪里、混淆了什么知识点
2. 正确选项：1-2句话说明正确思路，解释为什么这个答案对、依据什么知识
3. 语言简洁准确，适合初中生理解，不要泛泛而谈
4. 每个选项的解析必须不同且具体，禁止出现"根据所学知识该说法正确/错误"之类的模板话术

严格按JSON数组输出，不要任何其他文字：
[{"index":1,"optionAnalysis":["A选项错因...","B选项错因...","正确思路：...","D选项错因..."]}]

题目：
${items}`;

console.log('\n=== 发送请求 ===');
const resp = await callAI([
  { role: 'system', content: '你是经验丰富的初中各科教师，擅长分析每道题每个选项的错因，讲解具体知识点。必须严格输出JSON数组，不要其他内容。' },
  { role: 'user', content: prompt },
]);

console.log('\n=== AI返回 ===');
console.log(resp);

// 尝试解析
let s = resp.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
const a = s.indexOf('['), b = s.lastIndexOf(']');
if (a !== -1 && b !== -1) s = s.slice(a, b + 1);
try {
  const arr = JSON.parse(s);
  console.log('\n=== 解析结果 ===');
  arr.forEach(r => {
    console.log(`index: ${r.index}, optionAnalysis长度: ${r.optionAnalysis?.length}, 内容:`, r.optionAnalysis);
  });
  // 检查长度匹配
  arr.forEach(r => {
    const q = choiceQs[r.index - 1];
    if (q) {
      console.log(`题目${r.index}: options.length=${q.options.length}, optionAnalysis.length=${r.optionAnalysis?.length}, 匹配=${r.optionAnalysis?.length === q.options.length}`);
    }
  });
} catch(e) {
  console.error('解析失败:', e.message);
  console.log('清理后字符串:', s.slice(0, 500));
}
