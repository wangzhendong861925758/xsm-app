// 核心类型定义

export type Subject = "biology" | "politics" | "history" | "geography" | "chemistry" | "physics";

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

// 客户端登录账号（独立于 User 的展示档案）
export interface ClientAccount {
  code: string;        // 8 位唯一数字 ID
  username: string;    // 用户名
  password: string;    // 密码
  studentName: string; // 学生姓名
  granted: boolean;    // 是否已开放答题权限
  expiresAt: number | null; // 权限到期时间戳（null 表示未授权或无期限）
  createdAt: number;
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
  /**
   * 选择/判断题专用：每个选项对应的错因解析
   * 数组顺序与 options 对齐；正确选项的位置存储"正确思路"而非错因
   * 客户端选错时，根据所选选项下标取对应错因展示
   */
  optionAnalysis?: string[];
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
