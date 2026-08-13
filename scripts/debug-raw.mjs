import mammoth from 'mammoth';

const filePath = 'd:/小四门软件/试题/试题/生物/七年级上册/人教版/第一单元 生物和细胞/第一章 认识生物/选择判断.docx';
const result = await mammoth.extractRawText({ path: filePath });
let text = result.value;
console.log('=== 前2000字符 ===');
console.log(text.slice(0, 2000));
console.log('\n=== 字符码 ===');
for (let i = 0; i < Math.min(300, text.length); i++) {
  const c = text[i];
  if (c.charCodeAt(0) > 127 || c === '\n' || c === '\r') {
    console.log(`  pos ${i}: "${c}" (U+${c.charCodeAt(0).toString(16)})`);
  }
}
