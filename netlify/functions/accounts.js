// 客户端账号 API：注册/登录/授权/撤销/查询全部
// 数据持久化使用 Netlify Blobs
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'accounts';
const KEY = 'all_accounts';

async function readAll() {
  const store = getStore(STORE_NAME);
  for (let i = 0; i < 3; i++) {
    try {
      const raw = await store.get(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(`[accounts] read 第 ${i + 1} 次失败:`, e.message);
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return [];
}

async function writeAll(list) {
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

  const url = new URL(req.url);
  const action = url.pathname.replace(/^\/+/, '').replace(/^api\/accounts\/?/, '');

  try {
    // GET /api/accounts —— 获取全部账号（管理端用）
    if (req.method === 'GET' && !action) {
      const list = await readAll();
      return json({ success: true, data: list });
    }

    // POST /api/accounts/register —— 注册
    if (req.method === 'POST' && action === 'register') {
      const payload = await req.json();
      const { username, password, studentName } = payload;
      if (!username || !password || !studentName) {
        return json({ success: false, message: '用户名、密码、学生姓名不能为空' }, 400);
      }
      const list = await readAll();
      if (list.some((a) => a.username === username)) {
        return json({ success: false, message: '用户名已存在' }, 409);
      }
      // 生成唯一 8 位数字 ID
      let code;
      do {
        code = String(Math.floor(10000000 + Math.random() * 90000000));
      } while (list.some((a) => a.code === code));
      const account = {
        code,
        username,
        password,
        studentName,
        granted: false,
        expiresAt: null,
        createdAt: Date.now(),
      };
      list.push(account);
      await writeAll(list);
      return json({ success: true, data: account }, 201);
    }

    // POST /api/accounts/login —— 登录
    if (req.method === 'POST' && action === 'login') {
      const payload = await req.json();
      const { username, password } = payload;
      const list = await readAll();
      const account = list.find((a) => a.username === username && a.password === password);
      if (!account) {
        return json({ success: false, message: '用户名或密码错误' }, 401);
      }
      return json({ success: true, data: account });
    }

    // POST /api/accounts/grant —— 授权（管理端用）
    if (req.method === 'POST' && action === 'grant') {
      const payload = await req.json();
      const { code, months } = payload;
      const list = await readAll();
      const account = list.find((a) => a.code === code);
      if (!account) {
        return json({ success: false, message: 'ID 不存在' }, 404);
      }
      account.granted = true;
      account.expiresAt = Date.now() + months * 30 * 24 * 60 * 60 * 1000;
      await writeAll(list);
      return json({ success: true, data: account });
    }

    // POST /api/accounts/revoke —— 撤销权限（管理端用）
    if (req.method === 'POST' && action === 'revoke') {
      const payload = await req.json();
      const { code } = payload;
      const list = await readAll();
      const account = list.find((a) => a.code === code);
      if (!account) {
        return json({ success: false, message: 'ID 不存在' }, 404);
      }
      account.granted = false;
      account.expiresAt = null;
      await writeAll(list);
      return json({ success: true, data: account });
    }

    return json({ success: false, message: 'API 不存在' }, 404);
  } catch (err) {
    console.error('[accounts API] 异常:', err);
    return json({ success: false, message: '服务器错误' }, 500);
  }
};

export const config = {
  path: ['/api/accounts', '/api/accounts/*'],
};
