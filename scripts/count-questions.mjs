// 批量解析所有 docx 文件，统计实际题量
import mammoth from 'mammoth';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';

const ROOT = 'd:/小四门软件/试题/试题';

// 学科映射
const SUBJECT_MAP = {
  '生物': 'biology',
  '道法': 'politics',
  '历史': 'history',
  '地理': 'geography',
  '化学': 'chemistry',
  '物理': 'physics',
};

function walkDir(dir) {
  const results = [];
  const items = readdirSync(dir);
  for (const item of items) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      results.push(...walkDir(full));
    } else if (item.endsWith('.docx')) {
      results.push(full);
    }
  }
  return results;
}

// 解析路径元数据
function parseMeta(filePath) {
  // 路径格式: 试题/试题/学科/年级/版本/章节/课时/文件名
  const rel = filePath.replace(/\\/g, '/').split('/试题/试题/')[1];
  const parts = rel.split('/');
  const subject = SUBJECT_MAP[parts[0]] || parts[0];
  const grade = parts[1] || '';
  const version = parts[2] || '';
  const chapter = parts[3] || '';
  const lesson = parts[4] || '';
  const fileName = parts[5] || '';
  const isChoice = fileName.includes('选择');
  return { subject, grade, version, chapter, lesson, isChoice, fileName };
}

// 解析选择判断题
function parseChoice(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let current = [];
  const NUM_PREFIX = /^\s*(\d+)\s*[.．、]\s*/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (NUM_PREFIX.test(trimmed)) {
      if (current.length > 0 && current.some(l => /答案\s*[:：]/.test(l))) {
        blocks.push(current.join('\n'));
      }
      current = [line];
    } else {
      if (current.length === 0 && trimmed === '') continue;
      current.push(line);
    }
  }
  if (current.length > 0 && current.some(l => /答案\s*[:：]/.test(l))) {
    blocks.push(current.join('\n'));
  }
  return blocks.length;
}

// 解析大题
function parseEssay(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let count = 0;
  const NUM_PREFIX = /^\s*(\d+)\s*[.．、]\s*/;
  
  for (const line of lines) {
    if (NUM_PREFIX.test(line.trim()) && /答案\s*[:：]/.test(line)) {
      count++;
    }
  }
  // 如果没匹配到，尝试按题号切分
  if (count === 0) {
    let prevNum = 0;
    for (const line of lines) {
      const m = line.trim().match(NUM_PREFIX);
      if (m) {
        const num = parseInt(m[1]);
        if (num === prevNum + 1) count++;
        prevNum = num;
      }
    }
  }
  return count;
}

async function main() {
  const files = walkDir(ROOT);
  console.log(`共 ${files.length} 个 docx 文件\n`);

  const stats = {};
  let totalChoice = 0, totalEssay = 0;

  // 先测试5个选择判断和5个大题文件
  const choiceFiles = files.filter(f => basename(f).includes('选择')).slice(0, 5);
  const essayFiles = files.filter(f => basename(f).includes('大题')).slice(0, 5);

  console.log('=== 选择判断样例 ===');
  for (const f of choiceFiles) {
    const buf = readFileSync(f);
    const { value } = await mammoth.extractRawText({ buffer: buf });
    const count = parseChoice(value);
    const meta = parseMeta(f);
    console.log(`[${meta.subject}] ${meta.grade} ${meta.chapter} ${meta.lesson}: ${count}题 (${value.length}字符)`);
  }

  console.log('\n=== 大题样例 ===');
  for (const f of essayFiles) {
    const buf = readFileSync(f);
    const { value } = await mammoth.extractRawText({ buffer: buf });
    const count = parseEssay(value);
    const meta = parseMeta(f);
    console.log(`[${meta.subject}] ${meta.grade} ${meta.chapter} ${meta.lesson}: ${count}题 (${value.length}字符)`);
    // 打印前500字符看格式
    console.log('  格式预览:', value.slice(0, 300).replace(/\n/g, ' | '));
  }

  console.log('\n=== 统计全部题量（采样前100个文件）===');
  const sample = files.slice(0, 100);
  for (const f of sample) {
    const buf = readFileSync(f);
    const { value } = await mammoth.extractRawText({ buffer: buf });
    const meta = parseMeta(f);
    const count = meta.isChoice ? parseChoice(value) : parseEssay(value);
    const key = `${meta.subject}`;
    if (!stats[key]) stats[key] = { choice: 0, essay: 0, files: 0 };
    if (meta.isChoice) stats[key].choice += count;
    else stats[key].essay += count;
    stats[key].files++;
  }

  console.log('\n采样统计（前100文件）:');
  for (const [k, v] of Object.entries(stats)) {
    console.log(`  ${k}: ${v.files}文件, 选择${v.choice}题, 大题${v.essay}题`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
