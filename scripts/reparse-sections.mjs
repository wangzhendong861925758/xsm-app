// 重新解析94个section为空的版本，从源docx文件中提取chapter和section
// 源目录结构：学科 > 年级 > 版本 > 单元(chapter) > 课时(section) > 文件
import { readdirSync, existsSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import mammoth from 'mammoth';
import { randomBytes } from 'crypto';

const SOURCE_DIR = 'D:/小四门软件/试题/试题';
const Q_DIR = 'd:/小四门软件/public/data/questions';

const SUBJECT_DIR = {
  biology: '生物', history: '历史', politics: '道法',
  geography: '地理', chemistry: '化学', physics: '物理'
};

const norm = (s) => s.replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');

// 读取需要修复的版本列表（仅重新解析选择题为0的14个版本）
const reparseLog = existsSync('d:/小四门软件/scripts/_reparse_log.json')
  ? JSON.parse(readFileSync('d:/小四门软件/scripts/_reparse_log.json', 'utf8'))
  : [];
const zeroChoiceVersions = reparseLog.filter(l => l.status === 'FIXED' && l.choice === 0);
const toFix = zeroChoiceVersions.map(l => ({ grade: l.grade, subject: l.subject, version: l.version }));

console.log(`需要重新解析: ${toFix.length} 个版本（选择题为0）`);

// 递归查找目录下所有 docx 文件
function findDocxFiles(dir, base = dir) {
  const out = [];
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      out.push(...findDocxFiles(fullPath, base));
    } else if ((item.endsWith('.docx') || item.endsWith('.doc')) && !item.startsWith('~$')) {
      const relPath = fullPath.substring(base.length + 1);
      out.push({ fullPath, relPath, fileName: item });
    }
  }
  return out;
}

// 解析选择题/判断题
function parseChoiceQuestions(text) {
  const questions = [];
  // 格式1: "数字. 题干（　）A. 选项 B. 选项 C. 选项 D. 选项 答案：X"
  // 格式2: "第X题 题干（　）A. 选项 B. 选项 C. 选项 D. 选项 答案：X"
  const lines = text.split(/\n/).filter(l => l.trim());
  for (const line of lines) {
    const m = line.match(/^(?:(\d+)\s*[.、．]\s*|第(\d+)题\s*)(.+)/);
    if (!m) continue;
    const num = parseInt(m[1] || m[2]);
    if (num > 500 || !num) continue; // 跳过过大的题号
    
    let rest = m[3];
    // 提取答案
    let answer = '';
    const ansMatch = rest.match(/答案[：:]\s*([A-Z对错√×]+)/);
    if (ansMatch) {
      answer = ansMatch[1];
      rest = rest.substring(0, ansMatch.index).trim();
    }
    
    // 提取选项
    const options = [];
    const optMatch = rest.match(/[A-D][.、．\s]+([^A-D]+?)(?=[A-D][.、．\s]|$)/g);
    if (optMatch) {
      for (const opt of optMatch) {
        const cleanOpt = opt.replace(/^[A-D][.、．\s]+/, '').trim();
        if (cleanOpt) options.push(cleanOpt);
      }
    }
    
    // 提取题干
    let stem = rest;
    if (optMatch && optMatch.length > 0) {
      stem = rest.substring(0, rest.indexOf(optMatch[0])).trim();
    }
    // 清理题干
    stem = stem.replace(/[（(]\s*[　 ]*\s*[)）]/, '（　）').trim();
    
    if (!stem) continue;
    
    // 判断题型
    let type = 'single';
    if (options.length === 2 && /[对错√×]/.test(answer)) {
      type = 'judge';
    } else if (answer.length > 1 && /^[A-Z]+$/.test(answer)) {
      type = 'multiple';
    }
    
    questions.push({ num, type, stem, options, answer });
  }
  return questions;
}

// 解析大题
function parseEssayQuestions(text) {
  const questions = [];
  const lines = text.split(/\n/).filter(l => l.trim());
  for (const line of lines) {
    const m = line.match(/^(?:第?(\d+)题|(\d+))\s*[.、．：:题目]*\s*(.+)/);
    if (!m) continue;
    const num = parseInt(m[1] || m[2]);
    if (num > 500) continue;
    
    let rest = m[3];
    // 提取答案
    let answer = '';
    const ansMatch = rest.match(/答案[：:]\s*(.+)/);
    if (ansMatch) {
      answer = ansMatch[1].trim();
      rest = rest.substring(0, ansMatch.index).trim();
    }
    
    if (!rest) continue;
    questions.push({ num, type: 'essay', stem: rest, answer });
  }
  return questions;
}

let totalFixed = 0;
const log = [];

for (let i = 0; i < toFix.length; i++) {
  const { grade, subject, version } = toFix[i];
  const subjectCn = SUBJECT_DIR[subject];
  const versionPath = join(SOURCE_DIR, subjectCn, grade, version);
  
  if (!existsSync(versionPath)) {
    log.push({ grade, subject, version, status: 'VERSION_DIR_NOT_FOUND' });
    continue;
  }

  // 递归查找所有 docx 文件
  const docxFiles = findDocxFiles(versionPath);
  if (docxFiles.length === 0) {
    log.push({ grade, subject, version, status: 'NO_DOCX' });
    continue;
  }

  // 解析每个 docx 文件
  const allQuestions = [];
  let qNum = 0;
  
  for (const docx of docxFiles) {
    const parts = docx.relPath.split(/[\\\/]/).filter(Boolean);
    const fileName = parts[parts.length - 1];
    const sectionDir = parts.length >= 2 ? parts[parts.length - 2] : '';
    const chapterDir = parts.length >= 3 ? parts[parts.length - 3] : version;
    
    // 判断题型
    let fileType = '';
    if (fileName.includes('选择') || fileName.includes('判断')) fileType = 'choice';
    else if (fileName.includes('大题') || fileName.includes('解答')) fileType = 'essay';
    else fileType = 'choice'; // 默认
    
    try {
      const result = await mammoth.extractRawText({ path: docx.fullPath });
      const text = result.value;
      
      let parsed;
      if (fileType === 'essay') {
        parsed = parseEssayQuestions(text);
      } else {
        parsed = parseChoiceQuestions(text);
      }
      
      for (const q of parsed) {
        qNum++;
        allQuestions.push({
          id: `${subject}_${grade}_${version}_${qNum}_${randomBytes(4).toString('hex')}`,
          type: q.type,
          subject,
          grade,
          version,
          chapter: chapterDir,
          section: sectionDir,
          stem: q.stem,
          options: q.options || [],
          answer: q.answer,
          sourceFile: fileName
        });
      }
    } catch (e) {
      console.error(`解析失败: ${docx.fullPath}: ${e.message}`);
    }
  }
  
  if (allQuestions.length === 0) {
    log.push({ grade, subject, version, status: 'NO_QUESTIONS_PARSED' });
    continue;
  }
  
  // 写入 JSON 文件
  const jsonFileName = `${subject}_${grade}_${version}.json`;
  const jsonFilePath = join(Q_DIR, jsonFileName);
  writeFileSync(jsonFilePath, JSON.stringify(allQuestions, null, 2));
  
  totalFixed++;
  const chapterSet = new Set(allQuestions.map(q => q.chapter));
  const sectionSet = new Set(allQuestions.map(q => q.section).filter(Boolean));
  const choiceCount = allQuestions.filter(q => q.type !== 'essay').length;
  const essayCount = allQuestions.filter(q => q.type === 'essay').length;
  
  log.push({
    grade, subject, version,
    status: 'FIXED',
    total: allQuestions.length,
    chapters: chapterSet.size,
    sections: sectionSet.size,
    choice: choiceCount,
    essay: essayCount
  });
  
  console.log(`[${i+1}/${toFix.length}] ${grade}|${subject}|${version}: ${allQuestions.length}题, ${chapterSet.size}章, ${sectionSet.size}课时 (选择${choiceCount}/大题${essayCount})`);
}

writeFileSync('d:/小四门软件/scripts/_reparse_log.json', JSON.stringify(log, null, 2), 'utf8');
console.log(`\n修复完成: ${totalFixed}/${toFix.length}`);
