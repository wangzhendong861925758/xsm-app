// 改进的匹配：去掉所有括号后比较，处理科教版/教科版等别名
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const Q_DIR = 'd:/小四门软件/public/data/questions';

// 一级规范化：全角括号→半角，去空格
const norm1 = (s) => s.replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');
// 二级规范化：去掉所有括号和空格
const norm2 = (s) => s.replace(/[（(）)\s]/g, '');
// 别名映射
const ALIAS = { '科教版': '教科版' };
const applyAlias = (s) => ALIAS[s] || s;

// 用户清单（同前）
const USER_LIST = {
  '六年级上册': {
    biology: ['鲁科版(五四学制)', '鲁科版(五四学制)2012', '人教版(五四制)'],
    history: ['统编版(五四学制)', '统编版(五四学制)(2018)'],
    politics: ['统编版(五四学制)', '统编版(五四学制)(2018)全一册'],
    geography: ['沪教版(上海)(2007)', '鲁教版(五四学制)', '鲁教版(五四学制)(2012)', '人教版(五四学制)(2012)', '中华中图版(五四学制)'],
  },
  '六年级下册': {
    biology: ['鲁科版(五四学制)', '鲁科版(五四学制)2012', '人教版(五四制)'],
    history: ['统编版(五四学制)', '统编版(五四学制)(2018)'],
    politics: ['统编版(五四学制)', '统编版(五四学制)(2018)全一册'],
    geography: ['沪教版(上海)(2007)', '鲁教版(五四学制)', '鲁教版(五四学制)(2012)', '人教版(五四学制)(2012)', '中华中图版(五四学制)'],
  },
  '七年级上册': {
    biology: ['北京版', '北京版(2012)', '北师大版', '北师大版(2012)', '沪教版(五四学制)', '济南版', '济南版(2012)', '冀少版', '冀少版(2012)', '鲁科版(五四学制)', '鲁科版(五四学制)(2012)', '人教版', '人教版(2012)', '人教版(五四学制)', '苏教版', '苏教版(2012)', '苏科版', '苏科版(2012)'],
    history: ['统编版', '统编版(2016)', '统编版(五四学制)', '统编版(五四学制)(2018)'],
    politics: ['统编版', '统编版(2016)', '统编版(五四学制)(2018)全一册', '统编版(五四学制)全一册', '中华民族大团结全一册'],
    geography: ['沪教版(上海)(2007)', '晋教版', '晋教版(2012)', '鲁教版(五四学制)', '鲁教版(五四学制)(2012)', '人教版', '人教版(2012)', '人教版(五四学制)(2012)', '仁爱科普版', '商务星球版', '湘教版', '湘教版(2012)', '粤人版', '粤人版(2012)', '中华中图版(五四学制)', '中图版', '中图版(2012)', '中图版(北京)', '中图版(北京)(2014)'],
  },
  '七年级下册': {
    biology: ['北京版', '北京版(2012)', '北师大版', '北师大版(2012)', '沪教版(五四学制)', '济南版', '济南版(2012)', '冀少版', '冀少版(2012)', '鲁科版(五四学制)', '鲁科版(五四学制)(2012)', '人教版', '人教版(2012)', '人教版(五四学制)', '苏教版', '苏教版(2012)', '苏科版', '苏科版(2012)'],
    history: ['统编版', '统编版(2016)', '统编版(五四学制)', '统编版(五四学制)(2018)'],
    politics: ['统编版', '统编版(2016)', '统编版(五四学制)(2018)全一册', '统编版(五四学制)全一册', '中华民族大团结全一册'],
    geography: ['晋教版', '晋教版(2012)', '鲁教版(五四学制)', '鲁教版(五四学制)(2012)', '人教版', '人教版(2012)', '人教版(五四学制)(2012)', '仁爱科普版', '商务星球版', '商务星球版(2012)', '湘教版', '湘教版(2012)', '粤人版', '粤人版(2012)', '中华中图版(五四学制)', '中图版', '中图版(2012)', '中图版(北京)'],
  },
  '八年级上册': {
    politics: ['统编版', '统编版(2016)', '统编版(五四学制)', '统编版(五四学制)(2018)'],
    geography: ['晋教版', '晋教版(2012)', '人教版', '人教版(2012)', '仁爱科普版全一册', '仁爱科普版(2012)', '商务星球版', '商务星球版(2012)', '湘教版', '湘教版(2012)', '粤人版', '粤人版(2012)', '中图版', '中图版(2012)', '中图版(北京版)', '中图版(北京版)(2014)'],
    chemistry: ['沪科版(五四学制)全一册', '鲁教版(五四学制)全一册', '人教版(五四学制)全一册'],
    history: ['统编版', '统编版(2016)', '统编版(五四学制)'],
    biology: ['北京版', '北京版(2012)', '北师大版', '北师大版(2012)', '沪教版(五四学制)', '沪教版(五四学制)(2012)', '济南版', '济南版(2012)', '冀少版', '冀少版(2012)', '鲁科版(五四学制)', '鲁科版(五四学制)(2012)', '人教版', '人教版(2012)', '苏教版', '苏教版(2012)', '苏科版', '苏科版(2012)'],
    physics: ['北师大版', '北师大版(2012)', '北师大版(北京)(2013)全一册', '北师大版(北京)全一册', '沪教版(上海)(2007)', '沪科版全一册', '沪科版(2012)全一册', '沪科版(五四学制)', '沪粤版', '沪粤版(2012)', '教科版', '教科版(2012)', '鲁科版(五四学制)', '鲁科版(五四学制)(2012)', '人教版', '人教版(2012)', '苏科版', '苏科版(2012)'],
  },
  '八年级下册': {
    politics: ['统编版', '统编版(2016)', '统编版(五四学制)', '统编版(五四学制)(2018)'],
    geography: ['晋教版', '晋教版(2012)', '人教版', '人教版(2012)', '仁爱科普版全一册', '仁爱科普版(2012)', '商务星球版', '商务星球版(2012)', '湘教版', '湘教版(2012)', '粤人版', '粤人版(2012)', '中图版', '中图版(2012)', '中图版(北京版)', '中图版(北京版)(2014)'],
    chemistry: ['沪科版(五四学制)全一册', '鲁教版(五四学制)全一册', '人教版(五四学制)全一册'],
    history: ['统编版', '统编版(2016)', '统编版(五四学制)'],
    biology: ['北京版', '北京版(2012)', '北师大版', '北师大版(2012)', '沪教版(五四学制)', '沪教版(五四学制)(2012)', '济南版', '济南版(2012)', '冀少版', '冀少版(2012)', '鲁科版(五四学制)', '鲁科版(五四学制)(2012)', '人教版', '人教版(2012)', '苏教版', '苏教版(2012)', '苏科版', '苏科版(2012)'],
    physics: ['北师大版', '北师大版(2012)', '北师大版(北京)(2013)全一册', '北师大版(北京)全一册', '沪教版(上海)(2007)', '沪科版全一册', '沪科版(2012)全一册', '沪科版(五四学制)', '沪粤版', '沪粤版(2012)', '教科版', '教科版(2012)', '鲁科版(五四学制)', '鲁科版(五四学制)(2012)', '人教版', '人教版(2012)', '苏科版', '苏科版(2012)'],
  },
  '九年级上册': {
    politics: ['统编版', '统编版(2016)', '统编版(五四学制)(2018)'],
    chemistry: ['北京版', '沪教版', '沪科版(五四学制)全一册', '科粤版', '鲁教版', '鲁教版(五四学制)全一册', '人教版', '人教版(五四学制)全一册', '仁爱科普版'],
    history: ['统编版', '统编版(2016)'],
    physics: ['北师大版全一册', '北师大版(2012)全一册', '北师大版(北京)(2013)全一册', '北师大版(北京)全一册', '沪教版(上海)(2007)', '沪科版全一册', '沪科版(2012)全一册', '沪科版(五四学制)', '沪粤版', '沪粤版(2012)', '教科版全一册', '教科版(2012)', '鲁科版(五四学制)', '鲁科版(五四学制)(2012)', '人教版全一册', '人教版(2012)全一册', '苏科版', '苏科版(2012)'],
  },
  '九年级下册': {
    politics: ['统编版', '统编版(2016)', '统编版(五四学制)(2018)'],
    chemistry: ['北京版', '沪教版', '沪科版(五四学制)全一册', '科粤版', '鲁教版', '鲁教版(五四学制)全一册', '人教版', '人教版(五四学制)全一册', '仁爱科普版'],
    history: ['统编版', '统编版(2016)'],
    physics: ['北师大版全一册', '北师大版(2012)全一册', '北师大版(北京)(2013)全一册', '北师大版(北京)全一册', '沪教版(上海)(2007)', '沪科版全一册', '沪科版(2012)全一册', '沪科版(五四学制)', '沪粤版', '沪粤版(2012)', '教科版', '教科版全一册', '教科版(2012)', '鲁科版(五四学制)', '鲁科版(五四学制)(2012)', '人教版全一册', '人教版(2012)全一册', '苏科版', '苏科版(2012)'],
  },
};

// 扫描实际文件
const qFiles = readdirSync(Q_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const fileMap = {};
for (const f of qFiles) {
  const base = f.replace(/\.json$/, '');
  const parts = base.split('_');
  if (parts.length < 3) continue;
  const subject = parts[0];
  const version = parts[parts.length - 1];
  const grade = parts.slice(1, -1).join('_');
  const key = `${subject}|${grade}`;
  let count = 0;
  try {
    const arr = JSON.parse(readFileSync(join(Q_DIR, f), 'utf8'));
    count = Array.isArray(arr) ? arr.length : 0;
  } catch {}
  if (!fileMap[key]) fileMap[key] = [];
  fileMap[key].push({ version, n1: norm1(version), n2: norm2(version), file: f, count });
}

// 多级匹配函数：用户版本 → 文件版本
function matchVersion(userVer, fileEntries) {
  const un1 = norm1(userVer);
  const un2 = norm2(applyAlias(userVer));
  // 一级：全角/半角统一+去空格
  let found = fileEntries.find(fe => fe.n1 === un1);
  if (found) return found;
  // 二级：去掉所有括号+别名
  found = fileEntries.find(fe => norm2(applyAlias(fe.version)) === un2);
  if (found) return found;
  return null;
}

// 匹配分析
const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };

let report = '';
let totalUser = 0, totalMatched = 0, totalNotFound = 0, totalExtra = 0;
const matchedConfig = {}; // key=subject|grade, value=[{version(文件中的), file, count}]

for (const grade of GRADE_ORDER) {
  report += `\n【${grade}】\n`;
  const userGrade = USER_LIST[grade] || {};
  for (const subject of Object.keys(SUBJECT_NAMES)) {
    const userVersions = userGrade[subject] || [];
    if (userVersions.length === 0) continue;
    const key = `${subject}|${grade}`;
    const fileEntries = fileMap[key] || [];
    const matchedFileNames = new Set(); // 已匹配的文件名
    
    const matched = [];
    const notFound = [];
    for (const uv of userVersions) {
      const found = matchVersion(uv, fileEntries);
      if (found && !matchedFileNames.has(found.file)) {
        matched.push({ version: found.version, file: found.file, count: found.count });
        matchedFileNames.add(found.file);
        totalMatched++;
      } else if (found && matchedFileNames.has(found.file)) {
        // 多个用户版本匹配到同一个文件（如"人教版"和"人教版(2012)"都匹配到人教版（2012）.json）
        // 这种情况下"人教版"不单独显示，因为文件只有一个
        notFound.push(`${uv}(→同${found.version})`);
        totalNotFound++;
      } else {
        notFound.push(uv);
        totalNotFound++;
      }
      totalUser++;
    }
    
    const extra = fileEntries.filter(fe => !matchedFileNames.has(fe.file));
    totalExtra += extra.length;
    matchedConfig[key] = matched;
    
    report += `  ${SUBJECT_NAMES[subject]}: 用户${userVersions.length}版→匹配${matched.length}, 未找到${notFound.length}, 多余${extra.length}\n`;
    if (notFound.length > 0) {
      report += `    ✗ 未找到: ${notFound.join(' / ')}\n`;
    }
    if (extra.length > 0) {
      report += `    ⚠ 多余文件: ${extra.map(e=>`${e.version}(${e.count}题)`).join(' / ')}\n`;
    }
  }
}

report += `\n=== 汇总 ===\n`;
report += `用户指定: ${totalUser}, 匹配: ${totalMatched}, 未找到: ${totalNotFound}, 多余: ${totalExtra}\n`;
report += `最终将显示: ${totalMatched} 个版本\n`;

console.log(report);
writeFileSync('d:/小四门软件/scripts/_match_report2.txt', report);
writeFileSync('d:/小四门软件/scripts/_matched_config.json', JSON.stringify(matchedConfig, null, 2));
