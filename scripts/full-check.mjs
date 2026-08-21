// 全量检查304个版本的题目数据完整性
// 检查项：题数、有章节、有课时、有选择/判断题、有大题
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';
const SOURCE_DIR = 'D:/小四门软件/试题/试题';

// 读取textbooks.ts获取所有版本
const tbRaw = readFileSync('d:/小四门软件/src/data/textbooks.ts', 'utf8');
const tbMatches = [...tbRaw.matchAll(/\{ grade: "([^"]+)", subject: "([^"]+)", subjectName: "([^"]+)", versions: \[([^\]]+)\] \}/g)];
const allVersions = [];
for (const m of tbMatches) {
  const grade = m[1], subject = m[2];
  const versions = [...m[4].matchAll(/"([^"]+)"/g)].map(x => x[1]);
  for (const v of versions) {
    allVersions.push({ grade, subject, version: v });
  }
}

const norm = (s) => s.replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');

// 获取所有题目文件
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const qFileMap = {};
for (const f of qFiles) {
  const base = f.replace(/\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  qFileMap[`${subject}|${grade}|${norm(version)}`] = { file: f, path: join(Q_DIR, f) };
}

// 学科目录映射
const SUBJECT_DIR = {
  biology: '生物', history: '历史', politics: '道法',
  geography: '地理', chemistry: '化学', physics: '物理'
};

// 扫描源目录，建立 版本->源文件列表 映射
const sourceMap = {};
function scanSource() {
  if (!existsSync(SOURCE_DIR)) {
    console.log(`源目录不存在: ${SOURCE_DIR}`);
    return;
  }
  const gradeDirs = readdirSync(SOURCE_DIR);
  for (const gradeDir of gradeDirs) {
    const gradePath = join(SOURCE_DIR, gradeDir);
    const subjDirs = readdirSync(gradePath);
    for (const subjDir of subjDirs) {
      const subjPath = join(gradePath, subjDir);
      const versionDirs = readdirSync(subjPath);
      for (const vDir of versionDirs) {
        const vPath = join(subjPath, vDir);
        const key = `${gradeDir}|${subjDir}|${vDir}`;
        if (!sourceMap[key]) sourceMap[key] = [];
        const files = readdirSync(vPath).filter(f => f.endsWith('.docx') || f.endsWith('.doc'));
        sourceMap[key].push(...files.map(f => join(vPath, f)));
      }
    }
  }
}
scanSource();

// 反向映射：学科中文->英文
const SUBJECT_EN = {};
for (const [en, cn] of Object.entries(SUBJECT_DIR)) SUBJECT_EN[cn] = en;

console.log(`总版本数: ${allVersions.length}`);
console.log(`源目录扫描完成, 含 ${Object.keys(sourceMap).length} 个学段-学科-版本组合\n`);

const issues = [];
const stats = [];

for (const { grade, subject, version } of allVersions) {
  const key = `${subject}|${grade}|${norm(version)}`;
  const fileEntry = qFileMap[key];
  
  if (!fileEntry) {
    // 题目文件不存在，检查源目录
    const subjCn = SUBJECT_DIR[subject];
    // 尝试多种key匹配源目录
    const sourceKeys = Object.keys(sourceMap).filter(k => {
      return k.startsWith(`${grade}|`) && 
             k.includes(`|${subjCn}|`) &&
             norm(k.split('|')[2]) === norm(version);
    });
    // 模糊匹配版本名
    const fuzzyKeys = Object.keys(sourceMap).filter(k => {
      if (!k.startsWith(`${grade}|`)) return false;
      if (!k.includes(`|${subjCn}|`)) return false;
      const srcV = k.split('|')[2];
      return norm(srcV) === norm(version) || 
             norm(srcV).replace(/[（）]/g,'') === norm(version).replace(/[（）]/g,'');
    });
    issues.push({ grade, subject, version, issue: 'NO_FILE', sourceCount: (sourceKeys[0] || fuzzyKeys[0]) ? sourceMap[sourceKeys[0]||fuzzyKeys[0]].length : 0 });
    continue;
  }
  
  let questions = [];
  try {
    questions = JSON.parse(readFileSync(fileEntry.path, 'utf8'));
  } catch (e) {
    issues.push({ grade, subject, version, issue: 'PARSE_ERROR' });
    continue;
  }
  
  if (!Array.isArray(questions) || questions.length === 0) {
    issues.push({ grade, subject, version, issue: 'ZERO_QUESTIONS' });
    continue;
  }
  
  // 统计
  const withChapter = questions.filter(q => q.chapter && q.chapter.trim()).length;
  const withSection = questions.filter(q => q.section && q.section.trim()).length;
  const choiceQs = questions.filter(q => q.type === 'single' || q.type === 'multiple' || q.type === 'judge').length;
  const essayQs = questions.filter(q => q.type === 'essay').length;
  
  const s = { grade, subject, version, total: questions.length, withChapter, withSection, choiceQs, essayQs };
  stats.push(s);
  
  // 检查问题
  if (withChapter === 0) {
    issues.push({ ...s, issue: 'NO_CHAPTER' });
  } else if (withChapter < questions.length * 0.5) {
    issues.push({ ...s, issue: 'LOW_CHAPTER' });
  }
  if (choiceQs === 0) {
    issues.push({ ...s, issue: 'NO_CHOICE' });
  }
  if (essayQs === 0) {
    issues.push({ ...s, issue: 'NO_ESSAY' });
  }
}

// 输出统计
console.log('=== 统计汇总 ===');
console.log(`总版本: ${allVersions.length}`);
console.log(`正常: ${allVersions.length - issues.length}`);
console.log(`有问题: ${issues.length}`);

console.log('\n=== 问题列表 ===');
const issueTypes = {};
for (const i of issues) {
  issueTypes[i.issue] = (issueTypes[i.issue] || 0) + 1;
}
console.log('问题类型统计:', issueTypes);

console.log('\n=== 详细问题 ===');
for (const i of issues) {
  if (i.issue === 'NO_FILE') {
    console.log(`[NO_FILE] ${i.grade}|${i.subject}|${i.version} (源文件数:${i.sourceCount})`);
  } else if (i.issue === 'NO_ESSAY') {
    // 大题缺失是常见的，不一定是问题（有些版本确实没有大题）
    console.log(`[NO_ESSAY] ${i.grade}|${i.subject}|${i.version} (总题:${i.total}, 选择:${i.choiceQs})`);
  } else {
    console.log(`[${i.issue}] ${i.grade}|${i.subject}|${i.version} (总:${i.total}, 章:${i.withChapter}, 选:${i.choiceQs}, 大:${i.essayQs})`);
  }
}
