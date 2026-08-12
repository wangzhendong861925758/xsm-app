/**
 * Supabase 云同步模块
 * 管理端上传题目后保存到云端，所有客户端通过 realtime 订阅实时收到更新
 */
import { createClient } from "@supabase/supabase-js";
import type { Question } from "@/data/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: ReturnType<typeof createClient> | null = null;
// 防止「云端更新 → 本地 set → 触发云同步 → 云端更新」循环
let suppressSync = false;

function getClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 2 } },
    });
  }
  return client;
}

const TABLE = "question_bank";
const PK = "singleton"; // 单行表，永远只有一条记录存全部题目

/** 是否已配置 Supabase */
export function isCloudReady(): boolean {
  return getClient() !== null;
}

/** 保存全部题目到云端（管理端调用） */
export async function syncQuestionsToCloud(questions: Question[]): Promise<void> {
  if (suppressSync) return;
  const sb = getClient();
  if (!sb) return;
  try {
    const { error } = await sb
      .from(TABLE)
      .upsert({ id: PK, questions, updated_at: new Date().toISOString() } as any, { onConflict: "id" });
    if (error) console.error("Supabase sync failed:", error.message);
  } catch (e) {
    console.error("Supabase sync failed:", e);
  }
}

/** 从云端拉取题目（客户端初始化时调用） */
export async function fetchQuestionsFromCloud(): Promise<Question[] | null> {
  const sb = getClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from(TABLE).select("questions").eq("id", PK).maybeSingle();
    if (error) {
      console.error("Supabase fetch failed:", error.message);
      return null;
    }
    return (data as any)?.questions || null;
  } catch (e) {
    console.error("Supabase fetch failed:", e);
    return null;
  }
}

/**
 * 订阅云端题目变更（客户端实时同步用）
 * 返回取消订阅函数
 */
export function subscribeToQuestions(onUpdate: (questions: Question[]) => void): () => void {
  const sb = getClient();
  if (!sb) return () => {};

  const channel = sb
    .channel("question_bank_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE },
      (payload: any) => {
        const questions = payload.new?.questions;
        if (questions && Array.isArray(questions)) {
          suppressSync = true;
          onUpdate(questions);
          setTimeout(() => {
            suppressSync = false;
          }, 2000);
        }
      },
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}
