// Word题目解析器 v4 - 修复切分逻辑
// 真实文件格式：用 "1. 2. 3." 作题号，不是 "第X题"
// 选择判断.docx：1. 题干（ ）A. 选项 B. 选项 C. 选项 D. 选项答案：X
// 大题.docx：1. 题干 答案：xxx  或  1. 问：题干 答：xxx
import mammoth from 'mammoth';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import crypto from 'crypto';

const ROOT = 'd:/小四门软件/试题/试题';
const OUT_DIR = 'd:/小四门软件/public/data/questions';
const FAIL_LOG = 'd:/小四门软件/scripts/failed-files.txt';

function cleanText(s) {
  return s.replace(/\u00a0/g, ' ')
    .replace(/\u3000/g, ' ') // 全角空格
    .replace(/\s+/g, ' ')
    .replace(/[*＊\s]+$/g, '')
    .replace(/^[*＊\s]+/g, '')
    .replace(/】\s*$/g, '')
    .trim();
}

function genId(str) {
  return crypto.createHash('md5').update(str).digest('hex').slice(0, 16);
}

// 清理所有章节标题噪音
function removeHeaders(s) {
  // "第一部分 选择题（100道）" / "第一部分：选择题（共100道）"
  s = s.replace(/第[一二三四五六七八九十百]+部分[：:]?\s*[^\s]*?(?:[（(][^)）]*[)）])?\s*/g, ' ');
  // "第一节 生物的特征（第1—80道）"
  s = s.replace(/第[一二三四五六七八九十百]+节\s+[^\s]*?(?:[（(][^)）]*[)）])?\s*/g, ' ');
  // "第X框 xxx（第X题～第X题）"
  s = s.replace(/第\d+框\s+[^第]*?(?:第\d+题[~～]第\d+题)?[）)]?\s*/g, ' ');
  // "大题（共50道）" / "选择题（100道）"
  s = s.replace(/[大小选择判断题]+[（(]共?\d+道[)）]\s*/g, ' ');
  return s;
}

// 按题号 "1. " 切分，支持两种格式：数字. 和 第X题
function splitByNumber(text) {
  // 优先匹配 "第X题" 格式（部分文件可能使用）
  let Q_START = /第(\d+)题[\s\u00a0]+/g;
  let chunks = [];
  let lastNum = 0;
  let m;
  while ((m = Q_START.exec(text)) !== null) {
    const num = parseInt(m[1]);
    if (num > 0 && num <= lastNum + 200) {
      if (chunks.length > 0) chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start, m.index);
      chunks.push({ num, start: m.index + m[0].length });
      lastNum = num;
    }
  }
  if (chunks.length > 0) {
    chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start);
    return chunks;
  }

  // 回退到 "数字. " 格式
  // 匹配：行首/空格后 + 数字 + "." + 空格 + 中文
  Q_START = /(?:^|\s)(\d{1,3})\.\s+/g;
  chunks = [];
  lastNum = 0;
  while ((m = Q_START.exec(text)) !== null) {
    const num = parseInt(m[1]);
    // 序号验证：必须从1或接近上次序号开始，过滤文本中的数字
    if (num > 0 && num <= lastNum + 50) {
      if (chunks.length > 0) chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start, m.index);
      chunks.push({ num, start: m.index + m[0].length });
      lastNum = num;
    } else if (num === 1 && chunks.length === 0) {
      chunks.push({ num, start: m.index + m[0].length });
      lastNum = 1;
    }
  }
  if (chunks.length > 0) chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start);
  return chunks;
}

// 解析选择判断文件
function parseChoiceJudge(text, ctx) {
  const questions = [];
  let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
  normalized = removeHeaders(normalized);
  normalized = cleanText(normalized);

  const chunks = splitByNumber(normalized);

  for (const chunk of chunks) {
    let body = cleanText(chunk.text);
    if (!body || body.length < 3) continue;
    body = removeHeaders(body);
    body = cleanText(body);
    if (!body || body.length < 3) continue;

    // 提取答案：格式 "答案：X" 或 "答案：X（解析：xxx）"
    let answer = '', analysis = '';
    const ansIdx = body.search(/[*＊]*\s*答案\s*[：:]/);
    let stemAndOptions = body;
    if (ansIdx > 5) {
      stemAndOptions = cleanText(body.slice(0, ansIdx));
      const afterAns = body.slice(ansIdx);
      const m2 = afterAns.match(/[*＊]*\s*答案\s*[：:]\s*(.+?)(?:[（(]解析[：:]\s*(.+?)[)）])?\s*[*＊]*\s*[】\]]?\s*$/);
      if (m2) {
        answer = cleanText(m2[1]);
        if (m2[2]) analysis = cleanText(m2[2]);
      } else {
        answer = cleanText(afterAns.replace(/[*＊]*\s*答案\s*[：:]\s*/, '').replace(/[*＊\s】\]]+$/g, ''));
      }
    }

    if (!stemAndOptions || stemAndOptions.length < 2) continue;

    // 提取选项 A. B. C. D.
    const optionPattern = /([A-D])\s*[.．、]\s*/g;
    const optMatches = [];
    let om;
    while ((om = optionPattern.exec(stemAndOptions)) !== null) {
      optMatches.push({ letter: om[1], index: om.index, matchLen: om[0].length });
    }

    let type = 'judge';
    let options = ['正确', '错误'];
    let stem = stemAndOptions;

    const hasA = optMatches.some(o => o.letter === 'A');
    const hasOther = optMatches.some(o => o.letter === 'B' || o.letter === 'C' || o.letter === 'D');
    const answerText = answer.replace(/[*＊\s】\]]/g, '');
    const answerIsChoice = /^[A-D]+$/.test(answerText);
    const answerIsJudge = /正确|错误|[对错√×]/.test(answerText);

    if (hasA && hasOther) {
      // 选择题
      type = 'single';
      const firstA = optMatches.find(o => o.letter === 'A');
      stem = cleanText(stemAndOptions.slice(0, firstA.index));
      // 取A/B/C/D各第一次出现位置
      const seen = new Set();
      const positions = [];
      for (const o of optMatches) {
        if (!seen.has(o.letter)) {
          seen.add(o.letter);
          positions.push(o);
        }
      }
      positions.sort((a, b) => a.index - b.index);
      options = [];
      for (let i = 0; i < positions.length; i++) {
        const start = positions[i].index + positions[i].matchLen;
        const end = i + 1 < positions.length ? positions[i + 1].index : stemAndOptions.length;
        const optText = cleanText(stemAndOptions.slice(start, end));
        if (optText) options.push(optText);
      }
      // 答案取字母
      const letterMatch = answerText.match(/[A-D]/);
      answer = letterMatch ? letterMatch[0] : '';
    } else if (answerIsJudge) {
      // 判断题
      type = 'judge';
      options = ['正确', '错误'];
      answer = /对|√|正确/.test(answerText) ? 'A' : 'B';
    } else if (answerIsChoice) {
      // 答案是字母但没有选项标记（异常）
      type = 'single';
      const letterMatch = answerText.match(/[A-D]/);
      answer = letterMatch ? letterMatch[0] : '';
    } else {
      // 无法判定，默认判断题
      type = 'judge';
      options = ['正确', '错误'];
      answer = '';
    }

    if (!stem || stem.length < 2) continue;
    // 多选题：答案为多个字母
    if (type === 'single' && answerText.length > 1 && /^[A-D]+$/.test(answerText)) {
      type = 'multiple';
      answer = answerText;
    }

    questions.push({
      id: 'q_' + genId(ctx.subject + ctx.grade + ctx.version + chunk.num + stem.slice(0, 100)),
      subject: ctx.subject,
      grade: ctx.grade,
      version: ctx.version,
      chapter: ctx.unit || '',
      section: ctx.lesson || '',
      type,
      stem,
      options,
      answer,
      analysis: analysis || '',
      solution: analysis || '',
      difficulty: 'medium',
      createdAt: new Date().toISOString(),
      source: 'imported',
    });
  }
  return questions;
}

// 解析大题文件
function parseEssayText(text, ctx) {
  const questions = [];
  let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
  normalized = removeHeaders(normalized);
  normalized = cleanText(normalized);

  const chunks = splitByNumber(normalized);

  for (const chunk of chunks) {
    let body = cleanText(chunk.text);
    if (!body || body.length < 5) continue;
    body = removeHeaders(body);
    body = cleanText(body);
    if (!body || body.length < 5) continue;

    // 去掉 "问：" 前缀
    body = body.replace(/^问\s*[：:]\s*/, '');

    // 找答案标记："答案：" 或 "答："
    const ansIdx = body.search(/[*＊]*\s*答案?\s*[：:]/);
    if (ansIdx <= 0) continue;

    const stem = cleanText(body.slice(0, ansIdx));
    if (!stem || stem.length < 2) continue;

    const afterAns = body.slice(ansIdx);
    const answer = cleanText(afterAns.replace(/[*＊]*\s*答案?\s*[：:]\s*/, '').replace(/[*＊\s】\]]+$/g, ''));
    if (!answer || answer.length < 2) continue;

    questions.push({
      id: 'q_' + genId(ctx.subject + ctx.grade + ctx.version + chunk.num + stem.slice(0, 100)),
      subject: ctx.subject,
      grade: ctx.grade,
      version: ctx.version,
      chapter: ctx.unit || '',
      section: ctx.lesson || '',
      type: 'essay',
      stem,
      options: [],
      answer,
      analysis: answer,
      solution: answer,
      difficulty: 'medium',
      createdAt: new Date().toISOString(),
      source: 'imported',
    });
  }
  return questions;
}

function walkDir(dir, ctx, allFiles) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      const normFull = full.replace(/\\/g, '/');
      const normRoot = ROOT.replace(/\\/g, '/');
      const rel = normFull.replace(normRoot + '/', '');
      const parts = rel.split('/');
      const newCtx = { ...ctx };
      if (parts.length >= 1) newCtx.subject = mapSubject(parts[0]);
      if (parts.length >= 2) newCtx.grade = parts[1];
      if (parts.length >= 3) newCtx.version = parts[2];
      if (parts.length >= 4) newCtx.unit = parts[3];
      if (parts.length >= 5) newCtx.lesson = parts[4];
      walkDir(full, newCtx, allFiles);
    } else if (e.isFile()) {
      const ext = extname(e.name).toLowerCase();
      if (ext === '.docx' || ext === '.doc') {
        allFiles.push({ path: full, name: e.name, ctx: { ...ctx } });
      }
    }
  }
}

function mapSubject(name) {
  const map = {
    '生物': 'biology', '地理': 'geography', '历史': 'history',
    '道法': 'politics', '道德与法治': 'politics', '政治': 'politics',
    '化学': 'chemistry', '物理': 'physics',
  };
  return map[name] || name;
}

async function processFile(fileInfo) {
  const { path: filePath, name: fileName, ctx } = fileInfo;
  const questions = [];
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    if (!text || text.length < 10) return questions;
    if (fileName.includes('大题')) {
      questions.push(...parseEssayText(text, ctx));
    } else {
      questions.push(...parseChoiceJudge(text, ctx));
    }
  } catch(e) {
    throw new Error(`${filePath}: ${e.message}`);
  }
  return questions;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const allFiles = [];
  walkDir(ROOT, {}, allFiles);
  console.log(`共 ${allFiles.length} 个文件`);

  const groups = new Map();
  for (const f of allFiles) {
    const key = `${f.ctx.subject}|${f.ctx.grade}|${f.ctx.version}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }
  console.log(`共 ${groups.size} 个分组`);

  const seen = new Set();
  const manifest = {};
  let totalQ = 0, hasAnalysis = 0, failed = 0, fileCount = 0;
  const failedList = [];
  const startTime = Date.now();

  for (const [key, files] of groups) {
    const [subject, grade, version] = key.split('|');
    if (!subject || !grade || !version) continue;

    const questions = [];
    for (const f of files) {
      fileCount++;
      if (fileCount % 200 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`  已处理 ${fileCount}/${allFiles.length} (${elapsed.toFixed(1)}s) - 累计 ${totalQ} 题`);
      }
      try {
        const qs = await processFile(f);
        for (const q of qs) {
          if (q.stem.length < 2) continue;
          if (seen.has(q.id)) continue;
          seen.add(q.id);
          questions.push(q);
          totalQ++;
          if (q.analysis && q.analysis.length > 5) hasAnalysis++;
        }
      } catch(e) {
        failed++;
        failedList.push(e.message);
      }
    }

    if (questions.length === 0) continue;
    const filename = `${subject}_${grade}_${version}.json`.replace(/[\\/:*?"<>|]/g, '_');
    writeFileSync(join(OUT_DIR, filename), JSON.stringify(questions));
    const mkey = `${subject}|${grade}`;
    if (!manifest[mkey]) manifest[mkey] = [];
    manifest[mkey].push({ version, file: filename, count: questions.length });
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(FAIL_LOG, failedList.join('\n'), 'utf8');

  console.log(`\n=== 完成 ===`);
  console.log(`总题数: ${totalQ} (去重后)`);
  console.log(`有解析: ${hasAnalysis}`);
  console.log(`失败文件: ${failed}`);
  console.log(`分片文件数: ${Object.values(manifest).reduce((s, v) => s + v.length, 0)}`);
  console.log(`耗时: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch(e => { console.error(e); process.exit(1); });
