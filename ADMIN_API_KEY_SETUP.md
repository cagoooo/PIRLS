# Gemini API Key 管理介面實施方案

由於 admin.html 檔案較大且複雜，建議採用以下兩種方式之一來新增 API Key 管理功能：

## 方式 1：手動新增HTML區塊（推薦）

請在 `admin.html` 的 `</header>` 標籤後（約第 372 行）手動新增以下代碼：

```html
<!-- API Key 設定區 -->
<div style="background: var(--card-bg); padding: 20px; border-radius: var(--border-radius); box-shadow: var(--shadow-sm); margin-bottom: 20px; border-left: 4px solid var(--warning-color);">
    <h3 style="margin-top:0; color:var(--secondary-color); font-size:1.1rem; display: flex; align-items: center; gap: 8px;">
        🔐 Gemini API Key 設定
    </h3>
    <div id="api-key-status" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
        <span class="status-indicator" style="font-weight: 600;">⏳ 檢查中...</span>
    </div>
    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start;">
        <input type="password" id="gemini-api-key-input" 
               placeholder="輸入 Gemini API Key (AIza...)" 
               style="flex: 1; min-width: 250px; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-family: monospace; font-size: 0.95rem;">
        <button onclick="setGeminiApiKey()" 
                style="padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: transform 0.2s;">
            💾 儲存 API Key
        </button>
        <button onclick="toggleApiKeyVisibility()" 
                style="padding: 12px 20px; background: #64748b; color: white; border: none; border-radius: 8px; cursor: pointer;">
            👁️ 顯示/隱藏
        </button>
    </div>
    <p style="color: var(--text-gray); font-size: 0.85rem; margin-top: 10px; margin-bottom: 0;">
        ℹ️ API Key 儲存在伺服器記憶體中，重啟後需要重新設定。這確保 Key 不會被寫入任何檔案。
    </p>
</div>
```

然後在 `</script>` 標籤前（檔案末尾）新增以下 JavaScript 函數：

```javascript
// API Key 管理函數
async function checkApiKeyStatus() {
    try {
        const response = await fetch('http://127.0.0.1:3001/api/admin/gemini-key-status', {
            headers: { 'Authorization': localStorage.getItem('pirls_admin_token') || '' }
        });
        const result = await response.json();
        
        const statusDiv = document.getElementById('api-key-status');
        if (result.isSet) {
            statusDiv.innerHTML = `
                <span class="status-indicator" style="color: #10b981;">✅ API Key 已設定</span>
                <span style="color: #64748b; font-size: 0.9rem;">(來源: ${result.source === 'environment' ? '環境變數' : '運行時設定'})</span>
            `;
        } else {
            statusDiv.innerHTML = `
                <span class="status-indicator" style="color: #ef4444;">❌ API Key 未設定</span>
                <span style="color: #64748b; font-size: 0.9rem;">- AI 生成功能無法使用</span>
            `;
        }
    } catch (error) {
        console.error('檢查 API Key 狀態失敗:', error);
    }
}

async function setGeminiApiKey() {
    const apiKey = document.getElementById('gemini-api-key-input').value.trim();
    
    if (!apiKey) {
        alert('請輸入 API Key');
        return;
    }
    
    if (!apiKey.startsWith('AIza')) {
        alert('⚠️ API Key 格式不正確\n\nGemini API Key 應該以 "AIza" 開頭\n請檢查是否複製正確');
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:3001/api/admin/set-gemini-key', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('pirls_admin_token') || ''
            },
            body: JSON.stringify({ apiKey })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ API Key 設定成功！\n\n現在可以使用 AI 自動生成功能了');
            document.getElementById('gemini-api-key-input').value = '';
            checkApiKeyStatus();
        } else {
            alert('❌ 設定失敗：' + result.error);
        }
    } catch (error) {
        console.error('設定 API Key 失敗:', error);
        alert('❌ 設定失敗，請檢查網路連線');
    }
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('gemini-api-key-input');
    input.type = input.type === 'password' ? 'text' : 'password';
}

// 修改 initData 函數，在載入資料後檢查 API Key 狀態
const originalInitData = initData;
initData = async function() {
    await originalInitData();
    checkApiKeyStatus();
};
```

## 方式 2：使用獨立的 API Key 管理頁面

創建一個新的 `api-key-settings.html` 頁面，在後台導航中新增連結。

---

**後續步驟**：
1. 手動在 admin.html 新增上述代碼
2. 更新 ai-generate.html
3. 更新文檔檔案

由於檔案編輯工具遇到格式問題，建議手動新增上述代碼塊。
