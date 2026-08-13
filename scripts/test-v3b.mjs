import mammoth from 'mammoth';

function cleanText(s) {
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ')
    .replace(/[*＊\s]+$/g, '').replace(/^[*＊\s]+/g, '')
    .replace(/】\s*$/g, '').trim();
}

const filePath = 'd:/小四门软件/试题/试题/道法/九年级下册/统编版/第一单元 我们共同的世界/第一课 生活在同一个地球/选择判断.docx';
const result = await mammoth.extractRawText({ path: filePath });
const text = result.value;

let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
const Q_START = /第(\d+)题[\s\u00a0]+/g;
const chunks = [];
let lastNum = 0, m;
while ((m = Q_START.exec(normalized)) !== null) {
  const num = parseInt(m[1]);
  if (num <= lastNum + 200 && num > 0) {
    if (chunks.length > 0) chunks[chunks.length - 1].text = normalized.slice(chunks[chunks.length - 1].start, m.index);
    chunks.push({ num, start: m.index + m[0].length });
    lastNum = num;
  }
}
if (chunks.length > 0) chunks[chunks.length - 1].text = normalized.slice(chunks[chunks.length - 1].start);

let choiceCount = 0, judgeCount = 0;
for (const chunk of chunks) {
  let body = cleanText(chunk.text);
  const ansIdx = body.search(/[*＊]*\s*答案\s*[：:]/);
  if (ansIdx < 0) continue;
  const afterAns = body.slice(ansIdx);
  const ansMatch = afterAns.match(/[*＊]*\s*答案\s*[：:]\s*(.+?)(?:[（(]解析[：:]\s*(.+?)[)）])?\s*(?:[*＊]*\s*[】\]]\s*)?$/);
  let answer = '', analysis = '';
  let stemOpts = cleanText(body.slice(0, ansIdx));
  if (ansMatch) { answer = cleanText(ansMatch[1]); if (ansMatch[2]) analysis = cleanText(ansMatch[2]); }

  const optPat = /([A-D])\s*[.．、]\s*/g;
  const optMatches = [];
  let om;
  while ((om = optPat.exec(stemOpts)) !== null) {
    optMatches.push({ letter: om[1], index: om.index, matchLen: om[0].length });
  }
  const hasA = optMatches.some(o => o.letter === 'A');
  const hasOther = optMatches.some(o => o.letter === 'B' || o.letter === 'C' || o.letter === 'D');
  let type = 'judge', options = ['正确', '错误'], stem = stemOpts;
  if (hasA && hasOther) {
    type = 'single';
    const optPos = [];
    const seen = new Set();
    for (const o of optMatches) { if (!seen.has(o.letter)) { seen.add(o.letter); optPos.push(o); } }
    optPos.sort((a,b) => a.index - b.index);
    const firstA = optPos.find(o => o.letter === 'A');
    stem = cleanText(stemOpts.slice(0, firstA.index));
    options = [];
    for (let i = 0; i < optPos.length; i++) {
      const s = optPos[i].index + optPos[i].matchLen;
      const e = i + 1 < optPos.length ? optPos[i+1].index : stemOpts.length;
      const t = cleanText(stemOpts.slice(s, e));
      if (t) options.push(t);
    }
  }
  // 答案标准化
  const at = answer.replace(/[*＊\s】\]]/g, '');
  if (/正确|[对√]/.test(at)) answer = 'A';
  else if (/错误|[错×]/.test(at)) answer = 'B';
  else answer = at.replace(/[^A-D]/g, '');

  if (type === 'single') choiceCount++; else judgeCount++;
}

console.log(`总题数: ${chunks.length}, 选择题: ${choiceCount}, 判断题: ${judgeCount}`);

// 验证前3道选择和后3道判断
console.log('\n=== 前3道选择题 ===');
for (let i = 0; i < 3; i++) {
  const chunk = chunks[i];
  let body = cleanText(chunk.text);
  const ansIdx = body.search(/[*＊]*\s*答案\s*[：:]/);
  const afterAns = body.slice(ansIdx);
  const ansMatch = afterAns.match(/[*＊]*\s*答案\s*[：:]\s*(.+?)(?:[（(]解析[：:]\s*(.+?)[)）])?\s*(?:[*＊]*\s*[】\]]\s*)?$/);
  let answer = cleanText(ansMatch[1]);
  let stemOpts = cleanText(body.slice(0, ansIdx));
  const optPat = /([A-D])\s*[.．、]\s*/g;
  const optMatches = []; let om;
  while ((om = optPat.exec(stemOpts)) !== null) optMatches.push({ letter: om[1], index: om.index, matchLen: om[0].length });
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
  const at = answer.replace(/[*＊\s】\]]/g, '');
  const ans = /正确|[对√]/.test(at) ? 'A(正确)' : /错误|[错×]/.test(at) ? 'B(错误)' : at;
  console.log(`第${chunk.num}题:`);
  console.log(`  题干: ${stem}`);
  options.forEach((o, j) => console.log(`  ${String.fromCharCode(65+j)}. ${o}`));
  console.log(`  答案: ${ans}\n`);
}

console.log('=== 判断题样例(第91-93题) ===');
for (let i = 90; i < 93 && i < chunks.length; i++) {
  const chunk = chunks[i];
  let body = cleanText(chunk.text);
  const ansIdx = body.search(/[*＊]*\s*答案\s*[：:]/);
  const afterAns = body.slice(ansIdx);
  const ansMatch = afterAns.match(/[*＊]*\s*答案\s*[：:]\s*(.+?)(?:[（(]解析[：:]\s*(.+?)[)）])?\s*(?:[*＊]*\s*[】\]]\s*)?$/);
  let answer = cleanText(ansMatch[1]);
  let analysis = ansMatch[2] ? cleanText(ansMatch[2]) : '';
  let stemOpts = cleanText(body.slice(0, ansIdx));
  const optPat = /([A-D])\s*[.．、]\s*/g;
  const optMatches = []; let om;
  while ((om = optPat.exec(stemOpts)) !== null) optMatches.push({ letter: om[1], index: om.index });
  const hasA = optMatches.some(o => o.letter === 'A');
  const hasOther = optMatches.some(o => o.letter === 'B' || o.letter === 'C' || o.letter === 'D');
  const isJudge = !(hasA && hasOther);
  const at = answer.replace(/[*＊\s】\]]/g, '');
  const stdAns = /正确|[对√]/.test(at) ? '正确' : /错误|[错×]/.test(at) ? '错误' : at;
  console.log(`第${chunk.num}题 [${isJudge ? '判断' : '选择'}] 题干: ${stemOpts.slice(0,100)} 答案: ${stdAns}${analysis ? ' 解析: ' + analysis.slice(0,60) : ''}`);
}
