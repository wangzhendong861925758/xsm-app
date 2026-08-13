// 清理解析/答案/思路末尾的页码噪音（-1, -22, -19-21 等）
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const PAGE_NOISE = /-\d+(-\d+)*\s*$/;

const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
let fixed = 0;

for (const f of files) {
  const data = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  let changed = false;
  for (const q of data) {
    for (const field of ['stem', 'answer', 'analysis', 'solution']) {
      if (typeof q[field] === 'string' && PAGE_NOISE.test(q[field])) {
        q[field] = q[field].replace(PAGE_NOISE, '').trim();
        changed = true;
        fixed++;
      }
    }
    if (Array.isArray(q.answer)) {
      // 多选答案是数组，不用处理
    }
    // 选项也清理
    if (Array.isArray(q.options)) {
      for (let i = 0; i < q.options.length; i++) {
        if (PAGE_NOISE.test(q.options[i])) {
          q.options[i] = q.options[i].replace(PAGE_NOISE, '').trim();
          changed = true;
          fixed++;
        }
      }
    }
  }
  if (changed) writeFileSync(join(DIR, f), JSON.stringify(data));
}

console.log(`清理完成，共修复 ${fixed} 处页码噪音`);
