import type { Subject } from "./types";

// 课时
export interface Lesson {
  id: string;
  title: string;
}

// 章节
export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

// 学期+学科 → 章节列表
export type ChapterMap = Record<string, Chapter[]>; // key: `${grade}|${subject}`

// 通用章节生成器：每个学科每学期 4-6 章，每章 3-5 课时
function buildChapters(
  grade: string,
  subject: Subject,
  chapterTitles: string[],
  lessonsPerChapter: number = 4,
  // 可选：自定义每章每课时的标题。外层=章，内层=课时
  lessonsTitles?: string[][],
): Chapter[] {
  const subjectPrefix = subject.slice(0, 2);
  return chapterTitles.map((title, ci) => {
    const chapterId = `${subjectPrefix}-${grade}-${ci + 1}`;
    const customLessons = lessonsTitles?.[ci];
    const lessons: Lesson[] = Array.from({ length: lessonsPerChapter }, (_, li) => ({
      id: `${chapterId}-L${li + 1}`,
      title: customLessons?.[li] || `第${li + 1}课时`,
    }));
    return { id: chapterId, title, lessons };
  });
}

// 各学科各学期的章节标题（参考人教版/统编版目录结构）
const CHAPTER_TITLES: Record<Subject, Record<string, string[]>> = {
  biology: {
    "六年级上册": [
      "第一单元 生物和生物圈",
      "第二单元 了解生物圈",
    ],
    "六年级下册": [
      "第三单元 生物圈中的绿色植物",
      "第四单元 生物圈中的人",
    ],
    "七年级上册": [
      "第一单元 生物和生物圈",
      "第二单元 了解生物圈",
      "第三单元 生物圈中的绿色植物",
    ],
    "七年级下册": [
      "第四单元 生物圈中的人",
      "第五单元 生物圈中的其他生物",
    ],
    "八年级上册": [
      "第五单元 生物圈中的其他生物",
      "第六单元 动物的运动和行为",
    ],
    "八年级下册": [
      "第七单元 生物圈中生命的延续和发展",
      "第八单元 健康地生活",
    ],
    "九年级上册": ["综合复习一", "综合复习二"],
    "九年级下册": ["中考冲刺一", "中考冲刺二"],
  },
  politics: {
    "六年级上册": [
      "第一单元 走进中学",
      "第二单元 认识新自我",
    ],
    "六年级下册": [
      "第一单元 青春时光",
      "第二单元 情绪与情感",
    ],
    "七年级上册": [
      "第一单元 少年有梦",
      "第二单元 友谊的天空",
      "第三单元 师长情谊",
    ],
    "七年级下册": [
      "第一单元 青春时光",
      "第二单元 做情绪情感的主人",
      "第三单元 在集体中成长",
    ],
    "八年级上册": [
      "第一单元 走进社会生活",
      "第二单元 遵守社会规则",
      "第三单元 勇担社会责任",
    ],
    "八年级下册": [
      "第一单元 坚持宪法至上",
      "第二单元 理解权利义务",
      "第三单元 人民当家作主",
    ],
    "九年级上册": [
      "第一单元 富强与创新",
      "第二单元 民主与法治",
      "第三单元 文明与发展",
    ],
    "九年级下册": [
      "第一单元 我们共同的世界",
      "第二单元 世界舞台上的中国",
    ],
  },
  history: {
    "六年级上册": [
      "第一单元 史前时期",
      "第二单元 夏商周时期",
    ],
    "六年级下册": [
      "第一单元 秦汉时期",
      "第二单元 三国两晋南北朝",
    ],
    "七年级上册": [
      "第一单元 史前时期：中国境内人类的活动",
      "第二单元 夏商周时期：早期国家与社会变革",
      "第三单元 秦汉时期",
    ],
    "七年级下册": [
      "第一单元 隋唐时期",
      "第二单元 辽宋夏金元时期",
      "第三单元 明清时期",
    ],
    "八年级上册": [
      "第一单元 中国开始沦为半殖民地半封建社会",
      "第二单元 近代化的早期探索与民族危机的加剧",
      "第三单元 新民主主义革命的开始",
    ],
    "八年级下册": [
      "第一单元 中华人民共和国的成立和巩固",
      "第二单元 社会主义制度的建立与社会主义建设的探索",
      "第三单元 中国特色社会主义道路",
    ],
    "九年级上册": [
      "第一单元 古代亚非文明",
      "第二单元 封建时代的欧洲",
      "第三单元 走向近代",
    ],
    "九年级下册": [
      "第一单元 殖民地人民的反抗与资本主义制度的扩展",
      "第二单元 第二次工业革命和近代科学文化",
      "第三单元 第一次世界大战和战后初期的世界",
    ],
  },
  geography: {
    "六年级上册": [
      "第一章 地球和地图",
      "第二章 陆地和海洋",
    ],
    "六年级下册": [
      "第三章 天气与气候",
      "第四章 居民与聚落",
    ],
    "七年级上册": [
      "第一章 地球和地图",
      "第二章 陆地和海洋",
      "第三章 天气与气候",
    ],
    "七年级下册": [
      "第六章 我们生活的大洲——亚洲",
      "第七章 我们邻近的地区和国家",
      "第八章 东半球其他的地区和国家",
    ],
    "八年级上册": [
      "第一章 从世界看中国",
      "第二章 中国的自然环境",
      "第三章 中国的自然资源",
    ],
    "八年级下册": [
      "第五章 中国的地理差异",
      "第六章 北方地区",
      "第七章 南方地区",
    ],
    "九年级上册": ["区域地理复习", "中国地理复习"],
    "九年级下册": ["中考地理冲刺一", "中考地理冲刺二"],
  },
};

// 自定义课时标题映射：key = `${grade}|${subject}`，value = 二维数组（外层=章，内层=课时标题）
// 不配置的章节/课时将使用默认 "第N课时"
const LESSONS_TITLES: Record<string, string[][]> = {
  // 道德与法治 · 七年级上册 · 第一单元 少年有梦
  "七年级上册|politics": [
    // 第一单元 少年有梦（4 课时）
    [
      "第1课时 奏响中学序曲",
      "第2课时 规划初中生活",
      "第3课时 少年当有梦",
      "第4课时 学习新天地",
    ],
    // 第二单元 友谊的天空（默认 4 课时）
    [],
    // 第三单元 师长情谊（默认 4 课时）
    [],
  ],
};

// 构建完整章节 map
function buildAllChapters(): ChapterMap {
  const map: ChapterMap = {};
  const grades = [
    "六年级上册", "六年级下册",
    "七年级上册", "七年级下册",
    "八年级上册", "八年级下册",
    "九年级上册", "九年级下册",
  ];
  const subjects: Subject[] = ["biology", "politics", "history", "geography"];
  grades.forEach((grade) => {
    subjects.forEach((subject) => {
      const titles = CHAPTER_TITLES[subject]?.[grade];
      if (!titles) return;
      const key = `${grade}|${subject}`;
      const customLessons = LESSONS_TITLES[key];
      map[key] = buildChapters(grade, subject, titles, 4, customLessons);
    });
  });
  return map;
}

export const CHAPTERS: ChapterMap = buildAllChapters();

// 获取某学期某学科的章节
export function getChapters(grade: string, subject: Subject): Chapter[] {
  return CHAPTERS[`${grade}|${subject}`] || [];
}
