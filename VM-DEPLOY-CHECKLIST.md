# PIRLS vCloud VM 部署檢查清單

**目標 VM 路徑**: `/var/www/html/smes/PIRLS`

## 📋 部署前準備（在本地電腦）

### 1️⃣ 確認專案完整性

- [ ] 專案位於 `h:\PIRLS\`
- [ ] 所有 HTML 文件存在（`index.html`, `admin.html`, `ai-generate.html`, `quiz.html`, `upload.html`）
- [ ] `server.js` 存在
- [ ] `package.json` 存在
- [ ] `assets/` 資料夾完整
- [ ] `data/` 資料夾完整

### 2️⃣ 檢查環境變數文件

- [ ] `.env` 文件存在
- [ ] `.env` 包含 `GEMINI_API_KEY`
- [ ] `.env` 包含 `ADMIN_PASSWORD_HASH`
- [ ] `.env` 包含 `JWT_SECRET`
- [ ] `.env` 包含 `JWT_EXPIRY`

**驗證指令** (本地 PowerShell):
```powershell
type .env
```

### 3️⃣ 準備部署文件

建議使用以下兩種方式之一：

#### 方案 A: 自動化腳本（推薦）

- [ ] 將 `deploy-to-vm.sh` 複製到 VM
- [ ] 將整個 PIRLS 資料夾複製到 VM 臨時位置

#### 方案 B: 手動打包

- [ ] 創建排除清單（見下方「不需要複製的文件」）
- [ ] 使用 WinSCP 或 `scp` 傳輸文件

---

## 📦 不需要複製的文件/資料夾

建議**排除**以下內容（會在 VM 上重新生成或不需要）：

- ❌ `node_modules/` - 會在 VM 上執行 `npm install`
- ❌ `.git/` - Git 歷史記錄（可選）
- ❌ `archive/` - 存檔資料
- ❌ `progress_*.md` - 開發進度文檔
- ❌ `*.log` - 日誌文件
- ❌ `.vscode/`, `.idea/` - IDE 配置
- ❌ `css_additions.txt` - 開發備註

**必須保留**：
- ✅ `.env` - 環境變數（包含敏感資訊）
- ✅ `.env.example` - 範本
- ✅ `package.json` - 依賴清單
- ✅ `server.js` - 後端伺服器
- ✅ 所有 `.html` 文件
- ✅ `assets/` - 前端資源
- ✅ `data/` - 資料文件
- ✅ `tools/` - 工具腳本

---

## 🚀 VM 部署步驟

### Step 1: 連接到 VM

```bash
ssh your_username@vm_ip_address
```

- [ ] 成功連接到 VM

### Step 2: 準備部署環境

#### 選項 A - 使用自動化腳本（推薦）

1. 上傳整個 PIRLS 資料夾到 VM 臨時位置（如 `/tmp/PIRLS`）

```bash
# 在本地 (使用 WSL 或 Git Bash)
scp -r h:\PIRLS your_username@vm_ip:/tmp/
```

2. 在 VM 上執行部署腳本

```bash
cd /tmp/PIRLS
chmod +x deploy-to-vm.sh
./deploy-to-vm.sh
```

- [ ] 腳本執行完成無錯誤

#### 選項 B - 手動部署

1. **檢查/安裝 Node.js**

```bash
# 檢查是否已安裝
node --version
npm --version

# 如果沒有，安裝 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

- [ ] Node.js 版本 >= 18.x
- [ ] npm 已安裝

2. **創建目標目錄**

```bash
sudo mkdir -p /var/www/html/smes/PIRLS
sudo chown -R $USER:$USER /var/www/html/smes/PIRLS
```

- [ ] 目錄創建成功
- [ ] 權限設定正確

3. **複製文件到目標路徑**

```bash
# 使用 rsync (推薦)
rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'archive' \
    /tmp/PIRLS/ /var/www/html/smes/PIRLS/
```

- [ ] 文件複製完成

4. **安裝 Node.js 依賴**

```bash
cd /var/www/html/smes/PIRLS
npm install --production
```

- [ ] `npm install` 成功完成
- [ ] 沒有嚴重錯誤訊息

5. **驗證 .env 文件**

```bash
cat .env
```

- [ ] .env 存在且包含所有必要變數

6. **測試運行**

```bash
node server.js
```

- [ ] 看到啟動訊息「🚀 PIRLS 後端 API 伺服器已啟動」
- [ ] 按 `Ctrl+C` 停止測試

---

### Step 3: 配置 PM2 進程管理

```bash
# 安裝 PM2
sudo npm install -g pm2

# 啟動服務
cd /var/www/html/smes/PIRLS
pm2 start server.js --name pirls

# 設定開機自啟
pm2 startup
# 複製並執行顯示的指令（通常是 sudo 開頭）

# 儲存配置
pm2 save
```

- [ ] PM2 安裝成功
- [ ] 服務啟動成功
- [ ] `pm2 status` 顯示 `pirls` 狀態為 `online`
- [ ] 開機自啟設定完成

---

### Step 4: 配置防火牆

```bash
# 開放端口 3001
sudo ufw allow 3001/tcp
sudo ufw enable

# 查看狀態
sudo ufw status
```

- [ ] 防火牆已啟用
- [ ] 端口 3001 已開放

---

### Step 5: 測試訪問

**從 VM 本地測試**:
```bash
curl http://localhost:3001
```

- [ ] 返回 HTML 內容

**從外部電腦測試** (使用瀏覽器):
```
http://VM的IP:3001/index.html
http://VM的IP:3001/admin.html
http://VM的IP:3001/ai-generate.html
```

- [ ] 首頁 (`index.html`) 正常顯示
- [ ] 能夠選擇並閱讀文章
- [ ] Quiz 功能正常

---

### Step 6: 測試管理功能

1. **訪問管理後台**:
   ```
   http://VM的IP:3001/admin.html
   ```

2. **登入測試**:
   - 使用您在 `.env` 中設定的密碼
   - 預設密碼: `034711752`（如果您沒有更改）

- [ ] 能夠成功登入
- [ ] AI 生成功能正常
- [ ] Excel 上傳功能正常

---

## ✅ 部署完成檢查

- [ ] 服務在 VM 上運行正常
- [ ] 從外部可以訪問網站
- [ ] 所有頁面正常顯示
- [ ] 管理員登入功能正常
- [ ] AI 題目生成功能正常
- [ ] PM2 狀態為 `online`
- [ ] 開機自啟已設定

---

## 🔧 常用維護指令

### PM2 管理

```bash
# 查看服務狀態
pm2 status

# 查看即時日誌
pm2 logs pirls

# 重啟服務
pm2 restart pirls

# 停止服務
pm2 stop pirls

# 查看詳細資訊
pm2 show pirls
```

### 更新代碼

當本地有更新需要部署到 VM:

```bash
# 1. 在 VM 上備份當前版本（可選）
cd /var/www/html/smes
cp -r PIRLS PIRLS.backup.$(date +%Y%m%d)

# 2. 上傳更新的文件
# (在本地執行 scp 或使用 WinSCP)

# 3. 重啟服務
cd /var/www/html/smes/PIRLS
pm2 restart pirls
```

---

## 🆘 故障排查

### 問題 1: 無法訪問網站

**檢查清單**:
1. PM2 服務是否運行: `pm2 status`
2. 端口是否監聽: `sudo netstat -tlnp | grep 3001`
3. 防火牆是否開放: `sudo ufw status`
4. 查看日誌: `pm2 logs pirls`

### 問題 2: API Key 錯誤

```bash
# 檢查 .env
cat /var/www/html/smes/PIRLS/.env | grep GEMINI_API_KEY

# 重啟服務讓環境變數生效
pm2 restart pirls
```

### 問題 3: 權限問題

```bash
# 確保目錄權限正確
sudo chown -R $USER:$USER /var/www/html/smes/PIRLS
```

---

## 📞 相關文檔

- [VM-QUICK-DEPLOY.md](./VM-QUICK-DEPLOY.md) - 詳細部署指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署文檔
- [ADMIN_API_KEY_SETUP.md](./ADMIN_API_KEY_SETUP.md) - API Key 設定

---

## 🎉 部署完成！

完成所有檢查項目後，您的 PIRLS 系統已成功部署到:

**路徑**: `/var/www/html/smes/PIRLS`

**訪問網址**: `http://您的VM_IP:3001`

祝使用愉快！🚀
