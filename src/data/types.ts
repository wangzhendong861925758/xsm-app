// 核心类型定义

export type Subject = "biology" | "politics" | "history" | "geography";

export interface SubjectInfo {
  key: Subject;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  icon: string; // emoji 占位，组件内可替换
}

// 教材配置
export interface TextbookConfig {
  grade: string;
  subject: Subject;
  subjectName: string;
  versions: string[];
}

// 用户
export interface UserStats {
  streakDays: number;
  todayAnswered: number;
  accuracy: number;
  todayMinutes: number;
  errorRate: number;
  mastery: number;
  rank: number;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  grade: string;
  createdAt: number;
  role: "student" | "admin";
  stats: UserStats;
}

// 题目
export type QuestionType = "single" | "multiple" | "judge" | "essay";

export interface EssayKeyPoint {
  /** 关键要点文本（学生答案包含即视为命中该要点） */
  text: string;
  /** 该要点权重（默认1） */
  weight?: number;
}

export interface Question {
  id: string;
  subject: Subject;
  grade: string;
  version: string;
  type: QuestionType;
  stem: string;
  options: string[];
  answer: string | string[];
  analysis: string;
  mastered: boolean;
  collected: boolean;
  /** 大题专用：标准答案的要点列表（命中后判定正确） */
  keyPoints?: EssayKeyPoint[];
  /** 大题专用：推荐解题思路 */
  solution?: string;
  /** 大题专用：满分字数提示 */
  wordLimit?: number;
  /** 所属单元，例如 "第一单元 少年有梦" */
  chapter?: string;
  /** 所属课，例如 "第一课 开启初中生活" */
  lesson?: string;
  /** 所属课时，例如 "第1课时 奏响中学序曲" */
  section?: string;
}

// 学情记录
export interface StudyRecord {
  date: string; // YYYY-MM-DD
  weekday: string;
  minutes: number;
  answered: number;
  correct: number;
}

// 学霸笔记
export interface NoteItem {
  id: string;
  title: string;
  category: string;
}
