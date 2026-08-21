// 扫描所有版本的章节和题目情况，找出缺少章节/题目的版本
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

// 读取textbooks.ts获取所有版本
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
console.log(`总版本数: ${allVersions.length}`);

// 检查每个版本的题目文件
const norm = (s) => s.replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');

// 获取所有题目文件名
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const qFileMap = {};
for (const f of qFiles) {
  const base = f.replace(/\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  qFileMap[`${subject}|${grade}|${norm(version)}`] = f;
}

// 检查每个版本
const issues = [];
for (const { grade, subject, version } of allVersions) {
  const key = `${subject}|${grade}|${norm(version)}`;
  const file = qFileMap[key];
  
  if (!file) {
    issues.push({ grade, subject, version, issue: 'NO_FILE', count: 0, withChapter: 0 });
    continue;
  }
  
  const filePath = join(Q_DIR, file);
  let questions = [];
  try {
    questions = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    issues.push({ grade, subject, version, issue: 'PARSE_ERROR', count: 0, withChapter: 0 });
    continue;
  }
  
  if (!Array.isArray(questions) || questions.length === 0) {
    issues.push({ grade, subject, version, issue: 'ZERO_QUESTIONS', count: 0, withChapter: 0 });
    continue;
  }
  
  // 检查有章节的题目数
  const withChapter = questions.filter(q => q.chapter && q.chapter.trim());
  
  if (withChapter.length === 0) {
    issues.push({ grade, subject, version, issue: 'NO_CHAPTER', count: questions.length, withChapter: 0 });
  } else if (withChapter.length < questions.length * 0.5) {
    issues.push({ grade, subject, version, issue: 'LOW_CHAPTER', count: questions.length, withChapter: withChapter.length });
  }
}

console.log(`\n问题版本数: ${issues.length}`);
for (const i of issues) {
  console.log(`  ${i.grade}|${i.subject}|${i.version}: ${i.issue} (题数=${i.count}, 有章节=${i.withChapter})`);
}

// 输出可共享的版本（同学段同学科有章节题目的版本）
console.log('\n=== 可共享源版本（按 学段|学科 分组）===');
const shareableMap = {};
for (const { grade, subject, version } of allVersions) {
  const key = `${grade}|${subject}`;
  if (!shareableMap[key]) shareableMap[key] = [];
  const file = qFileMap[`${subject}|${grade}|${norm(version)}`];
  if (!file) continue;
  let questions = [];
  try {
    questions = JSON.parse(readFileSync(join(Q_DIR, file), 'utf8'));
  } catch { continue; }
  const withChapter = questions.filter(q => q.chapter && q.chapter.trim());
  if (withChapter.length > 0) {
    shareableMap[key].push({ version, count: withChapter.length });
  }
}

// 输出需要共享的版本（有问题的版本）
console.log('\n=== 需要共享的版本 ===');
for (const i of issues) {
  if (i.issue === 'NO_CHAPTER' || i.issue === 'ZERO_QUESTIONS' || i.issue === 'LOW_CHAPTER') {
    const key = `${i.grade}|${i.subject}`;
    const sources = shareableMap[key] || [];
    console.log(`${i.grade}|${i.subject}|${i.version} (${i.issue}) → 可用源: ${sources.map(s => s.version+'('+s.count+')').join(', ')}`);
  }
}
