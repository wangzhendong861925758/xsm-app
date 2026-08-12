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

/* ================ AI 解析生成（通过 Netlify Function 代理，避免 CORS 问题） ================ */

const AI_KEY_STORAGE = 'xsm_ai_api_key';

export function getAIKey(): string {
  return localStorage.getItem(AI_KEY_STORAGE) || '';
}

export function setAIKey(key: string): void {
  localStorage.setItem(AI_KEY_STORAGE, key.trim());
}

/** 调用 AI 为题目生成错题解析和正确思路（通过 Netlify Function 代理） */
export async function generateAnalysis(questions: Question[]): Promise<Question[]> {
  const key = getAIKey();
  const res = await fetch("/api/generate-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: JSON.stringify({ questions, apiKey: key }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "AI 生成失败");
  }
  return data.data as Question[];
}
