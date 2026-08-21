// 从 src/data/questions/*.ts 重新生成 JSON 分片 + manifest.json
// 确保 GradeSelectPage 显示的版本与 .ts 源数据完全一致
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

const SRC_DIR = 'd:/小四门软件/src/data/questions';
const OUT_DIR = 'd:/小四门软件/public/data/questions';
const OUT_IDX_DIR = 'd:/小四门软件/public/data/question-index';

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(OUT_IDX_DIR, { recursive: true });

const files = readdirSync(SRC_DIR).filter(f => f.endsWith('.ts'));
console.log(`发现 ${files.length} 个 .ts 源文件`);

// 用正则提取每个 question 对象的字段
// 格式：{ id: "...", subject: "...", grade: "...", version: "...", type: "...", stem: "...", options: [...], answer: "...", analysis: "...", mastered: false, collected: false }
function extractQuestions(content) {
  const questions = [];
  // 匹配每个对象（最外层 {...}）
  // 使用平衡括号扫描，支持单行和多行格式
  let i = 0;
  while (i < content.length) {
    // 找 "{ id:" 或 "{\n  id:" 格式
    const re = /\{\s*id:/g;
    re.lastIndex = i;
    const m = re.exec(content);
    if (!m) break;
    const start = m.index;
    // 找匹配的右括号
    let depth = 1;
    let j = start + 1;
    while (j < content.length && depth > 0) {
      if (content[j] === '{') depth++;
      else if (content[j] === '}') depth--;
      j++;
    }
    const objStr = content.slice(start, j);
    // 提取字段
    const q = parseQuestion(objStr);
    if (q) questions.push(q);
    i = j;
  }
  return questions;
}

function parseField(objStr, field) {
  const m = objStr.match(new RegExp(`${field}:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'm'));
  return m ? m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\') : '';
}

function parseOptions(objStr) {
  const m = objStr.match(/options:\s*\[([^\]]*)\]/s);
  if (!m) return [];
  const arrStr = m[1];
  // 匹配每个 "..." (含转义)
  const opts = [];
  let i = 0;
  while (i < arrStr.length) {
    const q = arrStr.indexOf('"', i);
    if (q === -1) break;
    let j = q + 1;
    while (j < arrStr.length) {
      if (arrStr[j] === '\\') { j += 2; continue; }
      if (arrStr[j] === '"') break;
      j++;
    }
    opts.push(arrStr.slice(q + 1, j).replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
    i = j + 1;
  }
  return opts;
}

function parseQuestion(objStr) {
  const id = parseField(objStr, 'id');
  const subject = parseField(objStr, 'subject');
  const grade = parseField(objStr, 'grade');
  const version = parseField(objStr, 'version');
  const type = parseField(objStr, 'type');
  const stem = parseField(objStr, 'stem');
  const answer = parseField(objStr, 'answer');
  const analysis = parseField(objStr, 'analysis');
  if (!id || !subject) return null;
  return {
    id, subject, grade, version, type: type || 'single',
    stem, options: parseOptions(objStr), answer, analysis,
    mastered: false, collected: false,
  };
}

// 收集所有题目
const allQuestions = [];
for (const f of files) {
  const content = readFileSync(join(SRC_DIR, f), 'utf8');
  const qs = extractQuestions(content);
  console.log(`  ${f}: ${qs.length} 题`);
  allQuestions.push(...qs);
}
console.log(`总计：${allQuestions.length} 题`);

// 按 subject|grade|version 分组
const groups = new Map();
for (const q of allQuestions) {
  if (!q.subject || !q.grade || !q.version) continue;
  const key = `${q.subject}|${q.grade}|${q.version}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(q);
}
console.log(`分组数：${groups.size}`);

// 检查化学九年级和历史八年级上
console.log('\n=== 验证关键数据 ===');
for (const [key, qs] of groups.entries()) {
  if (key.includes('chemistry|九年级') || key.includes('history|八年级上')) {
    console.log(`  ${key}: ${qs.length} 题`);
  }
}

// 写入分片文件 + 构建 manifest
// 注意：保留已存在的 .json 分片（如化学数据来自 docx 解析，不在 .ts 源中）
// 1) 先写入 .ts 能提取的分组（覆盖同名文件）
const tsWritten = new Set();
let totalWritten = 0;
for (const [key, qs] of groups.entries()) {
  const [subject, grade, version] = key.split('|');
  const filename = `${subject}_${grade}_${version}.json`.replace(/[\\/:*?"<>|]/g, '_');
  writeFileSync(join(OUT_DIR, filename), JSON.stringify(qs));
  tsWritten.add(filename);
  totalWritten += qs.length;
}

// 2) 扫描 OUT_DIR 下所有 .json 分片，构建完整 manifest（合并 .ts 和现有 .json）
//    特殊处理：化学九年级题目按"五四学制全一册"上传，上下册应共享所有版本
//    检测化学九年级上册的分片，自动复制到九年级下册（同名替换 grade）
const copyFileSync = (await import('fs')).copyFileSync;
const chemShards = readdirSync(OUT_DIR).filter(f => f.startsWith('chemistry_九年级上册_') && f.endsWith('.json'));
console.log(`\n检测到化学九年级上册 ${chemShards.length} 个分片，复制到九年级下册...`);
for (const f of chemShards) {
  const newF = f.replace('chemistry_九年级上册_', 'chemistry_九年级下册_');
  copyFileSync(join(OUT_DIR, f), join(OUT_DIR, newF));
  console.log(`  ${f} → ${newF}`);
}

// 同理：化学八年级上册的版本应同步到八年级下册（化学五四学制全一册跨学期）
// 五四学制化学在九年级开设（全一册），把八年级的"五四学制全一册"版本同时同步到九年级
const chem8aShards = readdirSync(OUT_DIR).filter(f => f.startsWith('chemistry_八年级上册_') && f.endsWith('.json'));
console.log(`\n检测到化学八年级上册 ${chem8aShards.length} 个分片，复制到八年级下册...`);
for (const f of chem8aShards) {
  const newF = f.replace('chemistry_八年级上册_', 'chemistry_八年级下册_');
  copyFileSync(join(OUT_DIR, f), join(OUT_DIR, newF));
  console.log(`  ${f} → ${newF}`);
  // 五四学制全一册 → 同步到九年级上/下册
  if (f.includes('五四学制') && f.includes('全一册')) {
    for (const g of ['九年级上册', '九年级下册']) {
      const targetF = f.replace('chemistry_八年级上册_', `chemistry_${g}_`);
      copyFileSync(join(OUT_DIR, f), join(OUT_DIR, targetF));
      console.log(`  ${f} → ${targetF} (五四学制归属九年级)`);
    }
  }
}

const manifest = {};
const allShards = readdirSync(OUT_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
for (const f of allShards) {
  // 解析文件名：subject_grade_version.json
  const base = f.replace(/\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  // 读取题数
  let count = 0;
  try {
    const content = JSON.parse(readFileSync(join(OUT_DIR, f), 'utf8'));
    count = Array.isArray(content) ? content.length : 0;
  } catch {}
  const mkey = `${subject}|${grade}`;
  if (!manifest[mkey]) manifest[mkey] = [];
  // 去重（按 version）
  if (!manifest[mkey].some(e => e.version === version)) {
    manifest[mkey].push({ version, file: f, count });
  }
}
writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`\n已写入 ${groups.size} 个分片，共 ${totalWritten} 题`);
console.log(`manifest.json 已生成`);

// 重新生成 question-index
console.log('\n=== 重新生成 question-index ===');
let idxCount = 0;
for (const [key, qs] of groups.entries()) {
  const [subject, grade, version] = key.split('|');
  // 聚合章节结构
  const chapterMap = new Map();
  for (const q of qs) {
    const ch = q.chapter || '未分单元';
    const sec = q.section || '';
    if (!chapterMap.has(ch)) chapterMap.set(ch, new Map());
    const secMap = chapterMap.get(ch);
    if (!secMap.has(sec)) secMap.set(sec, { choice: 0, essay: 0, judge: 0 });
    const cnt = secMap.get(sec);
    if (q.type === 'essay') cnt.essay++;
    else if (q.type === 'judge') cnt.judge++;
    else cnt.choice++;
  }
  const index = [];
  for (const [ch, secMap] of chapterMap) {
    const sections = [];
    for (const [sec, cnt] of secMap) {
      sections.push({ title: sec, ...cnt });
    }
    index.push({ chapter: ch, sections });
  }
  const filename = `${subject}_${grade}_${version}.idx.json`.replace(/[\\/:*?"<>|]/g, '_');
  writeFileSync(join(OUT_IDX_DIR, filename), JSON.stringify(index));
  idxCount++;
}

// 生成 index 的 manifest
const indexManifest = {};
for (const [key, entries] of Object.entries(manifest)) {
  indexManifest[key] = entries.map(e => ({
    version: e.version,
    file: e.file.replace('.json', '.idx.json'),
    count: e.count,
  }));
}
writeFileSync(join(OUT_IDX_DIR, 'manifest.json'), JSON.stringify(indexManifest, null, 2));

console.log(`已生成 ${idxCount} 个索引文件`);

// 验证：打印化学九年级和历史八年级上的版本
console.log('\n=== 最终 manifest 验证 ===');
for (const key of ['chemistry|九年级上册', 'chemistry|九年级下册', 'history|八年级上册']) {
  const entries = manifest[key] || [];
  console.log(`${key}: ${entries.length} 个版本`);
  for (const e of entries) {
    console.log(`  - ${e.version} (${e.count}题)`);
  }
}

console.log('\n完成。');
