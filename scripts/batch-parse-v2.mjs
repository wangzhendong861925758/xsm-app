// 批量解析所有 docx → 按学科+年级+版本分组 → 生成 JSON 文件（v2 修复大题解析）
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

// 清除页码噪音：行末的 "-数字" 或 "-数字-数字"（如 "-11", "-22-19-21"）
const PAGE_NOISE = /-\d+(-\d+)*\s*$/;

function walkDir(dir) {
  const results = [];
  for (const item of readdirSync(dir)) {
    if (item.startsWith('~$')) continue;
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

function cleanText(t) {
  return t.replace(PAGE_NOISE, '').replace(/\s+/g, ' ').trim();
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
  if (matches.length === 0) return { stem: cleanText(text).replace(/^\s*\d+\s*[.．、]\s*/, ''), options: [] };

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
      if (optText) validOpts.push({ ...matches[i], text: cleanText(optText) });
      expected = String.fromCharCode(expected.charCodeAt(0) + 1);
      if (expected > 'D') break;
    }
  }
  if (validOpts.length === 0) return { stem: cleanText(text).replace(/^\s*\d+\s*[.．、]\s*/, ''), options: [] };

  const stem = text.slice(0, validOpts[0].start).replace(/^\s*\d+\s*[.．、]\s*/, '').replace(/[（(]\s*[）)]\s*$/, '').trim();
  return { stem: cleanText(stem), options: validOpts.map(o => o.text) };
}

function parseChoiceBlock(block, ctx) {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const fullText = lines.map(cleanText).join(' ');
  const { answer, isJudge, before, after } = extractAnswer(fullText);
  if (!answer) return null;

  // 提取解析（在答案之后的文字）
  let analysis = '';
  const anaM = after.match(/解析\s*[:：]\s*(.+)$/s);
  if (anaM) analysis = cleanText(anaM[1]);

  // 如果 after 里没有"解析"标记，但有文字内容，当作解析
  if (!analysis && after.trim().length > 5) {
    const candidate = after.trim().replace(/^解析\s*[:：]?\s*/, '');
    if (candidate.length > 5 && !/^[A-Da-d√×✓✗对错]+\s*$/.test(candidate)) {
      analysis = candidate;
    }
  }

  let { stem, options } = extractOptions(before);
  let type;
  if (isJudge) {
    type = 'judge';
    options = ['正确', '错误'];
    stem = cleanText(before.replace(/^\s*\d+\s*[.．、]\s*/, '').replace(/[（(]\s*[）)]\s*$/, ''));
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
    const trimmed = line.trim().replace(PAGE_NOISE, '');
    if (/^\s*\d+\s*[.．、]/.test(trimmed)) {
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

// ============= 大题解析（v2：支持两种编号格式） =============
// 格式1: "第X题..."
// 格式2: "数字. ..." （题干和答案可能在同一行： "1. 题干 答案：答案内容"）
function parseEssayText(text, ctx) {
  const rawLines = text.replace(/\r\n/g, '\n').split('\n')
    .map(l => cleanText(l))
    .filter(l => l.length > 0);

  // 合并所有行为一个连续文本，按题号切分
  // 题号匹配：数字. 或 第数字题
  const Q_NUM = /(?:^|\s)(\d+)\s*[.．、]\s*/g;
  const Q_DI = /第(\d+)题\s*/g;

  // 先把全文按"第X题"或"数字." 切分成块
  // 策略：逐行扫描，识别新题开始
  const blocks = [];
  let current = [];
  let qNum = null;

  const startsNewQuestion = (line) => {
    // "第X题"开头
    if (/^第\d+题/.test(line)) return { num: parseInt(line.match(/^第(\d+)题/)[1]), rest: line.replace(/^第\d+题\s*/, '') };
    // "数字. " 开头（行首），且不是选项（选项是 A. B. C. D.）
    const m = line.match(/^(\d+)\s*[.．、]\s*(.*)/);
    if (m && !/^[A-Da-d]$/.test(m[1]) && parseInt(m[1]) <= 200) {
      return { num: parseInt(m[1]), rest: m[2] };
    }
    return null;
  };

  for (const line of rawLines) {
    const nq = startsNewQuestion(line);
    if (nq) {
      // 保存上一题
      if (current.length > 0 && current.some(l => /答案\s*[:：]/.test(l))) {
        blocks.push({ num: qNum, text: current.join(' ') });
      }
      qNum = nq.num;
      current = [nq.rest];
    } else {
      if (current.length > 0) current.push(line);
    }
  }
  // 最后一题
  if (current.length > 0 && current.some(l => /答案\s*[:：]/.test(l))) {
    blocks.push({ num: qNum, text: current.join(' ') });
  }

  const questions = [];
  for (const { num: _, text: blockText } of blocks) {
    const fullText = blockText;

    // 提取答案
    const ansIdx = fullText.search(/答案\s*[:：]\s*/);
    if (ansIdx === -1) continue;

    let stem = cleanText(fullText.slice(0, ansIdx));
    // 去除题号前缀残留
    stem = stem.replace(/^\d+\s*[.．、]?\s*/, '').replace(/^第\d+题\s*/, '').trim();
    if (!stem) continue;

    const afterAnswer = fullText.slice(ansIdx);

    // 提取答案文本（到"解析"为止，或到行尾）
    let answer = '';
    let analysis = '';

    const anaMatch = afterAnswer.match(/解析\s*[:：]\s*(.+)$/s);
    if (anaMatch) {
      const beforeAna = afterAnswer.slice(0, anaMatch.index);
      const ansM = beforeAna.match(/答案\s*[:：]\s*(.*)/s);
      answer = ansM ? cleanText(ansM[1]) : '';
      analysis = cleanText(anaMatch[1]);
    } else {
      const ansM = afterAnswer.match(/答案\s*[:：]\s*(.+)$/s);
      answer = ansM ? cleanText(ansM[1]) : '';
      // 无"解析"标记，但答案本身就是解析性回答（大题的答案本身包含解题过程）
      // answer 字段保存标准答案，analysis 从答案中提取解析
      // 对于有明确答案但没有显式解析的大题，把答案当作初步解析
      analysis = answer;
    }

    if (!answer) continue;

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
      solution: analysis, // solution 同 analysis，Word原文中答案本身即为解题思路
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

  const groups = {};
  let totalQ = 0, totalFailed = 0;
  const startTime = Date.now();

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ctx = parseMeta(f);
    const isChoice = basename(f).includes('选择') || basename(f).includes('判断');

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

  console.log('\n生成分片 JSON 文件...');
  const manifest = {};
  let totalWritten = 0, totalWithAnalysis = 0;

  for (const [key, questions] of Object.entries(groups)) {
    if (questions.length === 0) continue;
    const [subject, grade, version] = key.split('|');
    const safeVersion = version.replace(/[\/\\:*?"<>|]/g, '_');
    const fileName = `${subject}_${grade}_${safeVersion}.json`;
    const filePath = join(OUT_DIR, fileName);

    const seen = new Set();
    const deduped = questions.filter(q => {
      const k = q.stem.slice(0, 100);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    writeFileSync(filePath, JSON.stringify(deduped));
    totalWritten += deduped.length;
    totalWithAnalysis += deduped.filter(q => q.analysis && q.analysis.length > 5).length;

    const groupKey = `${subject}|${grade}`;
    if (!manifest[groupKey]) manifest[groupKey] = [];
    manifest[groupKey].push({ version, file: fileName, count: deduped.length });
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n=== 完成 ===`);
  console.log(`总题数: ${totalWritten} (去重后)`);
  console.log(`有解析: ${totalWithAnalysis} (${Math.round(totalWithAnalysis/totalWritten*100)}%)`);
  console.log(`失败文件: ${totalFailed}`);
  console.log(`分片文件数: ${Object.keys(groups).length}`);
  console.log(`耗时: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch(e => { console.error(e); process.exit(1); });
