const fs = require('fs');

const sourceFile = 'h:/PIRLS/assets/css/quiz.css';
const backupFile = sourceFile + '.backup';

// Create backup
if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(sourceFile, backupFile);
    console.log('✅ Backup created');
}

// Read file
let content = fs.readFileSync(sourceFile, 'utf8');

// Remove duplicate BOM 
if (content.startsWith('\uFEFF\uFEFF')) {
    content = content.substring(2);
} else if (content.startsWith('\uFEFF')) {
    content = content.substring(1);
}

// Apply all replacements
const replacements = [
    ['PIRLS Ã©ÂÂ±Ã¨Â®ÂÃ§ÂÂÃ¨Â§Â£Ã¦Â¸Â¬Ã©Â©Â - Ã¥ÂÂ±Ã§ÂÂ¨Ã¦Â¨Â£Ã¥Â¼Â', 'PIRLS 閱讀理解測驗 - 共用樣式'],
    ['CSS Ã¨Â®ÂÃ¦ÂÂ¸Ã¥Â®ÂÃ§Â¾Â©', 'CSS 變數定義'],
    ['Ã¥ÂÂºÃ§Â¤ÂÃ¦Â¨Â£Ã¥Â¼Â', '基礎樣式'],
    ['Ã¤Â¸ÂÃ¦Â¬ÂÃ¥Â¼ÂÃ¤Â½ÂÃ¥Â±Â \\(Ã¦Â¡ÂÃ©ÂÂ¢Ã§ÂÂ\\)', '三欄式佈局 (桌機版)'],
    ['Ã¥Â·Â¦Ã¥ÂÂ´Ã¦Â¬Â', '左側欄'],
    ['Ã¤Â¸Â­Ã©ÂÂÃ¦Â¬Â', '中間欄'],
    ['Ã¥ÂÂ³Ã¥ÂÂ´Ã¦Â¬Â', '右側欄'],
    ['Ã¦Â¨ÂÃ©Â¡ÂÃ¦Â¨Â£Ã¥Â¼Â', '標題樣式'],
    ['Ã¥Â·Â¦Ã¥ÂÂ´Ã¦Â¬Â - Ã¤Â½Â¿Ã§ÂÂ¨Ã¦ÂÂÃ¥ÂÂ', '左側欄 - 使用指南'],
    ['Ã¥ÂÂ³Ã¥ÂÂ´Ã¦Â¬Â - Ã¥ÂÂÃ§Â­ÂÃ¥ÂÂ', '右側欄 - 問題區'],
    ['Ã¦ÂÂÃ¤ÂºÂ¤Ã¦ÂÂÃ©ÂÂ', '提交按鈕'],
    ['Ã©ÂÂÃ©ÂÂ¨Ã¤Â½Â¿Ã§ÂÂ¨Ã¨ÂÂÃ¨Â³ÂÃ¨Â¨ÂÃ¥ÂÂ \\(Ã¦ÂÂÃ¦Â©ÂÃ§ÂÂ\\)', '頂部使用者資訊列 (手機版)'],
    ['Ã§ÂÂ»Ã¥ÂÂ¥', '登入'],
    ['Ã¦Â­Â·Ã¥ÂÂ²Ã§Â´ÂÃ©ÂÂ', '歷史紀錄'],
    ['Ã¥ÂÂÃ§ÂÂ«', '動畫'],
    ['Ã¦ÂÂ¬Ã¦Â¬Â¡Ã¦ÂÂÃ§Â¸Â¾Ã©Â¡Â¯Ã§Â¤ÂºÃ¥ÂÂ', '本次成績顯示區'],
    ['Ã¦Â¡ÂÃ¦Â©ÂÃ§ÂÂÃ¤Â½Â¿Ã§ÂÂ¨Ã¨ÂÂÃ¨Â³ÂÃ¨Â¨Â', '桌機版使用者資訊'],
    ['Ã¨Â¼ÂÃ¥ÂÂ¥Ã¤Â¸Â­Ã¦ÂÂÃ§Â¤Âº', '載入中指示'],
    ['Ã©ÂÂ¯Ã¨ÂªÂ¤Ã¦ÂÂÃ§Â¤Âº', '錯誤指示'],
    ['RWD Ã¦ÂÂÃ¦Â©ÂÃ§ÂÂÃ¨ÂªÂ¿Ã¦ÂÂ´', 'RWD 手機版調整'],
    ['Ã§ÂµÂÃ¦ÂÂÃ¥ÂÂÃ©Â¥Â', '結果回饋']
];

let count = 0;
for (const [from, to] of replacements) {
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = (content.match(regex) || []).length;
    if (matches > 0) {
        content = content.replace(regex, to);
        console.log(`✓ ${to} (${matches}x)`);
        count += matches;
    }
}

// Save with UTF-8 BOM
const BOM = '\uFEFF';
fs.writeFileSync(sourceFile, BOM + content, 'utf8');

console.log(`\n✅ Fixed ${count} comments`);
