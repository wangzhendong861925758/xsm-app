// 检查一个分片文件的内容格式
import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('d:/小四门软件/public/data/questions/chemistry_九年级上册_人教版.json', 'utf8'));
console.log('题数:', data.length);
console.log('前3题:', JSON.stringify(data.slice(0, 3), null, 2));
// 统计有解析的比例
const withAnalysis = data.filter(q => q.analysis && q.analysis.length > 0).length;
console.log(`\n有解析: ${withAnalysis}/${data.length} (${Math.round(withAnalysis/data.length*100)}%)`);
