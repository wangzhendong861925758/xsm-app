import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Question, Subject, ClientAccount } from "@/data/types";
import { CURRENT_USER, QUESTIONS, ADMIN_USERS, CAROUSEL_IMAGES } from "@/data/mock";
import { SUBJECTS } from "@/data/textbooks";
import {
  isCloudReady,
  syncQuestionsToCloud,
  fetchQuestionsFromCloud,
  subscribeToQuestions,
} from "@/lib/cloud";

// 错题记录条目
export interface ErrorBookItem {
  id: string;
  questionId: string;
  subject: Subject;
  grade?: string;
  version?: string;
  stem?: string;
  options?: string[];
  selectedAnswer: string;   // 用户错答的选项
  correctAnswer: string;    // 正确答案
  analysis?: string;
  solution?: string;        // 大题推荐解题思路
  addedAt: number;
}

// 站点可视化配置
export interface CarouselItem {
  url: string;
  title: string;
}
export interface SiteConfig {
  brandName: string;        // 品牌名（毛笔字标题）
  carousel: CarouselItem[]; // 轮播图
  heroBadge: string;        // 首页印章文字
}

const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: "小四门精练",
  carousel: CAROUSEL_IMAGES.map((c) => ({ ...c })),
  heroBadge: "初中同步",
};

interface AppState {
  // 当前登录用户
  currentUser: User;
  // 选中的年级
  selectedGrade: string;
  // 选中的学科（用于刷题）
  selectedSubject: string | null;
  // 题目库
  questions: Question[];
  // 管理端用户列表
  adminUsers: User[];
  // 管理端登录态
  adminLoggedIn: boolean;
  // 客户端学习记录缓存
  todayLearned: Record<string, number>; // subject -> count
  // 今日各学科答题统计（正确数/总数），用于首页正确率进度条
  todayStats: Record<string, { correct: number; total: number }>;
  // 已答题目 ID 记录（用于去重，每次刷题不重复）
  answeredHistory: string[];
  // 站点可视化配置
  siteConfig: SiteConfig;
  // 每个学科独立选择的教材版本 { [subject]: version }
  selectedVersions: Record<string, string>;
  // 错题集
  errorBook: ErrorBookItem[];
  // 客户端注册账号列表
  clientAccounts: ClientAccount[];
  // 当前登录的客户端账号 8 位 ID（null 表示未登录）
  currentClientCode: string | null;

  // Actions
  setSelectedGrade: (grade: string) => void;
  setSelectedSubject: (subject: string) => void;
  toggleCollect: (questionId: string) => void;
  toggleMastered: (questionId: string) => void;
  addQuestion: (q: Question) => void;
  addQuestions: (qs: Question[]) => void; // 批量新增（Word 导入用）
  updateQuestion: (q: Question) => void;
  deleteQuestion: (id: string) => void;
  clearQuestions: () => void; // 清空题库（重新上传前用）
  addAdminUser: (u: User) => void;
  updateAdminUser: (u: User) => void;
  deleteAdminUser: (id: string) => void;
  setAdminLoggedIn: (v: boolean) => void;
  incrementTodayLearned: (subject: string) => void;
  recordTodayAnswer: (subject: string, correct: boolean) => void;
  addAnsweredQuestion: (id: string) => void;
  resetAnsweredBySubjectVersion: (subject: string, version: string) => void;
  updateSiteConfig: (patch: Partial<SiteConfig>) => void;
  resetSiteConfig: () => void;
  setSelectedVersion: (subject: string, version: string) => void;
  addToErrorBook: (item: ErrorBookItem) => void;
  removeFromErrorBook: (questionId: string) => void;
  // 客户端账号：注册（返回新生成的 8 位 ID 或 null 表示用户名已存在）
  registerClient: (username: string, password: string, studentName: string) => string | null;
  // 客户端账号：登录（true=成功）
  loginClient: (username: string, password: string) => boolean;
  // 客户端账号：登出
  logoutClient: () => void;
  // 管理端：凭 8 位 ID 开放权限（true=找到并开放，false=ID 不存在）
  grantClientByCode: (code: string, months: number) => boolean;
  // 管理端：凭 8 位 ID 撤销权限
  revokeClientByCode: (code: string) => void;
  // 客户端：扫描所有账号，撤销已过期账号的权限，返回当前登录账号是否被撤销
  checkAndRevokeExpired: () => boolean;
  // 云同步：从云端拉取题目并订阅实时更新（应用启动时调用一次）
  initCloudSync: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: CURRENT_USER,
      selectedGrade: "七年级上册",
      selectedSubject: null,
      questions: QUESTIONS,
      adminUsers: ADMIN_USERS,
      adminLoggedIn: false,
      todayLearned: { biology: 12, politics: 8, history: 9, geography: 7 },
      todayStats: { biology: { correct: 10, total: 12 }, politics: { correct: 6, total: 8 }, history: { correct: 7, total: 9 }, geography: { correct: 5, total: 7 } },
      answeredHistory: [],
      siteConfig: DEFAULT_SITE_CONFIG,
      selectedVersions: {},
      errorBook: [],
      clientAccounts: [],
      currentClientCode: null,

      setSelectedGrade: (grade) => set({ selectedGrade: grade }),
      setSelectedSubject: (subject) => set({ selectedSubject: subject }),

      toggleCollect: (questionId) =>
        set((s) => ({
          questions: s.questions.map((q) =>
            q.id === questionId ? { ...q, collected: !q.collected } : q,
          ),
        })),

      toggleMastered: (questionId) =>
        set((s) => ({
          questions: s.questions.map((q) =>
            q.id === questionId ? { ...q, mastered: !q.mastered } : q,
          ),
        })),

      addQuestion: (q) => {
        set((s) => ({ questions: [...s.questions, q] }));
        syncQuestionsToCloud(useStore.getState().questions);
      },
      addQuestions: (qs) => {
        set((s) => ({ questions: [...s.questions, ...qs] }));
        syncQuestionsToCloud(useStore.getState().questions);
      },
      updateQuestion: (q) => {
        set((s) => ({ questions: s.questions.map((item) => (item.id === q.id ? q : item)) }));
        syncQuestionsToCloud(useStore.getState().questions);
      },
      deleteQuestion: (id) => {
        set((s) => ({ questions: s.questions.filter((q) => q.id !== id) }));
        syncQuestionsToCloud(useStore.getState().questions);
      },
      clearQuestions: () => {
        set({ questions: [] });
        syncQuestionsToCloud([]);
      },

      addAdminUser: (u) => set((s) => ({ adminUsers: [...s.adminUsers, u] })),
      updateAdminUser: (u) =>
        set((s) => ({ adminUsers: s.adminUsers.map((item) => (item.id === u.id ? u : item)) })),
      deleteAdminUser: (id) =>
        set((s) => ({ adminUsers: s.adminUsers.filter((u) => u.id !== id) })),

      setAdminLoggedIn: (v) => set({ adminLoggedIn: v }),

      incrementTodayLearned: (subject) =>
        set((s) => ({
          todayLearned: { ...s.todayLearned, [subject]: (s.todayLearned[subject] || 0) + 1 },
        })),

      recordTodayAnswer: (subject, correct) =>
        set((s) => {
          const cur = s.todayStats[subject] || { correct: 0, total: 0 };
          return {
            todayStats: {
              ...s.todayStats,
              [subject]: { correct: cur.correct + (correct ? 1 : 0), total: cur.total + 1 },
            },
          };
        }),

      addAnsweredQuestion: (id) =>
        set((s) => ({
          answeredHistory: s.answeredHistory.includes(id)
            ? s.answeredHistory
            : [...s.answeredHistory, id],
        })),

      resetAnsweredBySubjectVersion: (subject, version) =>
        set((s) => ({
          answeredHistory: s.answeredHistory.filter((id) => {
            const q = s.questions.find((item) => item.id === id);
            return !(q && q.subject === subject && q.version === version);
          }),
        })),

      updateSiteConfig: (patch) =>
        set((s) => ({ siteConfig: { ...s.siteConfig, ...patch } })),
      resetSiteConfig: () => set({ siteConfig: DEFAULT_SITE_CONFIG }),

      setSelectedVersion: (subject, version) =>
        set((s) => ({ selectedVersions: { ...s.selectedVersions, [subject]: version } })),

      addToErrorBook: (item) =>
        set((s) => ({
          errorBook: s.errorBook.find((e) => e.questionId === item.questionId)
            ? s.errorBook
            : [...s.errorBook, item],
        })),
      removeFromErrorBook: (questionId) =>
        set((s) => ({ errorBook: s.errorBook.filter((e) => e.questionId !== questionId) })),

      registerClient: (username, password, studentName) => {
        const state = useStore.getState();
        if (state.clientAccounts.some((a) => a.username === username)) return null;
        // 生成不重复的 8 位数字 ID
        let code = "";
        do {
          code = Math.floor(10000000 + Math.random() * 90000000).toString();
        } while (state.clientAccounts.some((a) => a.code === code));
        const account: ClientAccount = {
          code,
          username,
          password,
          studentName,
          granted: false,
          expiresAt: null,
          createdAt: Date.now(),
        };
        set((s) => ({ clientAccounts: [...s.clientAccounts, account], currentClientCode: code }));
        return code;
      },

      loginClient: (username, password) => {
        const account = useStore.getState().clientAccounts.find(
          (a) => a.username === username && a.password === password,
        );
        if (!account) return false;
        set({ currentClientCode: account.code });
        return true;
      },

      logoutClient: () => set({ currentClientCode: null }),

      grantClientByCode: (code, months) => {
        const exists = useStore.getState().clientAccounts.some((a) => a.code === code);
        if (!exists) return false;
        const expiresAt = Date.now() + months * 30 * 24 * 60 * 60 * 1000;
        set((s) => ({
          clientAccounts: s.clientAccounts.map((a) =>
            a.code === code ? { ...a, granted: true, expiresAt } : a,
          ),
        }));
        return true;
      },

      revokeClientByCode: (code) =>
        set((s) => ({
          clientAccounts: s.clientAccounts.map((a) =>
            a.code === code ? { ...a, granted: false, expiresAt: null } : a,
          ),
        })),

      checkAndRevokeExpired: () => {
        const now = Date.now();
        let currentRevoked = false;
        set((s) => {
          const currentCode = s.currentClientCode;
          const next = s.clientAccounts.map((a) => {
            if (a.granted && a.expiresAt && a.expiresAt < now) {
              if (a.code === currentCode) currentRevoked = true;
              return { ...a, granted: false, expiresAt: null };
            }
            return a;
          });
          return { clientAccounts: next };
        });
        return currentRevoked;
      },

      initCloudSync: async () => {
        if (!isCloudReady()) return;
        // 拉取云端题目，合并本地 mastered/collected 状态
        const cloudQuestions = await fetchQuestionsFromCloud();
        if (cloudQuestions && cloudQuestions.length > 0) {
          const local = useStore.getState().questions;
          const merged = cloudQuestions.map((q) => {
            const lq = local.find((x) => x.id === q.id);
            return lq ? { ...q, mastered: lq.mastered, collected: lq.collected } : q;
          });
          set({ questions: merged });
        }
        // 订阅实时更新：管理端变更后所有客户端自动同步
        subscribeToQuestions((cloudQuestions) => {
          const local = useStore.getState().questions;
          const merged = cloudQuestions.map((q) => {
            const lq = local.find((x) => x.id === q.id);
            return lq ? { ...q, mastered: lq.mastered, collected: lq.collected } : q;
          });
          set({ questions: merged });
        });
      },
    }),
    {
      name: "xsm-app-store",
      partialize: (s) => ({
        selectedGrade: s.selectedGrade,
        questions: s.questions,
        adminUsers: s.adminUsers,
        adminLoggedIn: s.adminLoggedIn,
        todayLearned: s.todayLearned,
        todayStats: s.todayStats,
        answeredHistory: s.answeredHistory,
        siteConfig: s.siteConfig,
        selectedVersions: s.selectedVersions,
        errorBook: s.errorBook,
        clientAccounts: s.clientAccounts,
        currentClientCode: s.currentClientCode,
      }),
      // 合并策略：
      // - 无持久化数据时，使用代码里的初始 QUESTIONS（保证首次访问有题）
      // - 有持久化数据时，以持久化 questions 为准（支持管理端清空/新增后客户端同步），
      //   过滤掉学科已不存在的旧题目（如已删除的 science），并继承 mastered/collected
      // - 其余用户作答状态以持久化为准，避免旧数据结构污染
      merge: (persisted, current) => {
        const p = (persisted as Partial<AppState>) || {};
        // 无持久化 questions 字段：首次访问，用代码初始题目
        if (!Array.isArray(p.questions)) {
          return {
            ...current,
            adminLoggedIn: p.adminLoggedIn ?? current.adminLoggedIn,
          };
        }
        // 有持久化 questions：以持久化为准，过滤掉学科已不存在的旧题目
        const validSubjects = new Set(Object.keys(SUBJECTS));
        const mergedQuestions = p.questions
          .filter((q) => validSubjects.has(q.subject))
          .map((q) => {
            const codeQ = current.questions.find((x) => x.id === q.id);
            if (codeQ) {
              return { ...codeQ, mastered: q.mastered, collected: q.collected };
            }
            return q;
          });
        return {
          ...current,
          answeredHistory: p.answeredHistory ?? current.answeredHistory,
          errorBook: p.errorBook ?? current.errorBook,
          clientAccounts: p.clientAccounts ?? current.clientAccounts,
          currentClientCode: p.currentClientCode ?? current.currentClientCode,
          adminLoggedIn: p.adminLoggedIn ?? current.adminLoggedIn,
          questions: mergedQuestions,
        };
      },
    },
  ),
);

// 跨标签页实时同步：管理端保存配置后，其他标签页的客户端自动更新
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "xsm-app-store" && e.newValue) {
      useStore.persist.rehydrate();
    }
  });
}
