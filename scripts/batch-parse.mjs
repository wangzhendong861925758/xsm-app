// 批量解析所有 docx → 按学科+年级+版本分组 → 生成 JSON 文件
import mammoth from 'mammoth';
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';

const ROOT = 'd:/小四门软件/试题/试题';
const OUT_DIR = 'd:/小四门软件/public/data/questions';

const SUBJECT_MAP = {
  '生物': 'biology', '道法': 'politics', '历史': 'history', '地理': 'geography',
  '化学': 'chemistry', '物理': 'physics',
};

const NUM_PREFIX = /^\s*(\d+)\s*[.．、]\s*/;
const DITI_PREFIX = /^\s*第(\d+)题\s*/;

function walkDir(dir) {
  const results = [];
  for (const item of readdirSync(dir)) {
    if (item.startsWith('~$')) continue; // 跳过 Word 临时文件
    const full = join(dir, item);
    try {
      if (statSync(full).isDirectory()) results.push(...walkDir(full));
      else if (item.endsWith('.docx')) results.push(full);
    } catch(e) { /* skip */ }
  }
  return results;
}

function parseMeta(filePath) {
  const rel = filePath.replace(/\\/g, '/').split('/试题/试题/')[1];
  const parts = rel.split('/');
  return {
    subject: SUBJECT_MAP[parts[0]] || parts[0],
    grade: parts[1] || '',
    version: parts[2] || '',
    chapter: parts[3] || '',
    lesson: parts[4] || '',
  };
}

function genId(str) {
  return createHash('md5').update(str).digest('hex').slice(0, 16);
}

// ============= 选择判断题解析 =============
function extractAnswer(fullText) {
  const ansIdx = fullText.search(/答案\s*[:：]\s*/);
  if (ansIdx === -1) return { answer: '', isJudge: false, before: fullText, after: '' };
  const before = fullText.slice(0, ansIdx);
  const after = fullText.slice(ansIdx);
  // 判断题
  const judgeM = after.match(/答案\s*[:：]\s*([√×✓✗对错]|正确|错误|T|F|true|false)/i);
  if (judgeM) {
    const raw = judgeM[1];
    const isCorrect = /^[√✓对正Tt]|^正确$|^true$/i.test(raw);
    const rest = after.replace(/答案\s*[:：]\s*[√×✓✗对错正确错误TtFftruefalse]+\s*/i, '');
    return { answer: isCorrect ? 'A' : 'B', isJudge: true, before, after: rest };
  }
  // 选择题
  const m = after.match(/答案\s*[:：]\s*([A-Da-d]+)/);
  const answer = m ? m[1].toUpperCase() : '';
  const rest = after.replace(/答案\s*[:：]\s*[A-Da-d]+\s*/, '');
  return { answer, isJudge: false, before, after: rest };
}

function extractOptions(text) {
  const optPattern = /(^|\s)([A-Da-d])\s*[.．、,，)）]\s*/g;
  const matches = [];
  let m;
  while ((m = optPattern.exec(text)) !== null) {
    matches.push({ letter: m[2].toUpperCase(), start: m.index + m[1].length, end: m.index + m[0].length });
  }
  if (matches.length === 0) return { stem: text.trim().replace(NUM_PREFIX, '').trim(), options: [] };

  let firstIdx = 0;
  for (let i = 0; i < matches.length; i++) {
    if (['A','B','C','D'].includes(matches[i].letter)) { firstIdx = i; break; }
  }

  const validOpts = [];
  let expected = matches[firstIdx].letter;
  for (let i = firstIdx; i < matches.length; i++) {
    if (matches[i].letter === expected) {
      const nextStart = i + 1 < matches.length ? matches[i + 1].start : text.length;
      let optText = text.slice(matches[i].end, nextStart).trim();
      optText = optText.replace(/答案\s*[:：].*$/s, '').trim();
      if (optText) validOpts.push({ ...matches[i], text: optText });
      expected = String.fromCharCode(expected.charCodeAt(0) + 1);
      if (expected > 'D') break;
    }
  }
  if (validOpts.length === 0) return { stem: text.trim().replace(NUM_PREFIX, '').trim(), options: [] };

  const stem = text.slice(0, validOpts[0].start).replace(NUM_PREFIX, '').replace(/[（(]\s*[）)]\s*$/, '').trim();
  return { stem, options: validOpts.map(o => o.text) };
}

function parseChoiceBlock(block, ctx) {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const fullText = lines.join(' ');
  const { answer, isJudge, before, after } = extractAnswer(fullText);
  if (!answer) return null;

  // 提取解析
  let analysis = '';
  const anaM = after.match(/解析\s*[:：]\s*(.*?)(?:$|(?=^\d+))/s);
  if (anaM) analysis = anaM[1].trim();
  // 也尝试从完整文本中找解析
  if (!analysis) {
    const anaM2 = fullText.match(/解析\s*[:：]\s*(.+)$/s);
    if (anaM2) analysis = anaM2[1].trim();
  }

  let { stem, options } = extractOptions(before);
  let type;
  if (isJudge) {
    type = 'judge';
    options = ['正确', '错误'];
    stem = before.replace(NUM_PREFIX, '').trim().replace(/[（(]\s*[）)]\s*$/, '').trim();
  } else if (options.length === 2 && /正确/.test(options[0]) && /错误/.test(options[1])) {
    type = 'judge';
  } else if (options.length < 2) {
    return null;
  } else if (answer.length >= 2) {
    type = 'multiple';
  } else {
    type = 'single';
  }

  if (!stem) return null;

  return {
    id: 'q_' + genId(ctx.subject + ctx.grade + ctx.version + stem + answer),
    subject: ctx.subject,
    grade: ctx.grade,
    version: ctx.version,
    type,
    stem,
    options,
    answer: type === 'multiple' ? answer.split('') : answer,
    analysis,
    mastered: false,
    collected: false,
    chapter: ctx.chapter,
    section: ctx.lesson,
  };
}

function parseChoiceText(text, ctx) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let current = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (NUM_PREFIX.test(trimmed)) {
      if (current.length > 0 && current.some(l => /答案\s*[:：]/.test(l))) {
        blocks.push(current.join('\n'));
      }
      current = [line];
    } else {
      if (current.length === 0 && trimmed === '') continue;
      current.push(line);
    }
  }
  if (current.length > 0 && current.some(l => /答案\s*[:：]/.test(l))) {
    blocks.push(current.join('\n'));
  }
  const questions = [];
  for (const block of blocks) {
    const q = parseChoiceBlock(block, ctx);
    if (q) questions.push(q);
  }
  return questions;
}

// ============= 大题解析 =============
function parseEssayText(text, ctx) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let current = [];
  for (const line of lines) {
    if (DITI_PREFIX.test(line.trim())) {
      if (current.length > 0) blocks.push(current.join('\n'));
      current = [line];
    } else {
      if (current.length === 0 && line.trim() === '') continue;
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current.join('\n'));

  const questions = [];
  for (const block of blocks) {
    const blockLines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const fullText = blockLines.join(' ');

    // 提取题干和答案
    const ansIdx = fullText.search(/答案\s*[:：]\s*/);
    if (ansIdx === -1) continue;

    let stem = fullText.slice(0, ansIdx).replace(DITI_PREFIX, '').trim();
    const afterAnswer = fullText.slice(ansIdx);

    const answerM = afterAnswer.match(/答案\s*[:：]\s*(.*?)(?:解析\s*[:：]|$)/s);
    if (!answerM) continue;
    const answer = answerM[1].trim();
    if (!answer || !stem) continue;

    // 提取解析
    let analysis = '';
    const anaM = afterAnswer.match(/解析\s*[:：]\s*(.+)$/s);
    if (anaM) analysis = anaM[1].trim();

    questions.push({
      id: 'q_' + genId(ctx.subject + ctx.grade + ctx.version + stem + answer.slice(0, 50)),
      subject: ctx.subject,
      grade: ctx.grade,
      version: ctx.version,
      type: 'essay',
      stem,
      options: [],
      answer,
      analysis,
      solution: '',
      mastered: false,
      collected: false,
      chapter: ctx.chapter,
      section: ctx.lesson,
    });
  }
  return questions;
}

// ============= 主流程 =============
async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const files = walkDir(ROOT);
  console.log(`共 ${files.length} 个文件\n`);

  // 按学科+年级+版本分组
  const groups = {}; // key: subject_grade_version -> Question[]
  let totalQ = 0, totalFailed = 0;
  const startTime = Date.now();

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ctx = parseMeta(f);
    const isChoice = basename(f).includes('选择');

    try {
      const buf = readFileSync(f);
      const { value } = await mammoth.extractRawText({ buffer: buf });
      const questions = isChoice ? parseChoiceText(value, ctx) : parseEssayText(value, ctx);

      const key = `${ctx.subject}|${ctx.grade}|${ctx.version}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(...questions);
      totalQ += questions.length;
    } catch(e) {
      totalFailed++;
    }

    if ((i + 1) % 500 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  已处理 ${i + 1}/${files.length} (${elapsed}s) - 累计 ${totalQ} 题`);
    }
  }

  // 生成分片 JSON 文件
  console.log('\n生成分片 JSON 文件...');
  const manifest = {};
  let totalWritten = 0;

  for (const [key, questions] of Object.entries(groups)) {
    if (questions.length === 0) continue;
    const [subject, grade, version] = key.split('|');
    // 文件名: subject_grade_version.json（特殊字符替换）
    const safeVersion = version.replace(/[\/\\:*?"<>|]/g, '_');
    const fileName = `${subject}_${grade}_${safeVersion}.json`;
    const filePath = join(OUT_DIR, fileName);

    // 去重（按 stem 去重）
    const seen = new Set();
    const deduped = questions.filter(q => {
      const k = q.stem.slice(0, 100);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    writeFileSync(filePath, JSON.stringify(deduped));
    totalWritten += deduped.length;

    const groupKey = `${subject}|${grade}`;
    if (!manifest[groupKey]) manifest[groupKey] = [];
    manifest[groupKey].push({ version, file: fileName, count: deduped.length });
  }

  // 写入 manifest（索引文件）
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n=== 完成 ===`);
  console.log(`总题数: ${totalWritten} (去重后)`);
  console.log(`失败文件: ${totalFailed}`);
  console.log(`分片文件数: ${Object.keys(groups).length}`);
  console.log(`耗时: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  // 打印各分片大小
  console.log('\n各分片统计:');
  for (const [key, entries] of Object.entries(manifest)) {
    const total = entries.reduce((s, e) => s + e.count, 0);
    console.log(`  ${key}: ${total}题 (${entries.length}个版本)`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
