﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Question, Subject, ClientAccount } from "@/data/types";
import { CURRENT_USER, ADMIN_USERS, CAROUSEL_IMAGES } from "@/data/mock";
import { SUBJECTS } from "@/data/textbooks";
import { DEFAULT_HOME_DESIGN, type HomeDesignConfig } from "@/data/homeDesign";
import {
  fetchAccounts,
  registerAccount,
  loginAccount,
  grantAccount,
  revokeAccount,
  fetchQuestionsByShard,
} from "@/lib/api";

// 错题记录条目
export interface ErrorBookItem {
  id: string;
  questionId: string;
  subject: Subject;
  /** 题目类型（重做时需要） */
  type?: "single" | "multiple" | "judge" | "essay";
  grade?: string;
  version?: string;
  stem?: string;
  options?: string[];
  selectedAnswer: string;   // 用户错答的选项
  correctAnswer: string;    // 正确答案
  analysis?: string;
  solution?: string;        // 大题推荐解题思路
  /** 选择/判断题：用户所选选项对应的错因（写入时从 optionAnalysis[selIdx] 取） */
  wrongReason?: string;
  /** 选择/判断题：正确选项位置的"正确思路"（写入时从 optionAnalysis[correctIdx] 取） */
  rightThought?: string;
  /** 来源：学科练习 或 考试（模拟/真题） */
  source?: "practice" | "exam";
  addedAt: number;
}

// 考试记录（模拟+真题）
export interface ExamRecord {
  paperId: string;
  title: string;
  type: "mock" | "real";
  score: number;          // 百分制
  correctCount: number;
  totalQuestions: number;
  completedAt: number;    // 时间戳
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
  // 各学科累计答题总数（跨会话累计，用于首页"已学习xx道题"）
  subjectTotalAnswered: Record<string, number>;
  // 各学科累计正确数（用于首页正确率进度条）
  subjectTotalCorrect: Record<string, number>;
  // 已答题目 ID 记录（用于去重，每次刷题不重复）
  answeredHistory: string[];
  // 学习日期记录（YYYY-MM-DD），用于计算坚持天数
  studyDates: string[];
  // 站点可视化配置
  siteConfig: SiteConfig;
  // 首页可视化设计配置（管理端编辑，首页实时读取）
  homeDesign: HomeDesignConfig;
  // 每个学科独立选择的教材版本 { [subject]: version }
  selectedVersions: Record<string, string>;
  // 错题集
  errorBook: ErrorBookItem[];
  // 我的收藏：独立存储完整题目，跨学科/跨会话可访问
  collectedQuestions: Question[];
  // 客户端账号列表
  clientAccounts: ClientAccount[];
  // 当前登录的客户端账号 8 位 ID（null 表示未登录）
  currentClientCode: string | null;
  // 考试记录（模拟+真题），用于实时统计
  examRecords: ExamRecord[];

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
  // 收藏题目（与 questions.collected 双向同步）
  addCollectedQuestion: (q: Question) => void;
  removeCollectedQuestion: (questionId: string) => void;
  // 客户端账号：注册（返回新生成的 8 位 ID 或 null 表示用户名已存在）
  registerClient: (username: string, password: string, studentName: string) => Promise<string | null>;
  // 客户端账号：登录（true=成功）
  loginClient: (username: string, password: string) => Promise<boolean>;
  // 客户端账号：登出
  logoutClient: () => void;
  // 管理端：凭 8 位 ID 开放权限（true=找到并开放，false=ID 不存在）
  // period: { months?: number; years?: number }，years 优先（年会员按次年同一天）
  grantClientByCode: (
    code: string,
    period: { months?: number; years?: number },
  ) => Promise<boolean>;
  // 管理端：凭 8 位 ID 撤销权限
  revokeClientByCode: (code: string) => Promise<void>;
  // 客户端：扫描所有账号，撤销已过期账号的权限，返回当前登录账号是否被撤销
  checkAndRevokeExpired: () => boolean;
  // 云同步：从云端拉取账号信息（题目已改为静态分片按需加载，不再全量拉取）
  initCloudSync: () => Promise<void>;
  // 按需加载题目：从静态 JSON 分片加载某学科+年级+版本的题目
  loadQuestions: (subject: Subject, grade: string, version: string) => Promise<void>;
  // 当前已加载题目的分片标识 "subject|grade|version"
  loadedQuestionKey: string | null;
  // 题目加载状态
  questionsLoading: boolean;
  // 记录一次考试结果
  recordExamResult: (record: ExamRecord) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: CURRENT_USER,
      selectedGrade: "七年级上册",
      selectedSubject: null,
      questions: [],
      loadedQuestionKey: null,
      questionsLoading: false,
      adminUsers: ADMIN_USERS,
      adminLoggedIn: false,
      todayLearned: {},
      todayStats: {},
      subjectTotalAnswered: {},
      subjectTotalCorrect: {},
      answeredHistory: [],
      studyDates: [],
      siteConfig: DEFAULT_SITE_CONFIG,
      homeDesign: DEFAULT_HOME_DESIGN,
      selectedVersions: {},
      errorBook: [],
      collectedQuestions: [],
      clientAccounts: [],
      currentClientCode: null,
      examRecords: [],

      setSelectedGrade: (grade) => set({ selectedGrade: grade }),
      setSelectedSubject: (subject) => set({ selectedSubject: subject }),

      toggleCollect: (questionId) =>
        set((s) => {
          const q = s.questions.find((x) => x.id === questionId);
          if (!q) return {};
          const willCollect = !q.collected;
          return {
            questions: s.questions.map((x) =>
              x.id === questionId ? { ...x, collected: willCollect } : x,
            ),
            // 同步独立收藏列表（去重）
            collectedQuestions: willCollect
              ? s.collectedQuestions.some((c) => c.id === questionId)
                ? s.collectedQuestions
                : [...s.collectedQuestions, { ...q, collected: true }]
              : s.collectedQuestions.filter((c) => c.id !== questionId),
          };
        }),

      addCollectedQuestion: (q) =>
        set((s) => ({
          collectedQuestions: s.collectedQuestions.some((c) => c.id === q.id)
            ? s.collectedQuestions
            : [...s.collectedQuestions, { ...q, collected: true }],
          questions: s.questions.map((x) =>
            x.id === q.id ? { ...x, collected: true } : x,
          ),
        })),

      removeCollectedQuestion: (questionId) =>
        set((s) => ({
          collectedQuestions: s.collectedQuestions.filter((c) => c.id !== questionId),
          questions: s.questions.map((x) =>
            x.id === questionId ? { ...x, collected: false } : x,
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
        // ponytail: 静态 JSON 分片不可运行时写入，管理端编辑仅影响当前会话；如需永久新增请重新生成静态文件
      },
      addQuestions: (qs) => {
        set((s) => ({ questions: [...s.questions, ...qs] }));
      },
      updateQuestion: (q) => {
        set((s) => ({ questions: s.questions.map((item) => (item.id === q.id ? q : item)) }));
      },
      deleteQuestion: (id) => {
        set((s) => ({ questions: s.questions.filter((q) => q.id !== id) }));
      },
      clearQuestions: () => {
        set({ questions: [], loadedQuestionKey: null });
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
          const today = new Date().toISOString().slice(0, 10);
          return {
            todayStats: {
              ...s.todayStats,
              [subject]: { correct: cur.correct + (correct ? 1 : 0), total: cur.total + 1 },
            },
            subjectTotalAnswered: {
              ...s.subjectTotalAnswered,
              [subject]: (s.subjectTotalAnswered[subject] || 0) + 1,
            },
            subjectTotalCorrect: {
              ...s.subjectTotalCorrect,
              [subject]: (s.subjectTotalCorrect[subject] || 0) + (correct ? 1 : 0),
            },
            studyDates: s.studyDates.includes(today) ? s.studyDates : [...s.studyDates, today],
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

      recordExamResult: (record) =>
        set((s) => ({ examRecords: [...s.examRecords, record] })),

      registerClient: async (username, password, studentName) => {
        const account = await registerAccount(username, password, studentName);
        if (!account) return null;
        set((s) => ({
          clientAccounts: [...s.clientAccounts.filter((a) => a.code !== account.code), account],
          currentClientCode: account.code,
        }));
        return account.code;
      },

      loginClient: async (username, password) => {
        const account = await loginAccount(username, password);
        if (!account) return false;
        set((s) => ({
          clientAccounts: [...s.clientAccounts.filter((a) => a.code !== account.code), account],
          currentClientCode: account.code,
        }));
        return true;
      },

      logoutClient: () => set({ currentClientCode: null }),

      grantClientByCode: async (code, period) => {
        const account = await grantAccount(code, period);
        if (!account) return false;
        set((s) => ({
          clientAccounts: s.clientAccounts.map((a) => (a.code === code ? account : a)),
        }));
        return true;
      },

      revokeClientByCode: async (code) => {
        const ok = await revokeAccount(code);
        if (ok) {
          set((s) => ({
            clientAccounts: s.clientAccounts.map((a) =>
              a.code === code ? { ...a, granted: false, expiresAt: null } : a,
            ),
          }));
        }
      },

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
        // 题目已改为静态分片按需加载，这里只拉取账号
        const cloudAccounts = await fetchAccounts();
        if (cloudAccounts.length > 0) {
          const currentCode = useStore.getState().currentClientCode;
          set({ clientAccounts: cloudAccounts, currentClientCode: currentCode });
        }
        // ponytail: REST API 无实时推送，用 30 秒轮询近似实时同步账号
        setInterval(async () => {
          const acs = await fetchAccounts();
          if (acs.length > 0) {
            const currentCode = useStore.getState().currentClientCode;
            set({ clientAccounts: acs, currentClientCode: currentCode });
          }
        }, 30000);
      },

      loadQuestions: async (subject, grade, version) => {
        const key = `${subject}|${grade}|${version}`;
        if (useStore.getState().loadedQuestionKey === key && useStore.getState().questions.length > 0) return;
        set({ questionsLoading: true });
        try {
          const questions = await fetchQuestionsByShard(subject, grade, version);
          // 合并本地用户状态（mastered/collected）
          const local = useStore.getState().questions;
          const merged = questions.map((q) => {
            const lq = local.find((x) => x.id === q.id);
            return lq ? { ...q, mastered: lq.mastered, collected: lq.collected } : q;
          });
          set({ questions: merged, loadedQuestionKey: key, questionsLoading: false });
        } catch (e) {
          console.error("加载题目失败:", e);
          set({ questionsLoading: false });
        }
      },
    }),
    {
      name: "xsm-app-store",
      version: 5,
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          const { questions: _q, loadedQuestionKey: _k, ...rest } = persisted || {};
          persisted = rest;
        }
        if (version < 3) {
          if (persisted?.siteConfig) {
            persisted.siteConfig.carousel = CAROUSEL_IMAGES.map((c) => ({ ...c }));
          }
        }
        if (version < 4) {
          if (persisted) {
            persisted.subjectTotalAnswered = {};
            persisted.subjectTotalCorrect = {};
          }
        }
        if (version < 5) {
          // ponytail: 清除旧的 selectedVersions，强制用户重新选择教材版本
          // 修复：旧版本选择可能指向已更新名称的版本，导致加载失败
          if (persisted) {
            persisted.selectedVersions = {};
          }
        }
        return persisted;
      },
      partialize: (s) => ({
        selectedGrade: s.selectedGrade,
        adminUsers: s.adminUsers,
        adminLoggedIn: s.adminLoggedIn,
        todayLearned: s.todayLearned,
        todayStats: s.todayStats,
        subjectTotalAnswered: s.subjectTotalAnswered,
        subjectTotalCorrect: s.subjectTotalCorrect,
        answeredHistory: s.answeredHistory,
        studyDates: s.studyDates,
        siteConfig: s.siteConfig,
        homeDesign: s.homeDesign,
        selectedVersions: s.selectedVersions,
        errorBook: s.errorBook,
        clientAccounts: s.clientAccounts,
        currentClientCode: s.currentClientCode,
      }),
      merge: (persisted, current) => {
        const p = (persisted as Partial<AppState>) || {};
        return {
          ...current,
          answeredHistory: p.answeredHistory ?? current.answeredHistory,
          studyDates: p.studyDates ?? current.studyDates,
          errorBook: p.errorBook ?? current.errorBook,
          collectedQuestions: p.collectedQuestions ?? current.collectedQuestions,
          clientAccounts: p.clientAccounts ?? current.clientAccounts,
          currentClientCode: p.currentClientCode ?? current.currentClientCode,
          examRecords: p.examRecords ?? current.examRecords,
          adminLoggedIn: p.adminLoggedIn ?? current.adminLoggedIn,
          selectedGrade: p.selectedGrade ?? current.selectedGrade,
          selectedVersions: p.selectedVersions ?? current.selectedVersions,
          siteConfig: p.siteConfig ?? current.siteConfig,
          homeDesign: p.homeDesign ?? current.homeDesign,
          adminUsers: p.adminUsers ?? current.adminUsers,
          todayLearned: p.todayLearned ?? current.todayLearned,
          todayStats: p.todayStats ?? current.todayStats,
          subjectTotalAnswered: p.subjectTotalAnswered ?? current.subjectTotalAnswered,
          subjectTotalCorrect: p.subjectTotalCorrect ?? current.subjectTotalCorrect,
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
