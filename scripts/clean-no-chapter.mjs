// 清理无 chapter 字段的占位题文件，重建 manifest 和 textbooks.ts
// 以用户上传的题目为准（有 chapter 字段），删除开发时编写的占位题
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

// === 1. 扫描所有题目文件，区分有chapter（真实上传）和无chapter（占位题）===
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const stubFiles = [];   // 无chapter的占位题
const realFiles = [];   // 有chapter的真实上传

for (const f of qFiles) {
  try {
    const arr = JSON.parse(readFileSync(join(Q_DIR, f), 'utf8'));
    if (!Array.isArray(arr) || arr.length === 0) {
      stubFiles.push(f);
      continue;
    }
    // 检查是否有 chapter 字段（用户上传的题目都有 chapter）
    const withChapter = arr.filter(q => q.chapter && q.chapter !== '未分单元').length;
    if (withChapter === 0) {
      stubFiles.push(f);
    } else {
      realFiles.push(f);
    }
  } catch {
    stubFiles.push(f);
  }
}

console.log(`=== 扫描结果 ===`);
console.log(`真实上传（有chapter）: ${realFiles.length} 个文件`);
console.log(`占位题（无chapter）: ${stubFiles.length} 个文件`);

// === 2. 删除占位题 .json 和对应的 .idx.json ===
let deleted = 0;
for (const f of stubFiles) {
  try { unlinkSync(join(Q_DIR, f)); deleted++; } catch {}
  const idxFile = f.replace(/\.json$/, '.idx.json');
  try { unlinkSync(join(IDX_DIR, idxFile)); } catch {}
}
console.log(`已删除 ${deleted} 个占位题文件`);

// === 3. 重建 questions/manifest.json ===
const manifest = {};
for (const f of realFiles) {
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
  const key = `${subject}|${grade}`;
  if (!manifest[key]) manifest[key] = [];
  if (!manifest[key].some(e => e.version === version)) {
    manifest[key].push({ version, file: f, count });
  }
}
writeFileSync(join(Q_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`questions/manifest.json: ${Object.keys(manifest).length} 个 subject|grade 组`);

// === 4. 重建 question-index/manifest.json ===
const idxManifest = {};
const idxFiles = readdirSync(IDX_DIR).filter(f => f.endsWith('.idx.json'));
for (const f of idxFiles) {
  const base = f.replace(/\.idx\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  const key = `${subject}|${grade}`;
  const qEntry = manifest[key]?.find(e => e.version === version);
  const count = qEntry?.count || 0;
  if (!idxManifest[key]) idxManifest[key] = [];
  if (!idxManifest[key].some(e => e.version === version)) {
    idxManifest[key].push({ version, file: f, count });
  }
}
writeFileSync(join(IDX_DIR, 'manifest.json'), JSON.stringify(idxManifest, null, 2));
console.log(`question-index/manifest.json: ${Object.keys(idxManifest).length} 个 subject|grade 组`);

// === 5. 输出最终版本清单 ===
const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
const SUBJECT_ORDER = ['physics','chemistry','biology','history','politics','geography'];
const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };

let report = '\n=== 最终版本清单（仅真实上传，有chapter） ===\n\n';
let totalVersions = 0;
for (const grade of GRADE_ORDER) {
  let gradeEntries = [];
  for (const subject of SUBJECT_ORDER) {
    const key = `${subject}|${grade}`;
    const versions = manifest[key] || [];
    if (versions.length > 0) {
      gradeEntries.push({ subject, versions });
      totalVersions += versions.length;
    }
  }
  if (gradeEntries.length > 0) {
    report += `【${grade}】\n`;
    for (const { subject, versions } of gradeEntries) {
      const vList = versions.map(v => `${v.version}(${v.count}题)`).join(' / ');
      report += `  ${SUBJECT_NAMES[subject]}: ${versions.length}版 — ${vList}\n`;
    }
    report += '\n';
  }
}
report += `总计: ${totalVersions} 个版本\n`;
writeFileSync('d:/小四门软件/scripts/_final_versions.txt', report);
console.log(report);
