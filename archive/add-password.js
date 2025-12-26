// 添加密碼保護到 admin.html
const fs = require('fs');

let content = fs.readFileSync('admin.html', 'utf8');

const passwordModal = `<body>
    <!-- 密碼驗證模態框 -->
    <div id="passwordModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px;">
            <h2 style="margin-bottom: 20px; color: #4f46e5;">🔒 管理員驗證</h2>
            <p style="color: #666; margin-bottom: 20px;">請輸入後台密碼以繼續</p>
            <input type="password" id="adminPassword" placeholder="輸入密碼" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; margin-bottom: 15px;">
            <button onclick="checkAdminPassword()" style="width: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">確認</button>
            <p id="passwordError" style="color: red; margin-top: 10px; display: none;">密碼錯誤！</p>
        </div>
    </div>
    <script>
        const ADMIN_PASSWORD = '034711752';
        function checkAdminPassword() {
            const input = document.getElementById('adminPassword').value;
            if (input === ADMIN_PASSWORD) {
                document.getElementById('passwordModal').style.display = 'none';
                sessionStorage.setItem('pirls_admin_auth', 'true');
            } else {
                document.getElementById('passwordError').style.display = 'block';
            }
        }
        document.getElementById('adminPassword').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') checkAdminPassword();
        });
        if (sessionStorage.getItem('pirls_admin_auth') === 'true') {
            document.getElementById('passwordModal').style.display = 'none';
        }
    </script>

    <div class="admin-container">`;

// 替換 <body> 標籤
content = content.replace(/<body>\s*<div class="admin-container">/i, passwordModal);

fs.writeFileSync('admin.html', content, 'utf8');
console.log('✅ 密碼保護已添加到 admin.html');
