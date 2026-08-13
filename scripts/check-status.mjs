// 快速统计所有题目的状态：选项数量分布、解析覆盖率、题型分布
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let total = 0, hasAnalysis = 0, hasOptionAnalysis = 0, badOptCount = 0;
const optDist = {};
const typeDist = {};
const badOptSamples = [];

for (const f of files) {
  let qs;
  try { qs = JSON.parse(readFileSync(join(DIR, f), 'utf8')); } catch(e) { continue; }
  for (const q of qs) {
    total++;
    typeDist[q.type] = (typeDist[q.type] || 0) + 1;
    if (q.type === 'essay') {
      if (q.analysis && q.analysis.length > 10) hasAnalysis++;
    } else {
      if (q.optionAnalysis && Array.isArray(q.optionAnalysis) && q.optionAnalysis.length === q.options.length) {
        hasOptionAnalysis++;
      } else if (q.analysis && q.analysis.length > 10) {
        hasAnalysis++; // 旧格式
      }
      // 选项数量分布
      const n = q.options?.length || 0;
      optDist[n] = (optDist[n] || 0) + 1;
      // 异常选项数量
      if (q.type === 'single' && n !== 4) {
        badOptCount++;
        if (badOptSamples.length < 5) {
          badOptSamples.push({ file: f, stem: q.stem.slice(0, 80), n, options: q.options });
        }
      }
    }
  }
}

console.log('=== 总体状态 ===');
console.log(`总题数: ${total}`);
console.log(`题型分布:`, typeDist);
console.log(`\n=== 选择/判断题选项数量分布 ===`);
Object.entries(optDist).sort((a,b) => a[0]-b[0]).forEach(([n, c]) => {
  console.log(`  ${n}个选项: ${c}题`);
});
console.log(`\n单选题选项数量异常（非4个）: ${badOptCount}题`);
if (badOptSamples.length > 0) {
  console.log('异常样本:');
  badOptSamples.forEach(s => {
    console.log(`  [${s.file}] n=${s.n} stem="${s.stem}..."`);
    console.log(`    options: ${JSON.stringify(s.options)}`);
  });
}

console.log(`\n=== 解析覆盖率 ===`);
console.log(`大题有analysis: ${hasAnalysis}`);
console.log(`选择/判断有optionAnalysis: ${hasOptionAnalysis}`);
