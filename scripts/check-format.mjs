// 查看选择判断文件中解析的格式
import mammoth from 'mammoth';
import { readFileSync } from 'fs';

const f = 'd:/小四门软件/试题/试题/化学/九年级上册/人教版/第一单元 走进化学世界/课题1 物质的变化和性质/选择判断.docx';
const buf = readFileSync(f);
const { value } = await mammoth.extractRawText({ buffer: buf });
// 打印前5道完整题目（含解析）
const lines = value.split('\n');
let count = 0;
for (const line of lines) {
  if (/^\s*\d+\s*[.．、]/.test(line.trim())) count++;
  if (count <= 5) console.log(line);
  if (count > 5) break;
}
