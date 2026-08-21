// 清理存根文件 + 重建 manifest + 生成缺失的 idx 索引
// 存根判定：题目对象无 source:"imported" 字段（开发时生成的测试占位数据）
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

// === 1. 扫描 questions 目录，区分存根与真实上传 ===
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const stubFiles = [];
const realFiles = [];

for (const f of qFiles) {
  try {
    const arr = JSON.parse(readFileSync(join(Q_DIR, f), 'utf8'));
    if (!Array.isArray(arr) || arr.length === 0) {
      stubFiles.push(f); // 空文件也删
      continue;
    }
    // 真实上传的题目都有 source:"imported"
    const isReal = arr[0].source === 'imported';
    if (isReal) {
      realFiles.push(f);
    } else {
      stubFiles.push(f);
    }
  } catch {
    stubFiles.push(f); // 解析失败的也删
  }
}

console.log(`=== 扫描结果 ===`);
console.log(`真实上传: ${realFiles.length} 个文件`);
console.log(`存根文件: ${stubFiles.length} 个文件`);

// === 2. 删除存根 .json 和对应的 .idx.json ===
let deleted = 0;
for (const f of stubFiles) {
  // 删除 questions 下的存根
  try { unlinkSync(join(Q_DIR, f)); deleted++; } catch {}
  // 删除 question-index 下对应的 .idx.json
  const idxFile = f.replace(/\.json$/, '.idx.json');
  try { unlinkSync(join(IDX_DIR, idxFile)); } catch {}
}
console.log(`已删除 ${deleted} 个存根 .json 文件（及其 .idx.json）`);

// === 3. 为缺少 .idx.json 的真实上传生成章节索引 ===
let idxGenerated = 0;
let idxExisting = 0;
for (const f of realFiles) {
  const idxFile = f.replace(/\.json$/, '.idx.json');
  const idxPath = join(IDX_DIR, idxFile);
  if (existsSync(idxPath)) {
    idxExisting++;
    continue;
  }
  // 从 .json 内容生成 .idx.json
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

// === 4. 重建 questions/manifest.json ===
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
  // 去重（按 version）
  if (!manifest[key].some(e => e.version === version)) {
    manifest[key].push({ version, file: f, count });
  }
}
writeFileSync(join(Q_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nquestions/manifest.json: ${Object.keys(manifest).length} 个 subject|grade 组`);

// === 5. 重建 question-index/manifest.json ===
const idxManifest = {};
const idxFiles = readdirSync(IDX_DIR).filter(f => f.endsWith('.idx.json'));
for (const f of idxFiles) {
  const base = f.replace(/\.idx\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  // 读取题数（从 questions manifest 获取）
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

// === 6. 输出最终版本清单供验证 ===
let report = '\n=== 最终版本清单（仅真实上传） ===\n\n';
const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
const SUBJECT_ORDER = ['physics','chemistry','biology','history','politics','geography'];
const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };

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
console.log(`\n版本清单已写入 scripts/_final_versions.txt`);
