// 检查AI生成的解析质量
import { readFileSync } from 'fs';

const FILE = 'd:/小四门软件/public/data/questions/biology_七年级上册_人教版.json';
const qs = JSON.parse(readFileSync(FILE, 'utf8'));

// 找有optionAnalysis的选择题
const withAnalysis = qs.filter(q => q.optionAnalysis && Array.isArray(q.optionAnalysis) && q.optionAnalysis.length === q.options.length);
console.log(`总题数: ${qs.length}`);
console.log(`有optionAnalysis的选择/判断题: ${withAnalysis.length}`);

// 显示前3道有解析的题
console.log('\n=== 前3道有解析的选择题 ===');
withAnalysis.slice(0, 3).forEach((q, i) => {
  console.log(`\n--- 题${i+1} [${q.type}] ---`);
  console.log(`stem: ${q.stem}`);
  q.options.forEach((o, j) => {
    const isCorrect = q.answer === String.fromCharCode(65 + j);
    console.log(`  ${String.fromCharCode(65+j)}. ${o} ${isCorrect ? '✓' : ''}`);
  });
  console.log(`answer: ${q.answer}`);
  console.log(`optionAnalysis:`);
  q.optionAnalysis.forEach((a, j) => {
    console.log(`  ${String.fromCharCode(65+j)}: ${a}`);
  });
});
