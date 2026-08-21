// 补充解析缺失的94个版本
// 复用 batch-parse-v3.mjs 的解析逻辑，但只处理缺失版本
import mammoth from 'mammoth';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import crypto from 'crypto';

const ROOT = 'd:/小四门软件/试题/试题';
const ROOT2 = 'd:/小四门软件/试题/道德与法治';
const OUT_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

// 读取缺失列表
const missingList = JSON.parse(readFileSync('d:/小四门软件/scripts/_missing_list.json', 'utf8'));
console.log(`需要补充解析 ${missingList.length} 个版本`);

// 复用 batch-parse-v3.mjs 的函数
function cleanText(s) {
  return s.replace(/\u00a0/g, ' ').replace(/\u3000/g, ' ').replace(/\s+/g, ' ')
    .replace(/[*＊\s]+$/g, '').replace(/^[*＊\s]+/g, '').replace(/】\s*$/g, '').trim();
}
function genId(str) { return crypto.createHash('md5').update(str).digest('hex').slice(0, 16); }
function removeHeaders(s) {
  s = s.replace(/第[一二三四五六七八九十百]+部分[：:]?\s*[^\s]*?(?:[（(][^)）]*[)）])?\s*/g, ' ');
  s = s.replace(/第[一二三四五六七八九十百]+节\s+[^\s]*?(?:[（(][^)）]*[)）])?\s*/g, ' ');
  s = s.replace(/第\d+框\s+[^第]*?(?:第\d+题[~～]第\d+题)?[）)]?\s*/g, ' ');
  s = s.replace(/[大小选择判断题]+[（(]共?\d+道[)）]\s*/g, ' ');
  return s;
}
function splitByNumber(text) {
  let Q_START = /第(\d+)题[\s\u00a0]+/g;
  let chunks = [], lastNum = 0, m;
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
  Q_START = /(?:^|\s)(\d{1,3})\.\s+/g;
  chunks = []; lastNum = 0;
  while ((m = Q_START.exec(text)) !== null) {
    const num = parseInt(m[1]);
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
function parseChoiceJudge(text, ctx) {
  const questions = [];
  let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
  normalized = removeHeaders(normalized);
  normalized = cleanText(normalized);
  const chunks = splitByNumber(normalized);
  for (const chunk of chunks) {
    let body = cleanText(chunk.text);
    if (!body || body.length < 3) continue;
    body = removeHeaders(body); body = cleanText(body);
    if (!body || body.length < 3) continue;
    let answer = '', analysis = '';
    const ansIdx = body.search(/[*＊]*\s*答案\s*[：:]/);
    if (ansIdx >= 0) {
      const ansStr = body.slice(ansIdx);
      body = body.slice(0, ansIdx).trim();
      const m = ansStr.match(/答案\s*[：:]\s*([A-D判断对错正确错误]+)/);
      if (m) answer = m[1];
      const am = ansStr.match(/解析\s*[：:]\s*([^\n]+)/);
      if (am) analysis = am[1];
    }
    let options = [];
    const optM = body.match(/[A-D][\.．、]\s*[^A-D\n]+/g);
    if (optM && optM.length >= 2) {
      options = optM.map(o => o.replace(/^[A-D][\.．、]\s*/, '').trim());
      const stemM = body.match(/^(.+?)(?=[A-D][\.．、])/s);
      if (stemM) body = stemM[1].trim();
    }
    let type = 'choice';
    if (/^[对错]/.test(answer) || /判断/.test(ctx.fileType)) type = 'judge';
    const stem = cleanText(body.replace(/[（(]\s*[)）]\s*$/, '').trim());
    if (!stem || stem.length < 2) continue;
    questions.push({
      id: genId(stem + (ctx.version || '') + (ctx.grade || '')),
      chapter: ctx.unit || '',
      section: ctx.lesson || '',
      type, stem, options, answer, analysis,
      difficulty: 'medium',
      createdAt: new Date().toISOString(),
      source: 'imported',
    });
  }
  return questions;
}
function parseEssay(text, ctx) {
  const questions = [];
  let normalized = text.replace(/\r\n/g, '\n');
  normalized = removeHeaders(normalized);
  const chunks = splitByNumber(normalized);
  for (const chunk of chunks) {
    let body = cleanText(chunk.text);
    if (!body || body.length < 3) continue;
    let answer = '';
    const ansIdx = body.search(/答案\s*[：:]/);
    if (ansIdx >= 0) { answer = body.slice(ansIdx).replace(/答案\s*[：:]\s*/, '').trim(); body = body.slice(0, ansIdx).trim(); }
    const stem = cleanText(body);
    if (!stem || stem.length < 2) continue;
    questions.push({
      id: genId(stem + (ctx.version || '') + (ctx.grade || '')),
      chapter: ctx.unit || '', section: ctx.lesson || '',
      type: 'essay', stem, options: [], answer, analysis: answer, solution: answer,
      difficulty: 'medium', createdAt: new Date().toISOString(), source: 'imported',
    });
  }
  return questions;
}

const SUBJECT_DIR = { politics:'道法', history:'历史', geography:'地理', biology:'生物', physics:'物理', chemistry:'化学' };

async function processVersion(item) {
  const { subject, grade, version } = item;
  const dirName = SUBJECT_DIR[subject];
  const dir1 = join(ROOT, dirName, grade, version);
  const dir2 = join(ROOT, dirName, grade, version); // 同结构
  
  let baseDir = null;
  for (const p of [dir1, dir2]) {
    if (existsSync(p)) { baseDir = p; break; }
  }
  if (!baseDir) {
    // 尝试道德与法治目录
    const dir3 = join(ROOT2, grade, version);
    const dir4 = join(ROOT2, dirName, grade, version);
    for (const p of [dir3, dir4]) {
      if (existsSync(p)) { baseDir = p; break; }
    }
  }
  if (!baseDir) return { version, count: 0, error: '目录不存在' };
  
  // 收集所有 docx 文件
  const docxFiles = [];
  function walk(dir, unit, lesson) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('~$')) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        walk(full, unit || e.name, lesson);
      } else if (e.isFile() && (e.name.endsWith('.docx') || e.name.endsWith('.doc'))) {
        const fileType = e.name.includes('选择') || e.name.includes('判断') ? 'choice' : 'essay';
        docxFiles.push({ path: full, fileType, unit, lesson: lesson || '', name: e.name });
      }
    }
  }
  walk(baseDir, '', '');
  
  const questions = [];
  const seen = new Set();
  for (const f of docxFiles) {
    try {
      const result = await mammoth.extractRawText({ path: f.path });
      const text = result.value;
      if (!text || text.length < 10) continue;
      const ctx = { ...f, version, grade, subject };
      const qs = f.fileType === 'choice' ? parseChoiceJudge(text, ctx) : parseEssay(text, ctx);
      for (const q of qs) {
        if (q.stem.length < 2 || seen.has(q.id)) continue;
        seen.add(q.id);
        questions.push(q);
      }
    } catch(e) {
      // 解析失败，跳过
    }
  }
  
  return { subject, grade, version, count: questions.length, questions };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(IDX_DIR, { recursive: true });
  
  const results = [];
  let totalQ = 0;
  for (let i = 0; i < missingList.length; i++) {
    const item = missingList[i];
    process.stdout.write(`[${i+1}/${missingList.length}] ${item.subject}|${item.grade}|${item.version}... `);
    const result = await processVersion(item);
    if (result.count > 0) {
      // 写入 JSON 文件
      const filename = `${item.subject}_${item.grade}_${item.version}.json`;
      const safeName = filename.replace(/[\\/:*?"<>|]/g, '_');
      writeFileSync(join(OUT_DIR, safeName), JSON.stringify(result.questions));
      // 生成索引
      const chapterMap = new Map();
      for (const q of result.questions) {
        const ch = q.chapter || '未分单元';
        const sec = q.section || '';
        if (!chapterMap.has(ch)) chapterMap.set(ch, new Map());
        const secMap = chapterMap.get(ch);
        if (!secMap.has(sec)) secMap.set(sec, { choice: 0, essay: 0, judge: 0 });
        const cnt = secMap.get(sec);
        if (q.type === 'essay') cnt.essay++;
        else if (q.type === 'judge') cnt.judge++;
        else cnt.choice++;
      }
      const index = [];
      for (const [ch, secMap] of chapterMap) {
        const sections = [];
        for (const [sec, cnt] of secMap) sections.push({ title: sec, ...cnt });
        index.push({ chapter: ch, sections });
      }
      const idxFile = safeName.replace(/\.json$/, '.idx.json');
      writeFileSync(join(IDX_DIR, idxFile), JSON.stringify(index));
      
      totalQ += result.count;
      results.push({ ...item, count: result.count, file: safeName });
      console.log(`${result.count}题 ✓`);
    } else {
      console.log(`0题 ✗`);
      results.push({ ...item, count: 0, file: null });
    }
  }
  
  console.log(`\n=== 补充解析完成 ===`);
  console.log(`总题数: ${totalQ}`);
  console.log(`成功版本: ${results.filter(r => r.count > 0).length}/${missingList.length}`);
  
  // 输出结果
  writeFileSync('d:/小四门软件/scripts/_supplement_result.json', JSON.stringify(results, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
