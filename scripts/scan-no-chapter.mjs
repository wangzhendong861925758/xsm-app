// 扫描所有题目文件，找出"未分单元"的版本（无 chapter 字段或 chapter 为空）
// 这些是可能被错误归类的版本，需要逐一审查
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const noChapter = [];
const withChapter = [];

for (const f of files) {
  try {
    const arr = JSON.parse(readFileSync(join(Q_DIR, f), 'utf8'));
    if (!Array.isArray(arr) || arr.length === 0) continue;
    
    const base = f.replace(/\.json$/, '');
    const parts = base.split('_');
    if (parts.length < 3) continue;
    const subject = parts[0];
    const version = parts[parts.length - 1];
    const grade = parts.slice(1, -1).join('_');
    
    // 统计 chapter 字段
    const withChCount = arr.filter(q => q.chapter && q.chapter !== '未分单元').length;
    const noChCount = arr.length - withChCount;
    const first = arr[0];
    
    const info = {
      file: f,
      subject, grade, version,
      count: arr.length,
      withChapter: withChCount,
      noChapter: noChCount,
      firstId: first.id,
      firstStem: (first.stem || '').slice(0, 50),
      isStub: !first.source || first.source !== 'imported',
    };
    
    if (withChCount === 0) {
      noChapter.push(info);
    } else {
      withChapter.push(info);
    }
  } catch (e) {}
}

// 按学科|年级分组
const groupBy = (list) => {
  const g = {};
  for (const item of list) {
    const key = `${item.subject}|${item.grade}`;
    if (!g[key]) g[key] = [];
    g[key].push(item);
  }
  return g;
};

const noChGroups = groupBy(noChapter);

let report = `=== "未分单元"的版本（无 chapter 字段）===\n共 ${noChapter.length} 个文件\n\n`;
const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };
const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];

for (const grade of GRADE_ORDER) {
  let hasAny = false;
  for (const subject of Object.keys(SUBJECT_NAMES)) {
    const key = `${subject}|${grade}`;
    const items = noChGroups[key] || [];
    if (items.length > 0) {
      if (!hasAny) {
        report += `【${grade}】\n`;
        hasAny = true;
      }
      report += `  ${SUBJECT_NAMES[subject]}:\n`;
      for (const i of items.sort((a,b) => a.version.localeCompare(b.version))) {
        report += `    ${i.version} — ${i.count}题 — ID:${i.firstId} — "${i.firstStem}"\n`;
      }
    }
  }
  if (hasAny) report += '\n';
}

console.log(report);
import { writeFileSync } from 'fs';
writeFileSync('d:/小四门软件/scripts/_no_chapter_report.txt', report);
console.log(`\n有 chapter 的版本: ${withChapter.length}`);
console.log(`无 chapter 的版本: ${noChapter.length}`);
