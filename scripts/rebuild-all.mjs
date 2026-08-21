// 重建 manifest.json 和 textbooks.ts，包含所有有题目的版本
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

// 扫描所有题目文件
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const idxFiles = readdirSync(IDX_DIR).filter(f => f.endsWith('.idx.json'));

// 重建 questions/manifest.json
const manifest = {};
for (const f of qFiles) {
  const base = f.replace(/\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  let count = 0;
  try {
    const arr = JSON.parse(readFileSync(join(Q_DIR, f), 'utf8'));
    count = Array.isArray(arr) ? arr.length : 0;
  } catch {}
  if (count === 0) continue; // 跳过0题的版本
  const key = `${subject}|${grade}`;
  if (!manifest[key]) manifest[key] = [];
  if (!manifest[key].some(e => e.version === version)) {
    manifest[key].push({ version, file: f, count });
  }
}
writeFileSync(join(Q_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

// 重建 question-index/manifest.json
const idxManifest = {};
const idxFileSet = new Set(idxFiles);
for (const [key, entries] of Object.entries(manifest)) {
  idxManifest[key] = [];
  for (const e of entries) {
    const idxFile = e.file.replace(/\.json$/, '.idx.json');
    if (idxFileSet.has(idxFile)) {
      idxManifest[key].push({ version: e.version, file: idxFile, count: e.count });
    }
  }
}
writeFileSync(join(IDX_DIR, 'manifest.json'), JSON.stringify(idxManifest, null, 2));

// 生成 textbooks.ts
const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
const SUBJECT_ORDER = ['physics','chemistry','biology','history','politics','geography'];
const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };

let tbCode = `import type { TextbookConfig } from "./types";\n\nexport const TEXTBOOKS: TextbookConfig[] = [\n`;
let totalVersions = 0;
let report = '';
for (const grade of GRADE_ORDER) {
  let hasAny = false;
  let gradeCode = '';
  let gradeReport = '';
  for (const subject of SUBJECT_ORDER) {
    const key = `${subject}|${grade}`;
    const entries = manifest[key] || [];
    if (entries.length === 0) continue;
    if (!hasAny) {
      gradeCode += `\n  // ===== ${grade} =====\n`;
      gradeReport += `\n【${grade}】\n`;
      hasAny = true;
    }
    const versions = entries.map(e => `"${e.version}"`).join(', ');
    gradeCode += `  { grade: "${grade}", subject: "${subject}", subjectName: "${SUBJECT_NAMES[subject]}", versions: [${versions}] },\n`;
    const vList = entries.map(e => `${e.version}(${e.count}题)`).join(' / ');
    gradeReport += `  ${SUBJECT_NAMES[subject]}: ${entries.length}版 — ${vList}\n`;
    totalVersions += entries.length;
  }
  tbCode += gradeCode;
  report += gradeReport;
}
tbCode += `];\n\nexport function getTextbooksByGrade(grade: string): TextbookConfig[] {\n  return TEXTBOOKS.filter((t) => t.grade === grade);\n}\n\nexport function getTextbook(grade: string, subject: Subject): TextbookConfig | undefined {\n  return TEXTBOOKS.find((t) => t.grade === grade && t.subject === subject);\n}\n`;

writeFileSync('d:/小四门软件/src/data/textbooks.ts', tbCode);
report += `\n总计: ${totalVersions} 个版本\n`;
console.log(report);
writeFileSync('d:/小四门软件/scripts/_final_versions.txt', report);
