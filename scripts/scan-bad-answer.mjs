// 扫描所有题目文件，找出 answer 字段格式异常的题
// 异常定义：1) 长度>2的非文本答案 2) 含标点 3) 为空但type是选择题
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const stats = { total: 0, byType: {}, badAns: 0, byPattern: {} };
const samples = [];

for (const f of files) {
  let data;
  try { data = JSON.parse(readFileSync(join(DIR, f), 'utf8')); } catch { continue; }
  if (!Array.isArray(data)) continue;
  
  for (const q of data) {
    stats.total++;
    stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
    if (q.type === 'essay') continue;
    
    const ans = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer || '');
    
    // 异常1: answer为空
    if (!ans.trim()) {
      stats.badAns++;
      if (samples.length < 5) samples.push({ file: f, id: q.id, type: q.type, issue: 'EMPTY_ANS', stem: q.stem?.substring(0,80), options: q.options });
      continue;
    }
    
    // 异常2: answer含标点或空白
    if (/[,，。.、；;:：]/.test(ans) || /\s/.test(ans)) {
      stats.badAns++;
      if (samples.length < 15) samples.push({ file: f, id: q.id, type: q.type, issue: 'PUNCT', ans, stem: q.stem?.substring(0,60) });
      continue;
    }
    
    // 异常3: judge题但answer不是"对/错/√/×"
    if (q.type === 'judge' && !/^(对|错|√|×|A|B)$/.test(ans)) {
      stats.badAns++;
      if (samples.length < 25) samples.push({ file: f, id: q.id, type: q.type, issue: 'JUDGE_BAD', ans, stem: q.stem?.substring(0,60) });
    }
    
    // 异常4: single题但answer不是A-D或文本
    if (q.type === 'single' && ans.length > 1 && !/^[A-D]$/.test(ans) && !/^(对|错|√|×)$/.test(ans)) {
      // 这不一定是异常，answer可能是完整选项文本
      const key = 'TEXT_ANS';
      stats.byPattern[key] = (stats.byPattern[key] || 0) + 1;
    }
  }
}

console.log(`总题数: ${stats.total}`);
console.log(`type分布:`, stats.byType);
console.log(`\n异常answer数: ${stats.badAns}`);
console.log('\n样本:');
for (const s of samples) console.log(' ', JSON.stringify(s));
