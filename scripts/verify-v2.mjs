import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let totalQ = 0, needChoice = 0, needEssay = 0, hasGoodAnalysis = 0;
const badStems = [];

for (const f of files) {
  const data = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  for (const q of data) {
    totalQ++;
    // 检查stem是否包含"答案："（说明没正确切分）
    if (q.stem.includes('答案：') || q.stem.includes('答案:')) {
      if (badStems.length < 5) badStems.push({ file: f, stem: q.stem.slice(0, 100) });
    }
    if (q.type === 'essay') {
      if (q.analysis && q.analysis.length > 10 && q.solution && q.solution.length > 10) hasGoodAnalysis++;
      else needEssay++;
    } else {
      if (q.analysis && q.analysis.length > 10) hasGoodAnalysis++;
      else needChoice++;
    }
  }
}

console.log(`总题数: ${totalQ}`);
console.log(`解析完整: ${hasGoodAnalysis} (${Math.round(hasGoodAnalysis/totalQ*100)}%)`);
console.log(`选择/判断缺解析: ${needChoice}`);
console.log(`大题缺解析: ${needEssay}`);
console.log(`stem含"答案"的: ${badStems.length > 0 ? '有问题!' : '无'}`);
if (badStems.length > 0) {
  badStems.forEach(b => console.log(`  ${b.file}: ${b.stem}`));
}

// 抽查一个大题
const sample = JSON.parse(readFileSync(join(DIR, 'physics_八年级上册_人教版.json'), 'utf8'));
const essaySample = sample.find(q => q.type === 'essay' && q.analysis.length > 20);
if (essaySample) {
  console.log('\n=== 大题样例 ===');
  console.log('题干:', essaySample.stem.slice(0, 100));
  console.log('答案:', (essaySample.answer || '').slice(0, 100));
  console.log('解析:', essaySample.analysis.slice(0, 150));
  console.log('思路:', essaySample.solution.slice(0, 100));
}
