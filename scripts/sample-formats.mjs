// 检查多个学科多个文件的题号格式
import mammoth from 'mammoth';
import { readdirSync } from 'fs';
import { join } from 'path';

const ROOT = 'd:/小四门软件/试题/试题';

function walkDir(dir, allFiles) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walkDir(full, allFiles);
    else if (e.isFile() && (e.name.endsWith('.docx') || e.name.endsWith('.doc'))) {
      allFiles.push(full);
    }
  }
}

const allFiles = [];
walkDir(ROOT, allFiles);

// 抽样：每学科第一个选择判断文件 + 第一个大题文件
const samples = [];
const subjects = [...new Set(allFiles.map(f => f.replace(/\\/g, '/').replace(ROOT + '/', '').split('/')[0]))];
for (const sub of subjects) {
  const subFiles = allFiles.filter(f => f.replace(/\\/g, '/').includes('/' + sub + '/'));
  const choice = subFiles.find(f => f.includes('选择判断'));
  const essay = subFiles.find(f => f.includes('大题'));
  if (choice) samples.push({ subject: sub, type: 'choice', path: choice });
  if (essay) samples.push({ subject: sub, type: 'essay', path: essay });
}

console.log(`共抽样 ${samples.length} 个文件`);

for (const s of samples.slice(0, 12)) {
  try {
    const r = await mammoth.extractRawText({ path: s.path });
    const t = r.value.slice(0, 600);
    console.log(`\n=== [${s.subject}] ${s.type}: ${s.path.split(/[/\\]/).slice(-3).join('/')} ===`);
    console.log(t);
  } catch(e) {
    console.log(`\n=== [${s.subject}] ${s.type}: 读取失败 ${e.message} ===`);
  }
}
