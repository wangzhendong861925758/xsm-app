import mammoth from 'mammoth';
const filePath = 'd:/小四门软件/试题/试题/道法/九年级下册/统编版/第一单元 我们共同的世界/第一课 生活在同一个地球/选择判断.docx';
const result = await mammoth.extractRawText({ path: filePath });
const text = result.value;
// 看"第二部分"之后的内容
const p2 = text.indexOf('第二部分');
console.log('第二部分位置:', p2, '文本总长:', text.length);
if (p2 >= 0) {
  console.log('\n=== 第二部分开始 ===');
  console.log(text.slice(p2, p2 + 3000));
} else {
  // 看看11000之后
  console.log('=== 11000之后 ===');
  console.log(text.slice(11000));
}
