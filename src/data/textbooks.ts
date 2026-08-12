import type { Subject, SubjectInfo, TextbookConfig } from "./types";

// 学科信息（小四门：生物/道法/历史/地理）
// 全部统一为蓝白同色系，仅用深浅区分
export const SUBJECTS: Record<Subject, SubjectInfo> = {
  biology: {
    key: "biology",
    name: "生物",
    shortName: "生",
    color: "#0284C7",
    bgColor: "#E0F2FE",
    icon: "🧬",
  },
  politics: {
    key: "politics",
    name: "道法",
    shortName: "政",
    color: "#0369A1",
    bgColor: "#E0F2FE",
    icon: "📜",
  },
  history: {
    key: "history",
    name: "历史",
    shortName: "史",
    color: "#0C4A6E",
    bgColor: "#E0F2FE",
    icon: "🏛️",
  },
  geography: {
    key: "geography",
    name: "地理",
    shortName: "地",
    color: "#0EA5E9",
    bgColor: "#E0F2FE",
    icon: "🌏",
  },
};

// 初中年级列表（7-9年级）
export const GRADES = [
  { key: "六年级上册", short: "六上", phase: "小升初" },
  { key: "六年级下册", short: "六下", phase: "小升初" },
  { key: "七年级上册", short: "七上", phase: "初中" },
  { key: "七年级下册", short: "七下", phase: "初中" },
  { key: "八年级上册", short: "八上", phase: "初中" },
  { key: "八年级下册", short: "八下", phase: "初中" },
  { key: "九年级上册", short: "九上", phase: "初中" },
  { key: "九年级下册", short: "九下", phase: "初中" },
];

// 教材版本配置（参考学科网初中各学科版本）
export const TEXTBOOKS: TextbookConfig[] = [
  // ===== 六年级上册（小升初衔接） =====
  {
    grade: "六年级上册",
    subject: "biology",
    subjectName: "生物",
    versions: ["人教版", "苏教版", "济南版"],
  },
  {
    grade: "六年级上册",
    subject: "politics",
    subjectName: "道法",
    versions: ["统编版"],
  },
  {
    grade: "六年级上册",
    subject: "history",
    subjectName: "历史",
    versions: ["统编版"],
  },
  {
    grade: "六年级上册",
    subject: "geography",
    subjectName: "地理",
    versions: ["人教版", "湘教版", "商务星球版"],
  },
  // ===== 六年级下册（小升初衔接） =====
  {
    grade: "六年级下册",
    subject: "biology",
    subjectName: "生物",
    versions: ["人教版", "苏教版", "济南版"],
  },
  {
    grade: "六年级下册",
    subject: "politics",
    subjectName: "道法",
    versions: ["统编版"],
  },
  {
    grade: "六年级下册",
    subject: "history",
    subjectName: "历史",
    versions: ["统编版"],
  },
  {
    grade: "六年级下册",
    subject: "geography",
    subjectName: "地理",
    versions: ["人教版", "湘教版", "商务星球版"],
  },
  // ===== 七年级上册 =====
  {
    grade: "七年级上册",
    subject: "biology",
    subjectName: "生物",
    versions: [
      "人教版",
      "人教版（2024）",
      "北师大版",
      "苏教版",
      "苏科版",
      "济南版",
      "冀少版",
      "北京版",
      "鲁科版（五四学制）",
    ],
  },
  {
    grade: "七年级上册",
    subject: "politics",
    subjectName: "道法",
    versions: ["统编版", "统编版（2024）", "统编版（五四学制）"],
  },
  {
    grade: "七年级上册",
    subject: "history",
    subjectName: "历史",
    versions: ["统编版", "统编版（2024）", "统编版（五四学制）"],
  },
  {
    grade: "七年级上册",
    subject: "geography",
    subjectName: "地理",
    versions: [
      "人教版",
      "人教版（2024）",
      "湘教版",
      "商务星球版",
      "中图版",
      "粤人版",
      "晋教版",
      "中图版（北京）",
      "仁爱科普版",
      "鲁教版（五四学制）",
    ],
  },
  // ===== 七年级下册 =====
  {
    grade: "七年级下册",
    subject: "biology",
    subjectName: "生物",
    versions: [
      "人教版",
      "人教版（2024）",
      "北师大版",
      "苏教版",
      "苏科版",
      "济南版",
      "冀少版",
      "北京版",
      "鲁科版（五四学制）",
    ],
  },
  {
    grade: "七年级下册",
    subject: "politics",
    subjectName: "道法",
    versions: ["统编版", "统编版（2024）", "统编版（五四学制）"],
  },
  {
    grade: "七年级下册",
    subject: "history",
    subjectName: "历史",
    versions: ["统编版", "统编版（2024）", "统编版（五四学制）"],
  },
  {
    grade: "七年级下册",
    subject: "geography",
    subjectName: "地理",
    versions: [
      "人教版",
      "人教版（2024）",
      "湘教版",
      "商务星球版",
      "中图版",
      "粤人版",
      "晋教版",
      "中图版（北京）",
      "仁爱科普版",
      "鲁教版（五四学制）",
    ],
  },
  // ===== 八年级上册 =====
  {
    grade: "八年级上册",
    subject: "biology",
    subjectName: "生物",
    versions: ["人教版", "北师大版", "苏教版", "苏科版", "济南版", "冀少版", "北京版", "鲁科版（五四学制）"],
  },
  {
    grade: "八年级上册",
    subject: "politics",
    subjectName: "道法",
    versions: ["统编版"],
  },
  {
    grade: "八年级上册",
    subject: "history",
    subjectName: "历史",
    versions: ["统编版"],
  },
  {
    grade: "八年级上册",
    subject: "geography",
    subjectName: "地理",
    versions: ["人教版", "湘教版", "商务星球版", "中图版", "粤人版", "晋教版", "中图版（北京）", "仁爱科普版"],
  },
  // ===== 八年级下册 =====
  {
    grade: "八年级下册",
    subject: "biology",
    subjectName: "生物",
    versions: ["人教版", "北师大版", "苏教版", "苏科版", "济南版", "冀少版", "北京版", "鲁科版（五四学制）"],
  },
  {
    grade: "八年级下册",
    subject: "politics",
    subjectName: "道法",
    versions: ["统编版"],
  },
  {
    grade: "八年级下册",
    subject: "history",
    subjectName: "历史",
    versions: ["统编版"],
  },
  {
    grade: "八年级下册",
    subject: "geography",
    subjectName: "地理",
    versions: ["人教版", "湘教版", "商务星球版", "中图版", "粤人版", "晋教版", "中图版（北京）", "仁爱科普版"],
  },
  // ===== 九年级上册 =====
  {
    grade: "九年级上册",
    subject: "biology",
    subjectName: "生物",
    versions: ["人教版", "北师大版", "苏教版", "济南版"],
  },
  {
    grade: "九年级上册",
    subject: "politics",
    subjectName: "道法",
    versions: ["统编版"],
  },
  {
    grade: "九年级上册",
    subject: "history",
    subjectName: "历史",
    versions: ["统编版"],
  },
  // ===== 九年级下册 =====
  {
    grade: "九年级下册",
    subject: "biology",
    subjectName: "生物",
    versions: ["人教版", "北师大版", "苏教版", "济南版"],
  },
  {
    grade: "九年级下册",
    subject: "politics",
    subjectName: "道法",
    versions: ["统编版"],
  },
  {
    grade: "九年级下册",
    subject: "history",
    subjectName: "历史",
    versions: ["统编版"],
  },
];

// 获取某年级所有学科配置
export function getTextbooksByGrade(grade: string): TextbookConfig[] {
  return TEXTBOOKS.filter((t) => t.grade === grade);
}

// 获取某年级某学科配置
export function getTextbook(grade: string, subject: Subject): TextbookConfig | undefined {
  return TEXTBOOKS.find((t) => t.grade === grade && t.subject === subject);
}
