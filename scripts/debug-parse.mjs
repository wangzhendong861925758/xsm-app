// 详细检查生物七年级上册人教版的第1题解析过程
import { readFileSync } from 'fs';

const FILE = 'd:/小四门软件/public/data/questions/biology_七年级上册_人教版.json';
const qs = JSON.parse(readFileSync(FILE, 'utf8'));

// 找前3道single题（选项数!=4）
const bad = qs.filter(q => q.type === 'single' && q.options.length !== 4).slice(0, 3);
console.log('=== 选项数量异常的前3题 ===');
bad.forEach((q, i) => {
  console.log(`\n--- 题${i+1} ---`);
  console.log(`type: ${q.type}`);
  console.log(`options.length: ${q.options.length}`);
  console.log(`answer: ${q.answer}`);
  console.log(`stem (full): "${q.stem}"`);
  console.log(`options: ${JSON.stringify(q.options)}`);
  console.log(`chapter: ${q.chapter}, section: ${q.section}`);
});
