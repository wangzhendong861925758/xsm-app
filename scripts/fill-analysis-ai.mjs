// 本地批量 AI 生成解析 v2：生成 optionAnalysis（选择/判断）+ analysis/solution（大题）
// 6并发，分批20题，断点续传，强制覆盖旧解析
import https from 'https';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const API_KEY = 'sk-ed1d4eb3a72434bbdef5dfc9fdca43321357e0cdea559d4e';
const API_HOST = 'token.xinhankr.com';
const API_PATH = '/v1/chat/completions';
const MODEL = 'deepseek-v4-pro';
const DIR = 'd:/小四门软件/public/data/questions';
const PROGRESS_FILE = 'd:/小四门软件/scripts/analysis-progress-v2.json';
const BATCH_SIZE = 30;
const CONCURRENCY = 10;
const MAX_RETRIES = 3;

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

async function callAIRetry(messages, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try { return await callAI(messages); }
    catch(e) { if (i === retries - 1) throw e; await sleep(2000 * (i + 1)); }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const SUBJECT_MAP = { biology: '生物', politics: '道德与法治', history: '历史', geography: '地理', chemistry: '化学', physics: '物理' };

function buildChoicePrompt(questions) {
  const items = questions.map((q, i) => {
    const opts = q.options.map((o, j) => `${String.fromCharCode(65+j)}. ${o}`).join('\n');
    const ans = Array.isArray(q.answer) ? q.answer.join('') : q.answer;
    const typeName = q.type === 'judge' ? '判断题' : q.type === 'multiple' ? '多选题' : '单选题';
    return `${i+1}. [${typeName}] ${q.stem}\n${opts}\n正确答案: ${ans}`;
  }).join('\n\n');

  return `你是一位经验丰富的初中${SUBJECT_MAP[questions[0].subject] || ''}老师。请为以下${questions.length}道选择题/判断题，为每个选项生成针对性的解析。

要求：
1. 错误选项：1句话说明选该选项为什么错、错在哪里、混淆了什么知识点
2. 正确选项：1-2句话说明正确思路，解释为什么这个答案对、依据什么知识
3. 语言简洁准确，适合初中生理解，不要泛泛而谈
4. 每个选项的解析必须不同且具体，禁止出现"根据所学知识该说法正确/错误"之类的模板话术

严格按JSON数组输出，不要任何其他文字：
[{"index":1,"optionAnalysis":["A选项错因...","B选项错因...","正确思路：...","D选项错因..."]}]

题目：
${items}`;
}

function buildEssayPrompt(questions) {
  const items = questions.map((q, i) => {
    let text = `${i+1}. ${q.stem}`;
    if (q.answer && q.answer.length > 5) text += `\n参考答案: ${String(q.answer).slice(0, 300)}`;
    return text;
  }).join('\n\n');

  return `你是一位经验丰富的初中${SUBJECT_MAP[questions[0].subject] || ''}老师。请为以下${questions.length}道大题/简答题生成针对性的错题解析和正确思路。

要求：
1. 错题解析：说明本题考查什么知识点、学生常见失分点在哪里、容易犯什么错
2. 正确思路：说明解题的正确步骤和推理过程、答案是怎么得出的
3. 语言简洁准确，适合初中生理解，不要泛泛而谈
4. 禁止出现"本题考查XX基础知识，根据所学知识该说法正确"之类的模板话术

严格按JSON数组输出，不要任何其他文字：
[{"index":1,"analysis":"错题解析文本","solution":"正确思路文本"}]

题目：
${items}`;
}

function parseAIResponse(text) {
  let s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const a = s.indexOf('['), b = s.lastIndexOf(']');
  if (a !== -1 && b !== -1) s = s.slice(a, b + 1);
  try { const arr = JSON.parse(s); return Array.isArray(arr) ? arr : null; } catch(e) { return null; }
}

async function processChoiceBatch(batchQs) {
  const prompt = buildChoicePrompt(batchQs);
  const resp = await callAIRetry([
    { role: 'system', content: '你是经验丰富的初中各科教师，擅长分析每道题每个选项的错因，讲解具体知识点。必须严格输出JSON数组，不要其他内容。' },
    { role: 'user', content: prompt },
  ]);
  const results = parseAIResponse(resp);
  if (!results) return batchQs.map(() => ({ optionAnalysis: null }));
  const map = new Map(results.map(r => [r.index, r]));
  return batchQs.map((q, i) => {
    const r = map.get(i + 1) || {};
    const oa = Array.isArray(r.optionAnalysis) ? r.optionAnalysis : null;
    // 确保optionAnalysis长度与options一致
    if (oa && oa.length === q.options.length) return { optionAnalysis: oa };
    return { optionAnalysis: null };
  });
}

async function processEssayBatch(batchQs) {
  const prompt = buildEssayPrompt(batchQs);
  const resp = await callAIRetry([
    { role: 'system', content: '你是经验丰富的初中各科教师，擅长分析错题、讲解解题思路。必须严格输出JSON数组，不要其他内容。' },
    { role: 'user', content: prompt },
  ]);
  const results = parseAIResponse(resp);
  if (!results) return batchQs.map(() => ({ analysis: '', solution: '' }));
  const map = new Map(results.map(r => [r.index, r]));
  return batchQs.map((_, i) => {
    const r = map.get(i + 1) || {};
    return { analysis: r.analysis || '', solution: r.solution || '' };
  });
}

async function runConcurrent(tasks, concurrency) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      try { results[i] = { ok: true, data: await tasks[i]() }; }
      catch(e) { results[i] = { ok: false, err: e.message }; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

async function processBatches(batches, isChoice, label) {
  let filled = 0;
  let done = 0;
  let next = 0;
  async function worker() {
    while (next < batches.length) {
      const bi = next++;
      const batch = batches[bi];
      try {
        const batchQs = batch.map(b => b.q);
        const results = isChoice ? await processChoiceBatch(batchQs) : await processEssayBatch(batchQs);
        let ok = 0;
        for (let j = 0; j < batch.length; j++) {
          const { idx } = batch[j];
          if (isChoice) {
            const { optionAnalysis } = results[j] || {};
            if (optionAnalysis && optionAnalysis.length === batchQs[j].options.length) {
              batch[j].target[idx].optionAnalysis = optionAnalysis;
              ok++; filled++;
            }
          } else {
            const { analysis, solution } = results[j] || {};
            if (analysis && analysis.length > 5) {
              batch[j].target[idx].analysis = analysis;
              batch[j].target[idx].solution = solution || analysis;
              ok++; filled++;
            }
          }
        }
        done++;
        if (done % 5 === 0 || done === batches.length) {
          console.log(`    ${label} ${done}/${batches.length} 批完成 (成功${ok}/${batch.length})`);
        }
      } catch(e) {
        done++;
        console.log(`    ${label} 批次${done} 失败: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return filled;
}

// 判断解析是否是模板/无效的
function isBadAnalysis(q) {
  const a = q.analysis || '';
  // 模板话术特征
  if (a.includes('本题考查') && a.includes('根据所学知识') && a.length < 80) return true;
  if (a.includes('请结合教材') && a.length < 60) return true;
  if (a.includes('该说法正确') && a.length < 40) return true;
  return false;
}

// 判断 optionAnalysis 是否缺失或无效
function needsOptionAnalysis(q) {
  if (!q.optionAnalysis) return true;
  if (!Array.isArray(q.optionAnalysis)) return true;
  if (q.optionAnalysis.length !== q.options.length) return true;
  // 检查是否是模板
  const allTemplate = q.optionAnalysis.every(a => !a || a.length < 5 || a.includes('根据所学知识'));
  return allTemplate;
}

async function main() {
  let progress = { completedFiles: [] };
  if (existsSync(PROGRESS_FILE)) progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));

  const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json' && !progress.completedFiles.includes(f));
  console.log(`待处理分片: ${files.length} (已完成: ${progress.completedFiles.length}), 并发: ${CONCURRENCY}, 批量: ${BATCH_SIZE}`);

  let totalFilled = 0, totalNeeded = 0;
  const startTime = Date.now();

  for (let fi = 0; fi < files.length; fi++) {
    const file = files[fi];
    const filePath = join(DIR, file);
    let questions;
    try { questions = JSON.parse(readFileSync(filePath, 'utf8')); }
    catch(e) {
      console.log(`[${fi+1}/${files.length}] ${file} 读取失败，跳过`);
      progress.completedFiles.push(file);
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      continue;
    }

    const needChoice = [], needEssay = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.type === 'essay') {
        // 大题：检查 analysis 和 solution
        if (!q.analysis || q.analysis.length < 10 || isBadAnalysis(q) || !q.solution || q.solution.length < 10) {
          needEssay.push({ idx: i, q, target: questions });
        }
      } else {
        // 选择/判断题：检查 optionAnalysis
        if (needsOptionAnalysis(q)) {
          needChoice.push({ idx: i, q, target: questions });
        }
      }
    }

    totalNeeded += needChoice.length + needEssay.length;
    if (needChoice.length === 0 && needEssay.length === 0) {
      console.log(`[${fi+1}/${files.length}] ${file}: 无需补充 (${questions.length}题均已有解析)`);
      progress.completedFiles.push(file);
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      continue;
    }

    console.log(`[${fi+1}/${files.length}] ${file}: ${questions.length}题, 选择/判断需补${needChoice.length}题, 大题需补${needEssay.length}题`);

    if (needChoice.length > 0) {
      const batches = [];
      for (let bi = 0; bi < needChoice.length; bi += BATCH_SIZE) batches.push(needChoice.slice(bi, bi + BATCH_SIZE));
      const n = await processBatches(batches, true, '选择/判断');
      totalFilled += n;
    }

    if (needEssay.length > 0) {
      const batches = [];
      for (let bi = 0; bi < needEssay.length; bi += BATCH_SIZE) batches.push(needEssay.slice(bi, bi + BATCH_SIZE));
      const n = await processBatches(batches, false, '大题');
      totalFilled += n;
    }

    writeFileSync(filePath, JSON.stringify(questions));
    progress.completedFiles.push(file);
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`    ✓ 已保存，累计补充 ${totalFilled}/${totalNeeded} (${elapsed}s)`);
  }

  console.log(`\n=== 全部完成 === 共补充 ${totalFilled} 题解析`);
}

main().catch(e => { console.error(e); process.exit(1); });
