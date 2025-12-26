/**
 * PIRLS 認證輔助模組
 * 提供統一的登入和Token管理功能
 */

const AUTH_API = 'http://127.0.0.1:3001/api/admin';
const TOKEN_KEY = 'pirls_admin_token';

/**
 * 顯示密碼模態框並處理登入
 */
async function showLoginModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('passwordModal');
        const passwordInput = document.getElementById('adminPassword');
        const errorDiv = document.getElementById('passwordError');

        // 顯示模態框
        modal.style.display = 'flex';
        passwordInput.value = '';
        passwordInput.focus();

        // 登入處理函數
        window.checkAdminPassword = async function () {
            const password = passwordInput.value.trim();

            if (!password) {
                errorDiv.textContent = '請輸入密碼';
                errorDiv.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`${AUTH_API}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                const result = await response.json();

                if (result.success) {
                    // 儲存 Token
                    localStorage.setItem(TOKEN_KEY, result.token);

                    // 關閉模態框
                    modal.style.display = 'none';

                    console.log('[Auth] 登入成功，Token有效期:', result.expiresIn);
                    resolve(true);
                } else {
                    // 顯示錯誤
                    errorDiv.textContent = result.error;
                    if (result.remainingAttempts !== undefined) {
                        errorDiv.textContent += ` (剩餘嘗試: ${result.remainingAttempts})`;
                    }
                    errorDiv.style.display = 'block';
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (e) {
                console.error('[Auth] 登入錯誤:', e);
                errorDiv.textContent = '登入失敗，請檢查網路連線';
                errorDiv.style.display = 'block';
            }
        };

        // Enter鍵登入
        passwordInput.onkeypress = function (e) {
            if (e.key === 'Enter') {
                checkAdminPassword();
            }
        };
    });
}

/**
 * 驗證 Token 是否有效
 */
async function verifyToken() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        return false;
    }

    try {
        const response = await fetch(`${AUTH_API}/verify`, {
            headers: { 'Authorization': token }
        });

        if (response.ok) {
            return true;
        } else {
            // Token 無效，清除
            localStorage.removeItem(TOKEN_KEY);
            return false;
        }
    } catch (e) {
        console.error('[Auth] Token驗證失敗:', e);
        return false;
    }
}

/**
 * 檢查認證狀態，未登入則顯示登入框
 */
async function ensureAuthenticated() {
    const isValid = await verifyToken();

    if (!isValid) {
        await showLoginModal();
    }
}

/**
 * 發送受保護的 API 請求
 */
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        throw new Error('未登入');
    }

    // 添加 Authorization header
    options.headers = {
        ...options.headers,
        'Authorization': token
    };

    const response = await fetch(url, options);

    // Token 過期處理
    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        await showLoginModal();

        // 重新嘗試請求
        const newToken = localStorage.getItem(TOKEN_KEY);
        options.headers['Authorization'] = newToken;
        return fetch(url, options);
    }

    return response;
}

/**
 * 登出
 */
function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.reload();
}

// 頁面載入時檢查認證
document.addEventListener('DOMContentLoaded', async () => {
    await ensureAuthenticated();
});
