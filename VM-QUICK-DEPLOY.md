# PIRLS VM 快速部署指南

**適用場景**: 已有完整的 PIRLS 本地開發環境，需要快速部署到 vCloud VM

**部署時間**: 約 10-15 分鐘

---

## 📋 部署前準備

### 在本地電腦準備

1. **確認 PIRLS 資料夾完整**
   ```
   h:\PIRLS\
   ├── .env ← 必須有！包含所有配置
   ├── server.js
   ├── package.json
   ├── index.html
   ├── ai-generate.html
   ├── assets/
   ├── data/
   └── 其他所有文件
   ```

2. **不需要複製的內容**
   - ❌ `node_modules/` - 太大，會在VM上重新安裝
   - ❌ `.git/` - 可選（除非需要在VM上git pull更新）

### VM 需求

- **作業系統**: Windows Server 或 Ubuntu 20.04+
- **RAM**: 4 GB+
- **空間**: 5 GB+
- **網路**: 固定IP或內網IP

---

## 🚀 部署步驟

### Step 1: 複製 PIRLS 資料夾到 VM

#### 方法 A - Windows Server VM（遠端桌面）

1. 開啟遠端桌面連接到 VM
2. 直接複製 `h:\PIRLS` 整個資料夾
3. 貼到 VM 的 `C:\PIRLS`（或喜歡的位置）

#### 方法 B - Linux VM（SCP）

**從您的本地 Windows 電腦**:

使用 WinSCP（推薦）:
1. 下載 WinSCP: https://winscp.net/
2. 連接到 VM（輸入IP、用戶名、密碼）
3. 拖拉整個 PIRLS 資料夾到 `/opt/`

或使用命令列:
```bash
# 如果有安裝 WSL 或 Git Bash
scp -r h:\PIRLS 用戶名@VM的IP:/opt/
```

---

### Step 2: 在 VM 上安裝 Node.js

#### Windows Server

1. 訪問: https://nodejs.org/
2. 下載 LTS 版本（目前推薦 18.x）
3. 執行安裝程式
4. 全部使用預設選項完成安裝

**驗證安裝**:
```powershell
# 打開 PowerShell
node --version  # 應該顯示 v18.x.x
npm --version   # 應該顯示 9.x.x+
```

#### Ubuntu/Linux

```bash
# 1. 安裝 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. 驗證
node --version
npm --version
```

---

### Step 3: 安裝依賴包

#### Windows Server

```powershell
# 1. 打開 PowerShell（管理員）
cd C:\PIRLS

# 2. 刪除舊的 node_modules（如果有從本地複製過來）
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# 3. 安裝依賴
npm install

# 應該看到安裝進度
# 完成後會顯示 "added xxx packages"
```

#### Ubuntu/Linux

```bash
# 1. 進入目錄
cd /opt/PIRLS

# 2. 刪除舊的 node_modules（如果有）
rm -rf node_modules

# 3. 設定目錄權限（重要！）
sudo chown -R $USER:$USER /opt/PIRLS

# 4. 安裝依賴
npm install
```

---

### Step 4: 確認 .env 文件

```bash
# Windows
type .env

# Linux
cat .env
```

**應該看到**:
```env
GEMINI_API_KEY=AIza...（你的API Key）
ADMIN_PASSWORD_HASH=d958f...（密碼hash）
JWT_SECRET=c9cd9d...（JWT密鑰）
JWT_EXPIRY=2h
```

✅ **如果看到這些內容，表示配置正確！**

---

### Step 5: 測試運行

```bash
# Windows
node server.js

# Linux
node server.js
```

**應該看到**:
```
==================================================
🚀 PIRLS 後端 API 伺服器已啟動
==================================================
   API 網址: http://127.0.0.1:3001
   管理後台: http://127.0.0.1:8080/admin.html
==================================================
```

**測試訪問**:
- 在 VM 的瀏覽器訪問: `http://localhost:3001/index.html`
- 從其他電腦訪問: `http://VM的IP:3001/index.html`

**如果成功顯示首頁，按 Ctrl+C 停止，繼續下一步**

---

### Step 6: 安裝 PM2（進程管理器）

**為什麼需要 PM2**:
- ✅ 關閉命令列視窗後繼續運行
- ✅ 開機自動啟動
- ✅ 崩潰自動重啟
- ✅ 日誌管理

#### Windows Server

```powershell
# 1. 安裝 PM2
npm install -g pm2

# 2. 安裝 Windows 服務支援
npm install -g pm2-windows-service

# 3. 設定為 Windows 服務（以管理員身份）
pm2-service-install

# 按照提示選擇（直接按 Enter 使用預設值）

# 4. 啟動 PIRLS
cd C:\PIRLS
pm2 start server.js --name pirls

# 5. 儲存配置
pm2 save

# 6. 查看狀態
pm2 status
```

#### Ubuntu/Linux

```bash
# 1. 安裝 PM2
sudo npm install -g pm2

# 2. 啟動 PIRLS
cd /opt/PIRLS
pm2 start server.js --name pirls

# 3. 設定開機自啟
pm2 startup
# 複製顯示的指令並執行（通常是 sudo 開頭的）

# 4. 儲存配置
pm2 save

# 5. 查看狀態
pm2 status
```

**應該看到**:
```
┌─────┬──────────┬─────────┬─────────┬─────────┐
│ id  │ name     │ mode    │ ↺      │ status  │
├─────┼──────────┼─────────┼─────────┼─────────┤
│ 0   │ pirls    │ fork    │ 0       │ online  │
└─────┴──────────┴─────────┴─────────┴─────────┘
```

✅ **status 顯示 "online" 表示成功！**

---

### Step 7: 設定防火牆

#### Windows Server

```powershell
# 開啟 PowerShell（管理員）
New-NetFirewallRule -DisplayName "PIRLS" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

#### Ubuntu/Linux

```bash
# 開放 3001 端口
sudo ufw allow 3001/tcp
sudo ufw enable

# 查看狀態
sudo ufw status
```

---

### Step 8: 測試訪問

**從其他電腦的網頁瀏覽器訪問**:

```
http://你的VM_IP:3001/index.html
http://你的VM_IP:3001/ai-generate.html
http://你的VM_IP:3001/admin.html
```

**測試功能**:
- [ ] 首頁能正常顯示
- [ ] 能選擇文章並閱讀
- [ ] 管理員登入成功（密碼: 034711752）
- [ ] AI 生成功能正常
- [ ] Excel 上傳功能正常

🎉 **全部成功！部署完成！**

---

## 🔧 常用管理指令

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

# 刪除服務
pm2 delete pirls

# 查看詳細資訊
pm2 show pirls
```

### 更新代碼

**如果本地有修改，需要更新到VM**:

1. 在本地重新複製修改的文件到VM
2. 在VM上執行:
   ```bash
   cd C:\PIRLS  # 或 /opt/PIRLS
   pm2 restart pirls
   ```

**如果使用 Git（推薦）**:

在VM上:
```bash
cd /opt/PIRLS
git pull origin main
npm install  # 如果有新依賴
pm2 restart pirls
```

---

## 🆘 問題排查

### Q1: 無法訪問網站

**檢查步驟**:

1. **服務是否運行**
   ```bash
   pm2 status
   # status 應該是 "online"
   ```

2. **端口是否監聽**
   ```bash
   # Windows
   netstat -an | findstr :3001
   
   # Linux
   sudo netstat -tlnp | grep 3001
   ```

3. **防火牆是否開放**
   ```bash
   # Windows
   Get-NetFirewallRule -DisplayName "PIRLS"
   
   # Linux
   sudo ufw status
   ```

4. **查看日誌**
   ```bash
   pm2 logs pirls
   ```

### Q2: npm install 失敗

**常見原因**:
- 網路問題
- 權限問題（Linux）

**解決**:
```bash
# Linux - 確保權限正確
sudo chown -R $USER:$USER /opt/PIRLS

# 清除 npm 快取
npm cache clean --force

# 重試
npm install
```

### Q3: PM2 開機後沒有自動啟動

```bash
# 重新設定
pm2 unstartup
pm2 startup
# 執行顯示的指令

pm2 save
```

### Q4: 登入密碼錯誤

**確認 .env 中的密碼hash**:
```bash
cat .env | grep ADMIN_PASSWORD_HASH

# 應該是: d958f781b8af08d4cb016a7a99fe3d6c54a826c4aa0fe4890b16eef8ceb9cd89
# 對應密碼: 034711752
```

**如果不對，重新生成**:
```bash
node -e "console.log(require('crypto').createHash('sha256').update('034711752').digest('hex'))"
```

---

## 📊 可選進階設定

### 使用 Nginx（標準80端口）

如果想要直接訪問 `http://VM_IP` 而不用加 `:3001`:

1. 安裝 Nginx
2. 配置反向代理
3. 詳見: `DEPLOYMENT.md` 中的 Nginx 設定章節

### HTTPS 設定

如果有域名並想啟用 HTTPS:

1. 使用 Let's Encrypt 免費證書
2. 詳見: `DEPLOYMENT.md` 中的 HTTPS 設定章節

---

## ✅ 部署檢查清單

### 部署前
- [ ] PIRLS 資料夾已完整複製到 VM
- [ ] .env 文件存在且包含正確配置
- [ ] Node.js 已安裝在 VM 上

### 部署中
- [ ] `npm install` 成功完成
- [ ] `node server.js` 測試成功
- [ ] PM2 已安裝
- [ ] PM2 服務啟動成功（status: online）
- [ ] PM2 已設定開機自啟
- [ ] 防火牆已開放 3001 端口

### 部署後
- [ ] 從其他電腦可以訪問首頁
- [ ] 管理員登入功能正常
- [ ] AI 生成功能正常
- [ ] Excel 上傳功能正常
- [ ] Firebase 統計正常

---

## 📝 一鍵部署腳本

### Windows PowerShell 腳本

創建 `deploy.ps1`:

```powershell
# PIRLS VM 快速部署腳本 - Windows Server
Write-Host "開始部署 PIRLS..." -ForegroundColor Green

# 檢查 Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "錯誤: 請先安裝 Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green

# 進入目錄
cd C:\PIRLS

# 清理並安裝依賴
Write-Host "安裝依賴包..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install

# 安裝 PM2
Write-Host "安裝 PM2..." -ForegroundColor Yellow
npm install -g pm2

# 啟動服務
Write-Host "啟動 PIRLS 服務..." -ForegroundColor Yellow
pm2 start server.js --name pirls
pm2 save

# 設定防火牆
Write-Host "設定防火牆..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "PIRLS" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

Write-Host "部署完成！" -ForegroundColor Green
Write-Host "訪問: http://localhost:3001" -ForegroundColor Cyan
pm2 status
```

**使用**:
```powershell
# 以管理員身份運行 PowerShell
.\deploy.ps1
```

### Linux Bash 腳本

創建 `deploy.sh`:

```bash
#!/bin/bash

echo "開始部署 PIRLS..."

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "錯誤: 請先安裝 Node.js"
    exit 1
fi
echo "Node.js 版本: $(node --version)"

# 進入目錄
cd /opt/PIRLS

# 設定權限
sudo chown -R $USER:$USER /opt/PIRLS

# 安裝依賴
echo "安裝依賴包..."
rm -rf node_modules
npm install

# 安裝 PM2
echo "安裝 PM2..."
sudo npm install -g pm2

# 啟動服務
echo "啟動 PIRLS 服務..."
pm2 start server.js --name pirls
pm2 startup
pm2 save

# 設定防火牆
echo "設定防火牆..."
sudo ufw allow 3001/tcp
sudo ufw --force enable

echo "部署完成！"
echo "訪問: http://$(hostname -I | awk '{print $1}'):3001"
pm2 status
```

**使用**:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🎯 總結

### 最快部署流程

1. **複製** PIRLS 資料夾到 VM（5分鐘）
2. **安裝** Node.js（3分鐘）
3. **執行** `npm install`（2分鐘）
4. **安裝** PM2 並啟動服務（3分鐘）
5. **開放** 防火牆（1分鐘）

**總時間**: 約 15 分鐘

### 關鍵要點

- ✅ **.env 文件必須存在** - 包含所有配置
- ✅ **必須執行 npm install** - 重建 node_modules
- ✅ **使用 PM2** - 確保服務持續運行
- ✅ **開放防火牆** - 允許外部訪問

---

## 📞 需要幫助？

**常見文檔**:
- `DEPLOYMENT.md` - 完整部署指南（包含 Nginx、HTTPS）
- `README.md` - 專案說明
- `security_audit_report.md` - 安全性說明

**部署成功！享受 PIRLS 系統！** 🎉
