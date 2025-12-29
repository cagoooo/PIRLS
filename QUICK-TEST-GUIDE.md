# PIRLS 效能優化 - 快速測試指南

## ✅ 整合完成確認

所有效能優化功能已自動整合到專案中！

### 已完成項目
- ✅ cache-manager.js - 雙層快取系統
- ✅ sw.js - Service Worker
- ✅ lazy-loader.js - 懶載入系統
- ✅ vite.config.js - Vite 配置
- ✅ index.html - 已整合快取+SW
- ✅ quiz.html  - 已整合快取+SW
- ✅ package.json - 已更新依賴

## 🧪 快速測試步驟

### 1. 啟動開發伺服器

```powershell
# 如果 npm install 還在進行中，請等待完成
# 然後啟動開發伺服器
npm run dev
```

或直接開啟 index.html（如使用 Live Server 或其他方式）

### 2. 測試快取功能

開啟瀏覽器 Console，執行：

```javascript
// 查看快取統計
await cacheManager.getStats()

// 預期輸出類似：
// {
//   version: '2.2.0',
//   localStorage: { count: 1, size: 236348 },
//   indexedDB: { count: 1, size: 0 }
// }
```

### 3. 測試 Service Worker

1. 開啟 DevTools → Application tab
2. 左側選擇 "Service Workers"
3. 確認看到：
   - ✅ Source: `/sw.js`
   - ✅ Status: "activated and is running"

### 4. 測試離線功能

1. 在 DevTools → Network tab
2. 勾選 "Offline" 模式
3. 重新載入頁面（Ctrl+R）
4. 頁面應該仍正常顯示（使用快取）
5. Console 應顯示："[Cache] ✓ Loaded questions.json from cache"

### 5. 測試快取效能

1. 清除快取：DevTools → Application → Clear site data
2. 第一次載入（未快取）：
   - Network tab 查看 questions.json 載入時間
   - Console: "[Cache] Cache miss, fetching from network"
   
3. 重新載入頁面（已快取）：
   - Console: "[Cache] ✓ Loaded questions.json from cache"
   - 速度應該顯著提升（通常 < 50ms）

## 📊 預期效能提升

| 測試項目 | 優化前 | 優化後 | 改善 |
|----------|--------|--------|------|
| questions.json 載入| ~500ms | ~20ms | 96% ↑ |
| 首次頁面載入 | ~5s | ~3s | 40% ↑ |
| 重複訪問 | ~3s | ~0.8s | 73% ↑ |
| 離線訪問 | ❌ | ✅ | 100% |

## 🔍 Console 訊息檢查清單

正常運行時，Console 應該會看到：

```
[SW] ✅ Service Worker registered
[Cache] Initialized
[LazyLoader] Initialized
[Cache] Cache miss, fetching from network  // 第一次
[Cache] ✓ Saved questions.json to cache
[動態載入] 成功載入 47 篇文章
```

重新載入後：

```
[SW] ✅ Service Worker registered
[Cache] Initialized
[Cache] ✓ Loaded questions.json from cache  // 從快取載入
[動態載入] 成功載入 47 篇文章
```

## ⚠️ 故障排除

### Service Worker 未註冊
**問題**: Console 顯示 "[SW] Registration failed"

**解決方案**:
1. 確認使用 HTTPS 或 localhost
2. 檢查 sw.js 檔案路徑是否正確
3. 檢查瀏覽器是否支援 Service Worker

### 快取未生效
**問題**: 重新載入後仍顯示 "Cache miss"

**解決方案**:
```javascript
// 手動測試快取寫入
await cacheManager.set('test', {data: 'hello'});
await cacheManager.get('test'); // 應返回 {data: 'hello'}

// 如果失敗，檢查 LocalStorage 配額
console.log(navigator.storage?.estimate());
```

### 離線模式無法訪問
**問題**: 離線時頁面無法載入

**解決方案**:
1. 確認 Service Worker 已啟用
2. 至少訪問過一次（預快取需要初始化）
3. 檢查 Cache Storage：DevTools → Application → Cache Storage

## 🎯 生產部署前檢查

- [ ] npm install 完成
- [ ] Service Worker 註冊成功
- [ ] 快取功能正常運作
- [ ] 離線模式可訪問
- [ ] HTTPS 憑證已配置（VM 部署）
- [ ] Cache version 已更新（如有修改）

## 📝 後續工作

1. **效能基準測試**: 
   - 使用 Lighthouse 進行評分
   - 記錄優化前後的對比數據

2. **用戶測試**:
   - 在不同網路環境測試（3G/4G/WiFi）
   - 不同裝置測試（手機/平板/桌機）

3. **監控設置**:
   - 考慮加入 Analytics 追蹤快取命中率
   - 監控 Service Worker 錯誤

## 📚 相關文檔

- [PERFORMANCE-INTEGRATION-GUIDE.md](file:///h:/PIRLS/PERFORMANCE-INTEGRATION-GUIDE.md) - 詳細整合說明
- [walkthrough.md](file:///C:/Users/smes/.gemini/antigravity/brain/c1a0d6e1-619e-432c-ab56-e43e8c126e2e/walkthrough.md) - 實作成果
- [implementation_plan.md](file:///C:/Users/smes/.gemini/antigravity/brain/c1a0d6e1-619e-432c-ab56-e43e8c126e2e/implementation_plan.md) - 技術規劃

---

**整合完成時間**: 2025-12-29  
**版本**: 2.2.0  
**狀態**: ✅ 自動整合完成，請執行測試驗證
