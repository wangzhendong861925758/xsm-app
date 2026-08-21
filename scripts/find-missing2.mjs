// 对比用户清单(304) vs 当前(302)，找出缺失的2个版本
import { readFileSync } from 'fs';

const sourceConfig = JSON.parse(readFileSync('d:/小四门软件/scripts/_source_config.json', 'utf8'));
const manifest = JSON.parse(readFileSync('d:/小四门软件/public/data/questions/manifest.json', 'utf8'));

const norm1 = (s) => s.replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');
const norm2 = (s) => s.replace(/[（(）)\s]/g, '');

const GRADE_ORDER = ['六年级上册','六年级下册','七年级上册','七年级下册','八年级上册','八年级下册','九年级上册','九年级下册'];
const SUBJECT_ORDER = ['physics','chemistry','biology','history','politics','geography'];
const SUBJECT_NAMES = { physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'道法', geography:'地理' };

for (const grade of GRADE_ORDER) {
  for (const subject of SUBJECT_ORDER) {
    const key = `${subject}|${grade}`;
    const sourceVersions = Object.keys(sourceConfig[key] || {});
    const mEntries = manifest[key] || [];
    const mVersions = mEntries.map(e => e.version);
    
    for (const sv of sourceVersions) {
      const svN1 = norm1(sv);
      const svN2 = norm2(sv);
      const found = mEntries.find(e => norm1(e.version) === svN1 || norm2(e.version) === svN2);
      if (!found) {
        console.log(`缺失: ${SUBJECT_NAMES[subject]}|${grade}|${sv} (源文件${sourceConfig[key][sv]}个)`);
      }
    }
  }
}
