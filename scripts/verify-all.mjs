// 全面验证：对比 textbooks.ts 与 manifest.json 的版本一致性
// 检查每个学科/年级的版本是否完全匹配，不遗漏不多余
import { readFileSync } from 'fs';

// 读取 textbooks.ts 中的 TEXTBOOKS 配置
const tbRaw = readFileSync('d:/小四门软件/src/data/textbooks.ts', 'utf8');
// 提取 TEXTBOOKS 数组中的配置项
const tbMatches = [...tbRaw.matchAll(/\{ grade: "([^"]+)", subject: "([^"]+)", subjectName: "([^"]+)", versions: \[([^\]]+)\] \}/g)];
const textbooksMap = {};
for (const m of tbMatches) {
  const grade = m[1];
  const subject = m[2];
  const versionsStr = m[4];
  const versions = [...versionsStr.matchAll(/"([^"]+)"/g)].map(x => x[1]);
  const key = `${subject}|${grade}`;
  textbooksMap[key] = versions;
}

// 读取 questions/manifest.json
const manifest = JSON.parse(readFileSync('d:/小四门软件/public/data/questions/manifest.json', 'utf8'));

// 读取 question-index/manifest.json
const idxManifest = JSON.parse(readFileSync('d:/小四门软件/public/data/question-index/manifest.json', 'utf8'));

const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
const SUBJECT_ORDER = ['physics','chemistry','biology','history','politics','geography'];
const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };

let hasError = false;
let report = '';
let totalTb = 0, totalManifest = 0;

for (const grade of GRADE_ORDER) {
  report += `\n【${grade}】\n`;
  for (const subject of SUBJECT_ORDER) {
    const key = `${subject}|${grade}`;
    const tbVersions = textbooksMap[key] || [];
    const mEntries = manifest[key] || [];
    const mVersions = mEntries.map(e => e.version);
    const idxEntries = idxManifest[key] || [];
    const idxVersions = idxEntries.map(e => e.version);

    if (tbVersions.length === 0 && mVersions.length === 0) continue;

    totalTb += tbVersions.length;
    totalManifest += mVersions.length;

    // 找出差异
    const onlyInTb = tbVersions.filter(v => !mVersions.includes(v));
    const onlyInManifest = mVersions.filter(v => !tbVersions.includes(v));
    const onlyInIdx = idxVersions.filter(v => !mVersions.includes(v));
    const missingIdx = mVersions.filter(v => !idxVersions.includes(v));

    const ok = onlyInTb.length === 0 && onlyInManifest.length === 0 && missingIdx.length === 0;
    const status = ok ? '✓' : '✗';
    if (!ok) hasError = true;

    report += `  ${status} ${SUBJECT_NAMES[subject]}: textbooks=${tbVersions.length} manifest=${mVersions.length} idx=${idxVersions.length}`;
    if (tbVersions.length > 0) report += ` 总题数=${mEntries.reduce((s,e)=>s+e.count,0)}`;
    report += '\n';

    if (onlyInTb.length > 0) {
      report += `    ⚠ textbooks有但manifest无: ${onlyInTb.join(' / ')}\n`;
    }
    if (onlyInManifest.length > 0) {
      report += `    ⚠ manifest有但textbooks无: ${onlyInManifest.join(' / ')}\n`;
    }
    if (missingIdx.length > 0) {
      report += `    ⚠ 缺少.idx.json索引: ${missingIdx.join(' / ')}\n`;
    }
    if (onlyInIdx.length > 0) {
      report += `    ⚠ idx有但questions无(孤立索引): ${onlyInIdx.join(' / ')}\n`;
    }
  }
}

report += `\n=== 汇总 ===\n`;
report += `textbooks.ts 版本总数: ${totalTb}\n`;
report += `manifest.json 版本总数: ${totalManifest}\n`;
report += `一致性: ${hasError ? '✗ 有差异' : '✓ 完全一致'}\n`;

console.log(report);

// 输出到文件
const { writeFileSync } = await import('fs');
writeFileSync('d:/小四门软件/scripts/_verify_report.txt', report);
