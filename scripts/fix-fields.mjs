// 全量修复题目数据中缺失的grade/subject/version字段
// 根据文件名推断正确的值并写入每道题
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';

// 文件名格式: ${subject}_${grade}_${version}.json
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let totalFixed = 0;
let totalFiles = 0;

for (const f of qFiles) {
  const filePath = join(Q_DIR, f);
  let questions;
  try {
    questions = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch { continue; }
  if (!Array.isArray(questions) || questions.length === 0) continue;
  
  // 从文件名解析字段
  const base = f.replace(/\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  
  let changed = false;
  for (const q of questions) {
    if (q.grade !== grade) { q.grade = grade; changed = true; }
    if (q.subject !== subject) { q.subject = subject; changed = true; }
    if (q.version !== version) { q.version = version; changed = true; }
  }
  
  if (changed) {
    writeFileSync(filePath, JSON.stringify(questions, null, 2));
    totalFixed++;
  }
  totalFiles++;
}

console.log(`扫描 ${totalFiles} 个文件`);
console.log(`修复 ${totalFixed} 个文件的 grade/subject/version 字段`);
