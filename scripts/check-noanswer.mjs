import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let noAns = 0;
for (const f of files) {
  const data = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  for (const q of data) {
    if (!q.answer || q.answer.length === 0) noAns++;
  }
}
console.log(`无答案的题: ${noAns}`);
