// 扫描 D:\小四门软件\试题 目录，按 学科\学段\教材版本 统计文件数量
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = 'D:/小四门软件/试题';

// 学科映射：目录名 → 代码
const SUBJECT_MAP = {
  '道法': 'politics', '道德与法治': 'politics',
  '历史': 'history',
  '地理': 'geography',
  '生物': 'biology',
  '物理': 'physics',
  '化学': 'chemistry',
};

const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };

function walk(dir, depth = 0, path = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return []; }
  const result = [];
  for (const name of entries) {
    if (name.startsWith('~$')) continue; // 跳过临时文件
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      result.push(...walk(full, depth + 1, [...path, name]));
    } else {
      result.push({ path: [...path, name], full });
    }
  }
  return result;
}

// 扫描两个子目录
const allFiles = [];
for (const sub of readdirSync(ROOT)) {
  const subPath = join(ROOT, sub);
  if (statSync(subPath).isDirectory()) {
    allFiles.push(...walk(subPath, 0, [sub]));
  }
}

// 解析每个文件的 学科/学段/教材版本
// 结构：试题/试题/学科/学段/教材版本/单元/课/文件  或  试题/道德与法治/学段/教材版本/...
// 从 path 中找学科、学段、教材版本
const GRADES = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
const config = {}; // key=subject|grade, value={version: count}

for (const f of allFiles) {
  // 找学科
  let subject = null;
  let subjectName = null;
  for (const p of f.path) {
    if (SUBJECT_MAP[p]) {
      subject = SUBJECT_MAP[p];
      subjectName = p;
      break;
    }
  }
  if (!subject) continue;
  
  // 找学段
  let grade = null;
  for (const p of f.path) {
    if (GRADES.includes(p)) {
      grade = p;
      break;
    }
  }
  if (!grade) continue;
  
  // 找教材版本：学段之后的第一个目录
  const gradeIdx = f.path.indexOf(grade);
  if (gradeIdx + 1 >= f.path.length) continue;
  const version = f.path[gradeIdx + 1];
  
  const key = `${subject}|${grade}`;
  if (!config[key]) config[key] = {};
  if (!config[key][version]) config[key][version] = 0;
  config[key][version]++;
}

// 输出报告
const GRADE_ORDER = GRADES;
const SUBJECT_ORDER = ['physics','chemistry','biology','history','politics','geography'];

let report = '=== 试题目录扫描结果（按 学科-学段-教材版本） ===\n';
let totalVersions = 0;
for (const grade of GRADE_ORDER) {
  let hasAny = false;
  for (const subject of SUBJECT_ORDER) {
    const key = `${subject}|${grade}`;
    const versions = config[key] || {};
    const vList = Object.keys(versions);
    if (vList.length === 0) continue;
    if (!hasAny) {
      report += `\n【${grade}】\n`;
      hasAny = true;
    }
    totalVersions += vList.length;
    const detail = vList.map(v => `${v}(${versions[v]}文件)`).sort().join(' / ');
    report += `  ${SUBJECT_NAMES[subject]}: ${vList.length}版 — ${detail}\n`;
  }
}
report += `\n总计: ${totalVersions} 个版本\n`;
console.log(report);

import { writeFileSync } from 'fs';
writeFileSync('d:/小四门软件/scripts/_source_scan.txt', report);

// 同时输出 JSON 供后续使用
writeFileSync('d:/小四门软件/scripts/_source_config.json', JSON.stringify(config, null, 2));
