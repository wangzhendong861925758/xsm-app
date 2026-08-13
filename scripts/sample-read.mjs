import mammoth from 'mammoth';
import { readFileSync } from 'fs';

const files = [
  'd:/小四门软件/试题/试题/道法/六年级下册/统编版（五四学制）/第三单元 我们受特殊保护/第七课 未成年人需特殊保护/选择判断.docx',
  'd:/小四门软件/试题/试题/道法/六年级下册/统编版（五四学制）/第三单元 我们受特殊保护/第七课 未成年人需特殊保护/大题.docx',
];

for (const f of files) {
  console.log('\n==========', f.split('/').pop(), '==========\n');
  const buf = readFileSync(f);
  const { value } = await mammoth.extractRawText({ buffer: buf });
  console.log(value.slice(0, 3000));
  console.log('\n... (共', value.length, '字符)');
}
