// ==========================================================================
// PIRLS 效能優化自動整合腳本
// 執行此腳本會自動將快取管理器和 Service Worker 整合到 HTML 檔案中
// ==========================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 開始自動整合效能優化功能...\n');

// 檔案路徑
const indexPath = path.join(__dirname, 'index.html');
const quizPath = path.join(__dirname, 'quiz.html');

// ==========================================================================
// 1. 整合 index.html
// ==========================================================================
console.log('📝 處理 index.html...');

let indexHtml = fs.readFileSync(indexPath, 'utf-8');

// 加入 Performance Scripts（在 particles.js 之後）
const performanceScripts = `    <script src="https://cdnjs.cloudflare.com/ajax/libs/particles.js/2.0.0/particles.min.js"></script>

    <!-- ✨ Performance Optimization Scripts -->
    <script src="assets/js/cache-manager.js"></script>
    <script src="assets/js/lazy-loader.js"></script>
    <script>
        // Service Worker Registration
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                const swPath = window.location.pathname.includes('/') ? getBasePath() + '/sw.js' : '/sw.js';
                navigator.serviceWorker.register(swPath)
                    .then((registration) => {
                        console.log('[SW] ✅ Service Worker registered');
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('[SW] New version available, reload to update');
                                }
                            });
                        });
                    })
                    .catch((error) => {
                        console.warn('[SW] Registration failed:', error);
                    });
            });
        }
    </script>

    <script type="module">`;

// 替換原有的 particles.js script 標籤
indexHtml = indexHtml.replace(
    /<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/particles\.js\/2\.0\.0\/particles\.min\.js"><\/script>\s*<script type="module">/,
    performanceScripts
);

// 修改 questions.json 載入邏輯（加入快取）
const oldFetchPattern = /\/\/ 文章資料 - 動態從 questions\.json 載入[\s\S]*?}\)\(\);/;
const newFetchCode = `// 文章資料 - 動態從 questions.json 載入（✨ 使用快取優化）
        let articles = [];

        // 初始載入
        (async function () {
            try {
                // 嘗試從快取載入
                let allQuestions = null;
                
                if (window.cacheManager) {
                    allQuestions = await window.cacheManager.get('questions', true);
                    if (allQuestions) {
                        console.log(\`[Cache] ✓ Loaded questions.json from cache\`);
                    }
                }
                
                // 快取未命中或不可用，從網路載入
                if (!allQuestions) {
                    console.log(\`[Cache] Cache miss, fetching from network\`);
                    const response = await fetch(\`\${BASE_PATH}/data/questions.json\`);
                    if (response.ok) {
                        allQuestions = await response.json();
                        // 儲存到快取
                        if (window.cacheManager) {
                            await window.cacheManager.set('questions', allQuestions, true);
                            console.log(\`[Cache] ✓ Saved questions.json to cache\`);
                        }
                    } else {
                        console.warn('[動態載入] questions.json 載入失敗，使用降級資料');
                        articles = Array.from({ length: 47 }, (_, i) => ({ id: i + 1, title: \`篇章 \${i + 1}\` }));
                        return;
                    }
                }
                
                if (allQuestions) {
                    articles = allQuestions.map(q => ({ id: q.id, title: q.title }));
                    console.log(\`[動態載入] 成功載入 \${articles.length} 篇文章\`);
                    if (document.getElementById('article-grid')) {
                        renderGrid();
                    }
                }
            } catch (e) {
                console.error('[動態載入] 錯誤:', e);
                articles = Array.from({ length: 47 }, (_, i) => ({ id: i + 1, title: \`篇章 \${i + 1}\` }));
            }
        })();`;

if (oldFetchPattern.test(indexHtml)) {
    indexHtml = indexHtml.replace(oldFetchPattern, newFetchCode);
    console.log('✓ 已更新 questions.json 載入邏輯（啟用快取）');
} else {
    console.log('⚠ 未找到 questions.json 載入邏輯，跳過此步驟');
}

// 寫回檔案
fs.writeFileSync(indexPath, indexHtml, 'utf-8');
console.log('✅ index.html 整合完成\n');

// ==========================================================================
// 2. 整合 quiz.html
// ==========================================================================
console.log('📝 處理 quiz.html...');

let quizHtml = fs.readFileSync(quizPath, 'utf-8');

// 在 mobile-tabs.js 之前加入 performance scripts
const quizScripts = `    <!-- ✨ Performance Optimization Scripts -->
    <script src="assets/js/cache-manager.js"></script>
    <script src="assets/js/lazy-loader.js"></script>

    <!-- 手機版 Tab 功能 -->
    <script src="assets/js/mobile-tabs.js"></script>`;

quizHtml = quizHtml.replace(
    /<!-- 手機版 Tab 功能 -->\s*<script src="assets\/js\/mobile-tabs\.js"><\/script>/,
    quizScripts
);

// 寫回檔案
fs.writeFileSync(quizPath, quizHtml, 'utf-8');
console.log('✅ quiz.html 整合完成\n');

// ==========================================================================
// 完成
// ==========================================================================
console.log('🎉 所有檔案整合完成！');
console.log('\n下一步：');
console.log('1. 執行 npm install 安裝依賴');
console.log('2. 測試快取功能：在 Console 執行 cacheManager.getStats()');
console.log('3. 測試 Service Worker：DevTools > Application > Service Workers');
console.log('4. 測試離線功能：DevTools > Network > Offline');
console.log('\n詳細說明請參考 PERFORMANCE-INTEGRATION-GUIDE.md');
