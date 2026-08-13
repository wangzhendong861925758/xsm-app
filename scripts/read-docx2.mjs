import mammoth from 'mammoth';

const filePath = 'd:/小四门软件/试题/试题/道法/九年级下册/统编版/第一单元 我们共同的世界/第一课 生活在同一个地球/选择判断.docx';
const result = await mammoth.extractRawText({ path: filePath });
const text = result.value;
console.log('=== 文本后半部分（判断题区域）===');
console.log(text.slice(6000, 12971));
