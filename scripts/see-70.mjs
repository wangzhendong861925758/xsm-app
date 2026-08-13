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
// 第69题（索68）第70题（69）第71题（70）
for (let i = 68; i <= 72 && i < chunks.length; i++) {
  const c = chunks[i];
  const body = cleanText(c.text);
  console.log(`=== 第${c.num}题 原始body (长度${body.length}) ===`);
  console.log(body);
  console.log();
}
