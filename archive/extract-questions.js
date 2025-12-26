/**
 * PIRLS 資料提取腳本
 * 從 44 個 PIRLS-*.html 檔案中提取文章內容和問題，生成 questions.json
 */

const fs = require('fs');
const path = require('path');

const PIRLS_DIR = __dirname;
const OUTPUT_FILE = path.join(PIRLS_DIR, 'data', 'questions.json');

// 確保 data 目錄存在
const dataDir = path.join(PIRLS_DIR, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const articles = [];

// 處理每個 PIRLS 檔案
for (let id = 1; id <= 44; id++) {
    const filePath = path.join(PIRLS_DIR, `PIRLS-${id}.html`);

    if (!fs.existsSync(filePath)) {
        console.warn(`[SKIP] PIRLS-${id}.html 不存在`);
        continue;
    }

    try {
        const html = fs.readFileSync(filePath, 'utf8');

        // 提取 ARTICLE_CONFIG
        const configMatch = html.match(/const ARTICLE_CONFIG = \{[\s\S]*?id:\s*(\d+)[^}]*title:\s*"([^"]+)"[^}]*answers:\s*\[([^\]]+)\][^}]*hints:\s*\[([\s\S]*?)\]\s*\}/);

        if (!configMatch) {
            console.warn(`[WARN] PIRLS-${id}.html 無法提取 ARTICLE_CONFIG`);
            continue;
        }

        const title = configMatch[2];
        const answersStr = configMatch[3];
        const hintsStr = configMatch[4];

        // 解析答案
        const answers = answersStr.split(',').map(a => a.trim().replace(/['"]/g, ''));

        // 解析提示
        const hints = [];
        const hintMatches = hintsStr.matchAll(/"([^"]+)"/g);
        for (const match of hintMatches) {
            hints.push(match[1]);
        }

        // 提取文章內容
        const articleBodyMatch = html.match(/<div id="article-body">([\s\S]*?)<\/div>\s*\n\s*(?:<!--|\s*<div)/);
        let content = [];
        if (articleBodyMatch) {
            const paragraphMatches = articleBodyMatch[1].matchAll(/<p>([\s\S]*?)<\/p>/g);
            for (const match of paragraphMatches) {
                content.push(match[1].trim());
            }
        }

        // 提取問題
        const questions = [];
        for (let qNum = 1; qNum <= 4; qNum++) {
            const qBlockRegex = new RegExp(`<div class="question" id="q-block-${qNum}">[\\s\\S]*?<p>\\d+\\.\\s*([^（]+)（([^）]+)）<\\/p>([\\s\\S]*?)<div class="explanation"`);
            const qMatch = html.match(qBlockRegex);

            if (qMatch) {
                const questionText = qMatch[1].trim();
                const questionType = qMatch[2].trim();
                const optionsHtml = qMatch[3];

                // 提取選項
                const options = [];
                const optionMatches = optionsHtml.matchAll(/<label class="option"><input type="radio" name="q\d+" value="[a-d]">\s*([^<]+)<\/label>/g);
                for (const match of optionMatches) {
                    options.push(match[1].trim());
                }

                questions.push({
                    question: questionText,
                    type: questionType,
                    options: options,
                    answer: answers[qNum - 1],
                    hint: hints[qNum - 1] || ""
                });
            }
        }

        articles.push({
            id: id,
            title: title,
            content: content,
            questions: questions
        });

        console.log(`[OK] PIRLS-${id}.html: ${title} (${content.length} 段落, ${questions.length} 問題)`);

    } catch (e) {
        console.error(`[ERROR] PIRLS-${id}.html: ${e.message}`);
    }
}

// 寫入 JSON 檔案
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(articles, null, 2), 'utf8');
console.log(`\n✅ 完成！已產生 ${OUTPUT_FILE}`);
console.log(`   共 ${articles.length} 篇文章`);
