// 调试单个文件的原始文本和解析过程
import mammoth from 'mammoth';

const FILE = 'd:/小四门软件/试题/试题/生物/七年级上册/人教版/第一单元 生物和细胞/第一章 认识生物/选择判断.docx';
const result = await mammoth.extractRawText({ path: FILE });
const text = result.value;

// 找第一题
const m = text.match(/第1题[\s\u00a0]+([\s\S]{0,800})/);
if (m) {
  console.log('=== 第一题原始文本（前800字符） ===');
  console.log(JSON.stringify(m[1].slice(0, 500)));
  console.log('\n=== 可见形式 ===');
  console.log(m[1].slice(0, 500));
}

// 查找所有 "A." 出现的位置
console.log('\n=== 前10个 A. 出现位置 ===');
const re = /([A-D])\s*[.．、]/g;
let mm;
let count = 0;
while ((mm = re.exec(text)) !== null && count < 10) {
  console.log(`pos=${mm.index} match="${mm[0]}" 前文="${text.slice(Math.max(0, mm.index-15), mm.index)}" 后文="${text.slice(mm.index+mm[0].length, mm.index+mm[0].length+30)}"`);
  count++;
}
