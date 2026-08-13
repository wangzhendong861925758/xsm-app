import mammoth from 'mammoth';

const filePath = 'd:/小四门软件/试题/试题/道法/九年级下册/统编版/第一单元 我们共同的世界/第一课 生活在同一个地球/选择判断.docx';
const result = await mammoth.extractRawText({ path: filePath });
const text = result.value;
console.log('=== 原始文本（前3000字符）===');
console.log(text.slice(0, 3000));
console.log('\n=== 总长度 ===', text.length);
