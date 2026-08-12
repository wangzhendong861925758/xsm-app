// AI 解析生成 API：调用第三方中转 API（token.xinhankr.com）一次性为每题生成所有选项的错因 + 正确思路
// - 选择/判断题：生成 optionAnalysis 数组（顺序与 options 对齐，正确选项位置存"正确思路"）
// - 大题：生成 analysis（错题解析）和 solution（正确思路）
// 环境变量 DEEPSEEK_API_KEY 需在 Netlify 后台设置（中转 API 的 key）
const DEEPSEEK_URL = 'https://token.xinhankr.com/v1/chat/completions';
const MODEL = 'deepseek-v4-pro';

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/** 将题目的 answer 统一成单字母数组，便于定位正确选项下标 */
function normalizeAnswerIndexes(q) {
  const opts = q.options || [];
  // answer 可能是 "A" / "AB" / "正确" / ["A","B"] / "对" 等
  let ans = q.answer;
  if (Array.isArray(ans)) ans = ans.join('');
  if (!ans) return { correctIndexes: [], opts };
  // 将"正确"/"错误"/"对"/"错" 映射到 A/B（判断题约定 options=["正确","错误"]）
  const normalized = String(ans).replace(/[对√]/g, 'A').replace(/[错×]/g, 'B');
  const letters = normalized.toUpperCase().match(/[A-Z]/g) || [];
  const correctIndexes = letters
    .map((l) => l.charCodeAt(0) - 65) // A->0, B->1 ...
    .filter((i) => i >= 0 && i < opts.length);
  return { correctIndexes, opts };
}

/** 调用 DeepSeek 为一批选择题生成每个选项的错因/正确思路 */
async function callDeepSeekChoice(questions, apiKey) {
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

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 6000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 401) {
      throw new Error(`DeepSeek 鉴权失败(401)：API Key 无效或已被吊销。Key 长度 ${apiKey.length}，末尾 "${apiKey.slice(-4)}"。请检查 Netlify 后台环境变量 DEEPSEEK_API_KEY 是否完整（应以 sk- 开头，无多余空格/引号/换行）。原始错误：${err}`);
    }
    throw new Error(`DeepSeek API 错误 ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('AI 返回格式异常（选择）');
  return JSON.parse(match[0]);
}

/** 调用 DeepSeek 为一批大题生成错题解析+正确思路 */
async function callDeepSeekEssay(questions, apiKey) {
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

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 401) {
      throw new Error(`DeepSeek 鉴权失败(401)：API Key 无效或已被吊销。Key 长度 ${apiKey.length}，末尾 "${apiKey.slice(-4)}"。原始错误：${err}`);
    }
    throw new Error(`DeepSeek API 错误 ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('AI 返回格式异常（大题）');
  return JSON.parse(match[0]);
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ success: false, message: '仅支持 POST' }, 405);
  }

  // ponytail: 自动去除前后空白/换行，避免复制 key 时带入的多余字符导致 401
  const API_KEY = (process.env.DEEPSEEK_API_KEY || '').trim();
  if (!API_KEY) {
    return json({ success: false, message: '未配置 DEEPSEEK_API_KEY 环境变量' }, 500);
  }
  if (!API_KEY.startsWith('sk-')) {
    return json({
      success: false,
      message: `DEEPSEEK_API_KEY 格式错误：应以 sk- 开头。当前长度 ${API_KEY.length}，前缀 "${API_KEY.substring(0, 4)}"`,
    }, 500);
  }

  try {
    const payload = await req.json();
    const questions = payload.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      return json({ success: false, message: 'questions 不能为空' }, 400);
    }

    // 按题型分流：选择题/判断题走 optionAnalysis；大题走 analysis+solution
    const choiceQs = questions.filter((q) => q.type === 'single' || q.type === 'multiple' || q.type === 'judge');
    const essayQs = questions.filter((q) => q.type === 'essay');

    // ponytail: DeepSeek 单次最多处理约20题，超过则分批
    const BATCH = 20;
    const choiceResults = [];
    const essayResults = [];

    for (let i = 0; i < choiceQs.length; i += BATCH) {
      const batch = choiceQs.slice(i, i + BATCH);
      if (batch.length > 0) {
        const r = await callDeepSeekChoice(batch, API_KEY);
        choiceResults.push(...r);
      }
    }
    for (let i = 0; i < essayQs.length; i += BATCH) {
      const batch = essayQs.slice(i, i + BATCH);
      if (batch.length > 0) {
        const r = await callDeepSeekEssay(batch, API_KEY);
        essayResults.push(...r);
      }
    }

    // 将结果合并回原题目
    const choiceMap = new Map(choiceResults.map((r) => [r.index, r]));
    const essayMap = new Map(essayResults.map((r) => [r.index, r]));

    const merged = questions.map((q, i) => {
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
        // 校验返回的 optionAnalysis 长度与 options 对齐
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
