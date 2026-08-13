// 测试大题解析
import mammoth from 'mammoth';

const FILE = 'd:/小四门软件/试题/试题/生物/七年级上册/人教版/第一单元 生物和细胞/第一章 认识生物/大题.docx';

function cleanText(s) {
  return s.replace(/\u00a0/g, ' ').replace(/\u3000/g, ' ').replace(/\s+/g, ' ')
    .replace(/[*＊\s]+$/g, '').replace(/^[*＊\s]+/g, '').replace(/】\s*$/g, '').trim();
}
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
  if (chunks.length > 0) { chunks[chunks.length - 1].text = text.slice(chunks[chunks.length - 1].start); return chunks; }
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

const result = await mammoth.extractRawText({ path: FILE });
const text = result.value;
let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
normalized = removeHeaders(normalized);
normalized = cleanText(normalized);

const chunks = splitByNumber(normalized);
console.log(`=== 大题文件切出 ${chunks.length} 个chunk ===\n`);

for (let i = 0; i < Math.min(3, chunks.length); i++) {
  const chunk = chunks[i];
  let body = cleanText(chunk.text);
  body = removeHeaders(body);
  body = cleanText(body);
  body = body.replace(/^问\s*[：:]\s*/, '');

  const ansIdx = body.search(/[*＊]*\s*答案?\s*[：:]/);
  if (ansIdx <= 0) { console.log(`题${chunk.num}: 无答案标记`); continue; }
  const stem = cleanText(body.slice(0, ansIdx));
  const afterAns = body.slice(ansIdx);
  const answer = cleanText(afterAns.replace(/[*＊]*\s*答案?\s*[：:]\s*/, '').replace(/[*＊\s】\]]+$/g, ''));

  console.log(`题${chunk.num}:`);
  console.log(`  stem: "${stem.slice(0, 100)}"`);
  console.log(`  answer: "${answer.slice(0, 150)}"`);
  console.log();
}
