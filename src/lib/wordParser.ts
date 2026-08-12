import type { Question, QuestionType, Subject } from "@/data/types";

/** 上传上下文：拆出的每道题都会带上这些字段 */
export interface UploadContext {
  subject: Subject;
  grade: string;
  version: string;
  chapter?: string;
  section?: string;
}

export interface ParseResult {
  questions: Question[];
  errors: string[];
}

/** 读取 .docx 文件为纯文本（动态导入 mammoth，避免进主 bundle） */
export async function readDocx(file: File): Promise<string> {
  const { default: mammoth } = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/** 题号行首正则：行首数字 + 点/全角点/顿号 */
const NUM_PREFIX = /^\s*(\d+)\s*[.．、]\s*/;

/** 大题题号：数字+点+问： */
const ESSAY_QUESTION_PREFIX = /^\s*\d+\s*[.．、]\s*问\s*[:：]/;

/**
 * 选择判断题：按「行首题号」切分，但只保留含「答案」标签的题块。
 * 这样大标题（如"第一部分：选择题（共100道）"）不会被误收。
 * 支持答案出现在行内（如"D．机器人答案：C"）。
 */
export function splitChoiceByAnswer(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 遇到新题号行 → 结算上一块
    if (NUM_PREFIX.test(trimmed)) {
      if (current.length > 0 && containsAnswer(current)) {
        blocks.push(current.join("\n"));
      }
      current = [line];
    } else {
      if (current.length === 0 && trimmed === "") continue;
      current.push(line);
    }
  }
  if (current.length > 0 && containsAnswer(current)) {
    blocks.push(current.join("\n"));
  }
  return blocks;
}

/** 题块中是否包含「答案」标签（支持行内和独立行） */
function containsAnswer(lines: string[]): boolean {
  return lines.some((l) => /答案\s*[:：]/.test(l));
}

/**
 * 大题：按"N.问："行切分。
 */
export function splitEssayByQuestion(text: string): string[] {
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

/**
 * 从文本中提取「答案：xxx」。支持多种答案格式：
 *   选择题：答案：A / 答案：ABC
 *   判断题：答案：√ / 答案：× / 答案：✓ / 答案：对 / 答案：错 / 答案：正确 / 答案：错误
 * 返回 { answer, beforeAnswer, afterAnswer }
 * - answer: 标准化结果，选择题为 "A"/"B"等，判断题为 "A"(正确)/"B"(错误)
 */
function extractAnswer(fullText: string): { answer: string; isJudge: boolean; beforeAnswer: string; afterAnswer: string } {
  const ansIdx = fullText.search(/答案\s*[:：]\s*/);
  if (ansIdx === -1) return { answer: "", isJudge: false, beforeAnswer: fullText, afterAnswer: "" };
  const before = fullText.slice(0, ansIdx);
  const after = fullText.slice(ansIdx);

  // 先尝试匹配判断题答案：√/×/✓/✗/对/错/正确/错误
  const judgeMatch = after.match(/答案\s*[:：]\s*([√×✓✗对错]|正确|错误|T|F|true|false|TRUE|FALSE)/);
  if (judgeMatch) {
    const raw = judgeMatch[1];
    const isCorrect = /^[√✓对正Tt]|^正确$|^true$|^TRUE$/.test(raw);
    const answer = isCorrect ? "A" : "B";
    const rest = after.replace(/答案\s*[:：]\s*([√×✓✗对错]|正确|错误|T|F|true|false|TRUE|FALSE)\s*/, "");
    return { answer, isJudge: true, beforeAnswer: before, afterAnswer: rest };
  }

  // 选择题：取 A-D 字母
  const m = after.match(/答案\s*[:：]\s*([A-Da-d]+)/);
  const answer = m ? m[1].toUpperCase() : "";
  const rest = after.replace(/答案\s*[:：]\s*[A-Da-d]+\s*/, "");
  return { answer, isJudge: false, beforeAnswer: before, afterAnswer: rest };
}

/**
 * 从文本中提取选项：支持选项独立行（A．xxx）或与题干同行（A．xxx B．xxx）。
 * 选项符号兼容：半角点 . 、全角点 ．、顿号 、、逗号 ，,、括号 ）)。
 */
function extractOptions(text: string): { stem: string; options: string[] } {
  // 选项起始标记：A 或 a 后跟各种分隔符
  // 使用一个全局匹配，找到所有 A. B. C. D. 的位置
  const optPattern = /(^|\s)([A-Da-d])\s*[.．、,，)）]\s*/g;

  // 找所有选项匹配位置
  const matches: { letter: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = optPattern.exec(text)) !== null) {
    matches.push({
      letter: m[2].toUpperCase(),
      start: m.index + m[1].length, // 跳过前导空白
      end: m.index + m[0].length,
    });
  }

  if (matches.length === 0) {
    return { stem: text.trim(), options: [] };
  }

  // 过滤掉非选项匹配：真正的选项应该是 A/B/C/D 连续或接近的
  // 取第一次出现的 A（或 B 起头的也行）开始的连续 A-D 序列
  // 实际题目的选项一定从 A 或 B（判断）开始
  const validOptions: { letter: string; start: number; end: number; text: string }[] = [];

  // 找到第一个疑似选项起点（字母在 A-D 范围内）
  let firstValidIdx = 0;
  for (let i = 0; i < matches.length; i++) {
    if (["A", "B", "C", "D"].includes(matches[i].letter)) {
      firstValidIdx = i;
      break;
    }
  }

  // 从 firstValidIdx 开始，按字母顺序收集
  let expectedLetter = matches[firstValidIdx].letter;
  for (let i = firstValidIdx; i < matches.length; i++) {
    if (matches[i].letter === expectedLetter) {
      // 计算选项文本：从当前 end 到下一个 option start（或文本末尾）
      const nextStart = i + 1 < matches.length ? matches[i + 1].start : text.length;
      const optText = text.slice(matches[i].end, nextStart).trim();
      // 去掉末尾可能跟的"答案："标签
      const optTextClean = optText.replace(/答案\s*[:：].*$/, "").trim();
      if (optTextClean) {
        validOptions.push({ ...matches[i], text: optTextClean });
      }
      // 下一个期望字母
      const nextCharCode = expectedLetter.charCodeAt(0) + 1;
      expectedLetter = String.fromCharCode(nextCharCode);
      if (expectedLetter > "D") break;
    }
  }

  if (validOptions.length === 0) {
    return { stem: text.trim(), options: [] };
  }

  // 题干 = 第一个选项开始位置之前的文本
  const stem = text.slice(0, validOptions[0].start).replace(NUM_PREFIX, "").trim();
  const options = validOptions.map((o) => o.text);

  return { stem, options };
}

/**
 * 拆解选择判断题。支持三种格式：
 *   格式1（选择题选项独立行）：
 *     1. 题干
 *     A．选项A
 *     B．选项B
 *     答案：A
 *   格式2（选项与答案挤在同行）：
 *     1. 题干（ ）A．选项A B．选项B C．选项C D．选项D答案：C
 *   格式3（判断题，无选项）：
 *     102. 病毒是生物，但没有细胞结构。（ ）
 *     答案：√
 *   支持题干跨行、全角点选项、行内答案。
 */
function parseChoiceBlock(block: string, ctx: UploadContext, idx: number): Question | null {
  const rawLines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const fullText = rawLines.join(" ");

  // 提取答案（支持 √/×/对/错/A-D）
  const { answer, isJudge, beforeAnswer, afterAnswer } = extractAnswer(fullText);
  if (!answer) return null;

  // 提取解析（在答案后找「解析：xxx」，支持括号包裹形式：（解析：xxx））
  let analysis = "";
  const anaMatch = afterAnswer.match(/解析\s*[:：]\s*(.*?)(?:[）)]\s*$|$)/);
  if (anaMatch) analysis = anaMatch[1].replace(/[）)]\s*$/, "").trim();

  // 在答案之前的文本中提取题干和选项
  let { stem, options } = extractOptions(beforeAnswer);

  // 判断题：明确识别到√/×/对/错等判断题答案，或者选项只有2个且是A.正确/B.错误形式
  let type: QuestionType;
  if (isJudge) {
    type = "judge";
    options = ["正确", "错误"];
    // 题干去掉题号前缀和末尾的括号（判断题常见"（  ）"）
    stem = beforeAnswer.replace(NUM_PREFIX, "").trim().replace(/[（(]\s*[）)]\s*$/, "").trim();
  } else if (options.length === 2 && 
             (/正确/.test(options[0]) && /错误/.test(options[1]) || 
              /对/.test(options[0]) && /错/.test(options[1]))) {
    type = "judge";
  } else if (options.length < 2) {
    // 选项提取失败，无法确定题型
    return null;
  } else if (answer.length >= 2) {
    type = "multiple";
  } else {
    type = "single";
  }

  if (!stem) return null;

  let finalAnswer: string | string[] = answer;
  if (type === "multiple" && answer.length >= 2) {
    finalAnswer = answer.split("");
  }

  return {
    id: `q_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
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
 * 支持多行题干和多行答案。
 */
function parseEssayBlock(block: string, ctx: UploadContext, idx: number): Question | null {
  const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  let stem = "";
  let answer = "";
  let inAnswer = false;

  for (const line of lines) {
    const numMatch = line.match(NUM_PREFIX);
    const cleaned = numMatch ? line.replace(NUM_PREFIX, "").trim() : line;

    if (/^问\s*[:：]\s*/.test(cleaned)) {
      stem += (stem ? " " : "") + cleaned.replace(/^问\s*[:：]\s*/, "").trim();
    } else if (/^答\s*[:：]\s*/.test(cleaned)) {
      inAnswer = true;
      answer += (answer ? "\n" : "") + cleaned.replace(/^答\s*[:：]\s*/, "").trim();
    } else if (inAnswer) {
      answer += "\n" + cleaned;
    } else {
      // 「问：」标签出现前的内容也并入题干（有的题目可能没有"问："前缀）
      stem += (stem ? " " : "") + cleaned;
    }
  }

  if (!stem || !answer) return null;

  return {
    id: `q_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
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
 */
export async function parseDocxToQuestions(
  file: File,
  ctx: UploadContext,
  mode: "choice" | "essay",
): Promise<ParseResult> {
  const text = await readDocx(file);
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
