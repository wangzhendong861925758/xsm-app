// 为缺失题型的版本从同学段同学科其他版本共享题目
// NO_ESSAY: 缺大题 → 从兄弟版本复制essay题
// NO_CHOICE: 缺选择题 → 从兄弟版本复制choice题（single/multiple/judge）
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

const Q_DIR = 'd:/小四门软件/public/data/questions';

const norm = (s) => s.replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');

// 读取textbooks.ts
const tbRaw = readFileSync('d:/小四门软件/src/data/textbooks.ts', 'utf8');
const tbMatches = [...tbRaw.matchAll(/\{ grade: "([^"]+)", subject: "([^"]+)", subjectName: "([^"]+)", versions: \[([^\]]+)\] \}/g)];
const gradeSubjectVersions = {};
for (const m of tbMatches) {
  const grade = m[1], subject = m[2];
  const versions = [...m[4].matchAll(/"([^"]+)"/g)].map(x => x[1]);
  const key = `${grade}|${subject}`;
  if (!gradeSubjectVersions[key]) gradeSubjectVersions[key] = [];
  gradeSubjectVersions[key].push(...versions);
}

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
  qFileMap[`${subject}|${grade}|${norm(version)}`] = { file: f, path: join(Q_DIR, f), grade, subject, version };
}

// 19个问题版本
const issues = JSON.parse(readFileSync('d:/小四门软件/scripts/_issues.json', 'utf8'));

// 按学段+学科分组，找到可共享的源
function findSourceQuestions(grade, subject, targetType) {
  const siblings = gradeSubjectVersions[`${grade}|${subject}`] || [];
  for (const sv of siblings) {
    const key = `${subject}|${grade}|${norm(sv)}`;
    const entry = qFileMap[key];
    if (!entry) continue;
    let questions;
    try { questions = JSON.parse(readFileSync(entry.path, 'utf8')); } catch { continue; }
    const target = questions.filter(q => q.type === targetType || 
      (targetType === 'choice' && (q.type === 'single' || q.type === 'multiple' || q.type === 'judge')));
    if (target.length > 0) return { questions: target, sourceVersion: sv };
  }
  return null;
}

let totalShared = 0;
const results = [];

for (const issue of issues) {
  const { grade, subject, version, issue: issueType } = issue;
  const key = `${subject}|${grade}|${norm(version)}`;
  const entry = qFileMap[key];
  if (!entry) { console.log(`文件不存在: ${key}`); continue; }
  
  let questions;
  try { questions = JSON.parse(readFileSync(entry.path, 'utf8')); } catch { continue; }
  
  // 确定需要共享的题型
  let targetType, missingType;
  if (issueType === 'NO_ESSAY') {
    targetType = 'essay';
  } else if (issueType === 'NO_CHOICE') {
    targetType = 'choice'; // single/multiple/judge
  } else continue;
  
  // 找源
  const source = findSourceQuestions(grade, subject, targetType);
  if (!source) {
    results.push({ ...issue, action: 'NO_SOURCE', shared: 0 });
    continue;
  }
  
  // 复制题目，修改ID和version
  const sharedQuestions = source.questions.map(q => ({
    ...q,
    id: `${q.id}_shared_${randomBytes(4).toString('hex')}`,
    version: version, // 改为目标版本
    chapter: q.chapter || '共享题目',
    section: q.section || '',
  }));
  
  // 合并到目标文件
  const merged = [...questions, ...sharedQuestions];
  writeFileSync(entry.path, JSON.stringify(merged, null, 2));
  
  totalShared += sharedQuestions.length;
  results.push({
    grade, subject, version,
    issue: issueType,
    sourceVersion: source.sourceVersion,
    sharedCount: sharedQuestions.length,
    originalCount: questions.length,
    newTotal: merged.length,
  });
}

console.log('=== 共享结果 ===');
for (const r of results) {
  console.log(`${r.grade}|${r.subject}|${r.version}: ${r.issue} → 从"${r.sourceVersion}"共享${r.sharedCount}题 (${r.originalCount}→${r.newTotal})`);
}
console.log(`\n总共享题数: ${totalShared}`);
