// 扫描 public/data/questions/ 下所有分片，按 subject|grade 分组输出实际版本
// 同时输出 question-index 的实际版本，用于对照 textbooks.ts
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

function scan(dir) {
  const files = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'manifest.json');
  const groups = {};
  for (const f of files) {
    const base = f.replace(/\.json$/, '').replace(/\.idx$/, '');
    const parts = base.split('_');
    if (parts.length < 3) continue;
    const subject = parts[0];
    const version = parts[parts.length - 1];
    const grade = parts.slice(1, -1).join('_');
    const key = `${subject}|${grade}`;
    if (!groups[key]) groups[key] = new Set();
    groups[key].add(version);
  }
  return groups;
}

const qGroups = scan(Q_DIR);
const idxGroups = scan(IDX_DIR);

const allKeys = new Set([...Object.keys(qGroups), ...Object.keys(idxGroups)]);
const sortedKeys = [...allKeys].sort();

console.log('subject|grade | 题目分片版本数 | 索引分片版本数 | 版本列表');
console.log('---|---|---|---');
for (const k of sortedKeys) {
  const qSet = qGroups[k] || new Set();
  const iSet = idxGroups[k] || new Set();
  const versions = [...qSet].sort();
  console.log(`${k} | ${qSet.size} | ${iSet.size} | ${versions.join(' / ')}`);
}

// 输出为可粘贴的 TypeScript 片段
console.log('\n\n=== textbooks.ts 片段（按实际数据生成）===\n');
const byGrade = {};
for (const k of sortedKeys) {
  const [subject, grade] = k.split('|');
  if (!byGrade[grade]) byGrade[grade] = [];
  const versions = [...(qGroups[k] || [])].sort();
  byGrade[grade].push({ subject, versions });
}

// 学科中文名
const SUBJECT_NAMES = {
  physics: '物理', chemistry: '化学', biology: '生物',
  history: '历史', politics: '道法', geography: '地理',
};

// 按年级固定顺序输出
const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
for (const grade of GRADE_ORDER) {
  if (!byGrade[grade]) continue;
  console.log(`\n  // ===== ${grade} =====`);
  for (const { subject, versions } of byGrade[grade]) {
    const name = SUBJECT_NAMES[subject] || subject;
    const vStr = versions.map(v => `"${v}"`).join(', ');
    console.log(`  { grade: "${grade}", subject: "${subject}", subjectName: "${name}", versions: [${vStr}] },`);
  }
}
