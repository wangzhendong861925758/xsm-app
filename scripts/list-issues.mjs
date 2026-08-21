// 输出问题列表到JSON文件（避免编码问题）
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
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

const issues = [];
for (const { grade, subject, version } of allVersions) {
  const key = `${subject}|${grade}|${norm(version)}`;
  const filePath = qFileMap[key];
  if (!filePath) { issues.push({ grade, subject, version, issue: 'NO_FILE' }); continue; }
  let questions;
  try { questions = JSON.parse(readFileSync(filePath, 'utf8')); } catch { continue; }
  if (!Array.isArray(questions) || questions.length === 0) continue;
  
  const choiceQs = questions.filter(q => q.type === 'single' || q.type === 'multiple' || q.type === 'judge').length;
  const essayQs = questions.filter(q => q.type === 'essay').length;
  
  if (choiceQs === 0) issues.push({ grade, subject, version, issue: 'NO_CHOICE', total: questions.length, choice: 0, essay: essayQs });
  if (essayQs === 0) issues.push({ grade, subject, version, issue: 'NO_ESSAY', total: questions.length, choice: choiceQs, essay: 0 });
}

writeFileSync('d:/小四门软件/scripts/_issues.json', JSON.stringify(issues, null, 2), 'utf8');
console.log(`问题数: ${issues.length}`);
console.log(JSON.stringify(issues, null, 2));
