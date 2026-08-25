// 重新解析八年级上册历史"统编版/统编版（2016）"，修复 section 为空的问题
// 根因：fix-zero-parse.mjs 的 walk() 递归时 lesson 参数从未赋值，导致 section 全空
// 源结构：历史/八年级上册/版本/单元(chapter) > 课时(section) > {选择判断题.docx, 大题.docx}
// 题号格式：中文数字（一、二、...一十一、...一百五十），答案带 "**答案：B】 -7" 等装饰
import { readdirSync, existsSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import mammoth from 'mammoth';
import { randomBytes } from 'crypto';

const SOURCE_DIR = 'D:/小四门软件/试题/试题';
const Q_DIR = 'd:/小四门软件/public/data/questions';

const toFix = [
  { grade: '八年级上册', subject: 'history', version: '统编版' },
  { grade: '八年级上册', subject: 'history', version: '统编版（2016）' },
];

// 完整中文数字转换（支持到百位，兼容"一十/一十一"带前导一）
function cnToNumFull(s) {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const CN = { '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
  const UNITS = { '十': 10, '百': 100 };
  let total = 0, current = 0;
  for (const ch of s) {
    if (CN[ch] !== undefined) current = CN[ch];
    else if (UNITS[ch]) {
      if (current === 0) current = 1;
      total += current * UNITS[ch];
      current = 0;
    }
  }
  return total + current;
}

// 题号切分："第X题" / 中文数字"一、" / "数字."
function splitByNumber(text) {
  const chunks = []; let lastNum = 0, m;
  // 中文数字题号（含百，兼容一十/一十一）
  const Q2 = /([一二三四五六七八九十百]+)、/g;
  while ((m = Q2.exec(text)) !== null) {
    const num = cnToNumFull(m[1]);
    if (num > 0 && num <= lastNum + 50) {
      if (chunks.length > 0) chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start, m.index);
      chunks.push({ num, start: m.index + m[0].length });
      lastNum = num;
    }
  }
  if (chunks.length > 0) {
    chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start);
    return chunks.filter(c => c.text && c.text.trim());
  }
  // 数字题号兜底
  const Q3 = /(?:^|\s)(\d{1,3})[.、．]\s+/g;
  while ((m = Q3.exec(text)) !== null) {
    const num = parseInt(m[1], 10);
    if (num > 0 && num <= lastNum + 50) {
      if (chunks.length > 0) chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start, m.index);
      chunks.push({ num, start: m.index + m[0].length });
      lastNum = num;
    }
  }
  if (chunks.length > 0) chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start);
  return chunks.filter(c => c.text && c.text.trim());
}

const cleanText = (s) => (s || '').replace(/[\u00a0\s]+/g, ' ').replace(/\*\*/g, '').replace(/[】\[]/g, ' ').trim();

// 过滤分组标题行（如"一、甲午中日战争的背景与爆发（第1-50题）"）
const isGroupHeader = (s) => /（\s*第\s*\d+\s*[-–~]\s*\d+\s*题\s*）/.test(s) || /（\s*共\s*\d+\s*题\s*）/.test(s);

// 解析选择判断题
function parseChoice(text) {
  const questions = [];
  const normalized = cleanText(text.replace(/\r\n/g, '\n').replace(/\n/g, ' '));
  for (const chunk of splitByNumber(normalized)) {
    let body = cleanText(chunk.text);
    if (!body || body.length < 5 || isGroupHeader(body)) continue;

    // 提取答案（格式："答案：B"、"[**答案：B】"等，答案后可能带"-7"尾缀）
    let answer = '', analysis = '';
    const ansIdx = body.search(/答案\s*[：:]/);
    if (ansIdx >= 0) {
      const ansStr = body.slice(ansIdx);
      body = body.slice(0, ansIdx).trim();
      const am = ansStr.match(/答案\s*[：:]\s*([A-D对错√×判断正确错误]+)/);
      if (am) answer = am[1];
      const an = ansStr.match(/解析\s*[：:]\s*(.+)$/);
      if (an) analysis = an[1];
    }

    // 提取选项
    let options = [];
    const optM = body.match(/[A-D][.．、]\s*[^A-D]+/g);
    if (optM && optM.length >= 2) {
      options = optM.map(o => o.replace(/^[A-D][.．、]\s*/, '').trim()).filter(Boolean);
      const stemM = body.match(/^(.+?)(?=[A-D][.．、])/s);
      if (stemM) body = stemM[1].trim();
    }

    const stem = body.replace(/[（(]\s*[　 ]*\s*[)）]\s*$/, '（　）').trim();
    if (!stem || stem.length < 2) continue;

    let type = 'single';
    if (options.length === 2 && /^[对错√×]/.test(answer)) type = 'judge';
    else if (answer.length > 1 && /^[A-D]+$/.test(answer)) type = 'multiple';

    questions.push({ num: chunk.num, type, stem, options, answer, analysis });
  }
  return questions;
}

// 解析大题
function parseEssay(text) {
  const questions = [];
  const normalized = text.replace(/\r\n/g, '\n');
  for (const chunk of splitByNumber(normalized)) {
    let body = cleanText(chunk.text);
    if (!body || body.length < 5 || isGroupHeader(body)) continue;

    let answer = '';
    const ansIdx = body.search(/答案\s*[：:]/);
    if (ansIdx >= 0) {
      answer = cleanText(body.slice(ansIdx).replace(/^答案\s*[：:]\s*/, ''));
      body = body.slice(0, ansIdx).trim();
    }
    const stem = body.replace(/^题目\s*[：:]\s*/, '').trim();
    if (!stem || stem.length < 2) continue;
    questions.push({ num: chunk.num, type: 'essay', stem, options: [], answer });
  }
  return questions;
}

// 判分兜底（与 fix-empty-options/fix-empty-answer 规则一致）
function sanitize(q) {
  if (q.type === 'essay') {
    if (!q.answer) q.answer = q.stem;
    q.options = [];
    return;
  }
  // options 合并异常 → 转 essay
  if (q.options && q.options.some((opt, i) => i > 0 && /[A-Z][.、．]/.test(opt))) {
    q.type = 'essay';
    if (!q.answer) q.answer = q.stem;
    q.options = [];
    return;
  }
  const ans = String(q.answer || '').trim();
  if (ans) {
    if (q.type === 'judge') {
      q.options = ['对', '错'];
      if (/^(对|√|T|true|正确)$/i.test(ans)) q.answer = '对';
      else if (/^(错|×|F|false|错误)$/i.test(ans)) q.answer = '错';
    }
    return;
  }
  // answer 为空：从 stem 提取
  const m = (q.stem || '').match(/答案[：:]\s*(对|错|√|×|正确|错误|A|B|C|D|T|F)/i);
  if (m && /[（(]\s*[)）]/.test(q.stem || '')) {
    const v = m[1];
    if (/^(对|√|T|正确)$/i.test(v)) q.answer = '对';
    else if (/^(错|×|F|错误)$/i.test(v)) q.answer = '错';
    else q.answer = v.toUpperCase();
    q.stem = (q.stem || '').replace(/[\s]*答案[：:]\s*[^\s。，,；;）)]+/i, '').trim();
    if (!q.options || q.options.length === 0) { q.type = 'judge'; q.options = ['对', '错']; }
    else if (q.type === 'judge') q.options = ['对', '错'];
    return;
  }
  q.type = 'essay';
  q.options = [];
  if (!q.answer) q.answer = q.stem;
}

// 递归查找 docx
function findDocxFiles(dir, base = dir) {
  const out = [];
  for (const item of readdirSync(dir)) {
    if (item.startsWith('~$')) continue;
    const fullPath = join(dir, item);
    if (statSync(fullPath).isDirectory()) {
      out.push(...findDocxFiles(fullPath, base));
    } else if (item.endsWith('.docx') || item.endsWith('.doc')) {
      out.push({ fullPath, relPath: fullPath.substring(base.length + 1), fileName: item });
    }
  }
  return out;
}

for (const { grade, subject, version } of toFix) {
  const versionPath = join(SOURCE_DIR, '历史', grade, version);
  if (!existsSync(versionPath)) { console.log(`目录不存在: ${versionPath}`); continue; }

  const docxFiles = findDocxFiles(versionPath);
  const allQuestions = [];
  let qNum = 0;

  for (const docx of docxFiles) {
    const parts = docx.relPath.split(/[\\\/]/).filter(Boolean);
    if (parts.length < 3) { console.log(`跳过非三层结构: ${docx.relPath}`); continue; }
    const sectionDir = parts[parts.length - 2].trim();
    const chapterDir = parts[parts.length - 3].trim();
    // 课时目录："第X课"开头；源目录偶有笔误漏"课"字（如"第十一 北洋政府的统治"），只要非"单元"名即视为课时
    const isLessonDir = /^第/.test(sectionDir) && !/单元/.test(sectionDir);
    const fileType = (docx.fileName.includes('大题') || docx.fileName.includes('解答')) ? 'essay' : 'choice';

    try {
      const result = await mammoth.extractRawText({ path: docx.fullPath });
      if (!result.value || result.value.length < 10) continue;
      const parsed = fileType === 'essay' ? parseEssay(result.value) : parseChoice(result.value);
      for (const q of parsed) {
        qNum++;
        const item = {
          id: `${subject}_${grade}_${version}_${qNum}_${randomBytes(4).toString('hex')}`,
          type: q.type, subject, grade, version,
          chapter: chapterDir,
          section: isLessonDir ? sectionDir : '',
          stem: q.stem, options: q.options || [], answer: q.answer,
          analysis: q.analysis || '',
          sourceFile: docx.fileName,
        };
        sanitize(item);
        allQuestions.push(item);
      }
    } catch (e) {
      console.error(`解析失败: ${docx.fullPath}: ${e.message}`);
    }
  }

  // 防御：解析异常导致 0 题时不覆盖现有数据
  if (allQuestions.length === 0) {
    console.log(`${version}: 解析出 0 题，跳过写入（保留原数据）`);
    continue;
  }

  writeFileSync(join(Q_DIR, `${subject}_${grade}_${version}.json`), JSON.stringify(allQuestions, null, 0), 'utf8');

  const chapters = new Set(allQuestions.map(q => q.chapter));
  const sections = new Set(allQuestions.map(q => q.section).filter(Boolean));
  const choice = allQuestions.filter(q => q.type !== 'essay').length;
  const essay = allQuestions.filter(q => q.type === 'essay').length;
  console.log(`${grade}|${version}: ${allQuestions.length}题, ${chapters.size}单元, ${sections.size}课时 (选择判断${choice}/大题${essay})`);
}
