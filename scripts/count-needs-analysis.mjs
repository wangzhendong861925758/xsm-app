import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let totalQ = 0, needChoice = 0, needEssay = 0, hasAnalysis = 0, hasSolution = 0;

for (const f of files) {
  const data = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  for (const q of data) {
    totalQ++;
    if (q.type === 'choice' || q.type === 'judge') {
      // 选择题需要 optionAnalysis 数组
      if (!q.optionAnalysis || !Array.isArray(q.optionAnalysis) || q.optionAnalysis.length !== q.options.length) needChoice++;
      if (q.analysis && q.analysis.length > 0) hasAnalysis++;
    } else if (q.type === 'essay') {
      // 大题需要 analysis 和 solution
      if (!q.analysis || q.analysis.length < 5) needEssay++;
      else hasAnalysis++;
      if (q.solution && q.solution.length > 5) hasSolution++;
    }
  }
}

console.log(`总题数: ${totalQ}`);
console.log(`选择/判断需生成optionAnalysis: ${needChoice}`);
console.log(`大题需生成analysis: ${needEssay}`);
console.log(`大题需生成solution: ${needEssay}`);
console.log(`已有解析: ${hasAnalysis}`);
