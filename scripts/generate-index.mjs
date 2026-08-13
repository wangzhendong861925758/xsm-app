// 生成分片的章节索引（轻量metadata），只包含 chapter + section + type + count，不含题目内容
// 用于 ChapterSelectPage 快速显示章节列表，无需下载完整分片
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';

const SRC_DIR = 'd:/小四门软件/public/data/questions';
const OUT_DIR = 'd:/小四门软件/public/data/question-index';

mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(SRC_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
console.log(`共 ${files.length} 个分片`);

let totalIndex = 0;
for (const file of files) {
  let qs;
  try { qs = JSON.parse(readFileSync(join(SRC_DIR, file), 'utf8')); } catch(e) { continue; }

  // 聚合章节结构：chapter -> section -> { choiceCount, essayCount, judgeCount }
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

  // 转为数组形式（轻量）
  const index = [];
  for (const [ch, secMap] of chapterMap) {
    const sections = [];
    for (const [sec, cnt] of secMap) {
      sections.push({ title: sec, ...cnt });
    }
    index.push({ chapter: ch, sections });
  }

  const outFile = file.replace('.json', '.idx.json');
  writeFileSync(join(OUT_DIR, outFile), JSON.stringify(index));
  totalIndex++;
}

// 生成索引的manifest
const manifest = JSON.parse(readFileSync(join(SRC_DIR, 'manifest.json'), 'utf8'));
const indexManifest = {};
for (const [key, entries] of Object.entries(manifest)) {
  indexManifest[key] = entries.map(e => ({
    version: e.version,
    file: e.file.replace('.json', '.idx.json'),
    count: e.count,
  }));
}
writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(indexManifest, null, 2));

console.log(`完成：生成 ${totalIndex} 个索引文件`);
console.log(`输出目录：${OUT_DIR}`);

// 检查大小
const idxFiles = readdirSync(OUT_DIR).filter(f => f.endsWith('.json'));
let totalSize = 0;
for (const f of idxFiles) {
  const stat = readFileSync(join(OUT_DIR, f));
  totalSize += stat.length;
}
console.log(`索引总大小：${(totalSize / 1024).toFixed(1)} KB (平均 ${(totalSize / idxFiles.length / 1024).toFixed(1)} KB/文件)`);
