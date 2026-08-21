// 对比源docx文件和已解析JSON，找出section为空的版本的源文件
import { readdirSync, existsSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SOURCE_DIR = 'D:/小四门软件/试题/试题';
const Q_DIR = 'd:/小四门软件/public/data/questions';

const SUBJECT_DIR = {
  biology: '生物', history: '历史', politics: '道法',
  geography: '地理', chemistry: '化学', physics: '物理'
};

// 读取textbooks.ts
const tbRaw = readFileSync('d:/小四门软件/src/data/textbooks.ts', 'utf8');
const tbMatches = [...tbRaw.matchAll(/\{ grade: "([^"]+)", subject: "([^"]+)", subjectName: "([^"]+)", versions: \[([^\]]+)\] \}/g)];
const allVersions = [];
for (const m of tbMatches) {
  const grade = m[1], subject = m[2];
  const versions = [...m[4].matchAll(/"([^"]+)"/g)].map(x => x[1]);
  for (const v of versions) allVersions.push({ grade, subject, version: v });
}

const norm = (s) => s.replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');

// 源目录结构：学科 > 年级 > 版本
function scanSource(grade, subjectCn, version) {
  const subjPath = join(SOURCE_DIR, subjectCn);
  if (!existsSync(subjPath)) return null;
  const gradePath = join(subjPath, grade);
  if (!existsSync(gradePath)) return null;
  
  const versionDirs = readdirSync(gradePath).filter(d => {
    const fullPath = join(gradePath, d);
    return statSync(fullPath).isDirectory();
  });
  
  // 尝试精确匹配
  let versionDir = versionDirs.find(d => d === version);
  if (!versionDir) {
    versionDir = versionDirs.find(d => norm(d) === norm(version));
  }
  if (!versionDir) {
    versionDir = versionDirs.find(d => {
      return d.replace(/[（()）\s]/g, '') === version.replace(/[（()）\s]/g, '');
    });
  }
  if (!versionDir) return null;
  
  const versionPath = join(gradePath, versionDir);
  const files = readdirSync(versionPath).filter(f => f.endsWith('.docx') || f.endsWith('.doc'));
  return { path: versionPath, files, dirName: versionDir };
}

// 检查 section 为空的版本
const norm2 = (s) => s.replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const qFileMap = {};
for (const f of qFiles) {
  const base = f.replace(/\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  qFileMap[`${subject}|${grade}|${norm2(version)}`] = { file: f, path: join(Q_DIR, f) };
}

// 输出JSON避免编码问题

let checkedCount = 0;
let foundSourceCount = 0;
let noSourceCount = 0;
const results = [];

for (const { grade, subject, version } of allVersions) {
  const key = `${subject}|${grade}|${norm2(version)}`;
  const fileEntry = qFileMap[key];
  if (!fileEntry) continue;
  
  let questions;
  try { questions = JSON.parse(readFileSync(fileEntry.path, 'utf8')); } catch { continue; }
  if (!Array.isArray(questions) || questions.length === 0) continue;
  
  // 检查是否有 section 为空的题目
  const emptySectionCount = questions.filter(q => !q.section || !q.section.trim()).length;
  const totalChoice = questions.filter(q => q.type !== 'essay').length;
  const emptySectionChoice = questions.filter(q => (!q.section || !q.section.trim()) && q.type !== 'essay').length;
  
  if (emptySectionCount === 0) continue; // 所有题目都有section，跳过
  
  checkedCount++;
  
  // 查找源文件
  const subjectCn = SUBJECT_DIR[subject];
  const source = scanSource(grade, subjectCn, version);
  
  if (source) {
    foundSourceCount++;
    results.push({
      grade, subject, version,
      totalQuestions: questions.length,
      emptySection: emptySectionCount,
      totalChoice,
      emptySectionChoice,
      sourcePath: source.path,
      sourceFiles: source.files,
      fileCount: source.files.length
    });
  } else {
    noSourceCount++;
    results.push({
      grade, subject, version,
      totalQuestions: questions.length,
      emptySection: emptySectionCount,
      totalChoice,
      emptySectionChoice,
      sourcePath: 'NOT_FOUND',
      fileCount: 0
    });
  }
}

writeFileSync('d:/小四门软件/scripts/_source_result.json', JSON.stringify({
  checkedCount,
  foundSourceCount,
  noSourceCount,
  results
}, null, 2), 'utf8');
console.log(`checked: ${checkedCount}, foundSource: ${foundSourceCount}, noSource: ${noSourceCount}`);
