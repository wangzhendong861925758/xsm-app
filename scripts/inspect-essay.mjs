import mammoth from 'mammoth';
import { readFileSync } from 'fs';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// 找几个大题文件看看格式
const ROOT = 'd:/小四门软件/试题/试题';

function walkDir(dir) {
  const results = [];
  for (const item of readdirSync(dir)) {
    if (item.startsWith('~$')) continue;
    const full = join(dir, item);
    try {
      if (statSync(full).isDirectory()) results.push(...walkDir(full));
      else if (item.endsWith('.docx') && !item.includes('选择') && !item.includes('判断')) results.push(full);
    } catch(e) {}
  }
  return results;
}

const essayFiles = walkDir(ROOT);
console.log(`大题文件数: ${essayFiles.length}`);

// 取3个不同学科的大题文件看看格式
for (let i = 0; i < Math.min(3, essayFiles.length); i++) {
  const f = essayFiles[i * Math.floor(essayFiles.length / 3)];
  const buf = readFileSync(f);
  const { value } = await mammoth.extractRawText({ buffer: buf });
  const lines = value.replace(/\r\n/g, '\n').split('\n').map(l => l.trim()).filter(l => l.length > 0);
  console.log(`\n=== ${f.split('/试题/试题/')[1]} ===`);
  console.log(`总行数: ${lines.length}`);
  // 看前20行和后10行
  console.log('前15行:');
  lines.slice(0, 15).forEach((l, i) => console.log(`  [${i}] ${l.slice(0, 120)}`));
  console.log('后5行:');
  lines.slice(-5).forEach((l, i) => console.log(`  [${lines.length-5+i}] ${l.slice(0, 120)}`));
}
