// 重建 manifest.json（包含所有题目文件，不按 source 字段过滤）
// 同时为缺失 .idx.json 的文件生成章节索引
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

// === 1. 扫描所有 .json 题目文件 ===
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
console.log(`扫描到 ${qFiles.length} 个题目文件`);

// === 2. 为缺失 .idx.json 的文件生成章节索引 ===
let idxGenerated = 0;
let idxExisting = 0;
for (const f of qFiles) {
  const idxFile = f.replace(/\.json$/, '.idx.json');
  const idxPath = join(IDX_DIR, idxFile);
  if (existsSync(idxPath)) {
    idxExisting++;
    continue;
  }
  try {
    const arr = JSON.parse(readFileSync(join(Q_DIR, f), 'utf8'));
    const chapterMap = new Map();
    for (const q of arr) {
      const ch = q.chapter || '未分单元';
      const sec = q.section || '';
      if (!chapterMap.has(ch)) chapterMap.set(ch, new Map());
      const secMap = chapterMap.get(ch);
      if (!secMap.has(sec)) secMap.set(sec, { choice: 0, essay: 0, judge: 0 });
      const cnt = secMap.get(sec);
      if (q.type === 'essay') cnt.essay++;
      else if (q.type === 'judge') cnt.judge++;
      else cnt.choice++;
    }
    const index = [];
    for (const [ch, secMap] of chapterMap) {
      const sections = [];
      for (const [sec, cnt] of secMap) {
        sections.push({ title: sec, ...cnt });
      }
      index.push({ chapter: ch, sections });
    }
    writeFileSync(idxPath, JSON.stringify(index));
    idxGenerated++;
  } catch (e) {
    console.warn(`  生成索引失败 ${f}: ${e.message}`);
  }
}
console.log(`章节索引: ${idxExisting} 个已存在, ${idxGenerated} 个新生成`);

// === 3. 重建 questions/manifest.json ===
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
  const key = `${subject}|${grade}`;
  if (!manifest[key]) manifest[key] = [];
  // 去重（按 version）
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

// === 5. 输出版本清单供验证 ===
const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
const SUBJECT_ORDER = ['physics','chemistry','biology','history','politics','geography'];
const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };

let report = '\n=== 完整版本清单 ===\n\n';
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
writeFileSync('d:/小四门软件/scripts/_all_versions.txt', report);
console.log(report);
