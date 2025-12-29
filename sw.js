// ==========================================================================
// PIRLS Service Worker - 離線支援與資源快取
// Version: 2.2.0
// ==========================================================================

const CACHE_VERSION = '2.2.0';
const CACHE_NAME = `pirls-cache-v${CACHE_VERSION}`;

// 預快取資源清單（核心資源）
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/quiz.html',
    '/assets/css/toast.css',
    '/assets/css/dashboard.css',
    '/assets/css/quiz.css',
    '/assets/js/cache-manager.js',
    '/assets/js/error-handler.js',
    '/assets/js/mobile-tabs.js',
    // Firebase SDK（從 CDN 快取）
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js'
];

// 運行時快取策略配置
const RUNTIME_CACHE_CONFIG = {
    images: {
        cacheName: `${CACHE_NAME}-images`,
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
    },
    data: {
        cacheName: `${CACHE_NAME}-data`,
        maxEntries: 10,
        maxAgeSeconds: 24 * 60 * 60 // 24小時
    },
    external: {
        cacheName: `${CACHE_NAME}-external`,
        maxEntries: 30,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7天
    }
};

// ==========================================================================
// 安裝事件 - 預快取核心資源
// ==========================================================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker version', CACHE_VERSION);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching core resources');
                return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
            })
            .then(() => {
                console.log('[SW] Installation complete');
                // 立即激活新的 Service Worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Precache failed:', error);
            })
    );
});

// ==========================================================================
// 激活事件 - 清理舊快取
// ==========================================================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker version', CACHE_VERSION);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 刪除舊版本快取
                        if (cacheName.startsWith('pirls-cache-') && cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete');
                // 立即控制所有頁面
                return self.clients.claim();
            })
    );
});

// ==========================================================================
// Fetch 事件 - 攔截網路請求
// ==========================================================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 跳過非 GET 請求
    if (request.method !== 'GET') {
        return;
    }

    // 跳過 Firebase API 請求（需要即時資料）
    if (url.hostname.includes('firebaseio.com') ||
        url.hostname.includes('googleapis.com')) {
        return;
    }

    // 根據不同類型的資源使用不同策略
    if (url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.gif') ||
        url.pathname.endsWith('.webp')) {
        // 圖片：Cache First
        event.respondWith(cacheFirst(request, RUNTIME_CACHE_CONFIG.images));
    } else if (url.pathname.includes('/data/') ||
        url.pathname.endsWith('.json')) {
        // API 資料：Network First
        event.respondWith(networkFirst(request, RUNTIME_CACHE_CONFIG.data));
    } else if (url.origin === self.location.origin) {
        // 同源靜態資源：Cache First
        event.respondWith(cacheFirst(request));
    } else {
        // 外部資源：Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE_CONFIG.external));
    }
});

// ==========================================================================
// 快取策略實作
// ==========================================================================

/**
 * Cache First 策略
 * 優先從快取讀取，失敗則從網路獲取並更新快取
 */
async function cacheFirst(request, config = {}) {
    const cache = await caches.open(config.cacheName || CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        console.log('[SW] Cache hit:', request.url);
        return cached;
    }

    console.log('[SW] Cache miss, fetching:', request.url);
    try {
        const response = await fetch(request);

        // 只快取成功的回應
        if (response && response.status === 200) {
            cache.put(request, response.clone());

            // 限制快取數量
            if (config.maxEntries) {
                limitCacheSize(config.cacheName || CACHE_NAME, config.maxEntries);
            }
        }

        return response;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);

        // 返回離線頁面或預設回應
        return new Response('離線模式：無法載入資源', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
    }
}

/**
 * Network First 策略
 * 優先從網路獲取最新資料，失敗則使用快取
 */
async function networkFirst(request, config = {}) {
    const cache = await caches.open(config.cacheName || CACHE_NAME);

    try {
        console.log('[SW] Fetching from network:', request.url);
        const response = await fetch(request);

        if (response && response.status === 200) {
            cache.put(request, response.clone());

            if (config.maxEntries) {
                limitCacheSize(config.cacheName || CACHE_NAME, config.maxEntries);
            }
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, using cache:', request.url);
        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        // 沒有快取，返回錯誤訊息
        return new Response('離線模式：無法載入資料', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
    }
}

/**
 * Stale While Revalidate 策略
 * 立即返回快取，同時在背景更新快取
 */
async function staleWhileRevalidate(request, config = {}) {
    const cache = await caches.open(config.cacheName || CACHE_NAME);
    const cached = await cache.match(request);

    // 背景更新
    const fetchPromise = fetch(request).then((response) => {
        if (response && response.status === 200) {
            cache.put(request, response.clone());

            if (config.maxEntries) {
                limitCacheSize(config.cacheName || CACHE_NAME, config.maxEntries);
            }
        }
        return response;
    }).catch((error) => {
        console.error('[SW] Background fetch failed:', error);
    });

    // 如果有快取，立即返回
    if (cached) {
        console.log('[SW] Serving from cache, updating in background:', request.url);
        return cached;
    }

    // 沒有快取，等待網路請求
    console.log('[SW] No cache, waiting for network:', request.url);
    return fetchPromise;
}

/**
 * 限制快取大小
 */
async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
        console.log(`[SW] Cache ${cacheName} exceeds limit, removing oldest entries`);
        // 刪除最舊的項目
        const deleteCount = keys.length - maxItems;
        for (let i = 0; i < deleteCount; i++) {
            await cache.delete(keys[i]);
        }
    }
}

// ==========================================================================
// 訊息處理 - 允許頁面控制 Service Worker
// ==========================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Received SKIP_WAITING message');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] Clearing all caches');
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('pirls-cache-')) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }).then(() => {
                console.log('[SW] All caches cleared');
                event.ports[0].postMessage({ success: true });
            })
        );
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});

// ==========================================================================
// 推送通知支援（預留）
// ==========================================================================
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);
    // 未來可擴展推送通知功能
});

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();
});

console.log('[SW] Service Worker loaded, version:', CACHE_VERSION);
