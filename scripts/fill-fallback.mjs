// 兜底解析填充：为没有解析的题目生成基础解析，确保100%有内容显示
// AI生成的详细解析会在后续覆盖这些内容
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DIR = 'd:/小四门软件/public/data/questions';
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const subjectName = { biology: '生物', politics: '道德与法治', history: '历史', geography: '地理', chemistry: '化学', physics: '物理' };

function letterToText(l) {
  return { A: 'A', B: 'B', C: 'C', D: 'D', '对': '正确', '√': '正确', '错': '错误', '×': '错误' }[l] || l;
}

function getCorrectAnswerText(q) {
  const ans = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer || '');
  const normalized = ans.replace(/[对√]/g, 'A').replace(/[错×]/g, 'B');
  if (q.type === 'judge') {
    return /[对√A]/.test(normalized) ? '正确' : '错误';
  }
  const letters = (normalized.toUpperCase().match(/[A-D]/g) || []);
  if (letters.length === 0) return ans;
  return letters.join('、');
}

let filledChoice = 0, filledEssay = 0, totalQ = 0;

for (const f of files) {
  const data = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  let changed = false;
  for (const q of data) {
    totalQ++;
    if (q.type === 'essay') {
      const ans = (q.answer || '').trim();
      if (!q.analysis || q.analysis.length < 5) {
        q.analysis = ans || '本题考查相关知识点，参考答案如上，需结合题意具体分析作答。';
        filledEssay++;
        changed = true;
      }
      if (!q.solution || q.solution.length < 5) {
        q.solution = q.analysis;
        changed = true;
      }
    } else {
      // 选择/判断题
      if (!q.analysis || q.analysis.length < 5) {
        const correctText = getCorrectAnswerText(q);
        const subj = subjectName[q.subject] || '本科目';
        let analysis = '';
        if (q.type === 'judge') {
          analysis = `本题考查${subj}基础知识。根据所学知识，该说法${correctText}。请结合教材相关知识点理解记忆。`;
        } else {
          const opts = q.options || [];
          const correctLetters = (() => {
            const ans = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer || '');
            const normalized = ans.toUpperCase();
            return (normalized.match(/[A-D]/g) || []);
          })();
          analysis = `本题考查${subj}相关知识点。正确选项为${correctText}。`;
          if (correctLetters.length > 0 && opts.length > 0) {
            const correctOptTexts = correctLetters.map(l => {
              const idx = l.charCodeAt(0) - 65;
              return idx >= 0 && idx < opts.length ? `${l}. ${opts[idx]}` : l;
            }).join('；');
            analysis += ` ${correctOptTexts} 符合题意要求，其余选项不符合题意，请仔细辨别。`;
          }
          analysis += ' 建议结合教材相关章节巩固该知识点。';
        }
        q.analysis = analysis;
        filledChoice++;
        changed = true;
      }
      if (!q.solution || q.solution.length < 5) {
        q.solution = q.analysis;
        changed = true;
      }
    }
  }
  if (changed) writeFileSync(join(DIR, f), JSON.stringify(data));
}

console.log(`=== 兜底解析填充完成 ===`);
console.log(`总题数: ${totalQ}`);
console.log(`填充选择题/判断题: ${filledChoice}`);
console.log(`填充大题: ${filledEssay}`);
console.log(`合计填充: ${filledChoice + filledEssay}`);
