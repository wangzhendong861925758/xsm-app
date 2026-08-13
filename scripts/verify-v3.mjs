// 快速验证选择题/判断题切分质量
import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('d:/小四门软件/public/data/questions/politics_九年级下册_统编版.json', 'utf8'));
console.log(`总题数: ${data.length}`);

const single = data.filter(q => q.type === 'single');
const judge = data.filter(q => q.type === 'judge');
const essay = data.filter(q => q.type === 'essay');
console.log(`单选: ${single.length}, 判断: ${judge.length}, 大题: ${essay.length}`);

console.log('\n=== 前5道选择题 ===');
single.slice(0, 5).forEach((q, i) => {
  console.log(`${i+1}. 题干: ${q.stem.slice(0, 100)}`);
  q.options.forEach((o, j) => console.log(`   ${String.fromCharCode(65+j)}. ${o.slice(0, 80)}`));
  console.log(`   答案: ${q.answer}`);
  console.log();
});

console.log('\n=== 前5道判断题 ===');
judge.slice(0, 5).forEach((q, i) => {
  console.log(`${i+1}. 题干: ${q.stem.slice(0, 100)}`);
  console.log(`   选项: ${q.options.join('/')}`);
  console.log(`   答案: ${q.answer}`);
  console.log();
});

console.log('\n=== 污染检查（题干/答案/分析含"第X框"或"第一部分"） ===');
let polluted = 0;
data.forEach(q => {
  const fields = [q.stem, q.answer, q.analysis].join(' ');
  if (/第\d+框|第[一二三四五六七八九十]+部分\s*选择题|第[一二三四五六七八九十]+部分\s*判断题/.test(fields)) {
    polluted++;
    if (polluted <= 5) console.log(`- 污染: ${q.stem.slice(0,100)}`);
  }
});
console.log(`污染题数: ${polluted}`);

console.log('\n=== 无答案题 ===');
let noAns = 0;
data.forEach(q => {
  if (!q.answer && q.type !== 'essay') { noAns++; if (noAns <= 3) console.log(`- ${q.stem.slice(0,80)}`); }
});
console.log(`无答案题数: ${noAns}`);
