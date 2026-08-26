// splitSubQuestions 自检：node scripts/check-split-subs.mjs
// 与 EssayPracticePage.tsx 中逻辑一致（纯函数拷贝），逻辑改动时同步更新此处
function splitSubQuestions(stem) {
  const re = /[（(]\s*(\d+)\s*[)）]/g;
  const marks = [];
  let m;
  while ((m = re.exec(stem)) !== null) marks.push({ num: parseInt(m[1], 10), index: m.index, end: re.lastIndex });
  let best = [], cur = [];
  for (const mk of marks) {
    if (cur.length > 0 && mk.num === cur[cur.length - 1].num + 1) cur.push(mk);
    else cur = mk.num === 1 ? [mk] : [];
    if (cur.length > best.length) best = [...cur];
  }
  if (best.length < 2 || best[0].num !== 1) return null;
  const material = stem.slice(0, best[0].index).trim();
  const subs = best.map((mk, i) => ({
    label: `（${mk.num}）`,
    text: stem.slice(mk.end, i + 1 < best.length ? best[i + 1].index : stem.length).trim(),
  }));
  return { material, subs };
}

import { strict as assert } from 'assert';

// 1. 典型材料题：材料 + 3 小问
const r1 = splitSubQuestions('阅读材料，回答问题。材料："卢沟桥……要道。"（1）战略地位是什么？（2）日本为何选择卢沟桥？（3）中国守军如何反应？');
assert.strictEqual(r1.material, '阅读材料，回答问题。材料："卢沟桥……要道。"');
assert.deepStrictEqual(r1.subs.map(s => s.label), ['（1）', '（2）', '（3）']);
assert.strictEqual(r1.subs[0].text, '战略地位是什么？');
assert.strictEqual(r1.subs[2].text, '中国守军如何反应？');

// 2. 无小问：普通大题不拆
assert.strictEqual(splitSubQuestions('简述人体内多余水分的排出途径。'), null);

// 3. 单个（1）：不拆
assert.strictEqual(splitSubQuestions('结合材料（1）简述背景。'), null);

// 4. 材料里已有（2）引用 + 小问从（1）开始：应取最长从1递增序列
const r4 = splitSubQuestions('材料提到参见（2）页。（1）第一问？（2）第二问？');
assert.ok(r4);
assert.deepStrictEqual(r4.subs.map(s => s.text), ['第一问？', '第二问？']);
assert.strictEqual(r4.material, '材料提到参见（2）页。');

// 5. 不连续编号（1）（3）：不拆
assert.strictEqual(splitSubQuestions('（1）第一问？（3）第三问？'), null);

// 6. 半角括号同样支持
const r6 = splitSubQuestions('根据材料。(1)问一？(2)问二？');
assert.ok(r6);
assert.strictEqual(r6.subs.length, 2);

console.log('splitSubQuestions 自检全部通过');
