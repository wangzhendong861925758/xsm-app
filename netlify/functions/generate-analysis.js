// AI 解析生成 API：调用 DeepSeek 为每道题生成错题解析和正确思路
// 环境变量 DEEPSEEK_API_KEY 需在 Netlify 后台设置
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

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

/** 调用 DeepSeek 为一批题目生成解析 */
async function callDeepSeek(questions) {
  const prompt = `你是一位初中生物、道法、历史、地理学科的资深教师。请为以下每道题生成简短的"错题解析"和"正确思路"。

要求：
- 错题解析：1-2句话，说明该题的易错点和考查知识点
- 正确思路：1-2句话，说明解题的正确推理过程
- 语言简洁，适合初中生理解
- 严格按照 JSON 数组格式输出，不要有其他文字

题目列表：
${JSON.stringify(questions.map((q, i) => ({
  index: i,
  type: q.type,
  stem: q.stem,
  options: q.options,
  answer: q.answer,
  subject: q.subject,
})))}

输出格式（JSON数组，每个元素对应一道题）：
[{"index":0,"analysis":"错题解析文本","solution":"正确思路文本"}]`;

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
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
    throw new Error(`DeepSeek API 错误 ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';

  // 提取 JSON 数组（兼容 markdown 代码块包裹）
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('AI 返回格式异常');
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

  if (!process.env.DEEPSEEK_API_KEY) {
    return json({ success: false, message: '未配置 DEEPSEEK_API_KEY 环境变量' }, 500);
  }

  try {
    const payload = await req.json();
    const questions = payload.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      return json({ success: false, message: 'questions 不能为空' }, 400);
    }

    // ponytail: DeepSeek 单次最多处理约20题，超过则分批
    const BATCH = 20;
    const results = [];

    for (let i = 0; i < questions.length; i += BATCH) {
      const batch = questions.slice(i, i + BATCH);
      const batchResults = await callDeepSeek(batch);
      results.push(...batchResults);
    }

    // 将解析合并回题目
    const merged = questions.map((q, i) => {
      const r = results.find((x) => x.index === i) || results[i];
      return {
        ...q,
        analysis: r?.analysis || q.analysis || '',
        solution: r?.solution || q.solution || '',
      };
    });

    return json({ success: true, data: merged });
  } catch (err) {
    console.error('[generate-analysis] 异常:', err);
    return json({ success: false, message: err.message || 'AI 生成失败' }, 500);
  }
};

export const config = {
  path: ['/api/generate-analysis'],
};
