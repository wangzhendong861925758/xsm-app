import type { Question, QuestionType, Subject } from "@/data/types";

/** 上传上下文：拆出的每道题都会带上这些字段 */
export interface UploadContext {
  subject: Subject;
  grade: string;
  version: string;
  chapter?: string;  // 单元标题
  section?: string;  // 课时标题
}

export interface ParseResult {
  questions: Question[];
  errors: string[]; // 拆解失败的题块提示
}

/** 读取 .docx 文件为纯文本（动态导入 mammoth，避免进主 bundle） */
export async function readDocx(file: File): Promise<string> {
  const { default: mammoth } = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/** 题号正则：行首 数字 + 点 */
const NUM_PREFIX = /^\s*(\d+)\s*[.．、]/;

/** 大题题号正则：行首 数字 + 点 + 问： */
const ESSAY_QUESTION_PREFIX = /^\s*\d+\s*[.．、]\s*问\s*[:：]/;

/**
 * 选择判断题：按"答案："行切题。
 * 每道选择判断题必有"答案："行，以它为分界不会被子序号干扰。
 * 答案后的"解析："行归入当前题块，之后第一个非空行开始下一题。
 */
function splitChoiceByAnswer(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let current: string[] = [];
  let foundAnswer = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (ANSWER_LABEL.test(trimmed)) {
      current.push(line);
      foundAnswer = true;
      continue;
    }

    // 答案后的"解析："行归入当前题块
    if (foundAnswer && ANALYSIS_LABEL.test(trimmed)) {
      current.push(line);
      continue;
    }

    // 已找到答案且当前行非空非解析 → 下一题开始
    if (foundAnswer && trimmed !== "") {
      blocks.push(current.join("\n"));
      current = [line];
      foundAnswer = false;
      continue;
    }

    // 跳过纯空行开头的噪声
    if (current.length === 0 && trimmed === "") continue;
    current.push(line);
  }

  if (current.length > 0 && current.some((l) => l.trim())) {
    blocks.push(current.join("\n"));
  }
  return blocks;
}

/**
 * 大题：按"N.问："行切题。
 * 用户指定大题格式为"1.问：题干 / 答：答案"，以"N.问："为分界，
 * 答案中的子序号不会误判为新题。
 */
function splitEssayByQuestion(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (ESSAY_QUESTION_PREFIX.test(line)) {
      if (current.length > 0) blocks.push(current.join("\n"));
      current = [line];
    } else {
      if (current.length === 0 && line.trim() === "") continue;
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current.join("\n"));
  return blocks;
}

/** 选项行正则：A、 A. A， A） 等 */
const OPTION_LINE = /^\s*([A-Da-d])\s*[、.．,，)）]\s*(.*)$/;

/** 解析答案字段：答案：xxx 或 答案:xxx */
const ANSWER_LABEL = /^\s*答案\s*[:：]\s*(.*)$/;

/** 解析字段：解析：xxx */
const ANALYSIS_LABEL = /^\s*解析\s*[:：]\s*(.*)$/;

/**
 * 拆解选择判断题。
 * 格式：
 *   1.题干
 *   A、选项A
 *   B、选项B
 *   C、选项C
 *   D、选项D
 *   答案：A
 *   解析：xxx（可选）
 */
function parseChoiceBlock(block: string, ctx: UploadContext, idx: number): Question | null {
  const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  const stemParts: string[] = [];
  const options: string[] = [];
  let answer = "";
  let analysis = "";

  for (const line of lines) {
    // 跳过题号行前缀，并入题干
    const numMatch = line.match(NUM_PREFIX);
    const optMatch = line.match(OPTION_LINE);
    const ansMatch = line.match(ANSWER_LABEL);
    const anaMatch = line.match(ANALYSIS_LABEL);

    if (ansMatch) {
      answer = ansMatch[1].trim();
    } else if (anaMatch) {
      analysis = anaMatch[1].trim();
    } else if (optMatch) {
      options.push(optMatch[2].trim());
    } else {
      // 题干行（去掉行首题号）
      stemParts.push(numMatch ? line.replace(NUM_PREFIX, "").trim() : line);
    }
  }

  const stem = stemParts.join(" ").trim();
  if (!stem || options.length === 0) return null;

  // 推断题型
  let type: QuestionType;
  const ansLetters = answer.toUpperCase().replace(/[^A-D]/g, "");
  if (options.length === 2) {
    type = "judge";
  } else if (ansLetters.length >= 2) {
    type = "multiple";
  } else {
    type = "single";
  }

  // 多选答案标准化为字母数组
  let finalAnswer: string | string[] = answer;
  if (type === "multiple" && ansLetters.length >= 2) {
    finalAnswer = ansLetters.split("");
  }

  return {
    id: `q${Date.now()}_${idx}`,
    subject: ctx.subject,
    grade: ctx.grade,
    version: ctx.version,
    type,
    stem,
    options,
    answer: finalAnswer,
    analysis,
    mastered: false,
    collected: false,
    chapter: ctx.chapter,
    section: ctx.section,
  };
}

/**
 * 拆解大题。
 * 格式：
 *   1.问：题干内容
 *   答：答案内容
 */
function parseEssayBlock(block: string, ctx: UploadContext, idx: number): Question | null {
  const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  let stem = "";
  let answer = "";

  for (const line of lines) {
    const numMatch = line.match(NUM_PREFIX);
    const cleaned = numMatch ? line.replace(NUM_PREFIX, "").trim() : line;

    if (/^问\s*[:：]\s*/.test(cleaned)) {
      stem += (stem ? " " : "") + cleaned.replace(/^问\s*[:：]\s*/, "").trim();
    } else if (/^答\s*[:：]\s*/.test(cleaned)) {
      answer += (answer ? "\n" : "") + cleaned.replace(/^答\s*[:：]\s*/, "").trim();
    } else if (!answer) {
      // 答案出现前的内容并入题干
      stem += (stem ? " " : "") + cleaned;
    } else {
      answer += "\n" + cleaned;
    }
  }

  if (!stem || !answer) return null;

  return {
    id: `q${Date.now()}_${idx}`,
    subject: ctx.subject,
    grade: ctx.grade,
    version: ctx.version,
    type: "essay",
    stem,
    options: [],
    answer,
    analysis: "",
    mastered: false,
    collected: false,
    chapter: ctx.chapter,
    section: ctx.section,
  };
}

/**
 * 主入口：解析 .docx 并拆解题目。
 * @param file .docx 文件
 * @param ctx 上传上下文（学段/学科/版本/单元/课时）
 * @param mode 题型：choice=选择判断题，essay=大题
 */
export async function parseDocxToQuestions(
  file: File,
  ctx: UploadContext,
  mode: "choice" | "essay",
): Promise<ParseResult> {
  const text = await readDocx(file);
  // 选择判断题按"答案："行切分，大题按"N.问："行切分，避免子序号干扰
  const blocks = mode === "choice" ? splitChoiceByAnswer(text) : splitEssayByQuestion(text);
  const questions: Question[] = [];
  const errors: string[] = [];

  blocks.forEach((block, i) => {
    const q = mode === "choice" ? parseChoiceBlock(block, ctx, i) : parseEssayBlock(block, ctx, i);
    if (q) {
      questions.push(q);
    } else {
      errors.push(`第 ${i + 1} 题块拆解失败，请检查格式`);
    }
  });

  return { questions, errors };
}
