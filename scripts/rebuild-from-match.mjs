// 基于匹配结果重建 textbooks.ts 和 manifest.json
// 只显示有题目文件的版本（用户清单 ∩ 文件）
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

// 读取匹配结果
const matchedConfig = JSON.parse(readFileSync('d:/小四门软件/scripts/_matched_config.json', 'utf8'));

// 手动修正：九年级下册物理 "科教版（2012）" 匹配到用户清单的"教科版(2012)"
const key = 'physics|九年级下册';
const extraKey = 'physics|九年级下册';
// 找到科教版（2012）文件
try {
  const arr = JSON.parse(readFileSync(join(Q_DIR, 'physics_九年级下册_科教版（2012）.json'), 'utf8'));
  matchedConfig[key].push({ version: '科教版（2012）', file: 'physics_九年级下册_科教版（2012）.json', count: arr.length });
} catch {}

// === 1. 重建 questions/manifest.json ===
const manifest = {};
for (const [key, entries] of Object.entries(matchedConfig)) {
  if (entries.length === 0) continue;
  manifest[key] = entries.map(e => ({ version: e.version, file: e.file, count: e.count }));
}
writeFileSync(join(Q_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

// === 2. 重建 question-index/manifest.json ===
const idxManifest = {};
const idxFiles = readdirSync(IDX_DIR).filter(f => f.endsWith('.idx.json'));
const idxFileSet = new Set(idxFiles);
for (const [key, entries] of Object.entries(matchedConfig)) {
  if (entries.length === 0) continue;
  idxManifest[key] = [];
  for (const e of entries) {
    const idxFile = e.file.replace(/\.json$/, '.idx.json');
    if (idxFileSet.has(idxFile)) {
      idxManifest[key].push({ version: e.version, file: idxFile, count: e.count });
    }
  }
}
writeFileSync(join(IDX_DIR, 'manifest.json'), JSON.stringify(idxManifest, null, 2));

// === 3. 生成 textbooks.ts ===
const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
const SUBJECT_ORDER = ['physics','chemistry','biology','history','politics','geography'];
const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };

let tbCode = `import type { TextbookConfig } from "./types";\n\nexport const TEXTBOOKS: TextbookConfig[] = [\n`;
let totalVersions = 0;
for (const grade of GRADE_ORDER) {
  let hasAny = false;
  let gradeCode = '';
  for (const subject of SUBJECT_ORDER) {
    const key = `${subject}|${grade}`;
    const entries = matchedConfig[key] || [];
    if (entries.length === 0) continue;
    if (!hasAny) {
      gradeCode += `\n  // ===== ${grade} =====\n`;
      hasAny = true;
    }
    const versions = entries.map(e => `"${e.version}"`).join(', ');
    gradeCode += `  { grade: "${grade}", subject: "${subject}", subjectName: "${SUBJECT_NAMES[subject]}", versions: [${versions}] },\n`;
    totalVersions += entries.length;
  }
  tbCode += gradeCode;
}
tbCode += `];\n\nexport function getTextbooksByGrade(grade: string): TextbookConfig[] {\n  return TEXTBOOKS.filter((t) => t.grade === grade);\n}\n\nexport function getTextbook(grade: string, subject: Subject): TextbookConfig | undefined {\n  return TEXTBOOKS.find((t) => t.grade === grade && t.subject === subject);\n}\n`;

writeFileSync('d:/小四门软件/src/data/textbooks.ts', tbCode);
console.log(`已生成 textbooks.ts，共 ${totalVersions} 个版本`);
console.log(`manifest.json: ${Object.values(manifest).flat().length} 个版本`);
console.log(`question-index/manifest.json: ${Object.values(idxManifest).flat().length} 个版本`);

// === 4. 输出最终清单 ===
let report = '\n=== 最终显示的教材版本 ===\n';
for (const grade of GRADE_ORDER) {
  let hasAny = false;
  for (const subject of SUBJECT_ORDER) {
    const key = `${subject}|${grade}`;
    const entries = matchedConfig[key] || [];
    if (entries.length === 0) continue;
    if (!hasAny) {
      report += `\n【${grade}】\n`;
      hasAny = true;
    }
    const vList = entries.map(e => `${e.version}(${e.count}题)`).join(' / ');
    report += `  ${SUBJECT_NAMES[subject]}: ${entries.length}版 — ${vList}\n`;
  }
}
report += `\n总计: ${totalVersions} 个版本\n`;
writeFileSync('d:/小四门软件/scripts/_final_display.txt', report);
console.log(report);
