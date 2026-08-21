// 检查选择题为0的版本的源文件情况
import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

const SOURCE_DIR = 'D:/小四门软件/试题/试题';
const SUBJECT_DIR = {
  biology: '生物', history: '历史', politics: '道法',
  geography: '地理', chemistry: '化学', physics: '物理'
};

const log = JSON.parse(readFileSync('d:/小四门软件/scripts/_reparse_log.json', 'utf8'));
const zeroChoice = log.filter(l => l.status === 'FIXED' && l.choice === 0);

console.log(`选择题为0的版本: ${zeroChoice.length}`);

function findDocxFiles(dir) {
  const out = [];
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      out.push(...findDocxFiles(fullPath));
    } else if (item.endsWith('.docx') || item.endsWith('.doc')) {
      out.push({ fullPath, fileName: item });
    }
  }
  return out;
}

for (const { grade, subject, version } of zeroChoice) {
  const subjectCn = SUBJECT_DIR[subject];
  const versionPath = join(SOURCE_DIR, subjectCn, grade, version);
  const files = findDocxFiles(versionPath);
  
  // 统计文件名
  const fileNames = [...new Set(files.map(f => f.fileName))];
  const choiceFiles = files.filter(f => f.fileName.includes('选择') || f.fileName.includes('判断'));
  const essayFiles = files.filter(f => f.fileName.includes('大题') || f.fileName.includes('解答'));
  const otherFiles = files.filter(f => !f.fileName.includes('选择') && !f.fileName.includes('判断') && !f.fileName.includes('大题') && !f.fileName.includes('解答'));
  
  console.log(`\n${grade}|${subject}|${version}`);
  console.log(`  总文件数: ${files.length}`);
  console.log(`  选择题文件: ${choiceFiles.length}`);
  console.log(`  大题文件: ${essayFiles.length}`);
  console.log(`  其他文件: ${otherFiles.length}`);
  if (otherFiles.length > 0) {
    console.log(`  其他文件名: ${[...new Set(otherFiles.map(f => f.fileName))].join(', ')}`);
  }
  if (choiceFiles.length === 0 && essayFiles.length > 0) {
    console.log(`  → 没有选择题文件，只有大题文件`);
  }
}
