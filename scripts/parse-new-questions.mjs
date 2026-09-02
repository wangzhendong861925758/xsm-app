// 解析新增试题目录（道法/历史 九年级上册 人教版），生成题目JSON
// 支持阿拉伯数字(1.)和中文数字(一、)题号，处理答案变体(**答案：A】)
import { readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import mammoth from 'mammoth';
import { randomBytes } from 'crypto';

const NEW_DIR = 'D:/小四门软件/试题/试题/新增';
const Q_DIR = 'd:/小四门软件/public/data/questions';
const VERSION = '人教版';
const GRADE = '九年级上册';

// 中文数字转整数（仅用于题号，不关键）
const CN_NUM = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'零':0 };
function cn2num(s) {
  if (/^\d+$/.test(s)) return parseInt(s);
  if (s === '十') return 10;
  if (s.startsWith('十') && s.length === 2) return 10 + CN_NUM[s[1]];
  if (s.length === 2 && s.endsWith('十')) return CN_NUM[s[0]] * 10;
  if (s.length === 3 && s[1] === '十') return CN_NUM[s[0]] * 10 + CN_NUM[s[2]];
  // 二十三, 一百零一 等，简化处理
  let n = 0;
  for (const ch of s) { if (CN_NUM[ch] !== undefined) n = n * 10 + CN_NUM[ch]; }
  return n || 1;
}

// 题号正则：阿拉伯数字 / 中文数字 / 第X题
const NUM_RE = /^(?:(\d+)\s*[.、．]\s*|([一二三四五六七八九十百零]+)\s*、\s*|第(\d+)题\s*)(.*)/;

// 答案正则：处理 答案： / **答案： / *答案： + 可能的 】 结尾
const ANS_RE = /[*]*答案[：:]\s*([A-Z对错√×]+)[*]*[】\]]*/;
const ANS_RE_LONG = /[*]*答案[：:]\s*(.+?)(?:[*]*[】\]]*)?$/;

function findDocx(dir) {
  const out = [];
  for (const item of readdirSync(dir)) {
    if (item.startsWith('~$')) continue;
    const p = join(dir, item);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...findDocx(p));
    else if (item.endsWith('.docx') || item.endsWith('.doc')) out.push(p);
  }
  return out;
}

function extractChapterSection(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  const parts = norm.split('/').filter(Boolean);
  const gradeIdx = parts.indexOf(GRADE);
  if (gradeIdx === -1) return { chapter: '', section: '' };
  let chapter = '', section = '';
  for (let i = gradeIdx + 1; i < parts.length; i++) {
    if (parts[i].includes('单元')) { chapter = parts[i]; break; }
  }
  const chIdx = parts.indexOf(chapter);
  if (chIdx !== -1 && chIdx + 1 < parts.length - 1) section = parts[chIdx + 1];
  return { chapter, section };
}

// 解析选择/判断题
function parseChoiceQuestions(text) {
  const questions = [];
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(NUM_RE);
    if (!m) { i++; continue; }
    const num = m[1] ? parseInt(m[1]) : (m[3] ? parseInt(m[3]) : cn2num(m[2]));
    if (!num || num > 500) { i++; continue; }

    let rest = m[4];
    let answer = '';

    // 答案可能在当前行末或后续行
    const ansInline = rest.match(ANS_RE);
    if (ansInline) {
      answer = ansInline[1];
      rest = rest.substring(0, ansInline.index).trim();
    }

    // 合并后续行（选项可能跨行）直到遇到答案行或下一题
    let optText = rest;
    let endIdx = i;
    if (!answer) {
      let j = i + 1;
      while (j < lines.length && j < i + 8) {
        const nxt = lines[j];
        if (nxt.match(NUM_RE)) break;
        const am = nxt.match(ANS_RE);
        if (am) { answer = am[1]; endIdx = j; break; }
        optText += nxt;
        endIdx = j;
        j++;
      }
    } else {
      // 答案已在行内，但仍需合并可能的跨行选项
      let j = i + 1;
      while (j < lines.length && j < i + 4) {
        const nxt = lines[j];
        if (nxt.match(NUM_RE)) break;
        if (nxt.match(ANS_RE)) break;
        optText += nxt;
        endIdx = j;
        j++;
      }
    }

    // 提取选项：A. xxx B. xxx ... (可能无空格)
    const options = [];
    const optPattern = /([A-D])\s*[.、．]\s*/g;
    const optStarts = [];
    let om;
    while ((om = optPattern.exec(optText)) !== null) {
      optStarts.push({ letter: om[1], idx: om.index, end: om.index + om[0].length });
    }
    if (optStarts.length >= 2) {
      for (let k = 0; k < optStarts.length; k++) {
        const start = optStarts[k].end;
        const end = k + 1 < optStarts.length ? optStarts[k + 1].idx : optText.length;
        const optContent = optText.substring(start, end).trim();
        if (optContent) options.push(optContent);
      }
      const firstOptIdx = optStarts[0].idx;
      rest = optText.substring(0, firstOptIdx).trim();
    } else {
      rest = optText.trim();
    }

    // 清理题干
    rest = rest.replace(/[（(]\s*[　 ]*\s*[)）]/, '（　）').trim();
    // 去除题号前缀残留
    rest = rest.replace(/^[一二三四五六七八九十百零]+\s*、\s*/, '').trim();

    if (!rest) { i = endIdx + 1; continue; }

    let type = 'single';
    if (options.length === 0 && /[对错√×]/.test(answer)) {
      type = 'judge';
    } else if (answer.length > 1 && /^[A-Z]+$/.test(answer)) {
      type = 'multiple';
    } else if (options.length === 0) {
      i = endIdx + 1;
      continue;
    }

    questions.push({ num, type, stem: rest, options, answer });
    i = endIdx + 1;
  }
  return questions;
}

// 解析大题
function parseEssayQuestions(text) {
  const questions = [];
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(NUM_RE);
    if (!m) { i++; continue; }
    const num = m[1] ? parseInt(m[1]) : (m[3] ? parseInt(m[3]) : cn2num(m[2]));
    if (!num || num > 500) { i++; continue; }

    let rest = m[4];
    let answer = '';

    const ansInline = rest.match(ANS_RE_LONG);
    if (ansInline) {
      answer = ansInline[1].trim();
      rest = rest.substring(0, ansInline.index).trim();
    } else {
      let j = i + 1;
      while (j < lines.length) {
        const nxt = lines[j];
        if (nxt.match(NUM_RE)) break;
        const am = nxt.match(ANS_RE_LONG);
        if (am) { answer = am[1].trim(); break; }
        rest += ' ' + nxt;
        j++;
      }
    }

    rest = rest.replace(/^请回答[：:]?\s*/i, '').trim();
    rest = rest.replace(/^[一二三四五六七八九十百零]+\s*、\s*/, '').trim();
    // 过滤小节标题："简答题（第1-20题）" "大题（共50道）" 等
    if (/^(简答题|材料分析题|综合题|论述题|辨析题|大题|选择题|判断题)[（(]/.test(rest)) { i++; continue; }
    if (!rest) { i++; continue; }

    questions.push({ num, type: 'essay', stem: rest, answer });
    i++;
  }
  return questions;
}

// === 主流程 ===
const tasks = [
  { subject: 'history', subjectCn: '历史', baseDir: join(NEW_DIR, '历史', GRADE, '人教版（2026）') },
  { subject: 'politics', subjectCn: '道法', baseDir: join(NEW_DIR, '道法', '人教版', GRADE) },
];

const stats = [];
for (const { subject, subjectCn, baseDir } of tasks) {
  if (!existsSync(baseDir)) { console.error(`目录不存在: ${baseDir}`); continue; }
  const docxFiles = findDocx(baseDir);
  console.log(`\n=== ${subjectCn} (${subject}) === ${docxFiles.length} 个文件`);

  const allQuestions = [];
  let qNum = 0, choiceCnt = 0, essayCnt = 0, judgeCnt = 0;

  for (const filePath of docxFiles) {
    const fileName = filePath.split(/[\\\/]/).pop();
    const { chapter, section } = extractChapterSection(filePath);
    const isEssay = fileName.includes('大题') || fileName.includes('解答');

    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const parsed = isEssay ? parseEssayQuestions(result.value) : parseChoiceQuestions(result.value);
      for (const q of parsed) {
        qNum++;
        allQuestions.push({
          id: `${subject}_${GRADE}_${VERSION}_${qNum}_${randomBytes(4).toString('hex')}`,
          type: q.type, subject, grade: GRADE, version: VERSION,
          chapter, section, stem: q.stem, options: q.options || [], answer: q.answer, sourceFile: fileName,
        });
        if (q.type === 'essay') essayCnt++;
        else if (q.type === 'judge') judgeCnt++;
        else choiceCnt++;
      }
      console.log(`  ${isEssay?'大题':'选择'} ${chapter}/${section}: ${parsed.length}题`);
    } catch (e) { console.error(`  解析失败 ${fileName}: ${e.message}`); }
  }

  const jsonName = `${subject}_${GRADE}_${VERSION}.json`;
  writeFileSync(join(Q_DIR, jsonName), JSON.stringify(allQuestions, null, 2));
  console.log(`写入 ${jsonName}: ${allQuestions.length}题 (选择${choiceCnt}/判断${judgeCnt}/大题${essayCnt})`);
  stats.push({ subject, total: allQuestions.length, choice: choiceCnt, judge: judgeCnt, essay: essayCnt });
}

console.log('\n=== 汇总 ===');
for (const s of stats) console.log(`${s.subject}: ${s.total}题 (选择${s.choice}/判断${s.judge}/大题${s.essay})`);
