// 全局扫描：所有版本中 type非essay 但 options为空 的异常题
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const bad = []; // 异常题统计
const judgeLike = new Set(); // 形如"答案：正确/错误"的可修复判断题

for (const f of files) {
  const data = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  for (const q of data) {
    if (q.type === 'essay') continue;
    const optsEmpty = !q.options || q.options.length === 0;
    if (!optsEmpty) continue;
    
    // 异常选择题：options为空
    const hasAnsInStem = /答案[：:]\s*(正确|错误|对|错|√|×|T|F|true|false)/i.test(q.stem || '');
    if (hasAnsInStem) judgeLike.add(f);
    
    bad.push({
      file: f.replace('.json', ''),
      id: q.id,
      type: q.type,
      stemHead: (q.stem || '').substring(0, 60),
      answer: q.answer,
      hasAnsInStem,
    });
  }
}

console.log(`异常题总数: ${bad.length}`);
console.log(`涉及文件数: ${new Set(bad.map(b => b.file)).size}`);
console.log(`其中"stem含答案"可修复为判断题的文件数: ${judgeLike.size}`);

// 按文件汇总
const byFile = {};
for (const b of bad) {
  byFile[b.file] = byFile[b.file] || { total: 0, hasAns: 0 };
  byFile[b.file].total++;
  if (b.hasAnsInStem) byFile[b.file].hasAns++;
}
console.log('\n各文件异常题数（按总数排序，前30）:');
const sorted = Object.entries(byFile).sort((a, b) => b[1].total - a[1].total);
for (const [f, c] of sorted.slice(0, 30)) {
  console.log(`  ${c.total.toString().padStart(4)} (含答案${c.hasAns})  ${f}`);
}
if (sorted.length > 30) console.log(`  ... 还有 ${sorted.length - 30} 个文件`);

// 抽样展示几条不可修复的（无答案标志的异常题）
const unfixable = bad.filter(b => !b.hasAnsInStem);
console.log(`\n不可修复（stem无答案标志）的题数: ${unfixable.length}`);
if (unfixable.length > 0) {
  console.log('前5条不可修复示例:');
  for (const b of unfixable.slice(0, 5)) {
    console.log(`  [${b.file}] type=${b.type} ans="${b.answer}" stem="${b.stemHead}"`);
  }
}
