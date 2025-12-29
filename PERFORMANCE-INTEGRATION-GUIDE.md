# PIRLS 效能優化整合指南

## 📝 已創建的檔案

### 核心模組
✅ `assets/js/cache-manager.js` - 快取管理系統
✅ `assets/js/lazy-loader.js` - 懶載入系統  
✅ `sw.js` - Service Worker
✅ `vite.config.js` - Vite 打包配置
✅ `package.json` - 更新依賴與腳本

## 🔧 手動整合步驟

由於專案採用內嵌 JavaScript 結構，以下是手動整合效能優化的步驟：

### 1. 整合到 index.html

在 `index.html` 的 `</body>` 之前，**error-handler.js 之前**加入：

```html
<!-- Performance Optimization Scripts -->
<script>
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swPath = window.location.pathname.includes('/') ? `${getBasePath()}/sw.js` : '/sw.js';
            navigator.serviceWorker.register(swPath)
                .then((registration) => {
                    console.log('[SW] ✓ Service Worker registered');
                })
                .catch((error) => {
                    console.warn('[SW] Registration failed:', error);
                });
        });
    }
</script>

<!-- Cache Manager -->
<script src="assets/js/cache-manager.js"></script>

<!-- Lazy Loader -->
<script src="assets/js/lazy-loader.js"></script>
```

### 2. 使用快取管理器載入 questions.json

在 index.html 的 `questions.json` 載入部分（約第 530 行），將：

```javascript
const response = await fetch(`${BASE_PATH}/data/questions.json`);
```

替換為：

```javascript
// 嘗試從快取載入
let allQuestions = await cacheManager.get('questions', true);

if (!allQuestions) {
    // 快取未命中，從網路載入
    const response = await fetch(`${BASE_PATH}/data/questions.json`);
    if (response.ok) {
        allQuestions = await response.json();
        // 儲存到快取（使用 IndexedDB）
        await cacheManager.set('questions', allQuestions, true);
        console.log('[Cache] Saved questions.json to cache');
    }
} else {
    console.log('[Cache] Loaded questions.json from cache');
}
```

### 3. 整合到 quiz.html

已完成 ✅ - 加入了 cache-manager.js 和 lazy-loader.js

### 4. 啟用圖片懶載入（可選）

如果未來加入文章圖片，使用懶載入屬性：

```html
<!-- 原本 -->
<img src="image.jpg" alt="...">

<!-- 改為懶載入 -->
<img data-src="image.jpg" alt="..." class="lazy-image">
```

懶載入器會自動處理這些圖片。

### 5. 安裝 Vite 依賴

在專案根目錄執行：

```powershell
npm install
```

這會安裝所有 Vite 相關依賴。

## 🚀 可選：Vite 打包

如果想使用 Vite 打包（生產環境優化）：

```powershell
# 開發模式
npm run dev

# 建置生產版本
npm run build

# 預覽生產build
npm run preview
```

**注意**：Vite 打包需要調整 Firebase 模組引入方式，從 CDN 改為 npm 套件。

## ✅ 快取管理器 API 使用範例

```javascript
// 讀取快取
const data = await cacheManager.get('mykey');

// 寫入快取 (小型資料 - LocalStorage)
await cacheManager.set('mykey', data);

// 寫入快取 (大型資料 - IndexedDB)
await cacheManager.set('questions', bigData, true);

// 清除過期快取
await cacheManager.clearExpired();

// 清除所有快取
cacheManager.clearAll();

// 獲取快取統計
const stats = await cacheManager.getStats();
console.log(stats);
// {
//   version: '2.2.0',
//   localStorage: { count: 5, size: 12345 },
//   indexedDB: { count: 2, size: 0 }
// }
```

## 🧪 測試驗證

### 1. 測試 Service Worker

1. 開啟 DevTools → Application → Service Workers
2. 確認 Service Worker 已註冊
3. 勾選「Offline」，重新載入頁面
4. 驗證頁面仍可顯示（使用快取）

### 2. 測試快取功能

```javascript
// 在瀏覽器 Console 執行
await cacheManager.getStats();
```

### 3. 測試懶載入

1. 開啟 DevTools → Network
2. 設定 Throttling 為 「Slow 3G」
3. 滾動頁面
4. 觀察圖片逐步載入

## 📊 預期效能提升

- **首次載入**: 減少 20-30% (Service Worker 預快取)
- **重複訪問**: 減少 60-80% (快取命中)
- **離線支援**: 完整離線瀏覽已訪問內容
- **資料載入**: questions.json 快取後 < 50ms

## ⚠️ 注意事項

1. **Service Worker 需要 HTTPS**
   - localhost 除外
   - 部署到 VM 時需要 SSL 憑證

2. **快取更新**
   - 預設 TTL 24小時
   - 可在 `cache-manager.js` 修改 `CACHE_CONFIG.ttl`

3. **清除快取**
   - 使用者可以在瀏覽器清除快取
   - 開發時可用 DevTools → Application → Clear Storage

4. **版本控制**
   - 修改 `CACHE_CONFIG.version` 會自動清除舊快取
   - 部署新版本時建議更新版本號

## 🔄 後續優化

- [ ] 將 Firebase SDK 改為 npm 套件（支援 tree-shaking）
- [ ] 實作 Critical CSS 提取
- [ ] 加入 Preload/Prefetch 提示
- [ ] 實作背景同步（Sync API）
- [ ] 加入推送通知支援

## 📖 相關文檔

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Vite 官方文檔](https://vitejs.dev/)
