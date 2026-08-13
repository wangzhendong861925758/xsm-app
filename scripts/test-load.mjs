// 测试 manifest 和分片加载
const resp = await fetch('http://localhost:5175/data/questions/manifest.json');
const m = await resp.json();
console.log('keys 数量:', Object.keys(m).length);
console.log('biology|七年级上册:', m['biology|七年级上册']);
console.log('physics|八年级上册 版本数:', m['physics|八年级上册']?.length);

// 测试加载一个分片
const shardResp = await fetch('http://localhost:5175/data/questions/biology_七年级上册_人教版.json');
const questions = await shardResp.json();
console.log('\nbiology 七年级上册 人教版 题目数:', questions.length);
console.log('第1题:', JSON.stringify(questions[0], null, 2));
