// 快速统计所有文件的实际题量
import mammoth from 'mammoth';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

const ROOT = 'd:/小四门软件/试题/试题';
const NUM_PREFIX = /^\s*(\d+)\s*[.．、]\s*/;
const DITI_PREFIX = /^\s*第\d+题/;

function walkDir(dir) {
  const results = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) results.push(...walkDir(full));
    else if (item.endsWith('.docx')) results.push(full);
  }
  return results;
}

function countChoice(text) {
  let count = 0;
  for (const line of text.split('\n')) {
    if (NUM_PREFIX.test(line.trim()) && /答案\s*[:：]/.test(line)) count++;
  }
  return count;
}

function countEssay(text) {
  let count = 0;
  for (const line of text.split('\n')) {
    if (DITI_PREFIX.test(line.trim())) count++;
  }
  return count;
}

async function main() {
  const files = walkDir(ROOT);
  console.log(`共 ${files.length} 个文件，开始统计...\n`);
  
  const stats = {};
  let totalQ = 0, totalChoice = 0, totalEssay = 0;
  let processed = 0;
  const startTime = Date.now();

  for (const f of files) {
    const subj = f.replace(/\\/g, '/').split('/试题/试题/')[1].split('/')[0];
    const isChoice = basename(f).includes('选择');
    
    try {
      const buf = readFileSync(f);
      const { value } = await mammoth.extractRawText({ buffer: buf });
      const cnt = isChoice ? countChoice(value) : countEssay(value);
      
      if (!stats[subj]) stats[subj] = { choice: 0, essay: 0 };
      if (isChoice) { stats[subj].choice += cnt; totalChoice += cnt; }
      else { stats[subj].essay += cnt; totalEssay += cnt; }
      totalQ += cnt;
    } catch(e) {
      console.error(`  读取失败: ${f}: ${e.message}`);
    }
    
    processed++;
    if (processed % 500 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  已处理 ${processed}/${files.length} (${elapsed}s)`);
    }
  }

  console.log('\n=== 最终统计 ===');
  for (const [k, v] of Object.entries(stats)) {
    console.log(`  ${k}: 选择${v.choice}题, 大题${v.essay}题, 共${v.choice + v.essay}题`);
  }
  console.log(`\n总计: 选择${totalChoice}题 + 大题${totalEssay}题 = ${totalQ}题`);
  console.log(`估算JSON大小: ${(totalQ * 0.3).toFixed(1)} KB`);
  console.log(`耗时: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch(e => { console.error(e); process.exit(1); });
