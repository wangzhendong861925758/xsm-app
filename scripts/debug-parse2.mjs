// 详细跟踪parseChoiceJudge的执行过程
import mammoth from 'mammoth';
import { readFileSync } from 'fs';

const FILE = 'd:/小四门软件/试题/试题/生物/七年级上册/人教版/第一单元 生物和细胞/第一章 认识生物/选择判断.docx';
const result = await mammoth.extractRawText({ path: FILE });
const text = result.value;

// 模拟 parseChoiceJudge 的处理过程
let normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
normalized = normalized.replace(/第[一二三四五六七八九十]+部分\s+[^第]*?(?:\d+道)?[）)]?\s*/g, ' ');
normalized = normalized.replace(/第\d+框\s+[^第]*?(?:第\d+题[~～]第\d+题)?[）)]?\s*/g, ' ');

function cleanText(s) {
  return s.replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[*＊\s]+$/g, '')
    .replace(/^[*＊\s]+/g, '')
    .replace(/】\s*$/g, '')
    .trim();
}
normalized = cleanText(normalized);

// 找第1题
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

console.log(`=== 共切出 ${chunks.length} 个chunk ===`);
if (chunks.length === 0) {
  console.log('未切出任何chunk！前200字符:');
  console.log(JSON.stringify(normalized.slice(0, 200)));
  console.log('\n可见形式:');
  console.log(normalized.slice(0, 500));
} else {
  console.log(`\n第1个chunk (num=${chunks[0].num}):`);
  console.log(`text长度: ${chunks[0].text.length}`);
  console.log(`text前300字符: ${JSON.stringify(chunks[0].text.slice(0, 300))}`);
  console.log(`\n可见: ${chunks[0].text.slice(0, 300)}`);
}

// 查找所有"第X题"出现的位置
console.log('\n=== "第X题"模式出现位置 ===');
const re = /第(\d+)题/g;
let mm;
let count = 0;
while ((mm = re.exec(normalized)) !== null && count < 5) {
  console.log(`pos=${mm.index} match="${mm[0]}"`);
  count++;
}

// 查找 "1." "2." 等数字开头的题号
console.log('\n=== "数字. " 模式出现位置 ===');
const re2 = /(?:^|\s)(\d+)\.\s/g;
let mm2;
count = 0;
while ((mm2 = re2.exec(normalized)) !== null && count < 10) {
  console.log(`pos=${mm2.index} num=${mm2[1]} 后文="${normalized.slice(mm2.index+mm2[0].length, mm2.index+mm2[0].length+50)}"`);
  count++;
}
