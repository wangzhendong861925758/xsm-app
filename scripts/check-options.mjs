import { readFileSync } from 'fs';

const questions = JSON.parse(readFileSync('d:/小四门软件/public/data/questions/biology_七年级上册_人教版.json', 'utf8'));

// 找前5道single题
const singles = questions.filter(q => q.type === 'single').slice(0, 5);
console.log(`=== 前5道选择题 ===`);
singles.forEach((q, i) => {
  console.log(`\n${i+1}. stem: "${q.stem}"`);
  console.log(`   options (${q.options.length}): ${JSON.stringify(q.options)}`);
  console.log(`   answer: ${q.answer}`);
  console.log(`   chapter: ${q.chapter}, section: ${q.section}`);
});

// 统计选项数量分布
const optCounts = {};
questions.filter(q => q.type === 'single').forEach(q => {
  const n = q.options.length;
  optCounts[n] = (optCounts[n] || 0) + 1;
});
console.log('\n=== 选项数量分布 ===');
Object.entries(optCounts).sort((a,b) => a[0]-b[0]).forEach(([n, c]) => {
  console.log(`  ${n}个选项: ${c}题`);
});
