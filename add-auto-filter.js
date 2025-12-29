// 自動篩選未完成文章功能 - 快速修補腳本
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');

console.log('🔧 添加自動篩選功能...\n');

// 讀取文件
let content = fs.readFileSync(indexPath, 'utf8');

// 步驟 1: 在 applyFilter 函數後添加新函數
const autoFilterFunction = `

        /**
         * 自動篩選未完成文章（針對已登入用戶）
         * 當用戶已登入且有完成記錄時，自動篩選顯示未完成的文章
         */
        function autoFilterUncompletedForLoggedInUser() {
            const storedUser = localStorage.getItem('shimen_pirls_user');
            
            // 只對已登入且有完成記錄的用戶應用自動篩選
            if (storedUser && completedArticleIds.size > 0) {
                console.log('[Auto Filter] 偵測到已登入用戶，自動篩選未完成文章');
                applyFilter('uncompleted');
            } else {
                // 未登入或無完成記錄，顯示全部
                console.log('[Auto Filter] 未登入用戶或無完成記錄，顯示全部文章');
                applyFilter('all');
            }
        }
`;

// 在 applyFilter 函數結束的 } 後添加
content = content.replace(
    /(function applyFilter\(filter\)[\s\S]+?document\.querySelectorAll\('\.status-btn'\)\.forEach[\s\S]+?\}\);[\s\S]+?\})/,
    `$1${autoFilterFunction}`
);

// 步驟 2: 在 DOMContentLoaded 中添加呼叫
content = content.replace(
    /(await loadCompletedArticles\(\);)/,
    `$1\n            // v2.1: Auto-filter uncompleted articles for logged-in users\n            autoFilterUncompletedForLoggedInUser();`
);

// 儲存文件
fs.writeFileSync(indexPath, content, 'utf8');

console.log('✅ 修改完成！');
console.log('✨ 已添加自動篩選未完成文章功能');
console.log('🔄 請重新整理瀏覽器測試');
