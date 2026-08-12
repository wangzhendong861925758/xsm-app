// 题库 API：GET 获取全部题目，POST 保存全部题目
// 数据持久化使用 Netlify Blobs
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'questions';
const KEY = 'all_questions';

async function readQuestions() {
  const store = getStore(STORE_NAME);
  for (let i = 0; i < 3; i++) {
    try {
      const raw = await store.get(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(`[questions] read 第 ${i + 1} 次失败:`, e.message);
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return [];
}

async function writeQuestions(list) {
  const store = getStore(STORE_NAME);
  await store.set(KEY, JSON.stringify(list));
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    // GET /api/questions —— 获取全部题目
    if (req.method === 'GET') {
      const list = await readQuestions();
      return json({ success: true, data: list });
    }

    // POST /api/questions —— 保存全部题目（管理端上传后调用）
    if (req.method === 'POST') {
      const payload = await req.json();
      if (!Array.isArray(payload.questions)) {
        return json({ success: false, message: 'questions 必须是数组' }, 400);
      }
      await writeQuestions(payload.questions);
      return json({ success: true, data: { count: payload.questions.length } });
    }

    return json({ success: false, message: '不支持的方法' }, 405);
  } catch (err) {
    console.error('[questions API] 异常:', err);
    return json({ success: false, message: '服务器错误' }, 500);
  }
};

export const config = {
  path: ['/api/questions'],
};
