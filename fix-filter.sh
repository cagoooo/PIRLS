#!/bin/bash

# 這是一個簡單的修復腳本
# 目的：將 index.html 中硬編碼的 47 改為動態值

echo "開始修復學習進度篩選器..."

# 步驟 1: 將 HTML 中的硬編碼數字改為 --
sed -i 's/id="countAll">47<\/span>/id="countAll">--<\/span>/g' index.html
sed -i 's/id="countUncompleted">47<\/span>/id="countUncompleted">--<\/span>/g' index.html

echo "HTML 初始值已更新"

# 步驟 2: 在 loadCompletedArticles 函數中添加對訪客的處理
# 這一步我們需要手動完成，因為替換會比較複雜

echo "請手動完成以下步驟："
echo "1. 在 loadCompletedArticles() 函數的 return 之前添加 updateFilterCountsForGuest()  的調用"
echo "2. 在 updateArticleStatus() 函數之前添加 updateFilterCountsForGuest() 函數的定義"
