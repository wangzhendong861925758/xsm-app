// 检查前端配置的版本名和实际数据文件是否匹配
import { readFileSync, readdirSync } from 'fs';

const manifest = JSON.parse(readFileSync('d:/小四门软件/public/data/questions/manifest.json', 'utf8'));

// 读取 textbooks.ts 中的配置（手动整理）
// 这里直接读取前端配置
const textbooksCode = readFileSync('d:/小四门软件/src/data/textbooks.ts', 'utf8');

// 提取所有版本配置
const configMatches = [...textbooksCode.matchAll(/grade:\s*"([^"]+)"[^}]*?subject:\s*"([^"]+)"[^}]*?versions:\s*\[([^\]]+)\]/gs)];
const config = [];
for (const m of configMatches) {
  const grade = m[1];
  const subject = m[2];
  const versionsStr = m[3];
  const versions = [...versionsStr.matchAll(/"([^"]+)"/g)].map(x => x[1]);
  config.push({ grade, subject, versions });
}

console.log('=== 版本匹配检查 ===\n');
let totalMismatch = 0;
for (const c of config) {
  const key = `${c.subject}|${c.grade}`;
  const dataVersions = manifest[key] || [];
  const dataVersionNames = dataVersions.map(v => v.version);
  const missingInData = c.versions.filter(v => !dataVersionNames.includes(v));
  const missingInConfig = dataVersionNames.filter(v => !c.versions.includes(v));

  if (missingInData.length > 0 || missingInConfig.length > 0) {
    totalMismatch++;
    console.log(`[${key}]`);
    if (missingInData.length > 0) {
      console.log(`  配置有但数据没有: ${missingInData.join(', ')}`);
    }
    if (missingInConfig.length > 0) {
      console.log(`  数据有但配置没有: ${missingInConfig.join(', ')}`);
    }
  }
}
console.log(`\n共 ${totalMismatch} 个学科年级有版本不匹配`);
