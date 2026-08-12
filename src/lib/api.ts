/**
 * 前端 API 封装：通过 fetch 调用 Netlify Functions
 * 本地开发时通过 vite proxy 转发到 Netlify Dev，生产环境直接调用同域 API
 */
import type { Question, ClientAccount } from "@/data/types";

async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || `请求失败 (${res.status})`);
  }
  return data.data as T;
}

/* ================ 题库 API ================ */

/** 从云端拉取全部题目 */
export async function fetchQuestions(): Promise<Question[]> {
  try {
    return await request<Question[]>("/api/questions");
  } catch {
    return [];
  }
}

/** 保存全部题目到云端（管理端调用） */
export async function saveQuestions(questions: Question[]): Promise<void> {
  try {
    await request("/api/questions", {
      method: "POST",
      body: JSON.stringify({ questions }),
    });
  } catch (e) {
    console.error("保存题目到云端失败:", e);
  }
}

/* ================ 账号 API ================ */

/** 从云端拉取全部账号 */
export async function fetchAccounts(): Promise<ClientAccount[]> {
  try {
    return await request<ClientAccount[]>("/api/accounts");
  } catch {
    return [];
  }
}

/** 注册客户端账号 */
export async function registerAccount(
  username: string,
  password: string,
  studentName: string,
): Promise<ClientAccount | null> {
  try {
    return await request<ClientAccount>("/api/accounts/register", {
      method: "POST",
      body: JSON.stringify({ username, password, studentName }),
    });
  } catch (e) {
    console.error("注册失败:", e);
    return null;
  }
}

/** 登录 */
export async function loginAccount(
  username: string,
  password: string,
): Promise<ClientAccount | null> {
  try {
    return await request<ClientAccount>("/api/accounts/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return null;
  }
}

/** 授权（管理端调用） */
export async function grantAccount(code: string, months: number): Promise<ClientAccount | null> {
  try {
    return await request<ClientAccount>("/api/accounts/grant", {
      method: "POST",
      body: JSON.stringify({ code, months }),
    });
  } catch {
    return null;
  }
}

/** 撤销权限（管理端调用） */
export async function revokeAccount(code: string): Promise<boolean> {
  try {
    await request("/api/accounts/revoke", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    return true;
  } catch {
    return false;
  }
}

/* ================ AI 解析生成（管理端浏览器直连，绕过Netlify无法访问国内API的问题） ================ */

const AI_API_URL = 'https://token.xinhankr.com/v1/chat/completions';
const AI_MODEL = 'deepseek-v4-pro';
const AI_KEY_STORAGE = 'xsm_ai_api_key';

export function getAIKey(): string {
  return localStorage.getItem(AI_KEY_STORAGE) || '';
}

export function setAIKey(key: string): void {
  localStorage.setItem(AI_KEY_STORAGE, key.trim());
}

/** 将题目的 answer 统一成单字母下标，便于定位正确选项位置 */
function normalizeAnswerIndexes(q: Question): { correctIndexes: number[]; opts: string[] } {
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

async function callAI(prompt: string, maxTokens: number): Promise<string> {
  const key = getAIKey();
  if (!key) throw new Error('请先在管理端设置 AI API Key');
  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: AI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 401) throw new Error('AI Key 无效或余额不足，请检查 API Key');
    if (res.status === 403) throw new Error('模型权限不足，该 Key 不支持 deepseek-v4-pro');
    throw new Error(`AI 接口错误 ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/** 选择题/判断题：每个选项生成错因，正确选项位置存正确思路 */
async function generateChoiceAnalysis(batch: Question[]): Promise<{ index: number; optionAnalysis: string[] }[]> {
  const items = batch.map((q, i) => {
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
- 每个错因1句话，说明选该选项的典型错误或知识点误区
- 正确思路1-2句话，说明正确推理过程
- 语言简洁，适合初中生理解
- 严格按JSON数组输出，不要任何其他文字、注释或markdown标记

题目列表：
${JSON.stringify(items)}

输出格式（optionAnalysis数组顺序与options一一对应，正确选项位置写正确思路）：
[{"index":0,"optionAnalysis":["选A错因...","选B错因...","正确思路：...","选D错因..."]}]`;

  const content = await callAI(prompt, Math.max(6000, batch.length * 500));
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('AI 返回格式异常（选择题），请重试');
  return JSON.parse(match[0]);
}

/** 大题：生成 analysis + solution */
async function generateEssayAnalysis(batch: Question[]): Promise<{ index: number; analysis: string; solution: string }[]> {
  const items = batch.map((q, i) => ({ index: i, stem: q.stem, answer: q.answer, keyPoints: q.keyPoints, subject: q.subject }));
  const prompt = `你是一位初中生物、道法、历史、地理学科的资深教师。请为以下每道大题/简答题生成"错题解析"和"正确思路"。

要求：
- 错题解析：1-2句话，说明本题常见失分点和考查知识点
- 正确思路：1-2句话，说明解题的正确推理过程和答题要点
- 语言简洁，适合初中生理解
- 严格按JSON数组输出，不要任何其他文字

题目列表：
${JSON.stringify(items)}

输出格式：
[{"index":0,"analysis":"错题解析文本","solution":"正确思路文本"}]`;

  const content = await callAI(prompt, Math.max(4000, batch.length * 300));
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('AI 返回格式异常（大题），请重试');
  return JSON.parse(match[0]);
}

/** 调用 AI 为题目批量生成错题解析和正确思路（管理端直接调用，不走Netlify Function） */
export async function generateAnalysis(questions: Question[]): Promise<Question[]> {
  const BATCH = 15;
  const choiceQs = questions.filter((q) => q.type === 'single' || q.type === 'multiple' || q.type === 'judge');
  const essayQs = questions.filter((q) => q.type === 'essay');

  const choiceResults: { index: number; optionAnalysis: string[] }[] = [];
  const essayResults: { index: number; analysis: string; solution: string }[] = [];

  for (let i = 0; i < choiceQs.length; i += BATCH) {
    const batch = choiceQs.slice(i, i + BATCH);
    if (batch.length > 0) {
      const r = await generateChoiceAnalysis(batch);
      choiceResults.push(...r);
    }
  }
  for (let i = 0; i < essayQs.length; i += BATCH) {
    const batch = essayQs.slice(i, i + BATCH);
    if (batch.length > 0) {
      const r = await generateEssayAnalysis(batch);
      essayResults.push(...r);
    }
  }

  const choiceMap = new Map(choiceResults.map((r) => [r.index, r]));
  const essayMap = new Map(essayResults.map((r) => [r.index, r]));

  return questions.map((q) => {
    if (q.type === 'essay') {
      const origIndex = essayQs.indexOf(q);
      const r = essayMap.get(origIndex);
      return { ...q, analysis: r?.analysis || q.analysis || '', solution: r?.solution || q.solution || '' };
    } else {
      const origIndex = choiceQs.indexOf(q);
      const r = choiceMap.get(origIndex);
      const optionAnalysis = Array.isArray(r?.optionAnalysis) && r.optionAnalysis.length === q.options.length ? r.optionAnalysis : q.optionAnalysis;
      return { ...q, optionAnalysis };
    }
  });
}
