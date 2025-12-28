#!/bin/bash

###############################################################################
# PIRLS vCloud VM 部署腳本
# 目標路徑: /var/www/html/smes/PIRLS
# VM 作業系統: Ubuntu/Linux
###############################################################################

set -e  # 遇到錯誤立即停止

echo "=================================="
echo "🚀 PIRLS vCloud VM 部署腳本"
echo "=================================="

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 設定變數
TARGET_DIR="/var/www/html/smes/PIRLS"
SERVICE_NAME="pirls"
PORT=3001

echo -e "${YELLOW}目標部署路徑: ${TARGET_DIR}${NC}"
echo ""

# 步驟 1: 檢查是否為 root 或有 sudo 權限
echo "========================================="
echo "步驟 1/8: 檢查權限"
echo "========================================="
if [ "$EUID" -ne 0 ]; then 
    if ! sudo -v; then
        echo -e "${RED}錯誤: 需要 sudo 權限來執行此腳本${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ 有 sudo 權限${NC}"
else
    echo -e "${GREEN}✓ 以 root 身份運行${NC}"
fi
echo ""

# 步驟 2: 檢查/安裝 Node.js
echo "========================================="
echo "步驟 2/8: 檢查 Node.js"
echo "========================================="
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js 未安裝，開始安裝...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js 安裝完成${NC}"
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js 已安裝: ${NODE_VERSION}${NC}"
fi
echo ""

# 步驟 3: 創建目標目錄並設定權限
echo "========================================="
echo "步驟 3/8: 準備部署目錄"
echo "========================================="
sudo mkdir -p "$TARGET_DIR"
sudo chown -R $USER:$USER "$TARGET_DIR"
echo -e "${GREEN}✓ 目錄已準備: ${TARGET_DIR}${NC}"
echo ""

# 步驟 4: 檢查 .env 文件
echo "========================================="
echo "步驟 4/8: 檢查環境變數配置"
echo "========================================="
if [ ! -f ".env" ]; then
    echo -e "${RED}警告: .env 文件不存在！${NC}"
    echo "請確保在部署之前已經創建 .env 文件"
    echo "參考 .env.example 來創建"
    read -p "是否繼續部署？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "部署已取消"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env 文件存在${NC}"
fi
echo ""

# 步驟 5: 複製文件（排除不需要的）
echo "========================================="
echo "步驟 5/8: 複製專案文件"
echo "========================================="
echo "從當前目錄複製到 ${TARGET_DIR}..."

# 使用 rsync 排除不需要的文件
sudo rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --exclude 'Thumbs.db' \
    --exclude '.vscode' \
    --exclude '.idea' \
    --exclude '*.swp' \
    --exclude '*.swo' \
    --exclude 'dist' \
    --exclude 'build' \
    --exclude 'archive' \
    --exclude 'progress_*.md' \
    --exclude 'css_additions.txt' \
    ./ "$TARGET_DIR/"

echo -e "${GREEN}✓ 文件複製完成${NC}"
echo ""

# 步驟 6: 安裝依賴
echo "========================================="
echo "步驟 6/8: 安裝 Node.js 依賴"
echo "========================================="
cd "$TARGET_DIR"
sudo chown -R $USER:$USER "$TARGET_DIR"
npm install --production
echo -e "${GREEN}✓ 依賴安裝完成${NC}"
echo ""

# 步驟 7: 安裝並配置 PM2
echo "========================================="
echo "步驟 7/8: 配置 PM2 進程管理"
echo "========================================="

if ! command -v pm2 &> /dev/null; then
    echo "安裝 PM2..."
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 安裝完成${NC}"
else
    echo -e "${GREEN}✓ PM2 已安裝${NC}"
fi

# 停止舊的進程（如果存在）
pm2 delete $SERVICE_NAME 2>/dev/null || true

# 啟動服務
echo "啟動 PIRLS 服務..."
pm2 start server.js --name $SERVICE_NAME

# 設定開機自啟
pm2 startup | tail -n 1 | sudo sh
pm2 save

echo -e "${GREEN}✓ PM2 配置完成${NC}"
echo ""

# 步驟 8: 配置防火牆
echo "========================================="
echo "步驟 8/8: 配置防火牆"
echo "========================================="

if command -v ufw &> /dev/null; then
    echo "開放端口 ${PORT}..."
    sudo ufw allow $PORT/tcp
    echo -e "${GREEN}✓ 防火牆配置完成${NC}"
else
    echo -e "${YELLOW}⚠ UFW 未安裝，跳過防火牆配置${NC}"
    echo "請手動確保端口 ${PORT} 已開放"
fi
echo ""

# 完成
echo "========================================="
echo "🎉 部署完成！"
echo "========================================="
echo ""
echo "服務狀態:"
pm2 status
echo ""
echo "訪問網址:"
echo "  http://$(hostname -I | awk '{print $1}'):${PORT}"
echo "  http://$(hostname -I | awk '{print $1}'):${PORT}/index.html"
echo "  http://$(hostname -I | awk '{print $1}'):${PORT}/admin.html"
echo ""
echo "常用指令:"
echo "  查看日誌: pm2 logs ${SERVICE_NAME}"
echo "  重啟服務: pm2 restart ${SERVICE_NAME}"
echo "  停止服務: pm2 stop ${SERVICE_NAME}"
echo "  查看狀態: pm2 status"
echo ""
echo -e "${GREEN}✓ PIRLS 已成功部署到 ${TARGET_DIR}${NC}"
