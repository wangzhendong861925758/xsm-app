import { readFileSync } from 'fs';
import mammoth from 'mammoth';

function cleanText(s) {
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').replace(/[*＊\s]+$/g, '').replace(/^[*＊\s]+/g, '').replace(/】\s*$/g, '').trim();
}

const filePath = 'd:/小四门软件/试题/试题/生物/七年级上册/人教版/第一单元 生物和细胞/第一章 认识生物/选择判断.docx';
const result = await mammoth.extractRawText({ path: filePath });
let text = result.value;
let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
normalized = normalized.replace(/第[一二三四五六七八九十]+部分\s+[^第]*?(?:\d+道)?[）)]?\s*/g, ' ');
normalized = normalized.replace(/第\d+框\s+[^第]*?(?:第\d+题[~～]第\d+题)?[）)]?\s*/g, ' ');
normalized = cleanText(normalized);

// 找第1题
const Q_START = /第(\d+)题[\s\u00a0]+/g;
const m = Q_START.exec(normalized);
if (m) {
  const start = m.index + m[0].length;
  const m2 = Q_START.exec(normalized);
  const end = m2 ? m2.index : start + 500;
  const chunk1 = normalized.slice(start, end);
  
  console.log('=== 第1题原始文本 ===');
  console.log(JSON.stringify(chunk1));
  console.log('\n=== 可读形式 ===');
  console.log(chunk1);
  
  // 找答案位置
  const ansIdx = chunk1.search(/[*＊]*\s*答案\s*[：:]/);
  console.log('\n答案位置:', ansIdx);
  
  const stemAndOpts = ansIdx > 0 ? cleanText(chunk1.slice(0, ansIdx)) : chunk1;
  console.log('\n=== stemAndOptions ===');
  console.log(JSON.stringify(stemAndOpts));
  
  // 测试选项正则
  const optionPattern = /([A-D])\s*[.．、]\s*/g;
  const optMatches = [];
  let om;
  while ((om = optionPattern.exec(stemAndOpts)) !== null) {
    optMatches.push({ letter: om[1], index: om.index, matchLen: om[0].length, match: om[0] });
  }
  console.log('\n=== 选项匹配 ===');
  optMatches.forEach(o => {
    const ctx = stemAndOpts.slice(Math.max(0, o.index - 5), o.index + 20);
    console.log(`  letter=${o.letter} index=${o.index} match="${o.match}" context="...${ctx}..."`);
  });
}
