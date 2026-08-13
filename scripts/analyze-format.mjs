// 全面分析文件格式
import mammoth from 'mammoth';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

const ROOT = 'd:/小四门软件/试题/试题';

function walkDir(dir) {
  const results = [];
  const items = readdirSync(dir);
  for (const item of items) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) results.push(...walkDir(full));
    else if (item.endsWith('.docx')) results.push(full);
  }
  return results;
}

async function main() {
  const files = walkDir(ROOT);
  
  // 统计各学科文件
  const subjects = {};
  for (const f of files) {
    const subj = f.replace(/\\/g, '/').split('/试题/试题/')[1].split('/')[0];
    if (!subjects[subj]) subjects[subj] = { choice: 0, essay: 0, hasAnalysis: 0 };
    if (basename(f).includes('选择')) subjects[subj].choice++;
    else subjects[subj].essay++;
  }
  console.log('各学科文件数:');
  for (const [k, v] of Object.entries(subjects)) {
    console.log(`  ${k}: 选择${v.choice} 大题${v.essay} 总${v.choice+v.essay}`);
  }

  // 检查选择判断格式：是否有"解析"标签
  console.log('\n=== 检查选择判断文件是否自带解析 ===');
  const choiceFiles = files.filter(f => basename(f).includes('选择')).slice(0, 10);
  for (const f of choiceFiles) {
    const buf = readFileSync(f);
    const { value } = await mammoth.extractRawText({ buffer: buf });
    const hasAnalysis = /解析\s*[:：]/.test(value);
    const subj = f.replace(/\\/g, '/').split('/试题/试题/')[1].split('/')[0];
    console.log(`  [${subj}] ${basename(f)}: ${hasAnalysis ? '有解析' : '无解析'} (${value.length}字符)`);
  }

  // 检查大题格式：第N题 还是 N. 格式，是否有解析
  console.log('\n=== 检查大题文件格式 ===');
  const essayFiles = files.filter(f => basename(f).includes('大题')).slice(0, 10);
  for (const f of essayFiles) {
    const buf = readFileSync(f);
    const { value } = await mammoth.extractRawText({ buffer: buf });
    const hasAnalysis = /解析\s*[:：]/.test(value);
    const usesDiti = /第\d+题/.test(value);
    const usesNum = /^\s*\d+\s*[.．、]/m.test(value);
    const subj = f.replace(/\\/g, '/').split('/试题/试题/')[1].split('/')[0];
    console.log(`  [${subj}] ${basename(f)}: ${hasAnalysis ? '有解析' : '无解析'}, ${usesDiti ? '第N题格式' : ''} ${usesNum ? 'N.格式' : ''} (${value.length}字符)`);
  }

  // 统计有解析的文件比例（采样200个）
  console.log('\n=== 统计自带解析比例（采样200文件）===');
  let withAnalysis = 0, withoutAnalysis = 0;
  const sample = files.slice(0, 200);
  for (const f of sample) {
    const buf = readFileSync(f);
    const { value } = await mammoth.extractRawText({ buffer: buf });
    if (/解析\s*[:：]/.test(value)) withAnalysis++;
    else withoutAnalysis++;
  }
  console.log(`  有解析: ${withAnalysis}/${sample.length} (${Math.round(withAnalysis/sample.length*100)}%)`);
  console.log(`  无解析: ${withoutAnalysis}/${sample.length} (${Math.round(withoutAnalysis/sample.length*100)}%)`);
}

main().catch(e => { console.error(e); process.exit(1); });
