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
let lastNum = 0;
let m;
while ((m = Q_START.exec(normalized)) !== null) {
  const num = parseInt(m[1]);
  if (num <= lastNum + 200 && num > 0) {
    if (chunks.length > 0) {
      chunks[chunks.length - 1].text = normalized.slice(chunks[chunks.length - 1].start, m.index);
    }
    chunks.push({ num, start: m.index + m[0].length });
    lastNum = num;
  }
}
if (chunks.length > 0) {
  chunks[chunks.length - 1].text = normalized.slice(chunks[chunks.length - 1].start);
}

console.log(`切分得到 ${chunks.length} 道题\n`);

let choiceCount = 0, judgeCount = 0;
for (let i = 0; i < Math.min(chunks.length, 10); i++) {
  const chunk = chunks[i];
  let body = cleanText(chunk.text);

  const ansMatch = body.match(/[*＊]*\s*答案\s*[：:]\s*(.+?)(?:[（(]解析[：:]\s*(.+?)[)）])?\s*(?:[*＊]*\s*[】\]]\s*)?$/);
  let answer = '', analysis = '';
  let stemOpts = body;
  if (ansMatch) {
    const ansIdx = body.search(/[*＊]*\s*答案\s*[：:]/);
    stemOpts = cleanText(body.slice(0, ansIdx));
    answer = cleanText(ansMatch[1]);
    if (ansMatch[2]) analysis = cleanText(ansMatch[2]);
  }

  const optPat = /([A-D])\s*[.．、]\s*/g;
  const opts = [];
  let om;
  while ((om = optPat.exec(stemOpts)) !== null) {
    opts.push({ letter: om[1], idx: om.index });
  }

  const hasOpts = opts.length >= 2 && opts.some(o => o.letter === 'A');
  const type = hasOpts ? '选择' : '判断';
  if (type === '选择') choiceCount++; else judgeCount++;

  console.log(`第${chunk.num}题 [${type}]`);
  console.log(`  题干+选项: ${stemOpts.slice(0, 150)}...`);
  console.log(`  答案: ${answer}${analysis ? ', 解析: ' + analysis.slice(0, 80) : ''}`);
  console.log();
}

// 检查判断题
console.log('=== 后10题 ===');
for (let i = Math.max(0, chunks.length - 10); i < chunks.length; i++) {
  const chunk = chunks[i];
  let body = cleanText(chunk.text);
  const ansMatch = body.match(/[*＊]*\s*答案\s*[：:]\s*(.+?)(?:[（(]解析[：:]\s*(.+?)[)）])?\s*(?:[*＊]*\s*[】\]]\s*)?$/);
  let answer = '', analysis = '';
  if (ansMatch) { answer = cleanText(ansMatch[1]); if (ansMatch[2]) analysis = cleanText(ansMatch[2]); }
  console.log(`第${chunk.num}题 答案: ${answer}${analysis ? ' (有解析)' : ''}`);
}

console.log(`\n选择题: ${choiceCount}, 判断题: ${judgeCount}, 总计: ${chunks.length}`);
