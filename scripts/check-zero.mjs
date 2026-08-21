// 检查0题版本的docx文件内容
import mammoth from 'mammoth';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const result = JSON.parse(readFileSync('d:/小四门软件/scripts/_supplement_result.json', 'utf8'));
const zeroVersions = result.filter(r => r.count === 0);
console.log(`0题版本数: ${zeroVersions.length}\n`);

const SUBJECT_DIR = { politics:'道法', history:'历史', geography:'地理', biology:'生物', physics:'物理', chemistry:'化学' };
const ROOT = 'd:/小四门软件/试题/试题';

for (const item of zeroVersions.slice(0, 3)) {
  const dirName = SUBJECT_DIR[item.subject];
  const dir = join(ROOT, dirName, item.grade, item.version);
  console.log(`=== ${item.subject}|${item.grade}|${item.version} ===`);
  console.log(`目录: ${dir}`);
  
  // 收集docx文件
  const docxFiles = [];
  function walk(d, unit) {
    const entries = readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('~$')) continue;
      const full = join(d, e.name);
      if (e.isDirectory()) {
        walk(full, unit || e.name);
      } else if (e.name.endsWith('.docx')) {
        docxFiles.push({ path: full, name: e.name, unit });
      }
    }
  }
  walk(dir, '');
  console.log(`docx文件数: ${docxFiles.length}`);
  
  // 解析第一个文件
  if (docxFiles.length > 0) {
    const f = docxFiles[0];
    console.log(`样本文件: ${f.name}`);
    try {
      const r = await mammoth.extractRawText({ path: f.path });
      const text = r.value;
      console.log(`文本长度: ${text.length}`);
      console.log(`前800字符:\n${text.slice(0, 800)}\n`);
    } catch(e) {
      console.log(`解析失败: ${e.message}`);
    }
  }
  console.log('');
}
