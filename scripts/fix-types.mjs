// 全量修复题目类型：choice→single，并检查其他非标准类型
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const IDX_DIR = 'd:/小四门软件/public/data/question-index';

const VALID_TYPES = new Set(['single', 'multiple', 'judge', 'essay']);

const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
let totalFixed = 0;
let totalQuestions = 0;
const typeStats = {};

for (const f of qFiles) {
  const filePath = join(Q_DIR, f);
  let questions;
  try {
    questions = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch { continue; }
  if (!Array.isArray(questions)) continue;

  let changed = false;
  for (const q of questions) {
    totalQuestions++;
    const t = q.type;
    typeStats[t] = (typeStats[t] || 0) + 1;
    
    // choice → single（4选项单选）
    if (t === 'choice') {
      q.type = 'single';
      changed = true;
    }
    // 选择题但答错：有多个答案字母 → multiple
    // ponytail: 简单规则——answer是数组或多字母 → multiple
    if (q.type === 'single' && q.answer) {
      const ans = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer);
      const letters = ans.toUpperCase().match(/[A-Z]/g) || [];
      if (letters.length > 1) {
        q.type = 'multiple';
        changed = true;
      }
    }
    // 判断题：只有2个选项且答案是"对"/"错"或"A"/"B"
    if (q.options && q.options.length === 2) {
      const ans = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer);
      if (/[对错√×AB]/.test(ans) && !/[C-Zc-z]/.test(ans)) {
        // 确认是判断题（2选项）
        if (q.type !== 'judge') {
          q.type = 'judge';
          changed = true;
        }
      }
    }
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(questions, null, 2));
    totalFixed++;
  }
}

console.log('=== 题目类型统计（修复前）===');
for (const [t, c] of Object.entries(typeStats).sort((a, b) => b[1] - a[1])) {
  const valid = VALID_TYPES.has(t) ? '✓' : '✗(非标准)';
  console.log(`  ${t}: ${c} ${valid}`);
}
console.log(`\n总题数: ${totalQuestions}`);
console.log(`修复文件数: ${totalFixed}`);
