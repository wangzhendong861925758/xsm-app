// 修复 answer 为空的题：
// 1) stem 含"答案：XX" → 提取
// 2) stem 含"题目：" / 非判断句 / 无（　）标志 → 转 essay（避免污染选择题）
// 3) options 合并异常(如 "A.B.C.D" 挤一起) → 转 essay
// 4) judge 题但 stem 明显是简答 → 转 essay
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let fixExtract = 0, fixToEssay = 0, fixOptBad = 0, fixEssayJudge = 0;
const fileStats = [];

for (const f of files) {
  const fp = join(DIR, f);
  let data;
  try { data = JSON.parse(readFileSync(fp, 'utf8')); } catch { continue; }
  if (!Array.isArray(data)) continue;
  let changed = false;
  let fx = 0, fe = 0, fo = 0, fj = 0;
  
  for (const q of data) {
    if (q.type === 'essay') continue;
    
    // 修复 options 合并异常：检测相邻字母没分开（如"育雏E. 以上"）
    if (q.options && q.options.some((opt, i) => i > 0 && /[A-Z][.、．]/.test(opt))) {
      q.type = 'essay';
      if (!q.answer) q.answer = q.stem;
      q.options = [];
      fixOptBad++; fo++; changed = true;
      continue;
    }
    
    const ans = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer || '').trim();
    if (ans) continue;
    
    // answer为空，尝试从stem提取"答案：XX"
    const m = (q.stem || '').match(/答案[：:]\s*(对|错|√|×|正确|错误|A|B|C|D|T|F|true|false)/i);
    if (m) {
      const v = m[1];
      if (/^(对|√|T|true|正确)$/i.test(v)) q.answer = '对';
      else if (/^(错|×|F|false|错误)$/i.test(v)) q.answer = '错';
      else if (/^[A-D]$/i.test(v)) q.answer = v.toUpperCase();
      else if (/^(T|F)$/i.test(v)) q.answer = v === 'T' ? '对' : '错';
      // 从stem删除"答案：XX"段
      q.stem = (q.stem || '').replace(/[\s]*答案[：:]\s*[^\s。，,；;）)]+/i, '').trim();
      if (q.type === 'judge') q.options = ['对', '错'];
      fixExtract++; fx++; changed = true;
      continue;
    }
    
    // judge题但stem是大题（"题目：XXX"或不含"（）"）→ 转 essay
    if (q.type === 'judge') {
      const isEssayLike = (q.stem || '').startsWith('题目：') 
        || (q.stem || '').startsWith('题目:')
        || /[，。；！？]/.test(q.stem || '') && !/[（(]\s*[)）]/.test(q.stem || '');
      if (isEssayLike) {
        q.type = 'essay';
        q.options = [];
        if (!q.answer) q.answer = q.stem;
        fixEssayJudge++; fj++; changed = true;
        continue;
      }
    }
    
    // answer为空且无标志 → 转 essay
    q.type = 'essay';
    q.options = [];
    if (!q.answer) q.answer = q.stem;
    fixToEssay++; fe++; changed = true;
  }
  
  if (changed) {
    writeFileSync(fp, JSON.stringify(data, null, 0), 'utf8');
    fileStats.push({ file: f, extract: fx, toEssay: fe, optBad: fo, essayJudge: fj });
  }
}

console.log(`\n修复完成:`);
console.log(`  提取答案: ${fixExtract}`);
console.log(`  转essay(无答案): ${fixToEssay}`);
console.log(`  转essay(options异常): ${fixOptBad}`);
console.log(`  转essay(judge误标): ${fixEssayJudge}`);
console.log(`修改文件数: ${fileStats.length}`);
