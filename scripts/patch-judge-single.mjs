// 补丁：修复 type非essay 但 options为空 且 answer是判断值(√/×/对/错) 的题 → 转 judge
// 其余 options 为空的 single（脏碎片）→ 转 essay
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let toJudge = 0, toEssay = 0;
for (const f of files) {
  const fp = join(DIR, f);
  let data;
  try { data = JSON.parse(readFileSync(fp, 'utf8')); } catch { continue; }
  if (!Array.isArray(data)) continue;
  let changed = false;

  for (const q of data) {
    if (q.type === 'essay') continue;
    if (q.options && q.options.length > 0) continue;

    const ans = String(q.answer || '').trim();
    if (/^(√|对|T|true|正确)$/i.test(ans)) {
      q.type = 'judge'; q.options = ['对', '错']; q.answer = '对';
      // 清理题干前缀（如"判断题（100 道）"）和残留（如尾部" D. 结束了国民党统治"）
      q.stem = (q.stem || '').replace(/^判断题\s*[（(]\s*\d+\s*道?\s*[)）]\s*/, '').replace(/\s*[A-D][.．、][^A-D]*$/, '').trim();
      toJudge++; changed = true;
    } else if (/^(×|错|F|false|错误)$/i.test(ans)) {
      q.type = 'judge'; q.options = ['对', '错']; q.answer = '错';
      q.stem = (q.stem || '').replace(/^判断题\s*[（(]\s*\d+\s*道?\s*[)）]\s*/, '').replace(/\s*[A-D][.．、][^A-D]*$/, '').trim();
      toJudge++; changed = true;
    } else {
      q.type = 'essay'; q.options = [];
      if (!q.answer) q.answer = q.stem;
      toEssay++; changed = true;
    }
  }
  if (changed) writeFileSync(fp, JSON.stringify(data, null, 0), 'utf8');
}
console.log(`转 judge: ${toJudge}, 转 essay: ${toEssay}`);
