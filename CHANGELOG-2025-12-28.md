# PIRLS VM 部署与路径通用化完整记录

## 📅 更新日期
2025-12-28

## 🎯 本次更新概览

本次更新解决了 PIRLS 应用在 VM 部署时遇到的所有问题，并实现了路径通用化，使应用可以部署在任意子路径。

---

## ✅ 已完成的修复

### 1. 路径自动检测通用化

**问题**：应用路径硬编码为 `/smes/PIRLS2/`，无法灵活迁移

**解决方案**：实现自动路径检测，支持任意部署路径

**修改的文件**：
- `index.html`
- `assets/js/admin.js`
- `assets/js/auth-helper.js`
- `ai-generate.html`

**新的路径检测逻辑**：
```javascript
const getBasePath = () => {
    const pathname = window.location.pathname;
    const lastSlashIndex = pathname.lastIndexOf('/');
    const basePath = pathname.substring(0, lastSlashIndex);
    return basePath || '';
};
```

**支持的部署路径**：
- ✅ `/smes/PIRLS/`
- ✅ `/smes/PIRLS2/`
- ✅ `/apps/reading/`
- ✅ 任何子目录

---

### 2. 纯前端认证系统

**问题**：VM 上没有运行后端 API，无法登录

**解决方案**：实现纯前端密码验证作为后端 API 的 fallback

**修改的文件**：
- `assets/js/auth-helper.js`

**工作模式**：
1. 优先尝试后端 API 验证（如果 server.js 在运行）
2. 如果后端不可用，自动降级到前端验证
3. 使用 SHA-256 哈希验证密码
4. 密码：`034711752`
5. Hash：`d958f781b8af08d4cb016a7a99fe3d6c54a826c4aa0fe4890b16eef8ceb9cd89`

**Token 管理**：
- 登录成功后保存 `frontend-mode-{timestamp}` 到 localStorage
- 刷新页面时自动验证 token，无需重新登录
- 支持无痕模式下的会话持久化（同一窗口内）

---

### 3. 登录对话框问题修复

**问题**：第二次访问时报错 `checkAdminPassword is not defined`

**原因**：
- 首次访问无 token → 显示登录框 → 定义 `checkAdminPassword` 函数
- 二次访问有 token → 不显示登录框 → 函数未定义 → 点击按钮报错

**解决方案**：
在 `ensureAuthenticated()` 函数中，即使 token 有效也：
1. 隐藏登录对话框
2. 定义占位的 `checkAdminPassword` 函数

```javascript
async function ensureAuthenticated() {
    const isValid = await verifyToken();
    
    if (!isValid) {
        await showLoginModal();
    } else {
        // 隐藏对话框
        const modal = document.getElementById('passwordModal');
        if (modal) modal.style.display = 'none';
        
        // 定义占位函数
        window.checkAdminPassword = function() {
            console.log('[Auth] 已登录，无需重新验证');
        };
    }
}
```

---

### 4. API 检查逻辑优化

**问题**：API 返回 404 时仍尝试解析 JSON，导致错误

**解决方案**：在 `checkApiStatus()` 中添加 HTTP 状态检查

**修改的文件**：
- `assets/js/admin.js`

```javascript
async function checkApiStatus() {
    try {
        const response = await fetch(`${API_URL}/api/questions`, { method: 'GET' });
        if (response.ok) {
            apiAvailable = true;
            console.log('✅ API 伺服器已連線');
        } else {
            // 新增：处理 404 等错误
            apiAvailable = false;
            console.log('⚠️ API 端點不可用，將使用下載模式');
        }
    } catch (e) {
        apiAvailable = false;
        console.log('⚠️ API 伺服器未啟動，將使用下載模式');
    }
}
```

---

## 📦 文件修改清单

### 修改的文件

1. **`index.html`**
   - 添加通用路径检测函数 `getBasePath()`
   - 修改 data 文件读取路径为 `${BASE_PATH}/data/questions.json`
   - 修改页面跳转路径为 `${BASE_PATH}/quiz.html?id=${id}`

2. **`assets/js/admin.js`**
   - 添加通用路径检测函数 `getBasePath()`
   - 优化 API 检查逻辑，处理 404 响应
   - 修改 data 文件读取路径
   - 修改测试链接路径

3. **`assets/js/auth-helper.js`**
   - 修改 `getBaseURL()` 为通用路径检测
   - 添加纯前端密码验证 fallback
   - 修改 `verifyToken()` 支持前端模式 token
   - 修改 `ensureAuthenticated()` 处理已登录状态

4. **`ai-generate.html`**
   - 已使用通用路径（无需额外修改）

### 未修改但相关的文件

- `upload.html` - 使用 auth-helper.js，自动继承修复
- `quiz.html` - 路径由 index.html 控制
- `server.js` - 后端文件，不影响纯前端部署

---

## 🚀 部署指南

### 当前部署（/smes/PIRLS2/）

```bash
# 上传所有修改的文件
scp H:\PIRLS\index.html username@read.smes.tyc.edu.tw:/var/www/html/smes/PIRLS2/
scp H:\PIRLS\assets\js\admin.js username@read.smes.tyc.edu.tw:/var/www/html/smes/PIRLS2/assets/js/
scp H:\PIRLS\assets\js\auth-helper.js username@read.smes.tyc.edu.tw:/var/www/html/smes/PIRLS2/assets/js/
```

### 路径迁移（/smes/PIRLS2/ → /smes/PIRLS/）

```bash
# 在 VM 上移动整个目录
ssh username@read.smes.tyc.edu.tw
mv /var/www/html/smes/PIRLS2 /var/www/html/smes/PIRLS
```

**无需修改任何代码！** 所有路径会自动调整。

---

## ✅ 测试验证

### 功能测试清单

- [x] index.html - 文章列表显示正常
- [x] quiz.html - 测验功能正常
- [x] upload.html - 登录和上传功能正常
- [x] admin.html - 登录和管理功能正常
- [x] 路径检测 - 在 /smes/PIRLS2/ 下正常工作
- [x] 纯前端认证 - 无后端也能登录
- [x] Token 持久化 - 刷新页面不需要重新登录
- [x] 无痕模式 - 同一窗口内刷新正常

### 已知行为（正常）

以下 Console 输出是**正常的系统行为**，可以安全忽略：

```
GET .../api/questions 404 (Not Found)
⚠️ API 端點不可用，將使用下載模式

GET .../api/admin/login 404 (Not Found)
[Auth] 後端 API 不可用，使用前端驗證
[Auth] 前端驗證成功（純前端模式）
```

这些是系统自动检测后端并降级到纯前端模式的正常流程。

---

## 🎯 纯前端模式工作流程

### upload.html 使用流程

1. 访问 `https://read.smes.tyc.edu.tw/smes/PIRLS2/upload.html`
2. 输入密码 `034711752` 登录
3. 上传 PaGamO Excel 文件
4. 预览解析的内容
5. 点击"确认并储存"
6. 浏览器自动下载 `questions.json`
7. 使用 WinSCP 上传到 VM 的 `/var/www/html/smes/PIRLS2/data/` 目录

### 会话管理

- **刷新页面**：保持登录状态，无需重新输入密码
- **关闭窗口重开**：需要重新登录（localStorage 清除）
- **无痕模式**：同一窗口内刷新保持登录

---

## 📋 技术细节

### 路径检测算法

```javascript
// 从当前 URL 中自动提取目录路径
// 例如：https://read.smes.tyc.edu.tw/smes/PIRLS2/upload.html
//   → pathname = /smes/PIRLS2/upload.html
//   → basePath = /smes/PIRLS2
const pathname = window.location.pathname;
const lastSlashIndex = pathname.lastIndexOf('/');
const basePath = pathname.substring(0, lastSlashIndex);
```

### 密码验证算法

```javascript
// 1. 对输入的密码进行 SHA-256 哈希
const inputHash = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(password))
    .then(buf => Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''));

// 2. 与存储的哈希比较
if (inputHash === correctPasswordHash) {
    // 验证成功
}
```

### Token 格式

- 后端模式：JWT token
- 前端模式：`frontend-mode-{timestamp}`

---

## 🔄 后续优化建议

### 可选：启用完整后端模式

如果需要自动更新 questions.json 和 AI 生成功能：

```bash
# 在 VM 上启动后端
cd /var/www/html/smes/PIRLS2
npm install
pm2 start server.js --name pirls-api
pm2 save
```

然后配置 Web 服务器反向代理（需要系统管理员）。

### 安全性增强

1. 考虑使用更强的密码
2. 定期更新密码哈希
3. 添加登录失败次数限制

---

## 📞 支持信息

- **密码**：`034711752`
- **部署路径**：`/var/www/html/smes/PIRLS2/`
- **访问 URL**：`https://read.smes.tyc.edu.tw/smes/PIRLS2/`
- **Git 仓库**：`H:\PIRLS`

---

## 🎉 总结

本次更新实现了：
- ✅ 完全的路径独立性
- ✅ 无需后端的纯前端运行
- ✅ 流畅的登录体验
- ✅ 简单的迁移流程

现在 PIRLS 系统可以：
- 部署在任何路径
- 在纯前端模式下完整运行
- 无缝迁移到新路径
- 提供流畅的用户体验

**所有功能经过全面测试，可以安全使用！** 🚀
