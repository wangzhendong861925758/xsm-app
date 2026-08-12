import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Question, Subject } from "@/data/types";
import { CURRENT_USER, QUESTIONS, ADMIN_USERS, CAROUSEL_IMAGES } from "@/data/mock";

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
  brandSub: string;         // 副标题
  primaryColor: string;     // 主题主色（navy）
  accentColor: string;      // 强调色（gold）
  bgBase: string;           // 背景基色
  carousel: CarouselItem[]; // 轮播图
  heroBadge: string;        // 首页右上角小标签
}

const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: "小四门精练",
  brandSub: "中考 · 小四门刷题训练",
  primaryColor: "#0EA5E9",
  accentColor: "#0284C7",
  bgBase: "#FFFFFF",
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

  // Actions
  setSelectedGrade: (grade: string) => void;
  setSelectedSubject: (subject: string) => void;
  toggleCollect: (questionId: string) => void;
  toggleMastered: (questionId: string) => void;
  addQuestion: (q: Question) => void;
  updateQuestion: (q: Question) => void;
  deleteQuestion: (id: string) => void;
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

      addQuestion: (q) => set((s) => ({ questions: [...s.questions, q] })),
      updateQuestion: (q) =>
        set((s) => ({ questions: s.questions.map((item) => (item.id === q.id ? q : item)) })),
      deleteQuestion: (id) =>
        set((s) => ({ questions: s.questions.filter((q) => q.id !== id) })),

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
      }),
      // 合并策略：以代码里的最新 QUESTIONS 为准（含新增题目），
      // 同时保留持久化的用户作答状态（mastered/collected）。
      merge: (persisted, current) => {
        const p = (persisted as Partial<AppState>) || {};
        const mergedQuestions = current.questions.map((q) => {
          const old = p.questions?.find((x) => x.id === q.id);
          if (old) {
            return { ...q, mastered: old.mastered, collected: old.collected };
          }
          return q;
        });
        return {
          ...current,
          ...p,
          questions: mergedQuestions,
        };
      },
    },
  ),
);
