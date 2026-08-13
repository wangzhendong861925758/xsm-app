import mammoth from 'mammoth';
function cleanText(s) {
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').replace(/[*＊\s]+$/g, '').replace(/^[*＊\s]+/g, '').replace(/】\s*$/g, '').trim();
}

const filePath = 'd:/小四门软件/试题/试题/道法/九年级下册/统编版/第一单元 我们共同的世界/第一课 生活在同一个地球/选择判断.docx';
const result = await mammoth.extractRawText({ path: filePath });
let text = result.value;
let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');

// 全局清理章节标题
normalized = normalized.replace(/第[一二三四五六七八九十]+部分\s+[^第]*?(?:\d+道)?[）)]?\s*/g, ' ');
normalized = normalized.replace(/第\d+框\s+[^第]*?(?:第\d+题[~～]第\d+题)?[）)]?\s*/g, ' ');
normalized = cleanText(normalized);

const Q_START = /第(\d+)题[\s\u00a0]+/g;
const chunks = []; let lastNum = 0, m;
while ((m = Q_START.exec(normalized)) !== null) {
  const num = parseInt(m[1]);
  if (num <= lastNum + 200 && num > 0) {
    if (chunks.length > 0) chunks[chunks.length - 1].text = normalized.slice(chunks[chunks.length - 1].start, m.index);
    chunks.push({ num, start: m.index + m[0].length }); lastNum = num;
  }
}
if (chunks.length > 0) chunks[chunks.length - 1].text = normalized.slice(chunks[chunks.length - 1].start);

let single = 0, judge = 0;
for (const chunk of chunks) {
  let body = cleanText(chunk.text);
  body = body.replace(/^\s*(?:第[一二三四五六七八九十]+部分|第\d+框)[^第]*\s*/g, '');
  body = body.replace(/\s*第\d+框\s.*$/g, '');
  body = body.replace(/\s*第[一二三四五六七八九十]+部分\s.*$/g, '');
  body = cleanText(body);

  // 找答案
  const ansIdx = body.search(/[*＊]*\s*答案\s*[：:]/);
  if (ansIdx < 0) continue;
  const afterAns = body.slice(ansIdx);
  const ansPat = [
    /[*＊]*\s*答案\s*[：:]\s*(.+?)(?:[（(]解析[：:]\s*(.+?)[)）])\s*(?:[*＊]*\s*[】\]]\s*)?$/,
    /[*＊]*\s*答案\s*[：:]\s*(.+?)\s*[*＊]*\s*[】\]]\s*$/,
    /[*＊]*\s*答案\s*[：:]\s*(.+)$/,
  ];
  let answer = '', analysis = '';
  for (const pat of ansPat) {
    const idx = body.search(pat);
    if (idx >= 0) {
      const m2 = body.slice(idx).match(pat);
      if (m2) { answer = cleanText(m2[1]); if (m2[2]) analysis = cleanText(m2[2]); break; }
    }
  }
  let stemOpts = cleanText(body.slice(0, ansIdx));

  // 选项识别
  const optPat = /([A-D])\s*[.．、]\s*/g;
  const optMatches = []; let om;
  while ((om = optPat.exec(stemOpts)) !== null) {
    optMatches.push({ letter: om[1], index: om.index, matchLen: om[0].length });
  }
  const hasA = optMatches.some(o => o.letter === 'A');
  const hasOther = optMatches.some(o => o.letter === 'B' || o.letter === 'C' || o.letter === 'D');
  const ansText = answer.replace(/[*＊\s】\]（）()]/g, '');
  const ansHasJudge = /正确|错误|[对错√×]/.test(ansText);

  let type = 'judge';
  if (hasA && hasOther) type = 'single';
  else if (ansHasJudge) type = 'judge';

  if (type === 'single') single++; else judge++;
}

console.log(`切分: ${chunks.length}题, 单选: ${single}, 判断: ${judge}`);
console.log(`\n=== 前3道选择题 ===`);
let shown = 0;
for (const chunk of chunks) {
  if (shown >= 3) break;
  let body = cleanText(chunk.text);
  body = body.replace(/^\s*(?:第[一二三四五六七八九十]+部分|第\d+框)[^第]*\s*/g, '');
  body = cleanText(body);
  const ansIdx = body.search(/[*＊]*\s*答案\s*[：:]/);
  let answer = '', stemOpts = body.slice(0, ansIdx);
  const optPat = /([A-D])\s*[.．、]\s*/g;
  const optMatches = []; let om;
  while ((om = optPat.exec(stemOpts)) !== null) optMatches.push({ letter: om[1], index: om.index, matchLen: om[0].length });
  const hasA = optMatches.some(o => o.letter === 'A');
  const hasOther = optMatches.some(o => o.letter === 'B' || o.letter === 'C' || o.letter === 'D');
  if (!(hasA && hasOther)) continue;

  const optPos = []; const seen = new Set();
  for (const o of optMatches) { if (!seen.has(o.letter)) { seen.add(o.letter); optPos.push(o); } }
  optPos.sort((a,b) => a.index - b.index);
  const firstA = optPos.find(o => o.letter === 'A');
  const stem = cleanText(stemOpts.slice(0, firstA.index));
  const options = [];
  for (let j = 0; j < optPos.length; j++) {
    const s = optPos[j].index + optPos[j].matchLen;
    const e = j + 1 < optPos.length ? optPos[j+1].index : stemOpts.length;
    options.push(cleanText(stemOpts.slice(s, e)));
  }
  console.log(`第${chunk.num}题:`);
  console.log(`  题干: ${stem}`);
  options.forEach((o,i) => console.log(`  ${String.fromCharCode(65+i)}. ${o}`));
  console.log();
  shown++;
}
