// 检查缺失版本的源文件是否存在，并尝试解析一个样本
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import mammoth from 'mammoth';

const missingList = JSON.parse(readFileSync('d:/小四门软件/scripts/_missing_list.json', 'utf8'));
console.log(`缺失版本数: ${missingList.length}\n`);

// 检查每个缺失版本的源文件
const ROOT1 = 'D:/小四门软件/试题/试题';
const ROOT2 = 'D:/小四门软件/试题/道德与法治';

const SUBJECT_DIR = { politics:'道法', history:'历史', geography:'地理', biology:'生物', physics:'物理', chemistry:'化学' };

let foundCount = 0, notFoundCount = 0;
const samplePaths = [];

for (const item of missingList) {
  const dirName = SUBJECT_DIR[item.subject];
  const version = item.version;
  const grade = item.grade;
  
  // 在两个根目录下查找
  const path1 = join(ROOT1, dirName, grade, version);
  const path2 = join(ROOT2, grade, version); // 道德与法治目录结构不同？
  const path3 = join(ROOT2, dirName, grade, version);
  
  let found = null;
  for (const p of [path1, path2, path3]) {
    try {
      const st = statSync(p);
      if (st.isDirectory()) {
        found = p;
        break;
      }
    } catch {}
  }
  
  if (found) {
    foundCount++;
    if (samplePaths.length < 3) {
      // 收集样本文件路径
      const files = readdirSync(found).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));
      if (files.length > 0) {
        samplePaths.push({ version: item.version, grade, subject: item.subject, dir: found, sampleFile: files[0] });
      }
    }
  } else {
    notFoundCount++;
    console.log(`✗ 未找到目录: ${dirName}/${grade}/${version}`);
  }
}

console.log(`\n找到目录: ${foundCount}, 未找到: ${notFoundCount}`);
console.log(`\n样本文件:`);
for (const s of samplePaths) {
  console.log(`  ${s.subject}|${s.grade}|${s.version}`);
  console.log(`  目录: ${s.dir}`);
  console.log(`  样本: ${s.sampleFile}`);
}

// 解析一个样本文件看看
if (samplePaths.length > 0) {
  const sample = samplePaths[0];
  const filePath = join(sample.dir, sample.sampleFile);
  console.log(`\n=== 解析样本: ${filePath} ===`);
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    console.log(`文本长度: ${text.length}`);
    console.log(`前500字符:\n${text.slice(0, 500)}`);
    console.log(`\n... 后500字符:\n${text.slice(-500)}`);
  } catch(e) {
    console.log(`解析失败: ${e.message}`);
  }
}
