# PIRLS 閱讀素養測驗系統 - 部署指南

## 📋 部署前檢查清單

### ✅ 必須完成的步驟

#### 1. 環境變數設定

**重要**: `.env` 文件已被 `.gitignore` 排除，不會上傳到 GitHub

1. 複製 `.env.example` 為 `.env`
2. 填入你的配置：

```bash
# 複製範本
cp .env.example .env

# 編輯 .env
# 填入：
# - GEMINI_API_KEY: 你的 Gemini API Key
# - ADMIN_PASSWORD_HASH: 密碼的SHA-256 hash
# - JWT_SECRET: 隨機生成的密鑰
```

**生成密碼Hash**:
```bash
node -e "console.log(require('crypto').createHash('sha256').update('你的密碼').digest('hex'))"
```

**生成JWT Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 2. 安裝依賴

```bash
npm install
```

#### 3. 啟動服務器

```bash
node server.js
```

服務器會在 `http://localhost:3001` 啟動

---

## 🚀 部署到 GitHub

### 步驟

1. **初始化 Git（如果還沒有）**
```bash
git init
```

2. **檢查 .gitignore**
```bash
# 確認 .env 在 .gitignore 中
cat .gitignore | grep .env
```

3. **添加文件**
```bash
git add .
```

4. **提交**
```bash
git commit -m "Initial commit - PIRLS v2.1 with secure authentication"
```

5. **推送到 GitHub**
```bash
git remote add origin https://github.com/your-username/PIRLS.git
git branch -M main
git push -u origin main
```

---

## ⚠️ 安全注意事項

### 絕對不要提交的文件

- ❌ `.env` - 包含 API Key 和密碼
- ❌ `node_modules/` - 依賴包
- ❌ `*.log` - 日誌文件
- ❌ 任何包含敏感信息的文件

### 已保護的敏感信息

- ✅ Gemini API Key (在 .env)
- ✅ 密碼Hash (在 .env)
- ✅ JWT Secret (在 .env)

---

## 🔧 環境配置

### 開發環境

```bash
# .env
GEMINI_API_KEY=你的開發API_KEY
ADMIN_PASSWORD_HASH=開發密碼hash
JWT_SECRET=開發用secret
JWT_EXPIRY=2h
```

### 生產環境

```bash
# .env (在生產服務器上)
GEMINI_API_KEY=生產API_KEY
ADMIN_PASSWORD_HASH=生產密碼hash
JWT_SECRET=生產用secret（較長）
JWT_EXPIRY=1h  # 生產環境建議較短
```

---

## 📦 GitHub部署後的設定

### 1. 克隆到新機器

```bash
git clone https://github.com/your-username/PIRLS.git
cd PIRLS
```

### 2. 設定環境變數

```bash
# 複製範本
cp .env.example .env

# 編輯 .env，填入實際值
nano .env
```

### 3. 安裝依賴

```bash
npm install
```

### 4. 啟動

```bash
node server.js
```

---

## 🌐 生產環境建議

### 使用 PM2 管理進程

```bash
# 安裝 PM2
npm install -g pm2

# 啟動
pm2 start server.js --name pirls

# 開機自啟
pm2 startup
pm2 save
```

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 啟用 HTTPS

```bash
# 使用 Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

---

## ✅ 部署檢查清單

部署前請確認：

- [ ] `.env` 在 `.gitignore` 中
- [ ] `.env.example` 已創建且不包含敏感信息
- [ ] `node_modules/` 在 `.gitignore` 中
- [ ] 已測試本地環境運行正常
- [ ] README.md 已更新
- [ ] 所有敏感信息已移除

部署後請確認：

- [ ] 在新環境複製 `.env.example` 為 `.env`
- [ ] 填入實際的環境變數
- [ ] `npm install` 成功
- [ ] 服務器啟動成功
- [ ] 登入功能正常
- [ ] AI生成功能正常

---

## 🆘 常見問題

### Q: 忘記添加 .gitignore 就提交了 .env 怎麼辦？

```bash
# 從Git歷史中移除
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 強制推送
git push origin --force --all
```

⚠️ **更好的方法**: 立即更換所有敏感信息（API Key、密碼）

### Q: 如何更改管理員密碼？

```bash
# 1. 生成新密碼的hash
node -e "console.log(require('crypto').createHash('sha256').update('新密碼').digest('hex'))"

# 2. 更新 .env
ADMIN_PASSWORD_HASH=新的hash

# 3. 重啟服務器
pm2 restart pirls
```

### Q: API Key 洩露了怎麼辦？

1. 立即到 Google Cloud Console 撤銷舊 Key
2. 生成新的 API Key
3. 更新 `.env` 中的 `GEMINI_API_KEY`
4. 重啟服務器

---

## 📝 版本記錄

- **v2.1.0** - 安全認證系統（JWT + 密碼Hash）
- **v2.0.0** - AI 自動生成題組
- **v1.8.0** - 完成狀態篩選
- **v1.0.0** - 基礎系統

---

**部署完成後，記得**：
1. 更新 README.md 添加專案說明
2. 添加 LICENSE 文件
3. 設定 GitHub Actions（如需CI/CD）
4. 啟用 GitHub Security 掃描

**祝部署順利！** 🚀
