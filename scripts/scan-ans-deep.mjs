// 深入分析异常answer：分桶统计+找可修复的
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const buckets = {
  EMPTY_ANS: { count: 0, fixable: 0, samples: [] },         // answer为空
  JUDGE_BAD: { count: 0, fixable: 0, samples: [] },          // judge但answer不是对/错
  SINGLE_MULTI_LETTER: { count: 0, samples: [] },            // single题answer是多字母(可能是多选误标)
};

for (const f of files) {
  let data;
  try { data = JSON.parse(readFileSync(join(DIR, f), 'utf8')); } catch { continue; }
  if (!Array.isArray(data)) continue;
  
  for (const q of data) {
    if (q.type === 'essay') continue;
    const ans = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer || '').trim();
    
    // EMPTY_ANS
    if (!ans) {
      buckets.EMPTY_ANS.count++;
      // 看 stem 是否含"答案：XXX"
      const m = (q.stem || '').match(/答案[：:]\s*([^\s。，,；;]{1,8})/);
      if (m) {
        buckets.EMPTY_ANS.fixable++;
        if (buckets.EMPTY_ANS.samples.length < 5) {
          buckets.EMPTY_ANS.samples.push({ f, id: q.id, type: q.type, stemAns: m[1], stem: q.stem?.substring(0,80) });
        }
      } else {
        if (buckets.EMPTY_ANS.samples.length < 10) {
          buckets.EMPTY_ANS.samples.push({ f, id: q.id, type: q.type, stem: q.stem?.substring(0,80), options: q.options });
        }
      }
      continue;
    }
    
    // JUDGE_BAD
    if (q.type === 'judge' && !/^(对|错|√|×|A|B|正确|错误)$/.test(ans)) {
      buckets.JUDGE_BAD.count++;
      if (buckets.JUDGE_BAD.samples.length < 5) {
        buckets.JUDGE_BAD.samples.push({ f, id: q.id, ans, stem: q.stem?.substring(0,80) });
      }
    }
    
    // SINGLE 题但 answer 是多字母 (可能多选被误标为单选)
    if (q.type === 'single' && /^[A-Z]{2,}$/.test(ans)) {
      buckets.SINGLE_MULTI_LETTER.count++;
      if (buckets.SINGLE_MULTI_LETTER.samples.length < 5) {
        buckets.SINGLE_MULTI_LETTER.samples.push({ f, id: q.id, ans, stem: q.stem?.substring(0,80) });
      }
    }
  }
}

for (const [k, v] of Object.entries(buckets)) {
  console.log(`\n[${k}] 总数=${v.count}, 可修复=${v.fixable}`);
  for (const s of v.samples) console.log('  ', JSON.stringify(s));
}
