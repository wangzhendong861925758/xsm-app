// 重新解析剩余34个有问题的版本
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

// 从verify-final.mjs输出中提取的34个问题版本
const toFix = [
  // ALL_EMPTY_SECTION (2)
  { grade: '八年级上册', subject: 'history', version: '统编版' },
  { grade: '八年级上册', subject: 'history', version: '统编版（2016）' },
  // VERSION_NO_ESSAY (3)
  { grade: '七年级下册', subject: 'geography', version: '中图版' },
  { grade: '七年级下册', subject: 'geography', version: '晋教版' },
  { grade: '七年级下册', subject: 'geography', version: '湘教版' },
  // CHAPTER_ISSUES (29) - 从输出中提取
  { grade: '六年级上册', subject: 'history', version: '统编版（五四学制）' },
  { grade: '六年级上册', subject: 'geography', version: '鲁教版（五四学制）（2012）' },
  { grade: '六年级下册', subject: 'history', version: '统编版（五四学制）' },
  { grade: '七年级上册', subject: 'geography', version: '仁爱科普版' },
  { grade: '七年级上册', subject: 'geography', version: '粤人版（2012）' },
  { grade: '七年级下册', subject: 'geography', version: '人教版（五四学制）（2012）' },
  { grade: '七年级下册', subject: 'geography', version: '商务星球版' },
  { grade: '七年级下册', subject: 'geography', version: '商务星球版（2012）' },
  { grade: '七年级下册', subject: 'geography', version: '晋教版（2012）' },
  { grade: '七年级下册', subject: 'geography', version: '粤人版（2012）' },
  { grade: '七年级下册', subject: 'geography', version: '鲁教版（五四学制）（2012）' },
  { grade: '八年级上册', subject: 'biology', version: '人教版（2012）' },
  { grade: '八年级上册', subject: 'biology', version: '冀少版（2012）' },
  { grade: '八年级上册', subject: 'biology', version: '北京版（2012）' },
  { grade: '八年级上册', subject: 'biology', version: '北师大版（2012）' },
];

console.log(`需要重新解析: ${toFix.length} 个版本`);

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

function parseChoiceQuestions(text) {
  const questions = [];
  const lines = text.split(/\n/).filter(l => l.trim());
  for (const line of lines) {
    const m = line.match(/^(?:(\d+)\s*[.、．]\s*|第(\d+)题\s*)(.+)/);
    if (!m) continue;
    const num = parseInt(m[1] || m[2]);
    if (num > 500 || !num) continue;
    
    let rest = m[3];
    let answer = '';
    const ansMatch = rest.match(/答案[：:]\s*([A-Z对错√×]+)/);
    if (ansMatch) {
      answer = ansMatch[1];
      rest = rest.substring(0, ansMatch.index).trim();
    }
    
    const options = [];
    const optMatch = rest.match(/[A-D][.、．\s]+([^A-D]+?)(?=[A-D][.、．\s]|$)/g);
    if (optMatch) {
      for (const opt of optMatch) {
        const cleanOpt = opt.replace(/^[A-D][.、．\s]+/, '').trim();
        if (cleanOpt) options.push(cleanOpt);
      }
    }
    
    let stem = rest;
    if (optMatch && optMatch.length > 0) {
      stem = rest.substring(0, rest.indexOf(optMatch[0])).trim();
    }
    stem = stem.replace(/[（(]\s*[　 ]*\s*[)）]/, '（　）').trim();
    
    if (!stem) continue;
    
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

function parseEssayQuestions(text) {
  const questions = [];
  const lines = text.split(/\n/).filter(l => l.trim());
  for (const line of lines) {
    const m = line.match(/^(?:第?(\d+)题|(\d+))\s*[.、．：:题目]*\s*(.+)/);
    if (!m) continue;
    const num = parseInt(m[1] || m[2]);
    if (num > 500 || !num) continue;
    
    let rest = m[3];
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

  const docxFiles = findDocxFiles(versionPath);
  if (docxFiles.length === 0) {
    log.push({ grade, subject, version, status: 'NO_DOCX' });
    continue;
  }

  const allQuestions = [];
  let qNum = 0;
  
  for (const docx of docxFiles) {
    const parts = docx.relPath.split(/[\\\/]/).filter(Boolean);
    const fileName = parts[parts.length - 1];
    const sectionDir = parts.length >= 2 ? parts[parts.length - 2] : '';
    const chapterDir = parts.length >= 3 ? parts[parts.length - 3] : version;
    
    let fileType = '';
    if (fileName.includes('选择') || fileName.includes('判断')) fileType = 'choice';
    else if (fileName.includes('大题') || fileName.includes('解答')) fileType = 'essay';
    else fileType = 'choice';
    
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
      // 忽略损坏的docx
    }
  }
  
  if (allQuestions.length === 0) {
    log.push({ grade, subject, version, status: 'NO_QUESTIONS_PARSED' });
    continue;
  }
  
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

writeFileSync('d:/小四门软件/scripts/_reparse2_log.json', JSON.stringify(log, null, 2), 'utf8');
console.log(`\n修复完成: ${totalFixed}/${toFix.length}`);
