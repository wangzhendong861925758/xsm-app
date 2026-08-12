/**
 * LeanCloud 云同步模块
 * 管理端上传题目后保存到云端，所有客户端通过 LiveQuery 实时收到更新
 */
import type { Question } from "@/data/types";

// 动态导入 SDK，避免进主 bundle
let AV: any = null;
let initialized = false;
// 防止「云端更新 → 本地 set → 触发云同步 → 云端更新」循环
let suppressSync = false;

async function getAV(): Promise<any | null> {
  if (!AV) {
    const mod = await import("leancloud-storage");
    AV = mod.default || mod;
  }
  if (!initialized) {
    const appId = import.meta.env.VITE_LC_APP_ID;
    const appKey = import.meta.env.VITE_LC_APP_KEY;
    const serverURL = import.meta.env.VITE_LC_SERVER_URL;
    if (!appId || !appKey || !serverURL) return null;
    AV.init({ appId, appKey, serverURL });
    initialized = true;
  }
  return AV;
}

const CLASS_NAME = "QuestionBank";

/** 是否已配置 LeanCloud（用于判断是否启用云同步） */
export async function isCloudReady(): Promise<boolean> {
  const av = await getAV();
  return av !== null;
}

/** 保存全部题目到云端（管理端调用） */
export async function syncQuestionsToCloud(questions: Question[]): Promise<void> {
  if (suppressSync) return;
  const av = await getAV();
  if (!av) return;
  try {
    const query = new av.Query(CLASS_NAME);
    query.descending("updatedAt");
    query.limit(1);
    const existing = await query.first();

    if (existing) {
      existing.set("questions", questions);
      await existing.save();
    } else {
      const Obj = av.Object.extend(CLASS_NAME);
      const obj = new Obj();
      obj.set("questions", questions);
      await obj.save();
    }
  } catch (e) {
    console.error("LeanCloud sync failed:", e);
  }
}

/** 从云端拉取题目（客户端初始化时调用） */
export async function fetchQuestionsFromCloud(): Promise<Question[] | null> {
  const av = await getAV();
  if (!av) return null;
  try {
    const query = new av.Query(CLASS_NAME);
    query.descending("updatedAt");
    query.limit(1);
    const result = await query.first();
    if (result) {
      return (result.get("questions") as Question[]) || [];
    }
    return null;
  } catch (e) {
    console.error("LeanCloud fetch failed:", e);
    return null;
  }
}

/**
 * 订阅云端题目变更（客户端实时同步用）
 * 返回取消订阅函数
 */
export async function subscribeToQuestions(
  onUpdate: (questions: Question[]) => void,
): Promise<(() => void) | null> {
  const av = await getAV();
  if (!av) return null;
  try {
    const query = new av.Query(CLASS_NAME);
    query.descending("updatedAt");
    query.limit(1);
    const liveQuery = await query.subscribe();

    const handleUpdate = (object: any) => {
      const questions = object.get("questions");
      if (questions && Array.isArray(questions)) {
        suppressSync = true;
        onUpdate(questions);
        setTimeout(() => {
          suppressSync = false;
        }, 2000);
      }
    };

    liveQuery.on("update", handleUpdate);
    liveQuery.on("create", handleUpdate);

    return () => {
      liveQuery.unsubscribe();
    };
  } catch (e) {
    console.error("LeanCloud subscribe failed, 降级为轮询:", e);
    // ponytail: LiveQuery 失败时降级为 30 秒轮询，保证基本可用
    const timer = setInterval(async () => {
      const qs = await fetchQuestionsFromCloud();
      if (qs) {
        suppressSync = true;
        onUpdate(qs);
        setTimeout(() => {
          suppressSync = false;
        }, 2000);
      }
    }, 30000);
    return () => clearInterval(timer);
  }
}
