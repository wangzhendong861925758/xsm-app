// 扫描 public/data/questions/ 下所有分片，输出 textbooks.ts 片段
// 以实际上传题目的文件名为准，剔除前导空格
import { readdirSync, writeFileSync } from 'fs';
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
    const version = parts[parts.length - 1].trim(); // 去除前后空格
    const grade = parts.slice(1, -1).join('_').trim();
    const key = `${subject}|${grade}`;
    if (!groups[key]) groups[key] = new Set();
    groups[key].add(version);
  }
  return groups;
}

const qGroups = scan(Q_DIR);
const idxGroups = scan(IDX_DIR);

// 合并两个目录的版本（取并集）
const allKeys = new Set([...Object.keys(qGroups), ...Object.keys(idxGroups)]);

const byGrade = {};
for (const k of allKeys) {
  const [subject, grade] = k.split('|');
  if (!byGrade[grade]) byGrade[grade] = [];
  const versions = [...new Set([...(qGroups[k] || []), ...(idxGroups[k] || [])])].sort();
  byGrade[grade].push({ subject, versions });
}

const SUBJECT_NAMES = {
  physics: '物理', chemistry: '化学', biology: '生物',
  history: '历史', politics: '道法', geography: '地理',
};

// 学科固定顺序
const SUBJECT_ORDER = ['physics', 'chemistry', 'biology', 'history', 'politics', 'geography'];
const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];

let totalEntries = 0;
let out = 'import type { TextbookConfig } from "./types";\n\n';
out += 'export const TEXTBOOKS: TextbookConfig[] = [\n';
for (const grade of GRADE_ORDER) {
  if (!byGrade[grade]) continue;
  out += `\n  // ===== ${grade} =====\n`;
  const items = byGrade[grade].sort((a, b) => SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject));
  for (const { subject, versions } of items) {
    const name = SUBJECT_NAMES[subject] || subject;
    const vStr = versions.map(v => `"${v}"`).join(', ');
    out += `  { grade: "${grade}", subject: "${subject}", subjectName: "${name}", versions: [${vStr}] },\n`;
    totalEntries++;
  }
}
out += '];\n\n';
out += `export function getTextbooksByGrade(grade: string): TextbookConfig[] {\n`;
out += `  return TEXTBOOKS.filter((t) => t.grade === grade);\n`;
out += `}\n\n`;
out += `export function getTextbook(grade: string, subject: Subject): TextbookConfig | undefined {\n`;
out += `  return TEXTBOOKS.find((t) => t.grade === grade && t.subject === subject);\n`;
out += `}\n`;

writeFileSync('d:/小四门软件/scripts/_textbooks_output.txt', out);
console.log(`已写入 ${totalEntries} 条配置到 scripts/_textbooks_output.txt`);

// 验证关键学段
console.log('\n=== 验证 ===');
const verify = (key) => {
  const versions = qGroups[key] || [];
  console.log(`${key}: ${versions.length} 个版本 -> ${[...versions].sort().join(' / ')}`);
};
verify('chemistry|九年级上册');
verify('chemistry|九年级下册');
verify('history|八年级上册');
verify('history|八年级下册');
