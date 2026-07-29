// Service Worker - 像素机甲对决 PWA 离线缓存
const CACHE_NAME = 'mecha-battle-v4';
const CACHE_FILES = [
    './',
    './pixel-mecha-battle.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './sw.js'
];

// 安装：预缓存核心文件，跳过等待立即激活
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CACHE_FILES))
            .then(() => self.skipWaiting())
    );
});

// 激活：清理所有旧版本缓存，立即接管客户端
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截请求：网络优先，缓存回退（确保总是获取最新版本）
self.addEventListener('fetch', (event) => {
    // 导航请求（HTML页面）：网络优先
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                return caches.match('./pixel-mecha-battle.html');
            })
        );
        return;
    }
    // 静态资源：缓存优先，网络回退
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                return caches.match(event.request);
            });
        })
    );
});
