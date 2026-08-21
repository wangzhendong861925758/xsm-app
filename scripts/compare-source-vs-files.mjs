// 对比源目录(304版本) vs 题目文件(209版本)，找出缺失的95个版本
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 读取源目录扫描结果
const sourceConfig = JSON.parse(readFileSync('d:/小四门软件/scripts/_source_config.json', 'utf8'));

// 读取现有题目文件
const Q_DIR = 'd:/小四门软件/public/data/questions';
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const fileConfig = {}; // key=subject|grade, value=[{version, n1, n2, file}]

const norm1 = (s) => s.replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');
const norm2 = (s) => s.replace(/[（(）)\s]/g, '');

for (const f of qFiles) {
  const base = f.replace(/\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  const key = `${subject}|${grade}`;
  if (!fileConfig[key]) fileConfig[key] = [];
  fileConfig[key].push({ version, n1: norm1(version), n2: norm2(version), file: f });
}

// 对比
const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };
const SUBJECT_ORDER = ['physics','chemistry','biology','history','politics','geography'];

let report = '';
let totalMissing = 0;
let totalMatched = 0;
let totalExtra = 0;
const missingList = []; // 待生成的版本

for (const grade of GRADE_ORDER) {
  report += `\n【${grade}】\n`;
  for (const subject of SUBJECT_ORDER) {
    const key = `${subject}|${grade}`;
    const sourceVersions = Object.keys(sourceConfig[key] || {});
    const fileEntries = fileConfig[key] || [];
    if (sourceVersions.length === 0) continue;
    
    const matchedFiles = new Set();
    const missing = [];
    for (const sv of sourceVersions) {
      const svN1 = norm1(sv);
      const svN2 = norm2(sv);
      // 精确匹配
      let found = fileEntries.find(fe => fe.n1 === svN1);
      if (!found) found = fileEntries.find(fe => fe.n2 === svN2);
      if (found && !matchedFiles.has(found.file)) {
        matchedFiles.add(found.file);
        totalMatched++;
      } else {
        missing.push(sv);
        totalMissing++;
        missingList.push({ subject, grade, version: sv, fileCount: sourceConfig[key][sv] });
      }
    }
    
    const extra = fileEntries.filter(fe => !matchedFiles.has(fe.file));
    totalExtra += extra.length;
    
    if (missing.length === 0 && extra.length === 0) {
      report += `  ✓ ${SUBJECT_NAMES[subject]}: ${sourceVersions.length}版全部匹配\n`;
    } else {
      report += `  ${SUBJECT_NAMES[subject]}: 源${sourceVersions.length}版, 匹配${sourceVersions.length-missing.length}, 缺失${missing.length}, 多余${extra.length}\n`;
      if (missing.length > 0) {
        report += `    ✗ 缺失题目文件: ${missing.map(v => `${v}(${sourceConfig[key][v]}文件)`).join(' / ')}\n`;
      }
      if (extra.length > 0) {
        report += `    ⚠ 多余题目文件: ${extra.map(e => e.version).join(' / ')}\n`;
      }
    }
  }
}

report += `\n=== 汇总 ===\n`;
report += `源目录版本: 304\n`;
report += `已生成题目文件: ${totalMatched}\n`;
report += `缺失题目文件: ${totalMissing}\n`;
report += `多余题目文件: ${totalExtra}\n`;

console.log(report);
writeFileSync('d:/小四门软件/scripts/_missing_report.txt', report);
writeFileSync('d:/小四门软件/scripts/_missing_list.json', JSON.stringify(missingList, null, 2));
