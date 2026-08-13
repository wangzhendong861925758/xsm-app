import mammoth from 'mammoth';
function cleanText(s) {
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').replace(/[*＊\s]+$/g, '').replace(/^[*＊\s]+/g, '').replace(/】\s*$/g, '').trim();
}
const filePath = 'd:/小四门软件/试题/试题/道法/九年级下册/统编版/第一单元 我们共同的世界/第一课 生活在同一个地球/选择判断.docx';
const result = await mammoth.extractRawText({ path: filePath });
const text = result.value;
let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
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

console.log(`总chunks: ${chunks.length}`);
console.log(`索引100-102是第二部分(判断题区):`);
for (let i = 100; i < 103; i++) {
  const c = chunks[i];
  const body = cleanText(c.text);
  console.log(`chunk[${i}] 题号=${c.num}: ${body.slice(0,150)}`);
}
console.log(`\n索引198-199:`);
for (let i = 198; i < chunks.length; i++) {
  const c = chunks[i];
  const body = cleanText(c.text);
  console.log(`chunk[${i}] 题号=${c.num}: ${body.slice(0,150)}`);
}
// 统计
let judgeCount = 0;
for (let i = 100; i < chunks.length; i++) {
  const body = cleanText(chunks[i].text);
  const hasABCD = /[A-D]\s*[.．、]/.test(body);
  if (!hasABCD) judgeCount++;
}
console.log(`\n索引100以后没有A-D选项的(判断题): ${judgeCount}/${chunks.length - 100}`);
