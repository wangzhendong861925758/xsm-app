// 诊断脚本：扫描 public/data/questions/ 下所有分片，
// 区分"真实上传"（有 source:"imported" 字段）和"存根"（开发时生成的测试数据）
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';

const files = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const stubs = [];
const reals = [];
const ambiguous = [];

for (const f of files) {
  try {
    const raw = readFileSync(join(Q_DIR, f), 'utf8');
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) {
      ambiguous.push({ file: f, count: 0, reason: '空文件或非数组' });
      continue;
    }
    const first = arr[0];
    const isReal = first.source === 'imported';
    const idPattern = first.id || '';
    const isStubId = /^[a-z]+-\d?[a-z]-/.test(idPattern) || /^[a-z]+-tb-/.test(idPattern);
    const hasChapter = !!first.chapter;
    const hasCreatedAt = !!first.createdAt;

    const info = {
      file: f,
      count: arr.length,
      firstId: idPattern,
      source: first.source || '(无)',
      hasChapter,
      hasCreatedAt,
    };

    if (isReal) {
      reals.push(info);
    } else if (isStubId || (!hasChapter && !hasCreatedAt && arr.length <= 20)) {
      stubs.push(info);
    } else {
      ambiguous.push(info);
    }
  } catch (e) {
    ambiguous.push({ file: f, count: 0, reason: e.message });
  }
}

// 按学科|年级分组汇总
const summarize = (list) => {
  const groups = {};
  for (const item of list) {
    const base = item.file.replace(/\.json$/, '');
    const parts = base.split('_');
    if (parts.length < 3) continue;
    const subject = parts[0];
    const version = parts[parts.length - 1];
    const grade = parts.slice(1, -1).join('_');
    const key = `${subject}|${grade}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ version, count: item.count, file: item.file });
  }
  return groups;
};

const stubGroups = summarize(stubs);
const realGroups = summarize(reals);
const ambGroups = summarize(ambiguous);

let report = '=== 存根文件（将删除） ===\n';
report += `共 ${stubs.length} 个文件\n\n`;
for (const [key, items] of Object.entries(stubGroups).sort()) {
  report += `${key}:\n`;
  for (const i of items.sort((a, b) => a.version.localeCompare(b.version))) {
    report += `  ${i.version} (${i.count}题) — ${i.file}\n`;
  }
  report += '\n';
}

report += '\n=== 真实上传文件（保留） ===\n';
report += `共 ${reals.length} 个文件\n\n`;
for (const [key, items] of Object.entries(realGroups).sort()) {
  report += `${key}:\n`;
  for (const i of items.sort((a, b) => a.version.localeCompare(b.version))) {
    report += `  ${i.version} (${i.count}题)\n`;
  }
  report += '\n';
}

if (ambiguous.length > 0) {
  report += '\n=== 模糊文件（需人工确认） ===\n';
  report += `共 ${ambiguous.length} 个文件\n\n`;
  for (const i of ambiguous) {
    report += `  ${i.file} — ${i.count}题 — ${i.reason || `id=${i.firstId} source=${i.source}`}\n`;
  }
}

// 对比：哪些 subject|grade 同时有存根和真实文件
report += '\n=== 重复对比（同一 subject|grade 下存根版本 vs 真实版本） ===\n\n';
const allKeys = new Set([...Object.keys(stubGroups), ...Object.keys(realGroups)]);
for (const key of [...allKeys].sort()) {
  const s = (stubGroups[key] || []).map(i => i.version);
  const r = (realGroups[key] || []).map(i => i.version);
  const onlyStub = s.filter(v => !r.includes(v));
  const onlyReal = r.filter(v => !s.includes(v));
  const both = s.filter(v => r.includes(v));
  if (s.length > 0 || r.length > 0) {
    report += `${key}:\n`;
    report += `  真实上传 ${r.length} 版: ${r.sort().join(' / ')}\n`;
    report += `  存根文件 ${s.length} 版: ${s.sort().join(' / ')}\n`;
    if (both.length > 0) report += `  ⚠ 同名重复(存根会覆盖真实): ${both.join(' / ')}\n`;
    report += '\n';
  }
}

writeFileSync('d:/小四门软件/scripts/_diagnostic_report.txt', report);
console.log(`扫描完成：${reals.length} 真实 / ${stubs.length} 存根 / ${ambiguous.length} 模糊`);
console.log('报告已写入 scripts/_diagnostic_report.txt');
