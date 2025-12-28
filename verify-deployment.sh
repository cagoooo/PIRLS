#!/bin/bash

# PIRLS VM 部署驗證腳本
# 用於檢查 data/questions.json 是否正確部署

echo "=== PIRLS 部署驗證腳本 ==="
echo ""

# 設置顏色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查工作目錄
echo "📁 當前目錄: $(pwd)"
echo ""

# 檢查 data 目錄
echo "=== 步驟 1: 檢查 data 目錄 ==="
if [ -d "data" ]; then
    echo -e "${GREEN}✓${NC} data 目錄存在"
    ls -lh data/
else
    echo -e "${RED}✗${NC} data 目錄不存在"
    echo "   創建 data 目錄..."
    mkdir -p data
    echo -e "${GREEN}✓${NC} data 目錄已創建"
fi
echo ""

# 檢查 questions.json
echo "=== 步驟 2: 檢查 questions.json ==="
if [ -f "data/questions.json" ]; then
    filesize=$(stat -f%z "data/questions.json" 2>/dev/null || stat -c%s "data/questions.json")
    echo -e "${GREEN}✓${NC} questions.json 存在"
    echo "   文件大小: $filesize bytes"
    
    # 檢查 JSON 格式
    if command -v jq &> /dev/null; then
        article_count=$(jq '. | length' data/questions.json)
        echo "   文章數量: $article_count"
    fi
else
    echo -e "${RED}✗${NC} questions.json 不存在"
    echo -e "${YELLOW}!${NC} 需要從本地上傳此文件"
fi
echo ""

# 檢查 articleTags.json
echo "=== 步驟 3: 檢查 articleTags.json ==="
if [ -f "data/articleTags.json" ]; then
    echo -e "${GREEN}✓${NC} articleTags.json 存在"
else
    echo -e "${YELLOW}!${NC} articleTags.json 不存在（可選）"
fi
echo ""

# 檢查權限
echo "=== 步驟 4: 檢查文件權限 ==="
if [ -f "data/questions.json" ]; then
    perms=$(stat -f%Lp "data/questions.json" 2>/dev/null || stat -c%a "data/questions.json")
    echo "   questions.json 權限: $perms"
    
    if [ "$perms" = "644" ] || [ "$perms" = "664" ] || [ "$perms" = "444" ]; then
        echo -e "${GREEN}✓${NC} 權限正確"
    else
        echo -e "${YELLOW}!${NC} 建議權限為 644"
        echo "   執行: chmod 644 data/questions.json"
    fi
fi
echo ""

# 測試 HTTP 訪問
echo "=== 步驟 5: 測試 HTTP 訪問 ==="
if command -v curl &> /dev/null; then
    echo "測試 http://localhost:3001/data/questions.json ..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/data/questions.json)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC} HTTP 200 - 文件可訪問"
    else
        echo -e "${RED}✗${NC} HTTP $response - 文件無法訪問"
        echo -e "${YELLOW}!${NC} 建議檢查 server.js 的靜態文件配置"
    fi
else
    echo -e "${YELLOW}!${NC} curl 未安裝，跳過 HTTP 測試"
fi
echo ""

# PM2 狀態
echo "=== 步驟 6: PM2 服務狀態 ==="
if command -v pm2 &> /dev/null; then
    pm2 list | grep pirls
else
    echo -e "${YELLOW}!${NC} PM2 未安裝或未在 PATH 中"
fi
echo ""

echo "=== 驗證完成 ==="
echo ""
echo "如果發現問題，請參考以下修復步驟："
echo "1. 上傳缺失的文件"
echo "2. 修正文件權限: chmod 644 data/*.json"
echo "3. 重啟服務: pm2 restart pirls"
echo "4. 測試訪問: curl https://read.smes.tyc.edu.tw/data/questions.json"
