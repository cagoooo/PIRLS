# 準備 PIRLS 資料夾以部署到 vCloud VM

**目標**: 將 `h:\PIRLS` 部署到 VM 的 `/var/www/html/smes/PIRLS`

## 🎯 快速開始（3 種方法）

### 方法 1: 自動化腳本（最推薦） ⭐

**適合**: 想要一鍵部署，減少手動操作

**步驟**:
1. 使用 WinSCP 或 SCP 將整個 PIRLS 資料夾上傳到 VM 的 `/tmp/`
2. 在 VM 上運行:
   ```bash
   cd /tmp/PIRLS
   chmod +x deploy-to-vm.sh
   ./deploy-to-vm.sh
   ```
3. 腳本會自動處理一切（安裝依賴、配置 PM2、設定防火牆等）

✅ **優點**: 全自動，不會遺漏步驟
❌ **缺點**: 需要上傳整個資料夾（包含 node_modules）

---

### 方法 2: 使用 rsync 智能同步（推薦給熟悉 Linux 的用戶）

**適合**: 想要精確控制傳輸的文件，節省傳輸時間

**在本地 Windows（使用 WSL 或 Git Bash）**:
```bash
# 使用 rsync 排除不需要的文件
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'archive' \
    --exclude '*.log' \
    --exclude 'progress_*.md' \
    /h/PIRLS/ your_username@vm_ip:/tmp/PIRLS-upload/
```

**然後在 VM 上**:
```bash
# 移動到目標位置
sudo mkdir -p /var/www/html/smes
sudo mv /tmp/PIRLS-upload /var/www/html/smes/PIRLS
sudo chown -R $USER:$USER /var/www/html/smes/PIRLS

# 安裝依賴並啟動
cd /var/www/html/smes/PIRLS
npm install
pm2 start server.js --name pirls
pm2 save
```

✅ **優點**: 只傳輸必要文件，速度快
❌ **缺點**: 需要熟悉命令列

---

### 方法 3: WinSCP 手動選擇（適合初學者）

**適合**: 不熟悉命令列，想要圖形介面操作

1. **下載並安裝 WinSCP**: https://winscp.net/

2. **連接到 VM**:
   - 協議: SFTP
   - 主機名: VM 的 IP
   - 用戶名: 您的 SSH 用戶名
   - 密碼: 您的 SSH 密碼

3. **手動傳輸文件**:
   - 左側視窗: `h:\PIRLS`
   - 右側視窗: `/tmp/`
   - 選擇以下文件/資料夾，拖拉到右側:
     ```
     ✅ .env (重要！)
     ✅ .env.example
     ✅ .gitignore
     ✅ *.html (所有 HTML 文件)
     ✅ package.json
     ✅ server.js
     ✅ assets/ (整個資料夾)
     ✅ data/ (整個資料夾)
     ✅ tools/ (整個資料夾)
     ✅ deploy-to-vm.sh
     ✅ VM-DEPLOY-CHECKLIST.md
     
     ❌ node_modules/ (不要傳)
     ❌ .git/ (不要傳)
     ❌ archive/ (不要傳)
     ❌ progress_*.md (不要傳)
     ```

4. **在 VM 上執行部署**:
   ```bash
   ssh your_username@vm_ip
   cd /tmp/PIRLS
   chmod +x deploy-to-vm.sh
   ./deploy-to-vm.sh
   ```

✅ **優點**: 圖形介面，容易理解
❌ **缺點**: 需要手動選擇文件

---

## 📋 部署前檢查清單

在開始傳輸之前，請確認:

### 1. 環境變數已設定

```powershell
# 在本地 PowerShell 執行
cd h:\PIRLS
type .env
```

**應該看到**:
```env
GEMINI_API_KEY=AIza...
ADMIN_PASSWORD_HASH=d958f...
JWT_SECRET=c9cd9d...
JWT_EXPIRY=2h
```

❌ **如果 .env 不存在**:
```powershell
cp .env.example .env
# 然後編輯 .env 填入實際值
```

### 2. VM 連接資訊準備好

您需要知道:
- [ ] VM 的 IP 地址: `_______________`
- [ ] SSH 用戶名: `_______________`
- [ ] SSH 密碼 (或 SSH Key 路徑)
- [ ] 是否有 sudo 權限

### 3. 本地專案完整性

```powershell
# 快速檢查必要文件
cd h:\PIRLS
dir *.html
dir package.json
dir server.js
dir assets
dir data
```

---

## 🚀 推薦的完整部署流程

### Step 1: 準備（在本地 Windows）

```powershell
# 1. 進入專案目錄
cd h:\PIRLS

# 2. 確認 .env 存在
if (Test-Path .env) { 
    Write-Host "✓ .env 文件存在" -ForegroundColor Green 
} else { 
    Write-Host "✗ .env 文件不存在！請創建" -ForegroundColor Red 
}

# 3. 查看專案大小
Get-ChildItem -Recurse | Measure-Object -Property Length -Sum | 
    Select-Object @{Name="Size(MB)";Expression={[math]::Round($_.Sum/1MB,2)}}
```

### Step 2: 傳輸到 VM

**使用 WinSCP** (推薦給初學者):
1. 開啟 WinSCP
2. 連接到 VM
3. 將 PIRLS 資料夾拖拉到 `/tmp/`

**或使用 SCP** (如果有 WSL):
```bash
scp -r /mnt/h/PIRLS your_username@vm_ip:/tmp/
```

### Step 3: 在 VM 上部署

```bash
# SSH 連接到 VM
ssh your_username@vm_ip

# 進入上傳的目錄
cd /tmp/PIRLS

# 執行自動部署腳本
chmod +x deploy-to-vm.sh
./deploy-to-vm.sh
```

### Step 4: 驗證部署

```bash
# 檢查服務狀態
pm2 status

# 查看日誌
pm2 logs pirls --lines 50

# 測試訪問
curl http://localhost:3001
```

**在瀏覽器測試**:
```
http://VM的IP:3001/index.html
```

---

## 🔍 需要傳輸的文件大小估算

| 類型 | 大小 (約) | 是否必要 |
|------|----------|---------|
| HTML 文件 | < 1 MB | ✅ 必要 |
| assets/ | 5-10 MB | ✅ 必要 |
| data/ | < 1 MB | ✅ 必要 |
| server.js + package.json | < 1 MB | ✅ 必要 |
| .env | < 1 KB | ✅ 必要 |
| node_modules/ | 50-100 MB | ❌ 可跳過 |
| .git/ | 10-50 MB | ❌ 可跳過 |

**總計** (不含 node_modules): **約 10-15 MB**
**總計** (包含 node_modules): **約 60-115 MB**

💡 **建議**: 不要傳輸 `node_modules`，在 VM 上執行 `npm install` 重新安裝

---

## 📝 常見問題

### Q1: 我需要在 VM 上創建 /var/www/html/smes/PIRLS 目錄嗎?

**A**: 不需要！`deploy-to-vm.sh` 腳本會自動創建。如果手動部署，執行:
```bash
sudo mkdir -p /var/www/html/smes/PIRLS
```

### Q2: .env 文件會被上傳嗎？會不會有安全問題？

**A**: 
- .env 文件**需要**上傳到 VM（包含 API Key 等敏感資料）
- .env 已在 `.gitignore` 中，**不會**被提交到 Git
- 確保只通過加密的 SSH/SFTP 傳輸

### Q3: 如果 VM 已經有舊版本的 PIRLS 怎麼辦？

**A**: 建議先備份:
```bash
# 在 VM 上
cd /var/www/html/smes
mv PIRLS PIRLS.backup.$(date +%Y%m%d_%H%M%S)
```

### Q4: 如何確認傳輸完整？

**A**: 在 VM 上執行:
```bash
cd /var/www/html/smes/PIRLS
ls -la

# 檢查關鍵文件
test -f .env && echo "✓ .env 存在" || echo "✗ .env 不存在"
test -f server.js && echo "✓ server.js 存在" || echo "✗ server.js 不存在"
test -d assets && echo "✓ assets/ 存在" || echo "✗ assets/ 不存在"
```

---

## ✅ 下一步

完成文件傳輸後，請參考:

📄 **[VM-DEPLOY-CHECKLIST.md](./VM-DEPLOY-CHECKLIST.md)** - 完整部署檢查清單

或直接執行自動部署腳本:
```bash
cd /tmp/PIRLS  # 或您上傳的位置
./deploy-to-vm.sh
```

---

## 🎯 總結

**最簡單的方法** (推薦):
1. 用 WinSCP 把整個 PIRLS 資料夾上傳到 VM 的 `/tmp/`
2. SSH 連到 VM
3. 執行 `./deploy-to-vm.sh`
4. 完成！

**時間**: 約 10-15 分鐘（視網路速度）

祝部署順利！🚀
