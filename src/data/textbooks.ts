import type { TextbookConfig } from "./types";

export const TEXTBOOKS: TextbookConfig[] = [

  // ===== 六年级上册 =====
  { grade: "六年级上册", subject: "biology", subjectName: "生物", versions: ["鲁科版（五四学制）", "鲁科版（五四学制）2012", "人教版（五四制）"] },
  { grade: "六年级上册", subject: "history", subjectName: "历史", versions: ["统编版（五四学制）", "统编版（五四学制）（2018）"] },
  { grade: "六年级上册", subject: "politics", subjectName: "道法", versions: ["统编版(五四学制)", "统编版(五四学制)（2018）全一册"] },
  { grade: "六年级上册", subject: "geography", subjectName: "地理", versions: ["沪教版（上海）（2007）", "鲁教版（五四学制）", "鲁教版（五四学制）（2012）", "人教版（五四学制）（2012）", "中华中图版（五四学制）"] },

  // ===== 六年级下册 =====
  { grade: "六年级下册", subject: "biology", subjectName: "生物", versions: ["鲁科版（五四学制）", "鲁科版（五四学制）2012", "人教版（五四制）"] },
  { grade: "六年级下册", subject: "history", subjectName: "历史", versions: ["统编版（五四学制）", "统编版（五四学制）（2018）"] },
  { grade: "六年级下册", subject: "politics", subjectName: "道法", versions: ["统编版（五四学制）", "统编版(五四学制)（2018）全一册"] },
  { grade: "六年级下册", subject: "geography", subjectName: "地理", versions: ["沪教版（上海）（2007）", "鲁教版（五四学制）", "鲁教版（五四学制）（2012）", "人教版（五四学制）（2012）", "中华中图版（五四学制）"] },

  // ===== 七年级上册 =====
  { grade: "七年级上册", subject: "biology", subjectName: "生物", versions: ["北京版（2012）", "北师大版（2012）", "沪教版（五四学制）", "济南版（2012）", "冀少版（2012）", "鲁科版（五四学制）（2012）", "人教版（2012）", "人教版（五四学制）", "苏教版（2012）", "苏科版（2012）"] },
  { grade: "七年级上册", subject: "history", subjectName: "历史", versions: ["统编版（2016）"] },
  { grade: "七年级上册", subject: "politics", subjectName: "道法", versions: ["统编版（2016）", "统编版（五四学制）（2018）全一册", "统编版（五四学制）全一册", "中华民族大团结 全一册"] },
  { grade: "七年级上册", subject: "geography", subjectName: "地理", versions: ["沪教版（上海）（2007）", "晋教版（2012）", "鲁教版（五四学制）（2012）", "人教版（2012）", "人教版（五四学制）（2012）", "湘教版（2012）", "粤人版（2012）", "中华中图版（五四学制)", "中图版（2012）", "中图版（北京）（2014）"] },

  // ===== 七年级下册 =====
  { grade: "七年级下册", subject: "biology", subjectName: "生物", versions: ["北京版（2012）", "北师大版（2012）", "沪教版（五四学制）", "济南版（2012）", "冀少版（2012）", "鲁科版（五四学制）2012", "人教版（2012）", "人教版（五四学制）", "苏教版（2012）", "苏科版（2012）"] },
  { grade: "七年级下册", subject: "history", subjectName: "历史", versions: ["统编版（2016）", "统编版（五四学制）（2018）"] },
  { grade: "七年级下册", subject: "politics", subjectName: "道法", versions: ["统编版（2016）", "统编版（五四学制）（2018）全一册", "统编版（五四学制）全一册", "中华民族大团结 全一册"] },
  { grade: "七年级下册", subject: "geography", subjectName: "地理", versions: ["晋教版（2012）", "鲁教版（五四学制）（2012）", "人教版（2012）", "人教版（五四学制）（2012）", "商务星球版（2012）", "湘教版（2012）", "粤人版（2012）", "中华中图版（五四学制）", "中图版（2012）"] },

  // ===== 八年级上册 =====
  { grade: "八年级上册", subject: "physics", subjectName: "物理", versions: ["北师大版", "北师大版（2012）", "北师大版（北京）（2013）全一册", "北师大版（北京）全一册", "沪教版（上海）（2007）", "沪科版 全一册", "沪科版(2012) 全一册", "沪科版（五四学制）", "教科版", "教科版（2012）", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）", "人教版", "人教版（2012）", "苏科版", "苏科版（2012）"] },
  { grade: "八年级上册", subject: "chemistry", subjectName: "化学", versions: ["沪科版（五四学制）全一册", "鲁教版（五四学制）全一册", "人教版（五四学制）全一册"] },
  { grade: "八年级上册", subject: "biology", subjectName: "生物", versions: ["北京版（2012）", "北师大版（2012）", "沪教版（五四学制）", "沪教版（五四学制）（2012）", "济南版（2012）", "冀少版（2012）", "鲁科版（五四学制）（2012）", "人教版（2012）", "苏教版（2012）", "苏科版（2012）"] },
  { grade: "八年级上册", subject: "politics", subjectName: "道法", versions: ["统编版（2016）", "统编版（五四学制）（2018）"] },
  { grade: "八年级上册", subject: "geography", subjectName: "地理", versions: ["晋教版（2012）", "人教版（2012）", "仁爱科普版 全一册", "仁爱科普版（2012）", "商务星球版（2012）", "湘教版（2012）", "粤人版（2012）", "中图版（2012）", "中图版（北京版）", "中图版（北京版）（2014）"] },

  // ===== 八年级下册 =====
  { grade: "八年级下册", subject: "physics", subjectName: "物理", versions: ["北师大版（2012）", "北师大版（北京）（2013）全一册", "北师大版（北京）全一册", "沪科版 全一册", "沪科版(2012) 全一册", "沪科版（五四学制）", "沪粤版（2012）", "教科版（2012）", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）", "苏科版（2012）"] },
  { grade: "八年级下册", subject: "chemistry", subjectName: "化学", versions: ["沪科版（五四学制）全一册", "鲁教版（五四学制）全一册", "人教版（五四学制）全一册"] },
  { grade: "八年级下册", subject: "biology", subjectName: "生物", versions: ["北京版（2012）", "北师大版（2012）", "沪教版（五四学制）", "沪教版（五四学制）（2012）", "济南版（2012）", "冀少版（2012）", "鲁科版（五四学制）（2012）", "人教版（2012）", "苏教版（2012）", "苏科版（2012）"] },
  { grade: "八年级下册", subject: "history", subjectName: "历史", versions: ["统编版（2016）"] },
  { grade: "八年级下册", subject: "politics", subjectName: "道法", versions: ["统编版（2016）", "统编版（五四学制）2018"] },
  { grade: "八年级下册", subject: "geography", subjectName: "地理", versions: ["晋教版（2012）", "人教版（2012）", "仁爱科普版 全一册", "仁爱科普版（2012）", "商务星球版（2012）", "湘教版（2012）", "粤人版（2012）", "中图版（2012）", "中图版（北京版）"] },

  // ===== 九年级上册 =====
  { grade: "九年级上册", subject: "physics", subjectName: "物理", versions: ["北师大版 全一册", "北师大版（2012）全一册", "北师大版（北京）（2013）全一册", "北师大版（北京）全一册", "沪科版 全一册", "沪科版（2012）全一册", "沪粤版", "沪粤版（2012）", "教科版 全一册", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）", "人教版 全一册", "人教版（2012）全一册", "苏科版", "苏科版（2012）"] },
  { grade: "九年级上册", subject: "chemistry", subjectName: "化学", versions: ["北京版", "沪教版", "沪科版（五四学制）全一册", "科粤版", "鲁教版", "鲁教版（五四学制）全一册", "人教版", "人教版（五四学制）全一册", "仁爱科普版"] },
  { grade: "九年级上册", subject: "history", subjectName: "历史", versions: ["统编版（2016）"] },
  { grade: "九年级上册", subject: "politics", subjectName: "道法", versions: ["统编版（2016）", "统编版（五四学制）（2018）"] },

  // ===== 九年级下册 =====
  { grade: "九年级下册", subject: "physics", subjectName: "物理", versions: ["北师大版 全一册", "北师大版（2012）全一册", "北师大版（北京）（2013）全一册", "北师大版（北京）全一册", "沪教版（上海）（2007）", "沪科版 全一册", "沪科版（2012）全一册", "沪科版（五四学制）", "沪粤版", "沪粤版（2012）", "教科版", "教科版 全一册", "鲁科版（五四学制）", "鲁科版（五四学制）（2012）", "人教版 全一册", "人教版（2012）全一册", "苏科版", "苏科版（2012）", "科教版（2012）"] },
  { grade: "九年级下册", subject: "chemistry", subjectName: "化学", versions: ["北京版", "沪教版", "沪科版（五四学制）全一册", "科粤版", "鲁教版", "鲁教版（五四学制）全一册", "人教版", "人教版（五四学制）全一册", "仁爱科普版"] },
  { grade: "九年级下册", subject: "history", subjectName: "历史", versions: ["统编版（2016）"] },
  { grade: "九年级下册", subject: "politics", subjectName: "道法", versions: ["统编版（2016）", "统编版（五四学制）（2018）"] },
];

export function getTextbooksByGrade(grade: string): TextbookConfig[] {
  return TEXTBOOKS.filter((t) => t.grade === grade);
}

export function getTextbook(grade: string, subject: Subject): TextbookConfig | undefined {
  return TEXTBOOKS.find((t) => t.grade === grade && t.subject === subject);
}
