/**
 * PIRLS 後端 API 伺服器
 * 提供檔案上傳和自動更新功能
 */

const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // 載入環境變數

const app = express();
const PORT = 3001;

// 設定
const QUESTIONS_JSON_PATH = path.join(__dirname, 'data', 'questions.json');
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');

// 中介軟體
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // 提供靜態檔案服務

// 檔案上傳設定
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================================================
// API: 取得目前題組資訊
// ==========================================================================
app.get('/api/questions', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(QUESTIONS_JSON_PATH, 'utf8'));
        res.json({
            success: true,
            count: data.length,
            nextId: Math.max(...data.map(q => q.id), 0) + 1
        });
    } catch (e) {
        res.json({ success: true, count: 0, nextId: 1 });
    }
});

// ==========================================================================
// API: 上傳並產生題組
// ==========================================================================
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '請上傳檔案' });
        }

        const articleId = parseInt(req.body.articleId);
        if (!articleId || articleId < 1) {
            return res.status(400).json({ success: false, error: '請提供有效的題組 ID' });
        }

        // 解析 Excel
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const parsed = parseExcel(workbook);

        if (!parsed.title || parsed.content.length === 0 || parsed.questions.length === 0) {
            return res.status(400).json({ success: false, error: '無法解析有效的題組資料' });
        }

        // 更新 questions.json
        let questions = [];
        if (fs.existsSync(QUESTIONS_JSON_PATH)) {
            questions = JSON.parse(fs.readFileSync(QUESTIONS_JSON_PATH, 'utf8'));
        }

        const newArticle = {
            id: articleId,
            title: parsed.title,
            content: parsed.content,
            questions: parsed.questions
        };

        const existingIndex = questions.findIndex(q => q.id === articleId);
        if (existingIndex !== -1) {
            questions[existingIndex] = newArticle;
        } else {
            questions.push(newArticle);
            questions.sort((a, b) => a.id - b.id);
        }

        fs.writeFileSync(QUESTIONS_JSON_PATH, JSON.stringify(questions, null, 2), 'utf8');

        // 更新 index.html
        updateIndexHtml(articleId, parsed.title);

        res.json({
            success: true,
            articleId: articleId,
            title: parsed.title,
            questionCount: parsed.questions.length,
            totalArticles: questions.length,
            testUrl: `/quiz.html?id=${articleId}`
        });

    } catch (e) {
        console.error('上傳處理失敗:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==========================================================================
// 認證中間件 & API
// ==========================================================================

// 登入失敗記錄（防暴力破解）
const loginAttempts = new Map();

// JWT 驗證中間件
function verifyAdminToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: '未授權：缺少Token'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({
            success: false,
            error: 'Token無效或已過期'
        });
    }
}

// 檢查登入嘗試次數
function checkLoginAttempts(ip) {
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: now, lockUntil: 0 };

    // 檢查是否被鎖定
    if (attempts.lockUntil > now) {
        const remainingMinutes = Math.ceil((attempts.lockUntil - now) / 60000);
        return {
            locked: true,
            message: `登入嘗試過多，請 ${remainingMinutes} 分鐘後再試`
        };
    }

    // 重置計數（5分鐘後）
    if (now - attempts.lastAttempt > 5 * 60 * 1000) {
        attempts.count = 0;
    }

    return { locked: false, attempts };
}

// 記錄登入失敗
function recordFailedAttempt(ip) {
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: now, lockUntil: 0 };

    attempts.count++;
    attempts.lastAttempt = now;

    // 5次失敗後鎖定30分鐘
    if (attempts.count >= 5) {
        attempts.lockUntil = now + 30 * 60 * 1000;
        console.log(`[Security] IP ${ip} 已被鎖定 30 分鐘`);
    }

    loginAttempts.set(ip, attempts);
}

// API: 管理員登入
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // 檢查登入次數
    const attemptCheck = checkLoginAttempts(clientIp);
    if (attemptCheck.locked) {
        return res.status(429).json({
            success: false,
            error: attemptCheck.message
        });
    }

    // Hash 使用者輸入的密碼
    const hashedInput = crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');

    // 比對密碼
    if (hashedInput === process.env.ADMIN_PASSWORD_HASH) {
        // 生成 JWT token
        const token = jwt.sign(
            {
                role: 'admin',
                ip: clientIp
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '2h' }
        );

        // 清除失敗記錄
        loginAttempts.delete(clientIp);

        console.log(`[Auth] 管理員登入成功 - IP: ${clientIp}`);

        res.json({
            success: true,
            token: token,
            expiresIn: process.env.JWT_EXPIRY || '2h'
        });
    } else {
        // 記錄失敗
        recordFailedAttempt(clientIp);
        const attempts = loginAttempts.get(clientIp);

        console.log(`[Auth] 登入失敗 - IP: ${clientIp}, 嘗試次數: ${attempts.count}/5`);

        res.status(401).json({
            success: false,
            error: '密碼錯誤',
            remainingAttempts: Math.max(0, 5 - attempts.count)
        });
    }
});

// API: 驗證 Token
app.get('/api/admin/verify', verifyAdminToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// ==========================================================================
// API: AI 自動生成題組（受保護）
// ==========================================================================
app.post('/api/generate-quiz', verifyAdminToken, async (req, res) => {
    try {
        const { topic, difficulty, wordCount, questionCount } = req.body;

        if (!topic || !topic.trim()) {
            return res.status(400).json({ success: false, error: '請提供文章主題' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, error: 'API Key 未設定' });
        }

        // 生成 Prompt
        const prompt = generatePrompt(topic, difficulty || '中等', wordCount || '400-500', questionCount || 4);

        // 呼叫 Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API 錯誤: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;

        // 提取 JSON（移除可能的 markdown 包裝）
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('無法從 AI 回應中提取 JSON 格式');
        }

        const quizData = JSON.parse(jsonMatch[0]);

        // 資料驗證
        if (!validateQuizData(quizData)) {
            throw new Error('生成的資料格式不正確');
        }

        res.json({
            success: true,
            data: quizData
        });

    } catch (e) {
        console.error('AI 生成錯誤:', e);
        res.status(500).json({
            success: false,
            error: e.message || '生成失敗，請重試'
        });
    }
});

// ==========================================================================
// 生成 Prompt
// ==========================================================================
function generatePrompt(topic, difficulty, wordCount, questionCount) {
    const difficultyMap = {
        '簡單': '使用簡單詞彙，句子結構簡單，適合國小中年級',
        '中等': '使用一般詞彙，句子結構中等複雜，適合國小高年級',
        '困難': '使用進階詞彙，句子結構較複雜，適合國小高年級優秀學生'
    };

    return `你是一位專業的 PIRLS 閱讀素養題組設計師。請根據以下要求創作一個閱讀題組：

主題：${topic}
難度：${difficulty}（${difficultyMap[difficulty]}）
文章字數：${wordCount} 字
題目數量：${questionCount} 題

請嚴格按照以下 JSON 格式輸出（不要包含任何其他文字或 markdown 符號）：

{
  "title": "文章標題（吸引人且切題）",
  "content": [
    "第一段內容...",
    "第二段內容...",
    "第三段內容..."
  ],
  "questions": [
    {
      "type": "直接提取訊息",
      "question": "題目內容？",
      "options": ["A. 選項1", "B. 選項2", "C. 選項3", "D. 選項4"],
      "answer": "b",
      "hint": "提示：請仔細閱讀文章的第X段..."
    }
  ]
}

重要要求：
1. 文章內容要有趣、準確、適合台灣國小高年級學生
2. 文章要有清楚的段落結構，每段有明確主題
3. 題型必須涵蓋：「直接提取訊息」、「推論訊息」、「詮釋整合訊息」、「比較評估訊息」
4. 每題都要有明確的正確答案（a, b, c, d 小寫）
5. 提示要能引導學生回文章找答案，但不能直接透露答案
6. 選項要合理且具干擾性，錯誤選項要看似合理
7. 使用台灣慣用的詞彙和語法

請立即生成 JSON 格式的題組：`;
}

// ==========================================================================
// 驗證生成的題組資料
// ==========================================================================
function validateQuizData(data) {
    if (!data.title || !data.content || !data.questions) return false;
    if (!Array.isArray(data.content) || data.content.length < 3) return false;
    if (!Array.isArray(data.questions) || data.questions.length === 0) return false;

    for (const q of data.questions) {
        if (!q.type || !q.question || !q.options || !q.answer || !q.hint) return false;
        if (!Array.isArray(q.options) || q.options.length !== 4) return false;
        if (!['a', 'b', 'c', 'd'].includes(q.answer.toLowerCase())) return false;
    }

    return true;
}

// ==========================================================================
// API: 儲存 AI 生成的題組（受保護）
// ==========================================================================
app.post('/api/save-quiz', verifyAdminToken, (req, res) => {
    try {
        const { quizData, articleId } = req.body;

        if (!quizData || !articleId) {
            return res.status(400).json({ success: false, error: '缺少必要資料' });
        }

        // 讀取現有 questions.json
        let questions = [];
        if (fs.existsSync(QUESTIONS_JSON_PATH)) {
            questions = JSON.parse(fs.readFileSync(QUESTIONS_JSON_PATH, 'utf8'));
        }

        const newArticle = {
            id: parseInt(articleId),
            title: quizData.title,
            content: quizData.content,
            questions: quizData.questions
        };

        // 檢查是否已存在
        const existingIndex = questions.findIndex(q => q.id === newArticle.id);
        if (existingIndex !== -1) {
            questions[existingIndex] = newArticle;
        } else {
            questions.push(newArticle);
            questions.sort((a, b) => a.id - b.id);
        }

        // 儲存
        fs.writeFileSync(QUESTIONS_JSON_PATH, JSON.stringify(questions, null, 2), 'utf8');

        res.json({
            success: true,
            articleId: newArticle.id,
            title: newArticle.title,
            testUrl: `/quiz.html?id=${newArticle.id}`
        });

    } catch (e) {
        console.error('儲存失敗:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==========================================================================
// 解析 Excel
// ==========================================================================
function parseExcel(workbook) {
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 尋找包含「閱讀素養題組」的行
    let dataStartRow = 0;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const secondCell = String(row[1] || '');
        const contentCell = String(row[6] || '');

        if (secondCell.includes('閱讀素養題組') && contentCell.length > 100) {
            dataStartRow = i;
            break;
        }
    }

    if (dataStartRow === 0) {
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

    const articleRow = data[dataStartRow];
    const title = articleRow[5] || '';
    const contentRaw = articleRow[6] || '';

    const content = contentRaw
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

    const questions = [];
    for (let i = dataStartRow + 1; i < data.length; i++) {
        const row = data[i];
        const rowId = String(row[0] || '');

        if (rowId.includes('_')) {
            const questionText = row[8] || '';
            const optionA = row[10] || '';
            const optionB = row[12] || '';
            const optionC = row[14] || '';
            const optionD = row[16] || '';
            const optionE = row[18] || '';
            const correctAnswer = String(row[20] || '').toLowerCase();
            const explanation = row[21] || '';

            if (questionText.trim()) {
                const options = [optionA, optionB, optionC, optionD];
                if (optionE) options.push(optionE);

                let questionType = '直接提取訊息';
                if (explanation.includes('直接推論')) {
                    questionType = '直接推論';
                } else if (explanation.includes('詮釋與整合') || explanation.includes('詮釋')) {
                    questionType = '詮釋與整合';
                } else if (explanation.includes('評估與批判') || explanation.includes('評估')) {
                    questionType = '評估與批判';
                }

                let hint = explanation;
                if (hint && !hint.startsWith('提示')) {
                    hint = '提示：' + hint;
                }

                questions.push({
                    question: questionText.trim(),
                    type: questionType,
                    options: options.filter(o => o.trim()),
                    answer: correctAnswer.charAt(0),
                    hint: hint
                });
            }
        }
    }

    return { title, content, questions };
}

// ==========================================================================
// 更新 index.html
// ==========================================================================
function updateIndexHtml(articleId, title) {
    if (!fs.existsSync(INDEX_HTML_PATH)) return;

    let html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // 檢查是否已存在
    const existingPattern = new RegExp(`\\{ id: ${articleId}, title: "[^"]+" \\}`);
    if (existingPattern.test(html)) {
        // 更新現有標題
        html = html.replace(existingPattern, `{ id: ${articleId}, title: "${title}" }`);
    } else {
        // 新增項目
        const newEntry = `            { id: ${articleId}, title: "${title}" }`;
        const insertPattern = /(\{ id: \d+, title: "[^"]+" \})\s*\n(\s*\];)/;
        const match = html.match(insertPattern);

        if (match) {
            html = html.replace(insertPattern, `$1,\n${newEntry}\n$2`);
        }
    }

    fs.writeFileSync(INDEX_HTML_PATH, html, 'utf8');
}

// ==========================================================================
// 啟動伺服器
// ==========================================================================
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 PIRLS 後端 API 伺服器已啟動');
    console.log('='.repeat(50));
    console.log(`   API 網址: http://127.0.0.1:${PORT}`);
    console.log(`   管理後台: http://127.0.0.1:8080/admin.html`);
    console.log('='.repeat(50));
});
