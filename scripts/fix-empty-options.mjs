// 统一修复：所有 type非essay 但 options为空 的题
// 策略：
//   1) answer 是 对/错/√/×/T/F/true/false → 转 judge，answer 规范化为 "对"/"错"
//   2) stem 含"答案：正确/错误/对/错/√/×" → 提取答案，转 judge，从 stem 删除"答案：XXX"
//   3) 都没有 → 转 essay，避免污染选择题训练（题干本身已包含问句或材料）
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let toJudge = 0, toEssay = 0, stemCleaned = 0;
const fileStats = [];

for (const f of files) {
  const fp = join(DIR, f);
  let data;
  try { data = JSON.parse(readFileSync(fp, 'utf8')); } catch { continue; }
  if (!Array.isArray(data)) continue;

  let changed = false;
  let fJudge = 0, fEssay = 0, fClean = 0;

  for (const q of data) {
    if (q.type === 'essay') continue;
    if (q.options && q.options.length > 0) continue;

    // 优先从 answer 字段取判断题答案
    let ansRaw = String(q.answer || '').trim();
    let ansJudge = '';
    if (/^(对|√|T|true)$/i.test(ansRaw)) ansJudge = '对';
    else if (/^(错|×|F|false)$/i.test(ansRaw)) ansJudge = '错';

    // 若 answer 不是判断值，尝试从 stem 提取"答案：XXX"
    if (!ansJudge) {
      const m = (q.stem || '').match(/答案[：:]\s*(正确|错误|对|错|√|×|T|F|true|false)/i);
      if (m) {
        const v = m[1];
        if (/^(正确|对|√|T|true)$/i.test(v)) ansJudge = '对';
        else if (/^(错误|错|×|F|false)$/i.test(v)) ansJudge = '错';
        // 从 stem 删除"答案：XXX"段
        q.stem = (q.stem || '').replace(/[\s]*答案[：:]\s*(正确|错误|对|错|√|×|T|F|true|false)[\s。]*/i, ' ').trim();
        fClean++;
        stemCleaned++;
      }
    }

    if (ansJudge) {
      q.type = 'judge';
      q.answer = ansJudge;
      // 判断题统一加两个选项，便于前端按 options.map 渲染（A=对 B=错）
      q.options = ['对', '错'];
      fJudge++;
      toJudge++;
    } else {
      // 无判断答案标志：转 essay，避免污染选择题训练
      q.type = 'essay';
      if (!q.answer) q.answer = q.stem; // ponytail: 题干即答案的简答题，用 stem 兜底
      q.options = [];
      fEssay++;
      toEssay++;
    }
    changed = true;
  }

  if (changed) {
    writeFileSync(fp, JSON.stringify(data, null, 0), 'utf8');
    fileStats.push({ file: f, toJudge: fJudge, toEssay: fEssay, stemCleaned: fClean });
  }
}

console.log(`\n修复完成: 转 judge ${toJudge} 题，转 essay ${toEssay} 题，清理 stem 中答案 ${stemCleaned} 处`);
console.log(`修改文件数: ${fileStats.length}`);
console.log('\n各文件修复数（前20）:');
fileStats.sort((a, b) => (b.toJudge + b.toEssay) - (a.toJudge + a.toEssay));
for (const s of fileStats.slice(0, 20)) {
  console.log(`  judge=${s.toJudge.toString().padStart(4)} essay=${s.toEssay.toString().padStart(4)} clean=${s.stemCleaned.toString().padStart(4)}  ${s.file}`);
}
if (fileStats.length > 20) console.log(`  ... 还有 ${fileStats.length - 20} 个文件`);
