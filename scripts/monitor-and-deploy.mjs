// 监控AI生成进度，完成后自动部署到Netlify
// 每60秒检查一次，当 fill-analysis-ai.mjs 进程结束后触发部署
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { execSync, spawn } from 'child_process';

const PROGRESS_FILE = 'd:/小四门软件/scripts/analysis-progress-v2.json';
const STATUS_LOG = 'd:/小四门软件/scripts/analysis-status.log';
const TOTAL_SHARDS = 279;

function log(msg) {
  const t = new Date().toISOString();
  const line = `[${t}] ${msg}`;
  console.log(line);
  writeFileSync(STATUS_LOG, line + '\n', { flag: 'a' });
}

function getProgress() {
  if (!existsSync(PROGRESS_FILE)) return { completed: 0 };
  try {
    const p = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
    return { completed: p.completedFiles?.length || 0 };
  } catch(e) {
    return { completed: 0 };
  }
}

function isAIProcessRunning() {
  try {
    // 检查 node 进程是否在运行 fill-analysis-ai
    const out = execSync('wmic process where "name=\'node.exe\'" get CommandLine /format:list', { encoding: 'utf8' });
    return out.includes('fill-analysis-ai');
  } catch(e) {
    return false;
  }
}

function deployToNetlify() {
  log('=== 开始部署到 Netlify ===');
  try {
    // 先构建项目
    log('步骤1: 构建项目 (npm run build)');
    execSync('npm run build', { cwd: 'd:/小四门软件', stdio: 'inherit', timeout: 300000 });
    log('构建完成');

    // 部署到 Netlify
    log('步骤2: 部署到 Netlify');
    execSync('npx netlify deploy --prod --dir=dist', { cwd: 'd:/小四门软件', stdio: 'inherit', timeout: 600000 });
    log('=== 部署完成 ===');
    return true;
  } catch(e) {
    log(`部署失败: ${e.message}`);
    return false;
  }
}

function main() {
  log('=== 监控启动 ===');
  log(`目标: ${TOTAL_SHARDS} 个分片`);

  let lastCompleted = 0;
  let stableCount = 0; // 进程不在运行但完成数未变化的次数

  const checkInterval = setInterval(() => {
    const { completed } = getProgress();
    const running = isAIProcessRunning();

    if (completed !== lastCompleted) {
      log(`进度: ${completed}/${TOTAL_SHARDS} 分片完成 (进程${running ? '运行中' : '已停止'})`);
      lastCompleted = completed;
      stableCount = 0;
    }

    // 完成所有分片
    if (completed >= TOTAL_SHARDS) {
      clearInterval(checkInterval);
      log(`所有 ${TOTAL_SHARDS} 个分片已完成！`);
      setTimeout(() => deployToNetlify(), 5000);
      return;
    }

    // 进程不在运行
    if (!running) {
      stableCount++;
      log(`AI进程未运行 (第${stableCount}次检查)，已完成 ${completed}/${TOTAL_SHARDS}`);

      if (stableCount >= 2) {
        // 进程真的结束了，但还没完成所有分片
        log(`AI进程已结束，但只完成 ${completed}/${TOTAL_SHARDS} 分片`);
        log('尝试重新启动AI生成脚本...');

        const child = spawn('node', ['scripts/fill-analysis-ai.mjs'], {
          cwd: 'd:/小四门软件',
          detached: true,
          stdio: 'ignore'
        });
        child.unref();
        log(`已重新启动AI脚本 (PID: ${child.pid})`);
        stableCount = 0;
      }
    } else {
      stableCount = 0;
    }
  }, 60000); // 每60秒检查一次

  log('监控运行中，每60秒检查一次进度...');
}

main();
