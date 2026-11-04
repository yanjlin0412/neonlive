// 離線快取：App 外殼採 cache-first，字型採 stale-while-revalidate
const VERSION = 'neonlive-v29';   // 改版時 index.html 與這裡的 ?v= 一起改
const SHELL = [
  './',
  './index.html',
  './app.css?v=29',
  './js/core.js?v=29',
  './js/app.js?v=29',
  './js/cards.js?v=29',
  './js/recap.js?v=29',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))   // 不吃 HTTP 快取，確保拿到這一版的檔案.then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(VERSION).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((res) => { c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (url.origin === location.origin) {
    // 頁面導覽：先網路（拿到更新），失敗再用快取
    if (req.mode === 'navigate') {
      e.respondWith(
        fetch(req, { cache: 'no-store' })   // 繞過 GitHub Pages 的 10 分鐘 HTTP 快取，一打開就是最新版
          .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return res; })
          .catch(() => caches.match('./index.html'))
      );
      return;
    }
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
