/**
 * PIRLS 管理後台 - JavaScript 邏輯
 * 功能：上傳 Excel 檔案、解析內容、透過 API 儲存題組
 */

// ==========================================================================
// 設定
// ==========================================================================
// API URL 會根據環境自動調整
// 獲取基礎路徑（通用版本，支持任意子路徑部署）
const getBasePath = () => {
    const pathname = window.location.pathname;
    
    // 移除文件名，只保留目錄路徑
    // 例如：/smes/PIRLS2/index.html → /smes/PIRLS2
    //       /apps/reading/upload.html → /apps/reading
    const lastSlashIndex = pathname.lastIndexOf('/');
    const dir = pathname.substring(0, lastSlashIndex);
    
    // 如果是根目錄下的文件（如 /index.html），返回空字符串
    if (!dir || dir === '') return '';
    
    return dir;
};
const BASE_PATH = getBasePath();

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:3001' 
    : `${window.location.origin}${BASE_PATH}`;

// ==========================================================================
// 全域變數
// ==========================================================================
let parsedData = null;
let uploadedFile = null; // 儲存上傳的檔案
let existingQuestions = [];
let nextAvailableId = 1;
let apiAvailable = false;

// ==========================================================================
// 初始化
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 檢查 API 是否可用
    await checkApiStatus();

    // 載入現有題組資料
    await loadExistingData();

    // 設定拖放事件
    setupDragDrop();

    // 設定檔案輸入事件
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
});

// ==========================================================================
// 檢查 API 狀態
// ==========================================================================
async function checkApiStatus() {
    try {
        const response = await fetch(`${API_URL}/api/questions`, { method: 'GET' });
        if (response.ok) {
            apiAvailable = true;
            console.log('✅ API 伺服器已連線');
        } else {
            // API 端點存在但返回錯誤（如 404）
            apiAvailable = false;
            console.log('⚠️ API 端點不可用，將使用下載模式');
        }
    } catch (e) {
        apiAvailable = false;
        console.log('⚠️ API 伺服器未啟動，將使用下載模式');
    }
}

// ==========================================================================
// 載入現有資料
// ==========================================================================
async function loadExistingData() {
    try {
        // 優先使用 API
        if (apiAvailable) {
            const response = await fetch(`${API_URL}/api/questions`);
            if (response.ok) {
                const data = await response.json();
                nextAvailableId = data.nextId || 1;
                document.getElementById('total-count').textContent = data.count || 0;
                return;
            }
        }

        // 備用：直接讀取 JSON
        const response = await fetch(`${BASE_PATH}/data/questions.json?t=` + Date.now());
        if (response.ok) {
            existingQuestions = await response.json();
            nextAvailableId = Math.max(...existingQuestions.map(q => q.id), 0) + 1;
            document.getElementById('total-count').textContent = existingQuestions.length;
        }
    } catch (e) {
        console.error('載入題庫失敗:', e);
        document.getElementById('total-count').textContent = '0';
    }
}

// ==========================================================================
// 設定拖放
// ==========================================================================
function setupDragDrop() {
    const uploadZone = document.getElementById('upload-zone');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.remove('dragover');
        });
    });

    uploadZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    uploadZone.addEventListener('click', () => {
        document.getElementById('file-input').click();
    });
}

// ==========================================================================
// 檔案選擇處理
// ==========================================================================
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('請上傳 Excel 檔案（.xlsx 或 .xls）');
        return;
    }

    // 儲存檔案供後續 API 上傳使用
    uploadedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            parseExcel(workbook);
        } catch (err) {
            console.error('解析失敗:', err);
            alert('檔案解析失敗，請確認格式正確。\n\n錯誤訊息：' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

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
        // 備用方案
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

    // 解析文章資料
    const articleRow = data[dataStartRow];
    const title = articleRow[5] || '';
    const contentRaw = articleRow[6] || '';

    const content = contentRaw
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

    // 解析題目
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

                // 判斷題型
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

    if (!title || content.length === 0 || questions.length === 0) {
        alert('無法解析有效的題組資料，請確認檔案格式正確。');
        return;
    }

    // 儲存解析結果
    parsedData = { title, content, questions };

    // 顯示預覽
    showPreview();
}

// ==========================================================================
// 顯示預覽
// ==========================================================================
function showPreview() {
    // 更新預覽內容
    document.getElementById('preview-title').textContent = parsedData.title;
    document.getElementById('paragraph-count').textContent = parsedData.content.length;
    document.getElementById('preview-content').innerHTML = parsedData.content
        .map((p, i) => `<p style="margin-bottom: 8px;"><strong>${i + 1}.</strong> ${p.substring(0, 100)}${p.length > 100 ? '...' : ''}</p>`)
        .join('');

    document.getElementById('question-count').textContent = parsedData.questions.length;
    document.getElementById('preview-questions').innerHTML = parsedData.questions
        .map((q, i) => `
            <div class="question-item">
                <strong>${i + 1}.</strong> ${q.question}
                <span class="question-type">${q.type}</span>
            </div>
        `)
        .join('');

    // 設定建議 ID
    document.getElementById('article-id').placeholder = nextAvailableId;

    // 切換到步驟 2
    goToStep(2);
}

// ==========================================================================
// 儲存題組
// ==========================================================================
async function saveQuiz() {
    const idInput = document.getElementById('article-id');
    const articleId = parseInt(idInput.value) || nextAvailableId;

    // 如果 API 可用，透過 API 儲存
    if (apiAvailable && uploadedFile) {
        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);
            formData.append('articleId', articleId);

            const response = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // 顯示成功結果
                document.getElementById('result-id').textContent = result.articleId;
                document.getElementById('result-title').textContent = result.title;
                document.getElementById('result-questions').textContent = result.questionCount + ' 題';
                document.getElementById('test-link').href = result.testUrl;

                // 切換到步驟 3
                goToStep(3);
                return;
            } else {
                throw new Error(result.error || '儲存失敗');
            }
        } catch (e) {
            console.error('API 儲存失敗:', e);
            alert('API 儲存失敗：' + e.message + '\n\n將切換到下載模式...');
        }
    }

    // 備用方案：下載檔案模式
    // 檢查 ID 是否已存在
    const existingIndex = existingQuestions.findIndex(q => q.id === articleId);
    if (existingIndex !== -1) {
        if (!confirm(`題組 ID ${articleId} 已存在，確定要覆蓋嗎？`)) {
            return;
        }
    }

    // 建立新題組
    const newArticle = {
        id: articleId,
        title: parsedData.title,
        content: parsedData.content,
        questions: parsedData.questions
    };

    // 更新資料
    if (existingIndex !== -1) {
        existingQuestions[existingIndex] = newArticle;
    } else {
        existingQuestions.push(newArticle);
        existingQuestions.sort((a, b) => a.id - b.id);
    }

    // 產生 JSON 檔案內容
    const jsonContent = JSON.stringify(existingQuestions, null, 2);
    const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);

    // 產生 index.html 更新內容
    const indexEntry = `            { id: ${articleId}, title: "${parsedData.title}" }`;

    // 顯示結果
    document.getElementById('result-id').textContent = articleId;
    document.getElementById('result-title').textContent = parsedData.title;
    document.getElementById('result-questions').textContent = parsedData.questions.length + ' 題';
    document.getElementById('test-link').href = `${BASE_PATH}/quiz.html?id=${articleId}`;

    // 自動下載 JSON 檔案
    const downloadLink = document.createElement('a');
    downloadLink.href = jsonUrl;
    downloadLink.download = 'questions.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // 顯示 index.html 更新說明
    setTimeout(() => {
        alert(`✅ questions.json 已下載！\n\n請執行以下步驟完成設定：\n\n1. 將下載的 questions.json 放入 data 資料夾（覆蓋舊檔案）\n\n2. 在 index.html 的 articles 陣列中新增：\n${indexEntry}`);
    }, 500);

    // 切換到步驟 3
    goToStep(3);
}

// ==========================================================================
// 步驟切換
// ==========================================================================
function goToStep(step) {
    // 隱藏所有步驟
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.steps-indicator .step').forEach(el => {
        el.classList.remove('active');
    });

    // 顯示目標步驟
    document.getElementById(`step-${step}`).classList.add('active');
    document.getElementById(`step-${step}-indicator`).classList.add('active');

    // 標記已完成的步驟
    for (let i = 1; i < step; i++) {
        document.getElementById(`step-${i}-indicator`).classList.add('completed');
    }
}

// ==========================================================================
// 重置上傳
// ==========================================================================
function resetUpload() {
    parsedData = null;
    document.getElementById('file-input').value = '';
    document.getElementById('article-id').value = '';

    // 重新載入資料
    loadExistingData();

    // 回到步驟 1
    document.querySelectorAll('.steps-indicator .step').forEach(el => {
        el.classList.remove('active', 'completed');
    });
    document.getElementById('step-1-indicator').classList.add('active');

    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById('step-1').classList.add('active');
}

// 將函式暴露到全域
window.resetUpload = resetUpload;
window.saveQuiz = saveQuiz;
