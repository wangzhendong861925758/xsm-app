// 本地脚本：从线上拉取题库 → 本地调用AI生成解析 → 写回线上
// 用法：node scripts/generate-analysis-local.mjs
import https from 'https';

const API_BASE = 'https://imaginative-axolotl-edc12e.netlify.app';
const AI_URL = 'token.xinhankr.com';
const AI_PATH = '/v1/chat/completions';
const AI_MODEL = 'deepseek-v4-pro';
const AI_KEY = 'sk-ed1d4eb3a72434bbdef5dfc9fdca43321357e0cdea559d4e';
const BATCH = 15;

function httpsPost(hostname, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const req = https.request({
      hostname,
      path,
      port: 443,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
      timeout: 60000,
    }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get(u, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    }).on('error', reject);
  });
}

function callAI(prompt, maxTokens) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
    });
    const req = https.request({
      hostname: AI_URL, path: AI_PATH, port: 443, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}`, 'Content-Length': Buffer.byteLength(body) },
      timeout: 60000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.choices?.[0]?.message?.content || '');
        } catch (e) {
          reject(new Error(`AI响应解析失败: ${e.message}, 原始: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('AI请求超时')); });
    req.write(body);
    req.end();
  });
}

function normalizeAnswerIndexes(q) {
  const opts = q.options || [];
  let ans = q.answer;
  if (Array.isArray(ans)) ans = ans.join('');
  if (!ans) return { correctIndexes: [], opts };
  const normalized = String(ans).replace(/[对√]/g, 'A').replace(/[错×]/g, 'B');
  const letters = normalized.toUpperCase().match(/[A-Z]/g) || [];
  const correctIndexes = letters.map((l) => l.charCodeAt(0) - 65).filter((i) => i >= 0 && i < opts.length);
  return { correctIndexes, opts };
}

async function genChoiceBatch(batch) {
  const items = batch.map((q, i) => {
    const { correctIndexes, opts } = normalizeAnswerIndexes(q);
    return {
      index: i, stem: q.stem, options: opts,
      correctLetters: correctIndexes.map((idx) => String.fromCharCode(65 + idx)),
      subject: q.subject,
    };
  });
  const prompt = `你是一位初中生物、道法、历史、地理学科的资深教师。请为以下每道选择题/判断题，为每个选项生成简短的"错因分析"，并在正确选项的位置生成"正确解题思路"。

要求：
- 每个错误选项：1-2句话，说明选这个选项会犯什么错、混淆了什么知识点
- 正确选项的位置：1-2句话，说明正确的解题思路和依据
- 语言简洁，适合初中生理解
- 严格按照JSON数组格式输出，不要任何其他文字、注释或markdown代码块标记（不要\`\`\`json）
- optionAnalysis数组长度必须与该题options长度一致，顺序对齐

题目列表：
${JSON.stringify(items)}

输出格式：
[{"index":0,"optionAnalysis":["选A错因...","选B错因...","正确思路：C选项...","选D错因..."]}]`;

  for (let retry = 0; retry < 3; retry++) {
    try {
      const content = await callAI(prompt, Math.max(6000, batch.length * 500));
      const match = content.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
      console.log(`  重试 ${retry + 1}...`);
    } catch (e) {
      console.log(`  选择题批次错误(重试${retry + 1}): ${e.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('选择题生成失败（3次重试）');
}

async function genEssayBatch(batch) {
  const items = batch.map((q, i) => ({
    index: i, stem: q.stem, answer: q.answer, keyPoints: q.keyPoints, subject: q.subject,
  }));
  const prompt = `你是一位初中生物、道法、历史、地理学科的资深教师。请为以下每道大题/简答题生成"错题解析"和"正确思路"。

要求：
- 错题解析：1-2句话，说明本题常见失分点和考查知识点
- 正确思路：1-2句话，说明解题的正确推理过程和答题要点
- 语言简洁，适合初中生理解
- 严格按照JSON数组格式输出，不要任何其他文字、注释或markdown代码块标记

题目列表：
${JSON.stringify(items)}

输出格式：
[{"index":0,"analysis":"错题解析文本","solution":"正确思路文本"}]`;

  for (let retry = 0; retry < 3; retry++) {
    try {
      const content = await callAI(prompt, Math.max(4000, batch.length * 300));
      const match = content.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
      console.log(`  重试 ${retry + 1}...`);
    } catch (e) {
      console.log(`  大题批次错误(重试${retry + 1}): ${e.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('大题生成失败（3次重试）');
}

async function main() {
  console.log('1. 从线上拉取题库...');
  const { body: questionsRes } = await httpsGet(`${API_BASE}/api/questions`);
  const questions = questionsRes.data || [];
  console.log(`   共 ${questions.length} 道题目`);

  const needChoice = questions.filter(q => (q.type === 'single' || q.type === 'multiple' || q.type === 'judge') && (!q.optionAnalysis || q.optionAnalysis.length !== q.options.length));
  const needEssay = questions.filter(q => q.type === 'essay' && (!q.analysis || !q.solution));
  console.log(`   需生成解析的选择题: ${needChoice.length} 道，大题: ${needEssay.length} 道`);

  if (needChoice.length === 0 && needEssay.length === 0) {
    console.log('所有题目都已有解析，无需生成');
    return;
  }

  console.log('\n2. 批量生成选择题解析...');
  const choiceResults = [];
  for (let i = 0; i < needChoice.length; i += BATCH) {
    const batch = needChoice.slice(i, i + BATCH);
    process.stdout.write(`   批次 ${Math.floor(i/BATCH)+1}/${Math.ceil(needChoice.length/BATCH)} (${batch.length}题)...`);
    const r = await genChoiceBatch(batch);
    choiceResults.push(...r);
    console.log(` 完成，已得 ${choiceResults.length} 题结果`);
  }

  console.log('\n3. 批量生成大题解析...');
  const essayResults = [];
  for (let i = 0; i < needEssay.length; i += BATCH) {
    const batch = needEssay.slice(i, i + BATCH);
    process.stdout.write(`   批次 ${Math.floor(i/BATCH)+1}/${Math.ceil(needEssay.length/BATCH)} (${batch.length}题)...`);
    const r = await genEssayBatch(batch);
    essayResults.push(...r);
    console.log(` 完成，已得 ${essayResults.length} 题结果`);
  }

  console.log('\n4. 合并结果...');
  const choiceMap = new Map(choiceResults.map(r => [needChoice[r.index].id, r]));
  const essayMap = new Map(essayResults.map(r => [needEssay[r.index].id, r]));

  const finalQuestions = questions.map(q => {
    if (q.type === 'essay') {
      const r = essayMap.get(q.id);
      return r ? { ...q, analysis: r.analysis || q.analysis || '', solution: r.solution || q.solution || '' } : q;
    } else {
      const r = choiceMap.get(q.id);
      if (r && Array.isArray(r.optionAnalysis) && r.optionAnalysis.length === q.options.length) {
        return { ...q, optionAnalysis: r.optionAnalysis };
      }
      return q;
    }
  });

  const updatedChoice = finalQuestions.filter(q => q.optionAnalysis && q.optionAnalysis.length === q.options.length).length;
  const updatedEssay = finalQuestions.filter(q => q.type === 'essay' && q.analysis && q.solution).length;
  console.log(`   已有解析: 选择题 ${updatedChoice} 道，大题 ${updatedEssay} 道`);

  console.log('\n5. 写回线上题库...');
  const u = new URL(`${API_BASE}/api/questions`);
  const { status, body } = await httpsPost(u.hostname, u.pathname, { questions: finalQuestions });
  if (status === 200 && body.success) {
    console.log(`   成功！已更新 ${body.data.count} 道题目到线上`);
  } else {
    console.error(`   失败: status=${status}`, body);
    process.exit(1);
  }

  console.log('\n✅ 全部完成！');
}

main().catch(e => { console.error('失败:', e); process.exit(1); });
