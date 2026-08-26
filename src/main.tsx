import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useStore } from './store/useStore'

// 启动云同步：从云端拉取题目 + 订阅实时更新
useStore.getState().initCloudSync()

// 生产环境注册 Service Worker（PWA：离线缓存 + 添加到桌面）
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {/* 注册失败不影响正常使用 */})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
