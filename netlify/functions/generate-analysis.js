// AI 解析生成 API：通过原生 https 模块调用第三方中转 API（token.xinhankr.com）
// API Key 由管理端浏览器传入（保存在 localStorage），优先使用前端传来的 key，fallback 到环境变量
// - 选择/判断题：生成 optionAnalysis 数组（顺序与 options 对齐，正确选项位置存"正确思路"）
// - 大题：生成 analysis（错题解析）和 solution（正确思路）
const https = require('https');
const DEEPSEEK_HOST = 'token.xinhankr.com';
const DEEPSEEK_PATH = '/v1/chat/completions';
const MODEL = 'deepseek-v4-pro';
const TIMEOUT_MS = 30000;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-API-Key',
    },
  });
}

/** 用原生 https 模块发请求，提供比 fetch 更详细的网络错误诊断 */
function httpsRequest(bodyData, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(bodyData);
    const options = {
      hostname: DEEPSEEK_HOST,
      port: 443,
      path: DEEPSEEK_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: TIMEOUT_MS,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: data });
        } catch (e) {
          reject(new Error(`解析响应失败: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`网络连接失败: ${e.code || ''} ${e.message}（可能是DNS解析失败/连接超时/防火墙拦截，目标地址 ${DEEPSEEK_HOST}）`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`请求超时（${TIMEOUT_MS}ms），Netlify 服务器无法连接 ${DEEPSEEK_HOST}，可能是国际网络链路不通`));
    });

    req.write(postData);
    req.end();
  });
}

/** 将题目的 answer 统一成单字母数组，便于定位正确选项下标 */
function normalizeAnswerIndexes(q) {
  const opts = q.options || [];
  let ans = q.answer;
  if (Array.isArray(ans)) ans = ans.join('');
  if (!ans) return { correctIndexes: [], opts };
  const normalized = String(ans).replace(/[对√]/g, 'A').replace(/[错×]/g, 'B');
  const letters = normalized.toUpperCase().match(/[A-Z]/g) || [];
  const correctIndexes = letters
    .map((l) => l.charCodeAt(0) - 65)
    .filter((i) => i >= 0 && i < opts.length);
  return { correctIndexes, opts };
}

/** 调用 AI 为一批选择题生成每个选项的错因/正确思路 */
async function callAIChoice(questions, apiKey) {
  const items = questions.map((q, i) => {
    const { correctIndexes, opts } = normalizeAnswerIndexes(q);
    return {
      index: i,
      type: q.type,
      stem: q.stem,
      options: opts,
      correctLetters: correctIndexes.map((idx) => String.fromCharCode(65 + idx)),
      subject: q.subject,
    };
  });

  const prompt = `你是一位初中生物、道法、历史、地理学科的资深教师。请为以下每道选择题/判断题，为每个选项生成简短的"错因分析"，并在正确选项的位置生成"正确解题思路"。

要求：
- 每个错误选项：1-2句话，说明选这个选项会犯什么错、混淆了什么知识点
- 正确选项的位置：1-2句话，说明正确的解题思路和依据
- 语言简洁，适合初中生理解
- 严格按照 JSON 数组格式输出，不要有任何其他文字
- optionAnalysis 数组长度必须与该题 options 长度一致，顺序对齐

题目列表：
${JSON.stringify(items)}

输出格式：
[{"index":0,"optionAnalysis":["选A错因...","选B错因...","正确思路：C选项...","选D错因..."]}]`;

  const { statusCode, body } = await httpsRequest({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 6000,
  }, apiKey);

  if (statusCode !== 200) {
    if (statusCode === 401) {
      throw new Error(`AI 鉴权失败(401)：API Key 无效或已被吊销。Key 长度 ${apiKey.length}，末尾 "${apiKey.slice(-4)}"。原始错误：${body.slice(0, 300)}`);
    }
    if (statusCode === 403) {
      throw new Error(`模型权限不足(403)：该 Key 不支持 ${MODEL} 模型。原始错误：${body.slice(0, 300)}`);
    }
    throw new Error(`AI API 错误 ${statusCode}: ${body.slice(0, 500)}`);
  }

  let data;
  try { data = JSON.parse(body); } catch (e) { throw new Error(`AI 返回非 JSON: ${body.slice(0, 200)}`); }
  const content = data.choices?.[0]?.message?.content || '';
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('AI 返回格式异常（选择题），原始内容：' + content.slice(0, 200));
  return JSON.parse(match[0]);
}

/** 调用 AI 为一批大题生成错题解析+正确思路 */
async function callAIEssay(questions, apiKey) {
  const items = questions.map((q, i) => ({
    index: i,
    type: q.type,
    stem: q.stem,
    answer: q.answer,
    keyPoints: q.keyPoints,
    subject: q.subject,
  }));

  const prompt = `你是一位初中生物、道法、历史、地理学科的资深教师。请为以下每道大题/简答题生成"错题解析"和"正确思路"。

要求：
- 错题解析：1-2句话，说明本题常见失分点和考查知识点
- 正确思路：1-2句话，说明解题的正确推理过程和答题要点
- 语言简洁，适合初中生理解
- 严格按照 JSON 数组格式输出，不要有任何其他文字

题目列表：
${JSON.stringify(items)}

输出格式：
[{"index":0,"analysis":"错题解析文本","solution":"正确思路文本"}]`;

  const { statusCode, body } = await httpsRequest({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 4000,
  }, apiKey);

  if (statusCode !== 200) {
    if (statusCode === 401) {
      throw new Error(`AI 鉴权失败(401)：API Key 无效。Key 末尾 "${apiKey.slice(-4)}"。原始错误：${body.slice(0, 300)}`);
    }
    throw new Error(`AI API 错误 ${statusCode}: ${body.slice(0, 500)}`);
  }

  let data;
  try { data = JSON.parse(body); } catch (e) { throw new Error(`AI 返回非 JSON: ${body.slice(0, 200)}`); }
  const content = data.choices?.[0]?.message?.content || '';
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('AI 返回格式异常（大题），原始内容：' + content.slice(0, 200));
  return JSON.parse(match[0]);
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-API-Key',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ success: false, message: '仅支持 POST' }, 405);
  }

  try {
    const payload = await req.json();
    const questions = payload.questions;
    // 优先使用前端传来的 key（管理端 localStorage 里的），fallback 到环境变量
    const API_KEY = (payload.apiKey || req.headers.get('x-api-key') || process.env.DEEPSEEK_API_KEY || '').trim();

    if (!API_KEY) {
      return json({ success: false, message: '请先在管理端点击「设置 AI Key」按钮配置 API Key' }, 400);
    }
    if (!API_KEY.startsWith('sk-')) {
      return json({ success: false, message: `API Key 格式错误：应以 sk- 开头，当前前缀 "${API_KEY.substring(0, 6)}"` }, 400);
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return json({ success: false, message: 'questions 不能为空' }, 400);
    }

    // 按题型分流：选择题/判断题走 optionAnalysis；大题走 analysis+solution
    const choiceQs = questions.filter((q) => q.type === 'single' || q.type === 'multiple' || q.type === 'judge');
    const essayQs = questions.filter((q) => q.type === 'essay');

    const BATCH = 15;
    const choiceResults = [];
    const essayResults = [];

    for (let i = 0; i < choiceQs.length; i += BATCH) {
      const batch = choiceQs.slice(i, i + BATCH);
      if (batch.length > 0) {
        const r = await callAIChoice(batch, API_KEY);
        choiceResults.push(...r);
      }
    }
    for (let i = 0; i < essayQs.length; i += BATCH) {
      const batch = essayQs.slice(i, i + BATCH);
      if (batch.length > 0) {
        const r = await callAIEssay(batch, API_KEY);
        essayResults.push(...r);
      }
    }

    // 将结果合并回原题目
    const choiceMap = new Map(choiceResults.map((r) => [r.index, r]));
    const essayMap = new Map(essayResults.map((r) => [r.index, r]));

    const merged = questions.map((q) => {
      if (q.type === 'essay') {
        const origIndex = essayQs.indexOf(q);
        const r = essayMap.get(origIndex);
        return {
          ...q,
          analysis: r?.analysis || q.analysis || '',
          solution: r?.solution || q.solution || '',
        };
      } else {
        const origIndex = choiceQs.indexOf(q);
        const r = choiceMap.get(origIndex);
        const optionAnalysis = Array.isArray(r?.optionAnalysis) && r.optionAnalysis.length === q.options.length
          ? r.optionAnalysis
          : q.optionAnalysis;
        return { ...q, optionAnalysis };
      }
    });

    return json({ success: true, data: merged });
  } catch (err) {
    console.error('[generate-analysis] 异常:', err);
    return json({ success: false, message: err.message || 'AI 生成失败' }, 500);
  }
};
