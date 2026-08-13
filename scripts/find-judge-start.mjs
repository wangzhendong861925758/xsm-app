import mammoth from 'mammoth';

function cleanText(s) {
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').replace(/[*＊\s]+$/g, '').replace(/^[*＊\s]+/g, '').replace(/】\s*$/g, '').trim();
}

const filePath = 'd:/小四门软件/试题/试题/道法/九年级下册/统编版/第一单元 我们共同的世界/第一课 生活在同一个地球/选择判断.docx';
const result = await mammoth.extractRawText({ path: filePath });
const text = result.value;
let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');

// 找"第二部分"或"判断题"标记
const judgeStart = normalized.indexOf('判断题');
const judgeStart2 = normalized.indexOf('第二部分');
console.log('"判断题"位置:', judgeStart, '"第二部分"位置:', judgeStart2);

// 看看第60-80题的答案
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

for (let i = 65; i < 80 && i < chunks.length; i++) {
  const c = chunks[i];
  const body = cleanText(c.text);
  const ansMatch = body.match(/[*＊]*\s*答案\s*[：:]\s*(.+?)(?:[（(]解析[：:]\s*(.+?)[)）])?\s*(?:[*＊]*\s*[】\]]\s*)?$/);
  if (ansMatch) {
    const answer = cleanText(ansMatch[1]);
    const hasABCD = /[A-D]\s*[.．、]/.test(body);
    console.log(`第${c.num}题: hasABCD=${hasABCD}, answer="${answer.slice(0,30)}"`);
  }
}
