import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('d:/小四门软件/public/data/questions/politics_九年级下册_统编版.json', 'utf8'));
console.log(`总题数: ${data.length}`);

// 找有"第一部分"或"第1框"的题
const bad = data.filter(q => q.stem.includes('第一部分') || q.stem.includes('第1框') || q.stem.includes('开放互动'));
console.log(`污染题数: ${bad.length}`);
if (bad.length > 0) {
  const q = bad[0];
  console.log('\n=== 污染题样例 ===');
  console.log('type:', q.type);
  console.log('stem:', q.stem.slice(0, 500));
  console.log('options:', q.options);
  console.log('answer:', q.answer);
  console.log('analysis:', q.analysis?.slice(0, 300));
}

// 找判断题
const judges = data.filter(q => q.type === 'judge');
console.log(`\n判断题数: ${judges.length}`);
if (judges.length > 0) {
  console.log('\n=== 判断题样例 ===');
  const j = judges[0];
  console.log('stem:', j.stem.slice(0, 300));
  console.log('answer:', j.answer);
  console.log('analysis:', j.analysis?.slice(0, 200));
}
