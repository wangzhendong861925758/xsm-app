// 补充解析七年级上册历史的2个缺失版本
import mammoth from 'mammoth';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

const ROOT = 'd:/小四门软件/试题/试题';
const OUT_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

function cleanText(s) {
  return s.replace(/\u00a0/g, ' ').replace(/\u3000/g, ' ').replace(/\s+/g, ' ')
    .replace(/[*＊\s]+$/g, '').replace(/^[*＊\s]+/g, '').trim();
}
function genId(str) { return crypto.createHash('md5').update(str).digest('hex').slice(0, 16); }

function splitByNumberEnhanced(text) {
  let chunks = [], lastNum = 0, m;
  // 格式1: "第X题" 或 "第X题题目："
  const Q1 = /第(\d+)题(?:\s*题目[：:])?[\s\u00a0]*/g;
  while ((m = Q1.exec(text)) !== null) {
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
  // 格式2: 中文数字
  const CN_NUM = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10 };
  const Q2 = /([一二三四五六七八九十]+)、\s*/g;
  chunks = []; lastNum = 0;
  while ((m = Q2.exec(text)) !== null) {
    const cn = m[1];
    let num = 0;
    if (cn === '十') num = 10;
    else if (cn.startsWith('十')) num = 10 + (CN_NUM[cn[1]] || 0);
    else if (cn.endsWith('十')) num = (CN_NUM[cn[0]] || 0) * 10;
    else if (cn.length === 2 && cn.includes('十')) {
      const parts = cn.split('十');
      num = (CN_NUM[parts[0]] || 0) * 10 + (CN_NUM[parts[1]] || 0);
    } else num = CN_NUM[cn] || 0;
    if (num > 0 && num <= lastNum + 50) {
      if (chunks.length > 0) chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start, m.index);
      chunks.push({ num, start: m.index + m[0].length });
      lastNum = num;
    }
  }
  if (chunks.length > 0) {
    chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start);
    return chunks;
  }
  // 格式3: 数字.
  const Q3 = /(?:^|\s)(\d{1,3})\.\s+/g;
  chunks = []; lastNum = 0;
  while ((m = Q3.exec(text)) !== null) {
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

function parseEssayEnhanced(text, ctx) {
  const questions = [];
  let normalized = text.replace(/\r\n/g, '\n');
  const chunks = splitByNumberEnhanced(normalized);
  for (const chunk of chunks) {
    let body = cleanText(chunk.text);
    if (!body || body.length < 3) continue;
    let answer = '', analysis = '';
    const ansMatch = body.match(/答案[：:]\s*([\s\S]+?)(?=\s*解析[：:]|$)/);
    if (ansMatch) {
      answer = cleanText(ansMatch[1]);
      body = body.slice(0, body.search(/答案[：:]/)).trim();
    }
    const anaMatch = body.match(/解析[：:]\s*([\s\S]+)$/);
    if (anaMatch) analysis = cleanText(anaMatch[1]);
    const stem = cleanText(body.replace(/^题目[：:]\s*/, ''));
    if (!stem || stem.length < 2) continue;
    questions.push({
      id: genId(stem + (ctx.version || '') + (ctx.grade || '')),
      chapter: ctx.unit || '', section: ctx.lesson || '',
      type: 'essay', stem, options: [], answer, analysis: analysis || answer, solution: answer,
      difficulty: 'medium', createdAt: new Date().toISOString(), source: 'imported',
    });
  }
  return questions;
}

function parseChoiceJudgeEnhanced(text, ctx) {
  const questions = [];
  let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
  normalized = cleanText(normalized);
  const chunks = splitByNumberEnhanced(normalized);
  for (const chunk of chunks) {
    let body = cleanText(chunk.text);
    if (!body || body.length < 3) continue;
    let answer = '', analysis = '';
    const ansIdx = body.search(/答案\s*[：:]/);
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
      chapter: ctx.unit || '', section: ctx.lesson || '',
      type, stem, options, answer, analysis,
      difficulty: 'medium', createdAt: new Date().toISOString(), source: 'imported',
    });
  }
  return questions;
}

const versions = [
  { subject: 'history', grade: '七年级上册', version: '统编版（五四学制）' },
  { subject: 'history', grade: '七年级上册', version: '统编版（五四学制）（2018）' },
];

async function main() {
  for (const item of versions) {
    const dir = join(ROOT, '历史', item.grade, item.version);
    console.log(`处理: ${item.version}`);
    
    const docxFiles = [];
    function walk(d, unit, lesson) {
      const entries = readdirSync(d, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith('~$')) continue;
        const full = join(d, e.name);
        if (e.isDirectory()) walk(full, unit || e.name, e.name);
        else if (e.name.endsWith('.docx') || e.name.endsWith('.doc')) {
          const fileType = e.name.includes('选择') || e.name.includes('判断') ? 'choice' : 'essay';
          docxFiles.push({ path: full, fileType, unit, lesson: lesson || '', name: e.name });
        }
      }
    }
    walk(dir, '', '');
    console.log(`  docx文件: ${docxFiles.length}`);
    
    const questions = [];
    const seen = new Set();
    for (const f of docxFiles) {
      try {
        const result = await mammoth.extractRawText({ path: f.path });
        const text = result.value;
        if (!text || text.length < 10) continue;
        const ctx = { ...f, ...item };
        const qs = f.fileType === 'choice' ? parseChoiceJudgeEnhanced(text, ctx) : parseEssayEnhanced(text, ctx);
        for (const q of qs) {
          if (q.stem.length < 2 || seen.has(q.id)) continue;
          seen.add(q.id);
          questions.push(q);
        }
      } catch(e) {}
    }
    
    if (questions.length > 0) {
      const filename = `${item.subject}_${item.grade}_${item.version}.json`;
      const safeName = filename.replace(/[\\/:*?"<>|]/g, '_');
      writeFileSync(join(OUT_DIR, safeName), JSON.stringify(questions));
      // 生成索引
      const chapterMap = new Map();
      for (const q of questions) {
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
      console.log(`  ${questions.length}题 ✓`);
    } else {
      console.log(`  0题 ✗`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
