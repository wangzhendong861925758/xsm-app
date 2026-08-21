// 全量验证所有304个版本的数据完整性
// 检查项：文件存在、题数>0、有章节、有课时、有选择题、有大题、字段匹配
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

// 读取textbooks.ts
const tbRaw = readFileSync('d:/小四门软件/src/data/textbooks.ts', 'utf8');
const tbMatches = [...tbRaw.matchAll(/\{ grade: "([^"]+)", subject: "([^"]+)", subjectName: "([^"]+)", versions: \[([^\]]+)\] \}/g)];
const allVersions = [];
for (const m of tbMatches) {
  const grade = m[1], subject = m[2];
  const versions = [...m[4].matchAll(/"([^"]+)"/g)].map(x => x[1]);
  for (const v of versions) {
    allVersions.push({ grade, subject, version: v });
  }
}

const norm = (s) => s.replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');

// 构建文件映射
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const qFileMap = {};
for (const f of qFiles) {
  const base = f.replace(/\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  qFileMap[`${subject}|${grade}|${norm(version)}`] = join(Q_DIR, f);
}

// 读取manifest
const manifest = JSON.parse(readFileSync(join(Q_DIR, 'manifest.json'), 'utf8'));
const idxManifest = JSON.parse(readFileSync(join(IDX_DIR, 'manifest.json'), 'utf8'));

console.log(`检查 ${allVersions.length} 个版本...`);

let ok = 0;
const problems = [];

for (let i = 0; i < allVersions.length; i++) {
  const { grade, subject, version } = allVersions[i];
  const key = `${subject}|${grade}|${norm(version)}`;
  const filePath = qFileMap[key];
  
  // 1. 文件存在性
  if (!filePath) {
    problems.push({ grade, subject, version, issue: 'NO_FILE' });
    continue;
  }
  
  let questions;
  try {
    questions = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    problems.push({ grade, subject, version, issue: 'PARSE_ERROR' });
    continue;
  }
  
  // 2. 题数>0
  if (!Array.isArray(questions) || questions.length === 0) {
    problems.push({ grade, subject, version, issue: 'ZERO_QUESTIONS' });
    continue;
  }
  
  // 3. 类型统计
  const types = questions.reduce((a, q) => { a[q.type] = (a[q.type] || 0) + 1; return a; }, {});
  const choiceQs = (types.single || 0) + (types.multiple || 0) + (types.judge || 0);
  const essayQs = types.essay || 0;
  
  // 4. 有章节
  const withChapter = questions.filter(q => q.chapter && q.chapter.trim()).length;
  // 5. 有课时
  const withSection = questions.filter(q => q.section && q.section.trim()).length;
  
  // 6. 字段匹配检查
  const gradeMatch = questions.filter(q => q.grade === grade).length;
  const subjectMatch = questions.filter(q => q.subject === subject).length;
  const versionMatch = questions.filter(q => q.version === version).length;
  
  // 7. manifest登记检查
  const mKey = `${subject}|${grade}`;
  const mEntry = manifest[mKey]?.find(v => v.version === version);
  const idxEntry = idxManifest[mKey]?.find(v => v.version === version);
  
  // 收集问题
  if (choiceQs === 0) problems.push({ grade, subject, version, issue: 'NO_CHOICE', total: questions.length });
  if (essayQs === 0) problems.push({ grade, subject, version, issue: 'NO_ESSAY', total: questions.length });
  if (withChapter === 0) problems.push({ grade, subject, version, issue: 'NO_CHAPTER', total: questions.length });
  if (gradeMatch === 0) problems.push({ grade, subject, version, issue: 'GRADE_MISMATCH', sample: questions[0]?.grade });
  if (subjectMatch === 0) problems.push({ grade, subject, version, issue: 'SUBJECT_MISMATCH', sample: questions[0]?.subject });
  if (!mEntry) problems.push({ grade, subject, version, issue: 'NOT_IN_MANIFEST' });
  if (!idxEntry) problems.push({ grade, subject, version, issue: 'NOT_IN_INDEX' });
  
  ok++;
}

console.log(`\n=== 检查结果 ===`);
console.log(`通过: ${ok} / ${allVersions.length}`);
console.log(`问题数: ${problems.length}`);

if (problems.length > 0) {
  console.log('\n=== 问题详情 ===');
  // 按问题类型分组
  const byType = {};
  for (const p of problems) {
    if (!byType[p.issue]) byType[p.issue] = [];
    byType[p.issue].push(p);
  }
  for (const [issue, items] of Object.entries(byType)) {
    console.log(`\n[${issue}] (${items.length}个):`);
    for (const i of items.slice(0, 20)) {
      const detail = i.sample ? ` (sample: ${i.sample})` : i.total ? ` (total: ${i.total})` : '';
      console.log(`  ${i.grade}|${i.subject}|${i.version}${detail}`);
    }
    if (items.length > 20) console.log(`  ... 还有 ${items.length - 20} 个`);
  }
} else {
  console.log('\n所有版本验证通过！');
}
