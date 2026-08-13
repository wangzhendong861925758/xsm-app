import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let totalQ = 0, noAnalysis = 0, noSolution = 0;

for (const f of files) {
  const data = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  for (const q of data) {
    totalQ++;
    if (!q.analysis || q.analysis.length < 5) noAnalysis++;
    if (!q.solution || q.solution.length < 5) noSolution++;
  }
}

console.log(`总题数: ${totalQ}`);
console.log(`无错题解析: ${noAnalysis}`);
console.log(`无正确思路: ${noSolution}`);
console.log(`覆盖率: ${Math.round((totalQ - noAnalysis)/totalQ*100)}% 有解析, ${Math.round((totalQ - noSolution)/totalQ*100)}% 有思路`);
