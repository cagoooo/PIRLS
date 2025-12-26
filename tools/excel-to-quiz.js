/**
 * PIRLS 題組自動產生器
 * 將 PaGamO 格式的 Excel 檔案轉換為 PIRLS 題組 JSON 格式
 * 
 * 使用方式：
 * node tools/excel-to-quiz.js "path/to/excel.xlsx" --id 45
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 設定檔案路徑
const QUESTIONS_JSON_PATH = path.join(__dirname, '..', 'data', 'questions.json');
const INDEX_HTML_PATH = path.join(__dirname, '..', 'index.html');

// 解析命令列參數
function parseArgs() {
    const args = process.argv.slice(2);
    let excelPath = null;
    let articleId = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--id' && args[i + 1]) {
            articleId = parseInt(args[i + 1]);
            i++;
        } else if (!args[i].startsWith('--')) {
            excelPath = args[i];
        }
    }

    return { excelPath, articleId };
}

// 從 Excel 讀取並解析資料
function parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 找到資料開始的列
    // 尋找包含「閱讀素養題組」的行，這是真正的題組資料
    let dataStartRow = 0;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const firstCell = String(row[0] || '');
        const secondCell = String(row[1] || '');
        const contentCell = String(row[6] || '');

        // 找到科目為「閱讀素養題組」的行，這是正式資料
        // 同時確認內容欄位有較長的文字（避免範例行）
        if (secondCell.includes('閱讀素養題組') && contentCell.length > 100) {
            dataStartRow = i;
            console.log(`[INFO] 找到閱讀素養題組資料在第 ${i + 1} 行`);
            break;
        }
    }

    if (dataStartRow === 0) {
        // 備用方案：找到最後一個「編號(必填)」標題列之後的第一個數字行
        let lastHeaderRow = 0;
        for (let i = 0; i < data.length; i++) {
            const firstCell = String(data[i][0] || '');
            if (firstCell.includes('編號') && firstCell.includes('必填')) {
                lastHeaderRow = i;
            }
        }
        for (let i = lastHeaderRow + 1; i < data.length; i++) {
            const firstCell = String(data[i][0] || '');
            if (!isNaN(parseInt(firstCell)) && !firstCell.includes('_')) {
                dataStartRow = i;
                break;
            }
        }
    }

    console.log(`[INFO] 資料從第 ${dataStartRow + 1} 列開始`);

    // 解析文章資料
    const articleRow = data[dataStartRow];
    const title = articleRow[5] || ''; // 標題欄位
    const contentRaw = articleRow[6] || ''; // 內容欄位

    // 將內容分割成段落
    const content = contentRaw
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

    console.log(`[INFO] 文章標題: ${title}`);
    console.log(`[INFO] 內容段落數: ${content.length}`);

    // 解析題目資料
    const questions = [];
    for (let i = dataStartRow + 1; i < data.length; i++) {
        const row = data[i];
        const rowId = String(row[0] || '');

        // 檢查是否為題目列（格式如 1_1, 1_2, ...）
        if (rowId.includes('_')) {
            const questionText = row[8] || ''; // 題目欄位
            const optionA = row[10] || '';
            const optionB = row[12] || '';
            const optionC = row[14] || '';
            const optionD = row[16] || '';
            const optionE = row[18] || '';
            const correctAnswer = String(row[20] || '').toLowerCase();
            const explanation = row[21] || '';

            // 只有當題目文字存在時才加入
            if (questionText.trim()) {
                const options = [optionA, optionB, optionC, optionD];
                if (optionE) options.push(optionE);

                // 根據詳解判斷題型
                let questionType = '直接提取訊息';
                if (explanation.includes('直接推論')) {
                    questionType = '直接推論';
                } else if (explanation.includes('詮釋與整合') || explanation.includes('詮釋')) {
                    questionType = '詮釋與整合';
                } else if (explanation.includes('評估與批判') || explanation.includes('評估')) {
                    questionType = '評估與批判';
                } else if (explanation.includes('定位與提取') || explanation.includes('提取')) {
                    questionType = '直接提取訊息';
                }

                // 將詳解轉換為提示格式
                let hint = explanation;
                if (hint && !hint.startsWith('提示')) {
                    hint = `提示：${hint}`;
                }

                questions.push({
                    question: questionText.trim(),
                    type: questionType,
                    options: options.filter(o => o.trim()),
                    answer: correctAnswer.charAt(0), // 取第一個字母
                    hint: hint
                });

                console.log(`[INFO] 解析題目 ${questions.length}: ${questionText.substring(0, 30)}...`);
            }
        }
    }

    console.log(`[INFO] 共解析 ${questions.length} 題`);

    return { title, content, questions };
}

// 更新 questions.json
function updateQuestionsJson(articleId, articleData) {
    let questions = [];

    if (fs.existsSync(QUESTIONS_JSON_PATH)) {
        const existingData = fs.readFileSync(QUESTIONS_JSON_PATH, 'utf8');
        questions = JSON.parse(existingData);
    }

    // 檢查是否已存在相同 ID
    const existingIndex = questions.findIndex(q => q.id === articleId);

    const newArticle = {
        id: articleId,
        title: articleData.title,
        content: articleData.content,
        questions: articleData.questions
    };

    if (existingIndex !== -1) {
        console.log(`[WARN] 覆蓋已存在的題組 ID ${articleId}`);
        questions[existingIndex] = newArticle;
    } else {
        questions.push(newArticle);
        // 按 ID 排序
        questions.sort((a, b) => a.id - b.id);
    }

    fs.writeFileSync(QUESTIONS_JSON_PATH, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`[OK] 已更新 ${QUESTIONS_JSON_PATH}`);

    return questions.length;
}

// 更新 index.html 中的文章列表
function updateIndexHtml(articleId, title) {
    if (!fs.existsSync(INDEX_HTML_PATH)) {
        console.log(`[WARN] 找不到 ${INDEX_HTML_PATH}，跳過更新`);
        return;
    }

    let html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // 找到 articles 陣列
    const articlesMatch = html.match(/const articles = \[([\s\S]*?)\];/);
    if (!articlesMatch) {
        console.log('[WARN] 找不到 articles 陣列，跳過更新');
        return;
    }

    // 檢查是否已存在
    if (html.includes(`id: ${articleId},`)) {
        console.log(`[INFO] 文章 ID ${articleId} 已存在於 index.html`);
        return;
    }

    // 找到最後一個文章項目並在其後插入新項目
    const newEntry = `            { id: ${articleId}, title: "${title}" }`;

    // 在 ]; 之前插入新項目
    const insertPattern = /(\{ id: \d+, title: "[^"]+" \})\s*\n\s*\];/;
    const match = html.match(insertPattern);

    if (match) {
        html = html.replace(insertPattern, `$1,\n${newEntry}\n        ];`);
        fs.writeFileSync(INDEX_HTML_PATH, html, 'utf8');
        console.log(`[OK] 已將文章 ID ${articleId} 加入 index.html`);
    } else {
        console.log('[WARN] 無法自動更新 index.html，請手動新增');
    }
}

// 主程式
function main() {
    const { excelPath, articleId } = parseArgs();

    if (!excelPath) {
        console.error('用法: node excel-to-quiz.js <excel檔案路徑> --id <題組編號>');
        console.error('範例: node excel-to-quiz.js "PIRLS_PaGamO_題組.xlsx" --id 45');
        process.exit(1);
    }

    if (!articleId) {
        console.error('錯誤: 請使用 --id 參數指定題組編號');
        process.exit(1);
    }

    if (!fs.existsSync(excelPath)) {
        console.error(`錯誤: 找不到檔案 ${excelPath}`);
        process.exit(1);
    }

    console.log('='.repeat(50));
    console.log('PIRLS 題組自動產生器');
    console.log('='.repeat(50));
    console.log(`輸入檔案: ${excelPath}`);
    console.log(`輸出 ID: ${articleId}`);
    console.log('');

    try {
        // 解析 Excel
        const articleData = parseExcel(excelPath);

        // 更新 questions.json
        const totalArticles = updateQuestionsJson(articleId, articleData);

        // 更新 index.html
        updateIndexHtml(articleId, articleData.title);

        console.log('');
        console.log('='.repeat(50));
        console.log('✅ 轉換完成！');
        console.log(`   題組 ID: ${articleId}`);
        console.log(`   標題: ${articleData.title}`);
        console.log(`   題目數: ${articleData.questions.length}`);
        console.log(`   總題組數: ${totalArticles}`);
        console.log('');
        console.log(`測試網址: http://127.0.0.1:8080/quiz.html?id=${articleId}`);
        console.log('='.repeat(50));
    } catch (error) {
        console.error('錯誤:', error.message);
        process.exit(1);
    }
}

main();
