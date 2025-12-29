// ==========================================================================
// PIRLS Cache Manager - 統一快取管理系統
// Version: 2.2.0
// ==========================================================================

/**
 * 快取配置
 */
const CACHE_CONFIG = {
    version: '2.2.0',
    ttl: 24 * 60 * 60 * 1000, // 24小時 TTL
    maxSize: 10 * 1024 * 1024, // 10MB IndexedDB 上限
    storageKey: 'pirls_cache',
    versionKey: 'pirls_cache_version',
    dbName: 'PIRLS_DB',
    storeName: 'articles'
};

/**
 * 快取管理器類別
 */
class CacheManager {
    constructor() {
        this.db = null;
        this.initPromise = this.init();
    }

    /**
     * 初始化快取系統
     */
    async init() {
        // 檢查版本，清理舊快取
        const storedVersion = localStorage.getItem(CACHE_CONFIG.versionKey);
        if (storedVersion !== CACHE_CONFIG.version) {
            console.log(`[Cache] Version mismatch (${storedVersion} → ${CACHE_CONFIG.version}), clearing cache`);
            this.clearAll();
            localStorage.setItem(CACHE_CONFIG.versionKey, CACHE_CONFIG.version);
        }

        // 初始化 IndexedDB
        if (this.isIndexedDBSupported()) {
            try {
                this.db = await this.openIndexedDB();
                console.log('[Cache] IndexedDB initialized');
            } catch (error) {
                console.warn('[Cache] IndexedDB init failed, falling back to LocalStorage:', error);
            }
        }
    }

    /**
     * 檢查 IndexedDB 支援
     */
    isIndexedDBSupported() {
        return 'indexedDB' in window;
    }

    /**
     * 開啟 IndexedDB
     */
    openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CACHE_CONFIG.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(CACHE_CONFIG.storeName)) {
                    const store = db.createObjectStore(CACHE_CONFIG.storeName, { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * 獲取快取資料
     * @param {string} key - 快取鍵值
     * @param {boolean} useIndexedDB - 是否優先使用 IndexedDB
     * @returns {Promise<any>} - 快取資料
     */
    async get(key, useIndexedDB = false) {
        await this.initPromise;

        try {
            // 嘗試從 IndexedDB 讀取
            if (useIndexedDB && this.db) {
                const data = await this.getFromIndexedDB(key);
                if (data && !this.isExpired(data)) {
                    console.log(`[Cache] ✓ Hit (IndexedDB): ${key}`);
                    return data.value;
                }
            }

            // 嘗試從 LocalStorage 讀取
            const lsData = this.getFromLocalStorage(key);
            if (lsData && !this.isExpired(lsData)) {
                console.log(`[Cache] ✓ Hit (LocalStorage): ${key}`);
                return lsData.value;
            }

            console.log(`[Cache] ✗ Miss: ${key}`);
            return null;
        } catch (error) {
            console.error(`[Cache] Error getting ${key}:`, error);
            return null;
        }
    }

    /**
     * 設定快取資料
     * @param {string} key - 快取鍵值
     * @param {any} value - 要快取的資料
     * @param {boolean} useIndexedDB - 是否使用 IndexedDB
     */
    async set(key, value, useIndexedDB = false) {
        await this.initPromise;

        const cacheEntry = {
            key,
            value,
            timestamp: Date.now(),
            version: CACHE_CONFIG.version
        };

        try {
            const dataSize = this.estimateSize(value);

            // 大型資料使用 IndexedDB
            if ((useIndexedDB || dataSize > 1024 * 1024) && this.db) {
                await this.setToIndexedDB(cacheEntry);
                console.log(`[Cache] ✓ Saved to IndexedDB: ${key} (${this.formatSize(dataSize)})`);
            } else {
                // 小型資料使用 LocalStorage
                this.setToLocalStorage(cacheEntry);
                console.log(`[Cache] ✓ Saved to LocalStorage: ${key} (${this.formatSize(dataSize)})`);
            }
        } catch (error) {
            console.error(`[Cache] Error setting ${key}:`, error);

            // 如果 IndexedDB 失敗，嘗試 LocalStorage
            if (useIndexedDB) {
                try {
                    this.setToLocalStorage(cacheEntry);
                    console.log(`[Cache] ✓ Fallback to LocalStorage: ${key}`);
                } catch (lsError) {
                    console.error(`[Cache] LocalStorage also failed:`, lsError);
                }
            }
        }
    }

    /**
     * 從 LocalStorage 讀取
     */
    getFromLocalStorage(key) {
        try {
            const raw = localStorage.getItem(`${CACHE_CONFIG.storageKey}_${key}`);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error(`[Cache] LocalStorage parse error:`, error);
            return null;
        }
    }

    /**
     * 寫入 LocalStorage
     */
    setToLocalStorage(cacheEntry) {
        try {
            localStorage.setItem(
                `${CACHE_CONFIG.storageKey}_${cacheEntry.key}`,
                JSON.stringify(cacheEntry)
            );
        } catch (error) {
            // Quota exceeded - 清理舊快取
            if (error.name === 'QuotaExceededError') {
                console.warn('[Cache] LocalStorage quota exceeded, clearing old cache');
                this.clearExpired();
                // 重試
                localStorage.setItem(
                    `${CACHE_CONFIG.storageKey}_${cacheEntry.key}`,
                    JSON.stringify(cacheEntry)
                );
            } else {
                throw error;
            }
        }
    }

    /**
     * 從 IndexedDB 讀取
     */
    getFromIndexedDB(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([CACHE_CONFIG.storeName], 'readonly');
            const store = transaction.objectStore(CACHE_CONFIG.storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 寫入 IndexedDB
     */
    setToIndexedDB(cacheEntry) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([CACHE_CONFIG.storeName], 'readwrite');
            const store = transaction.objectStore(CACHE_CONFIG.storeName);
            const request = store.put(cacheEntry);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 檢查快取是否過期
     */
    isExpired(cacheEntry) {
        if (!cacheEntry || !cacheEntry.timestamp) return true;
        const age = Date.now() - cacheEntry.timestamp;
        return age > CACHE_CONFIG.ttl;
    }

    /**
     * 清除過期快取
     */
    async clearExpired() {
        // 清除 LocalStorage 過期項目
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_CONFIG.storageKey)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (this.isExpired(data)) {
                        localStorage.removeItem(key);
                        console.log(`[Cache] Removed expired: ${key}`);
                    }
                } catch (error) {
                    // 無效資料，直接刪除
                    localStorage.removeItem(key);
                }
            }
        });

        // 清除 IndexedDB 過期項目
        if (this.db) {
            try {
                const transaction = this.db.transaction([CACHE_CONFIG.storeName], 'readwrite');
                const store = transaction.objectStore(CACHE_CONFIG.storeName);
                const request = store.openCursor();

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        if (this.isExpired(cursor.value)) {
                            cursor.delete();
                            console.log(`[Cache] Removed expired from IndexedDB: ${cursor.value.key}`);
                        }
                        cursor.continue();
                    }
                };
            } catch (error) {
                console.error('[Cache] Error clearing expired IndexedDB entries:', error);
            }
        }
    }

    /**
     * 清除所有快取
     */
    clearAll() {
        // 清除 LocalStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_CONFIG.storageKey)) {
                localStorage.removeItem(key);
            }
        });

        // 清除 IndexedDB
        if (this.db) {
            const transaction = this.db.transaction([CACHE_CONFIG.storeName], 'readwrite');
            const store = transaction.objectStore(CACHE_CONFIG.storeName);
            store.clear();
        }

        console.log('[Cache] All cache cleared');
    }

    /**
     * 估算資料大小（位元組）
     */
    estimateSize(data) {
        return new Blob([JSON.stringify(data)]).size;
    }

    /**
     * 格式化大小顯示
     */
    formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    /**
     * 獲取快取統計資訊
     */
    async getStats() {
        await this.initPromise;

        const stats = {
            version: CACHE_CONFIG.version,
            localStorage: {
                count: 0,
                size: 0
            },
            indexedDB: {
                count: 0,
                size: 0
            }
        };

        // LocalStorage 統計
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_CONFIG.storageKey)) {
                stats.localStorage.count++;
                stats.localStorage.size += localStorage.getItem(key).length;
            }
        });

        // IndexedDB 統計
        if (this.db) {
            try {
                const transaction = this.db.transaction([CACHE_CONFIG.storeName], 'readonly');
                const store = transaction.objectStore(CACHE_CONFIG.storeName);
                const countRequest = store.count();

                stats.indexedDB.count = await new Promise((resolve) => {
                    countRequest.onsuccess = () => resolve(countRequest.result);
                });
            } catch (error) {
                console.error('[Cache] Error getting IndexedDB stats:', error);
            }
        }

        return stats;
    }
}

// 建立全域快取管理器實例
const cacheManager = new CacheManager();

// 定期清理過期快取（每小時執行一次）
setInterval(() => {
    cacheManager.clearExpired();
}, 60 * 60 * 1000);

// 導出為全域變數（相容現有程式碼）
if (typeof window !== 'undefined') {
    window.cacheManager = cacheManager;
    console.log('[Cache] ✓ CacheManager loaded and ready');
}

// ES Module 導出（僅在 module 模式下可用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = cacheManager;
    module.exports.CacheManager = CacheManager;
    module.exports.CACHE_CONFIG = CACHE_CONFIG;
}
