import type { TextbookConfig, Subject, SubjectInfo } from "./types";

export const SUBJECTS: Record<Subject, SubjectInfo> = {
  physics: { key: "physics", name: "物理", shortName: "物", color: "#E83E3E", bgColor: "rgba(232,62,62,0.08)", icon: "⚛️" },
  chemistry: { key: "chemistry", name: "化学", shortName: "化", color: "#22C593", bgColor: "rgba(34,197,147,0.08)", icon: "⚗️" },
  biology: { key: "biology", name: "生物", shortName: "生", color: "#3B82F6", bgColor: "rgba(59,130,246,0.08)", icon: "🧬" },
  history: { key: "history", name: "历史", shortName: "史", color: "#F59E0B", bgColor: "rgba(245,158,11,0.08)", icon: "📖" },
  politics: { key: "politics", name: "道法", shortName: "道", color: "#8B5CF6", bgColor: "rgba(139,92,246,0.08)", icon: "⚖️" },
  geography: { key: "geography", name: "地理", shortName: "地", color: "#10B981", bgColor: "rgba(16,185,129,0.08)", icon: "🌍" },
};

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

export const TEXTBOOKS: TextbookConfig[] = [

  // ===== 六年级上册 =====
  { grade: "六年级上册", subject: "biology", subjectName: "生物", versions: ["人教版（五四制）", "鲁科版（五四学制）", "鲁科版（五四学制）2012"] },
  { grade: "六年级上册", subject: "history", subjectName: "历史", versions: ["统编版（五四学制）", "统编版（五四学制）（2018）"] },
  { grade: "六年级上册", subject: "politics", subjectName: "道法", versions: ["统编版(五四学制)", "统编版(五四学制)（2018）全一册"] },
  { grade: "六年级上册", subject: "geography", subjectName: "地理", versions: ["中华中图版（五四学制）", "人教版（五四学制）（2012）", "沪教版（上海）（2007）", "鲁教版（五四学制）", "鲁教版（五四学制）（2012）"] },

  // ===== 六年级下册 =====
  { grade: "六年级下册", subject: "biology", subjectName: "生物", versions: ["人教版（五四制）", "鲁科版（五四学制）", "鲁科版（五四学制）2012"] },
  { grade: "六年级下册", subject: "history", subjectName: "历史", versions: ["统编版（五四学制）", "统编版（五四学制）（2018）"] },
  { grade: "六年级下册", subject: "politics", subjectName: "道法", versions: ["统编版(五四学制)（2018）全一册", "统编版（五四学制）"] },
  { grade: "六年级下册", subject: "geography", subjectName: "地理", versions: ["中华中图版（五四学制）", "人教版（五四学制）（2012）", "沪教版（上海）（2007）", "鲁教版（五四学制）", "鲁教版（五四学制）（2012）"] },

  // ===== 七年级上册 =====
  { grade: "七年级上册", subject: "biology", subjectName: "生物", versions: ["人教版", "人教版（2012）", "人教版（五四学制）", "冀少版", "冀少版（2012）", "北京版", "北京版（2012）", "北师大版", "北师大版（2012）", "沪教版（五四学制）", "济南版", "济南版（2012）", "苏教版", "苏教版（2012）", "苏科版", "苏科版（2012）", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）"] },
  { grade: "七年级上册", subject: "history", subjectName: "历史", versions: ["统编版", "统编版（2016）", "统编版（五四学制）", "统编版（五四学制）（2018）"] },
  { grade: "七年级上册", subject: "politics", subjectName: "道法", versions: ["中华民族大团结 全一册", "统编版", "统编版（2016）", "统编版（五四学制）全一册", "统编版（五四学制）（2018）全一册"] },
  { grade: "七年级上册", subject: "geography", subjectName: "地理", versions: ["中华中图版（五四学制)", "中图版", "中图版（2012）", "中图版（北京）", "中图版（北京）（2014）", "人教版", "人教版（2012）", "人教版（五四学制）（2012）", "仁爱科普版", "商务星球版", "晋教版", "晋教版（2012）", "沪教版（上海）（2007）", "湘教版", "湘教版（2012）", "粤人版", "粤人版（2012）", "鲁教版（五四学制）", "鲁教版（五四学制）（2012）"] },

  // ===== 七年级下册 =====
  { grade: "七年级下册", subject: "biology", subjectName: "生物", versions: ["人教版", "人教版（2012）", "人教版（五四学制）", "冀少版", "冀少版（2012）", "北京版", "北京版（2012）", "北师大版", "北师大版（2012）", "沪教版（五四学制）", "济南版", "济南版（2012）", "苏教版", "苏教版（2012）", "苏科版", "苏科版（2012）", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）"] },
  { grade: "七年级下册", subject: "history", subjectName: "历史", versions: ["统编版", "统编版（2016）", "统编版（五四学制）", "统编版（五四学制）（2018）"] },
  { grade: "七年级下册", subject: "politics", subjectName: "道法", versions: ["中华民族大团结 全一册", "统编版", "统编版（2016）", "统编版（五四学制）全一册", "统编版（五四学制）（2018）全一册"] },
  { grade: "七年级下册", subject: "geography", subjectName: "地理", versions: ["中华中图版（五四学制）", "中图版", "中图版（2012）", "中图版（北京）", "人教版", "人教版（2012）", "人教版（五四学制）（2012）", "仁爱科普版", "商务星球版", "商务星球版（2012）", "晋教版", "晋教版（2012）", "湘教版", "湘教版（2012）", "粤人版", "粤人版（2012）", "鲁教版（五四学制）", "鲁教版（五四学制）（2012）"] },

  // ===== 八年级上册 =====
  { grade: "八年级上册", subject: "physics", subjectName: "物理", versions: ["人教版", "人教版（2012）", "北师大版", "北师大版（2012）", "北师大版（北京）全一册", "北师大版（北京）（2013）全一册", "教科版", "教科版（2012）", "沪教版（上海）（2007）", "沪科版 全一册", "沪科版(2012) 全一册", "沪科版（五四学制）", "沪粤版", "沪粤版（2012）", "苏科版", "苏科版（2012）", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）"] },
  { grade: "八年级上册", subject: "chemistry", subjectName: "化学", versions: ["人教版（五四学制）全一册", "沪科版（五四学制）全一册", "鲁教版（五四学制）全一册"] },
  { grade: "八年级上册", subject: "biology", subjectName: "生物", versions: ["人教版", "人教版（2012）", "冀少版", "冀少版（2012）", "北京版", "北京版（2012）", "北师大版", "北师大版（2012）", "沪教版（五四学制）", "沪教版（五四学制）（2012）", "济南版", "济南版（2012）", "苏教版", "苏教版（2012）", "苏科版", "苏科版（2012）", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）"] },
  { grade: "八年级上册", subject: "history", subjectName: "历史", versions: ["统编版", "统编版（2016）", "统编版（五四学制）"] },
  { grade: "八年级上册", subject: "politics", subjectName: "道法", versions: ["统编版", "统编版（2016）", "统编版（五四学制）", "统编版（五四学制）（2018）"] },
  { grade: "八年级上册", subject: "geography", subjectName: "地理", versions: ["中图版", "中图版（2012）", "中图版（北京版）", "中图版（北京版）（2014）", "人教版", "人教版（2012）", "仁爱科普版 全一册", "仁爱科普版（2012）", "商务星球版", "商务星球版（2012）", "晋教版", "晋教版（2012）", "湘教版", "湘教版（2012）", "粤人版", "粤人版（2012）"] },

  // ===== 八年级下册 =====
  { grade: "八年级下册", subject: "physics", subjectName: "物理", versions: ["人教版", "人教版（2012）", "北师大版", "北师大版（2012）", "北师大版（北京）全一册", "北师大版（北京）（2013）全一册", "教科版", "教科版（2012）", "沪教版（上海）（2007）", "沪科版 全一册", "沪科版(2012) 全一册", "沪科版（五四学制）", "沪粤版", "沪粤版（2012）", "苏科版", "苏科版（2012）", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）"] },
  { grade: "八年级下册", subject: "chemistry", subjectName: "化学", versions: ["人教版（五四学制）全一册", "沪科版（五四学制）全一册", "鲁教版（五四学制）全一册"] },
  { grade: "八年级下册", subject: "biology", subjectName: "生物", versions: ["人教版", "人教版（2012）", "冀少版", "冀少版（2012）", "北京版", "北京版（2012）", "北师大版", "北师大版（2012）", "沪教版（五四学制）", "沪教版（五四学制）（2012）", "济南版", "济南版（2012）", "苏教版", "苏教版（2012）", "苏科版", "苏科版（2012）", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）"] },
  { grade: "八年级下册", subject: "history", subjectName: "历史", versions: ["统编版", "统编版（2016）", "统编版（五四学制）"] },
  { grade: "八年级下册", subject: "politics", subjectName: "道法", versions: ["统编版", "统编版（2016）", "统编版（五四学制）", "统编版（五四学制）（2018）"] },
  { grade: "八年级下册", subject: "geography", subjectName: "地理", versions: ["中图版", "中图版（2012）", "中图版（北京版）", "中图版（北京版）（2014）", "人教版", "人教版（2012）", "仁爱科普版 全一册", "仁爱科普版（2012）", "商务星球版", "商务星球版（2012）", "晋教版", "晋教版（2012）", "湘教版", "湘教版（2012）", "粤人版", "粤人版（2012）"] },

  // ===== 九年级上册 =====
  { grade: "九年级上册", subject: "physics", subjectName: "物理", versions: ["人教版 全一册", "人教版（2012）全一册", "北师大版 全一册", "北师大版（2012）全一册", "北师大版（北京）全一册", "北师大版（北京）（2013）全一册", "教科版 全一册", "教科版（2012）", "沪教版（上海）2007", "沪科版 全一册", "沪科版（2012）全一册", "沪科版（五四学制）", "沪粤版", "沪粤版（2012）", "苏科版", "苏科版（2012）", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）"] },
  { grade: "九年级上册", subject: "chemistry", subjectName: "化学", versions: ["人教版", "人教版（五四学制）全一册", "仁爱科普版", "北京版", "沪教版", "沪科版（五四学制）全一册", "科粤版", "鲁教版", "鲁教版（五四学制）全一册"] },
  { grade: "九年级上册", subject: "history", subjectName: "历史", versions: ["统编版", "统编版（2016）"] },
  { grade: "九年级上册", subject: "politics", subjectName: "道法", versions: ["统编版", "统编版（2016）", "统编版（五四学制）（2018）"] },

  // ===== 九年级下册 =====
  { grade: "九年级下册", subject: "physics", subjectName: "物理", versions: ["人教版 全一册", "人教版（2012）全一册", "北师大版 全一册", "北师大版（2012）全一册", "北师大版（北京）全一册", "北师大版（北京）（2013）全一册", "教科版 全一册", "教科版", "教科版（2012）", "沪教版（上海）（2007）", "沪科版 全一册", "沪科版（2012）全一册", "沪科版（五四学制）", "沪粤版", "沪粤版（2012）", "苏科版", "苏科版（2012）", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）"] },
  { grade: "九年级下册", subject: "chemistry", subjectName: "化学", versions: ["人教版", "人教版（五四学制）全一册", "仁爱科普版", "北京版", "沪教版", "沪科版（五四学制）全一册", "科粤版", "鲁教版", "鲁教版（五四学制）全一册"] },
  { grade: "九年级下册", subject: "history", subjectName: "历史", versions: ["统编版", "统编版（2016）"] },
  { grade: "九年级下册", subject: "politics", subjectName: "道法", versions: ["统编版", "统编版（2016）", "统编版（五四学制）（2018）"] },
];

export function getTextbooksByGrade(grade: string): TextbookConfig[] {
  return TEXTBOOKS.filter((t) => t.grade === grade);
}

export function getTextbook(grade: string, subject: Subject): TextbookConfig | undefined {
  return TEXTBOOKS.find((t) => t.grade === grade && t.subject === subject);
}
