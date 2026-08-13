import type { Question, NoteItem, StudyRecord, User } from "./types";
import { BIOLOGY_QUESTIONS } from "./questions/biology";
import { HISTORY_QUESTIONS } from "./questions/history";
import { GEOGRAPHY_QUESTIONS } from "./questions/geography";
import { POLITICS_QUESTIONS } from "./questions/politics";
import { GRADE7B_QUESTIONS } from "./questions/grade7b";
import { GRADE8A_QUESTIONS } from "./questions/grade8a";
import { GRADE8B_QUESTIONS } from "./questions/grade8b";
import { GRADE9A_QUESTIONS } from "./questions/grade9a";
import { GRADE9B_QUESTIONS } from "./questions/grade9b";
import { GRADE6A_QUESTIONS } from "./questions/grade6a";
import { GRADE6B_QUESTIONS } from "./questions/grade6b";
import { ESSAY_QUESTIONS } from "./questions/essay";

// 首页轮播图（本地图片）
export const CAROUSEL_IMAGES = [
  {
    url: "/images/slide1.jpg",
    title: "高效学习三步法",
  },
  {
    url: "/images/slide2.jpg",
    title: "高效学习四步法",
  },
  {
    url: "/images/slide3.jpg",
    title: "好习惯学习卡",
  },
];

// 学霸笔记 20 条
export const NOTES: NoteItem[] = [
  { id: "n1", title: "生物：细胞膜控制物质进出，叶绿体是光合作用场所", category: "生物" },
  { id: "n2", title: "历史：鸦片战争1840年，中国近代史开端，半殖民地半封建", category: "历史" },
  { id: "n3", title: "地理：季风区非季风区分界线大兴阴贺巴冈", category: "地理" },
  { id: "n4", title: "道法：宪法是根本法，具有最高法律效力", category: "道法" },
  { id: "n5", title: "生物：光合作用二氧化碳加水光照叶绿体生成有机物和氧", category: "生物" },
  { id: "n6", title: "历史：新文化运动四提倡四反对，陈独秀李大钊鲁迅", category: "历史" },
  { id: "n7", title: "地理：34省级行政区简称速记口诀两湖两广两河两山", category: "地理" },
  { id: "n8", title: "道法：基本经济制度公有制为主体多种所有制经济共同发展", category: "道法" },
  { id: "n9", title: "生物：人体消化系统酶的催化作用具有专一性", category: "生物" },
  { id: "n10", title: "历史：辛亥革命推翻两千年封建帝制，使民主共和深入人心", category: "历史" },
  { id: "n11", title: "地理：气候类型判断步骤以温定带以水定型", category: "地理" },
  { id: "n12", title: "道法：公民基本权利政治自由选举权和被选举权", category: "道法" },
  { id: "n13", title: "生物：血液循环体循环肺循环路径要分清", category: "生物" },
  { id: "n14", title: "历史：五四运动是新旧民主革命转折点", category: "历史" },
  { id: "n15", title: "地理：等高线地形图判读鞍部山谷山脊陡崖", category: "地理" },
  { id: "n16", title: "道法：未成年人保护六道防线家庭学校社会司法网络政府", category: "道法" },
  { id: "n17", title: "生物：遗传变异DNA基因染色体关系链要记牢", category: "生物" },
  { id: "n18", title: "历史：三大改造完成标志社会主义制度基本建立", category: "历史" },
  { id: "n19", title: "地理：东南亚十字路口马六甲海峡咽喉要道", category: "地理" },
  { id: "n20", title: "道法：维护国家安全维护民族团结是公民义务", category: "道法" },
];

// 每周学情记录（7天）
export const WEEKLY_RECORDS: StudyRecord[] = [
  { date: "07-08", weekday: "周一", minutes: 45, answered: 32, correct: 26 },
  { date: "07-09", weekday: "周二", minutes: 38, answered: 28, correct: 21 },
  { date: "07-10", weekday: "周三", minutes: 52, answered: 40, correct: 33 },
  { date: "07-11", weekday: "周四", minutes: 41, answered: 30, correct: 25 },
  { date: "07-12", weekday: "周五", minutes: 60, answered: 48, correct: 39 },
  { date: "07-13", weekday: "周六", minutes: 75, answered: 56, correct: 47 },
  { date: "07-14", weekday: "周日", minutes: 48, answered: 36, correct: 30 },
];

// 当前登录用户
export const CURRENT_USER: User = {
  id: "u001",
  nickname: "李墨白",
  avatar: "",
  grade: "七年级上册",
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  role: "student",
  stats: {
    streakDays: 28,
    todayAnswered: 36,
    accuracy: 83,
    todayMinutes: 48,
    errorRate: 17,
    mastery: 76,
    rank: 156,
  },
};

// 各学科今日已学题数
export const SUBJECT_TODAY_COUNT: Record<string, number> = {
  biology: 12,
  politics: 8,
  history: 9,
  geography: 7,
};

// 考点速记统计
export const MASTERY_STATS = {
  collected: 48,
  mastered: 32,
  unmastered: 16,
};

// Mock 题目库（按年级×学科×版本分组，每版本 15 题，覆盖 7-9 年级全部学期）
// 题目来源于 src/data/questions/ 目录下的分年级分学科题库文件
export const QUESTIONS: Question[] = [
  ...GRADE6A_QUESTIONS,    // 六上
  ...GRADE6B_QUESTIONS,    // 六下
  ...BIOLOGY_QUESTIONS,    // 七上
  ...HISTORY_QUESTIONS,    // 七上
  ...GEOGRAPHY_QUESTIONS,  // 七上
  ...POLITICS_QUESTIONS,   // 七上
  ...GRADE7B_QUESTIONS,    // 七下
  ...GRADE8A_QUESTIONS,    // 八上
  ...GRADE8B_QUESTIONS,    // 八下
  ...GRADE9A_QUESTIONS,    // 九上
  ...GRADE9B_QUESTIONS,    // 九下
  ...ESSAY_QUESTIONS,      // 大题专项
];

// 管理端 Mock 用户列表
export const ADMIN_USERS: User[] = [
  {
    id: "u001", nickname: "李墨白", avatar: "", grade: "七年级上册",
    createdAt: Date.now() - 30 * 86400000, role: "student",
    stats: { streakDays: 28, todayAnswered: 36, accuracy: 83, todayMinutes: 48, errorRate: 17, mastery: 76, rank: 156 },
  },
  {
    id: "u002", nickname: "王书瑶", avatar: "", grade: "八年级上册",
    createdAt: Date.now() - 45 * 86400000, role: "student",
    stats: { streakDays: 52, todayAnswered: 50, accuracy: 91, todayMinutes: 65, errorRate: 9, mastery: 88, rank: 42 },
  },
  {
    id: "u003", nickname: "陈砚秋", avatar: "", grade: "九年级上册",
    createdAt: Date.now() - 60 * 86400000, role: "student",
    stats: { streakDays: 12, todayAnswered: 18, accuracy: 72, todayMinutes: 22, errorRate: 28, mastery: 61, rank: 580 },
  },
  {
    id: "u004", nickname: "林清和", avatar: "", grade: "七年级下册",
    createdAt: Date.now() - 20 * 86400000, role: "student",
    stats: { streakDays: 15, todayAnswered: 28, accuracy: 79, todayMinutes: 35, errorRate: 21, mastery: 70, rank: 320 },
  },
  {
    id: "u005", nickname: "苏白芷", avatar: "", grade: "八年级下册",
    createdAt: Date.now() - 10 * 86400000, role: "student",
    stats: { streakDays: 8, todayAnswered: 12, accuracy: 65, todayMinutes: 15, errorRate: 35, mastery: 48, rank: 980 },
  },
];

// 管理端统计
export const ADMIN_STATS = {
  totalUsers: 5,
  activeToday: 4,
  totalQuestions: 2010,
  totalAnswered: 1248,
};
