// 小四门刷题 Service Worker
// 策略：
//  - index.html / 导航请求: network-first（保证发新版立即生效，离线回退缓存）
//  - /assets/*（Vite 带内容 hash）: cache-first（immutable）
//  - /data/*（题目分片，更新频繁且体积大）: stale-while-revalidate（先回缓存秒开，后台静默更新）
//  - 其他同源 GET（favicon/manifest 等）: stale-while-revalidate
//  - 非同源 / API（Netlify Functions、字体 CDN）: 不拦截，直接走网络
const CACHE = "xsm-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg", "/icon-maskable.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const c = await caches.open(CACHE);
      c.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw new Error("offline and not cached");
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) {
    const c = await caches.open(CACHE);
    c.put(req, res.clone());
  }
  return res;
}

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res.ok) {
        const c = caches.open(CACHE).then((c) => c.put(req, res.clone()));
        // ponytail: 缓存写入不阻塞返回，失败只影响下次新鲜度
        c.catch(() => {});
      }
      return res;
    })
    .catch(() => null);
  if (cached) return cached;
  const fresh = await fetchPromise;
  if (fresh) return fresh;
  throw new Error("offline and not cached");
}

self.addEventListener("fetch", (e) => {
  const { request: req } = e;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 跨域（API/字体CDN）不拦截
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/")) return; // 动态接口不缓存

  if (req.mode === "navigate" || url.pathname === "/index.html") {
    e.respondWith(networkFirst(req));
  } else if (url.pathname.startsWith("/assets/")) {
    e.respondWith(cacheFirst(req));
  } else {
    // /data/* 与其余静态资源：先回缓存、后台更新
    e.respondWith(staleWhileRevalidate(req));
  }
});
