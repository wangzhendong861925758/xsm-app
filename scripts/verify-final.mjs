// 全量验证所有304个版本：每个版本都有选择题+大题+章节+课时
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';

// 读取textbooks.ts
const tbRaw = readFileSync('d:/小四门软件/src/data/textbooks.ts', 'utf8');
const tbMatches = [...tbRaw.matchAll(/\{ grade: "([^"]+)", subject: "([^"]+)", subjectName: "([^"]+)", versions: \[([^\]]+)\] \}/g)];
const allVersions = [];
for (const m of tbMatches) {
  const grade = m[1], subject = m[2];
  const versions = [...m[4].matchAll(/"([^"]+)"/g)].map(x => x[1]);
  for (const v of versions) allVersions.push({ grade, subject, version: v });
}

let ok = 0;
const problems = [];

for (const { grade, subject, version } of allVersions) {
  const filePath = join(Q_DIR, `${subject}_${grade}_${version}.json`);
  if (!existsSync(filePath)) {
    problems.push({ grade, subject, version, issue: 'NO_FILE' });
    continue;
  }
  
  let questions;
  try { questions = JSON.parse(readFileSync(filePath, 'utf8')); } catch {
    problems.push({ grade, subject, version, issue: 'PARSE_ERROR' });
    continue;
  }
  
  if (!Array.isArray(questions) || questions.length === 0) {
    problems.push({ grade, subject, version, issue: 'EMPTY' });
    continue;
  }
  
  // 模拟 PracticePage 过滤
  const base = questions.filter(q => {
    if (q.subject !== subject) return false;
    if (q.grade !== grade) return false;
    if (q.version && version && q.version !== version) return false;
    if (q.type === 'essay') return false;
    return true;
  });
  
  const essays = questions.filter(q => q.type === 'essay');
  const emptySection = questions.filter(q => !q.section || !q.section.trim());
  const chapters = [...new Set(questions.map(q => q.chapter || '未分单元'))];
  const sections = [...new Set(questions.map(q => q.section).filter(Boolean))];
  
  // 检查每个章节是否都有选择题和大题
  const chapterIssues = [];
  for (const ch of chapters) {
    const chChoice = base.filter(q => q.chapter === ch).length;
    const chEssay = essays.filter(q => q.chapter === ch).length;
    if (chChoice === 0) chapterIssues.push({ ch, issue: 'NO_CHOICE' });
    if (chEssay === 0) chapterIssues.push({ ch, issue: 'NO_ESSAY' });
  }
  
  if (base.length === 0) {
    problems.push({ grade, subject, version, issue: 'VERSION_NO_CHOICE', total: questions.length, essay: essays.length });
  } else if (essays.length === 0) {
    problems.push({ grade, subject, version, issue: 'VERSION_NO_ESSAY', total: questions.length, choice: base.length });
  } else if (emptySection.length === questions.length) {
    problems.push({ grade, subject, version, issue: 'ALL_EMPTY_SECTION', total: questions.length });
  } else if (chapterIssues.length > 0) {
    problems.push({ grade, subject, version, issue: 'CHAPTER_ISSUES', chapters: chapters.length, sections: sections.length, chapterIssues });
  } else {
    ok++;
  }
}

console.log(`通过: ${ok} / ${allVersions.length}`);
console.log(`问题: ${problems.length}`);

if (problems.length > 0) {
  const byIssue = {};
  for (const p of problems) {
    if (!byIssue[p.issue]) byIssue[p.issue] = [];
    byIssue[p.issue].push(p);
  }
  for (const [issue, items] of Object.entries(byIssue)) {
    console.log(`\n[${issue}] (${items.length}):`);
    for (const i of items.slice(0, 15)) {
      const detail = i.total !== undefined ? ` 总题${i.total}` : '';
      const chDetail = i.chapterIssues ? ` 章节${i.chapters}/课时${i.sections}, 问题:${i.chapterIssues.map(c => c.ch + ':' + c.issue).join(';')}` : '';
      console.log(`  ${i.grade}|${i.subject}|${i.version}${detail}${chDetail}`);
    }
    if (items.length > 15) console.log(`  ... 还有 ${items.length - 15} 个`);
  }
}
