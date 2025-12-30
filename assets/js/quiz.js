// ==========================================================================
// PIRLS 閱讀理解測驗 - 共用 JavaScript 邏輯
// ==========================================================================

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, doc, addDoc, setDoc, getDocs, query, orderBy, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// ==========================================================================
// Firebase 設定
// ==========================================================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyDpNO7HktKVmMRAEwiKlU1gJ6RTb9qaUm4",
    authDomain: "shimen-pirls.firebaseapp.com",
    projectId: "shimen-pirls",
    storageBucket: "shimen-pirls.firebasestorage.app",
    messagingSenderId: "908294261992",
    appId: "1:908294261992:web:948474ea7c2a662a778d5d"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : "shimen-pirls";

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ==========================================================================
// 全域狀態
// ==========================================================================
let startTime = new Date();
let currentUser = null;
let currentArticle = null; // 當前載入的文章資料
let selectedAnswers = new Map(); // v1.7: 儲存用戶選擇的答案

// ==========================================================================
// 初始化
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
    initClassOptions();

    // 從 URL 取得文章 ID
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = parseInt(urlParams.get('id'));

    if (!articleId) {
        showError('找不到指定的文章 ID，請從首頁選擇文章。');
        return;
    }

    // 載入文章資料
    try {
        const response = await fetch('data/questions.json?t=' + Date.now());
        if (!response.ok) throw new Error('載入題庫失敗');

        const articles = await response.json();
        currentArticle = articles.find(a => a.id === articleId);

        if (!currentArticle) {
            showError(`找不到編號 ${articleId} 的文章，請返回首頁重新選擇。`);
            return;
        }

        // 渲染頁面
        renderArticle();
        renderQuestions();

        // 更新標題
        document.getElementById('article-title-display').textContent = `閱讀文章：${currentArticle.title}`;
        document.title = `閱讀理解練習：${currentArticle.title}`;

    } catch (e) {
        console.error('載入文章失敗:', e);

        // 增強錯誤訊息
        let errorMsg = '❌ 無法載入文章內容';

        if (!navigator.onLine) {
            errorMsg = '❌ 網路連線中斷<br>請檢查網路設定後重試';
        } else if (e.message.includes('fetch') || !response) {
            errorMsg = '❌ 無法連線到伺服器<br>請稍後再試';
        } else if (e.message.includes('JSON')) {
            errorMsg = '❌ 資料格式錯誤<br>請聯絡管理員';
        }

        showErrorMessage(errorMsg);
        return;
    }

    // 檢查使用者登入狀態
    checkUserLogin();

    // Firebase 匿名登入
    try {
        await signInAnonymously(auth);
        if (currentUser) loadHistory();
    } catch (e) {
        console.error("Auth Error", e);
    }
});

// ==========================================================================
// 班級選項初始化
// ==========================================================================
function initClassOptions() {
    const select = document.getElementById('classNumberSelect');
    if (!select) return;

    // 生成 1-30 班
    for (let i = 1; i <= 30; i++) {
        const opt = document.createElement('option');
        opt.value = `${i}班`;
        opt.textContent = `${i}班`;
        select.appendChild(opt);
    }

    // 額外選項
    const extras = ["其他"];
    extras.forEach(ex => {
        const opt = document.createElement('option');
        opt.value = ex;
        opt.textContent = ex;
        select.appendChild(opt);
    });
}

// ==========================================================================
// 渲染文章內容
// ==========================================================================
function renderArticle() {
    const articleBody = document.getElementById('article-body');
    if (!articleBody || !currentArticle) return;

    articleBody.innerHTML = currentArticle.content
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('');
}

// ==========================================================================
// 渲染問題區
// ==========================================================================
function renderQuestions() {
    const container = document.getElementById('questions-container');
    if (!container || !currentArticle) return;

    container.innerHTML = currentArticle.questions.map((q, index) => {
        const qNum = index + 1;
        const optionLabels = ['a', 'b', 'c', 'd', 'e'];

        return `
            <div class="question" id="q-block-${qNum}">
                <p>${qNum}. ${q.question}（${q.type}）</p>
                ${q.options.map((opt, optIndex) => `
                    <label class="option">
                        <input type="radio" name="q${qNum}" value="${optionLabels[optIndex]}">
                        ${opt}
                    </label>
                `).join('')}
                <div class="explanation" id="exp${qNum}"></div>
            </div>
        `;
    }).join('');

    // v1.7: Initialize progress tracking
    selectedAnswers.clear();
    setTimeout(initProgressTracking, 100);
}

// ==========================================================================
// 使用者登入檢查
// ==========================================================================
function checkUserLogin() {
    const storedUser = localStorage.getItem('shimen_pirls_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUserUI();
        document.getElementById('loginModal').style.display = 'none';
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
}

// ==========================================================================
// 儲存使用者資訊
// ==========================================================================
window.saveUserInfo = function () {
    const grade = document.getElementById('gradeSelect').value;
    const classNum = document.getElementById('classNumberSelect').value;
    const name = document.getElementById('studentName').value.trim();
    const seat = document.getElementById('seatNumber').value.trim();

    // 檢查必填欄位並提供具體提示
    if (!grade || !classNum || !name) {
        let missingFields = [];
        if (!grade) missingFields.push('年級');
        if (!classNum) missingFields.push('班級');
        if (!name) missingFields.push('姓名');

        alert(`⚠️ 請填寫以下必填欄位：\n\n${missingFields.join('、')}`);
        return;
    }

    const finalClass = `${grade}年${classNum}`;

    currentUser = {
        class: finalClass,
        name: name,
        seat: seat,
        fullId: `${finalClass}-${seat ? seat + '-' : ''}${name}`
    };

    localStorage.setItem('shimen_pirls_user', JSON.stringify(currentUser));
    updateUserUI();
    document.getElementById('loginModal').style.display = 'none';
    startTime = new Date();
    loadHistory();
};

// ==========================================================================
// 切換使用者
// ==========================================================================
window.resetUser = function () {
    console.log("resetUser called - switching user"); // DEBUG
    localStorage.removeItem('shimen_pirls_user');
    location.reload();
};

// ==========================================================================
// 更新使用者 UI
// ==========================================================================
function updateUserUI() {
    if (!currentUser) return;

    const displayStr = `${currentUser.class} ${currentUser.name}`;

    const mobileUserName = document.getElementById('mobile-user-name');
    const desktopUserName = document.getElementById('desktop-user-name');

    if (mobileUserName) mobileUserName.textContent = displayStr;
    if (desktopUserName) desktopUserName.textContent = displayStr;
}


// ==========================================================================
// 檢查是否所有題目都已作答 (v1.6 新增)
// ==========================================================================
function checkAllAnswered() {
    if (!currentArticle) return true;

    const totalQuestions = currentArticle.questions.length;
    const answeredQuestions = new Set();

    for (let i = 1; i <= totalQuestions; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if (selected) {
            answeredQuestions.add(i);
        }
    }

    const unansweredCount = totalQuestions - answeredQuestions.size;

    if (unansweredCount > 0) {
        const confirmMsg = `⚠️ 還有 ${unansweredCount} 題未作答\n\n確定要提交答案嗎？\n（未作答的題目將被視為答錯）`;
        return confirm(confirmMsg);
    }

    return true;
}

// ==========================================================================
// 提交答案
// ==========================================================================
window.checkAnswers = async function () {
    // v1.6: 檢查是否所有題目都已作答
    if (!checkAllAnswered()) {
        return; // 使用者取消提交
    }

    if (!currentUser) {
        alert("請先登入！");
        location.reload();
        return;
    }

    if (!currentArticle) {
        alert("文章資料尚未載入！");
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = "評分與儲存中...";

    let score = 0;
    let answersRecord = {};
    const totalQuestions = currentArticle.questions.length;

    for (let i = 1; i <= totalQuestions; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        const expDiv = document.getElementById(`exp${i}`);
        const userVal = selected ? selected.value : "";
        const correctVal = currentArticle.questions[i - 1].answer;

        answersRecord[`q${i}`] = userVal;

        expDiv.className = "explanation show";
        if (userVal === correctVal) {
            score++;
            expDiv.innerHTML = `✅ <strong>正確！</strong>`;
            expDiv.classList.add("correct");
            expDiv.classList.remove("incorrect");
        } else {
            expDiv.innerHTML = `❌ <strong>需要複習：</strong> ${currentArticle.questions[i - 1].hint}`;
            expDiv.classList.add("incorrect");
            expDiv.classList.remove("correct");
        }
    }

    const finalScore = Math.round((score / totalQuestions) * 100);
    const timeTaken = Math.round((new Date() - startTime) / 1000);

    const statsDiv = document.getElementById('current-stats');
    statsDiv.style.display = 'block';

    // v1.7: Detailed Results Page
    let resultsHTML = `
        <h3 style="margin-top:0; color: #00008b;">📝 本次測驗結果</h3>
        <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
            <div style="text-align: center;">
                <div style="font-size: 2.5rem; font-weight: bold; color:${finalScore === 100 ? '#28a745' : '#dc3545'}">${finalScore}</div>
                <div style="font-size: 0.9rem; color: #666;">得分</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #4169e1;">${timeTaken}秒</div>
                <div style="font-size: 0.9rem; color: #666;">耗時</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #28a745;">${score}/${totalQuestions}</div>
                <div style="font-size: 0.9rem; color: #666;">答對</div>
            </div>
        </div>
        
        <div style="border-top: 2px solid #ddd; padding-top: 15px; margin-top: 15px;">
            <h4 style="color: #495057; margin-bottom: 15px;">📊 答題詳情</h4>
    `;

    for (let i = 1; i <= totalQuestions; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        const userAnswer = selected ? selected.value : "未作答";
        const correctAnswer = currentArticle.questions[i - 1].answer;
        const question = currentArticle.questions[i - 1];
        const isCorrect = userAnswer === correctAnswer;

        resultsHTML += `
            <div class="result-item ${isCorrect ? 'correct-result' : 'incorrect-result'}">
                <div class="result-header">
                    <span class="result-icon">${isCorrect ? '✅' : '❌'}</span>
                    <span class="result-question-num">第 ${i} 題</span>
                    <span class="result-type">${question.type}</span>
                </div>
                <div class="result-body">
                    <div class="result-row">
                        <span class="result-label">題目：</span>
                        <span>${question.question}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">你的答案：</span>
                        <span class="${isCorrect ? 'correct-answer' : 'wrong-answer'}">${userAnswer === "未作答" ? "❓ 未作答" : userAnswer.toUpperCase()}</span>
                    </div>
                    ${!isCorrect ? `
                    <div class="result-hint">
                        💡 提示：${question.hint}
                    </div>
                ` : ''}
                </div>
            </div>
        `;
    }

    resultsHTML += `
        </div>
        <p style="text-align: center; margin: 20px 0 0 0; font-size: 0.9rem; color: #888;">成績已上傳雲端</p>
    `;

    statsDiv.innerHTML = resultsHTML;

    // 滾動到成績區
    const offset = 100;
    const elementPosition = statsDiv.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
    });

    // 儲存至 Firebase
    try {
        const publicRef = collection(db, 'artifacts', appId, 'public', 'data', 'quiz_results');
        const recordData = {
            classId: currentUser.class,
            studentName: currentUser.name,
            seatNumber: currentUser.seat,
            studentFullId: currentUser.fullId,
            articleId: currentArticle.id,
            articleTitle: currentArticle.title,
            score: finalScore,
            answers: answersRecord,
            timeTakenSeconds: timeTaken,
            timestamp: serverTimestamp(),
            deviceInfo: navigator.userAgent
        };

        // 雙重寫入機制
        addDoc(publicRef, recordData).catch(e => console.warn("Public write failed:", e));

        // 寫入個人資料庫
        if (auth.currentUser) {
            const userRef = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'quiz_results');
            await addDoc(userRef, recordData);
        }

        // 更新首頁統計
        const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'pirls_stats', `pirls_${currentArticle.id}`);
        setDoc(statsRef, {
            count: increment(1),
            title: currentArticle.title
        }, { merge: true }).catch(e => console.warn("Stats update failed:", e));

        // 重新載入歷史
        setTimeout(loadHistory, 500);

    } catch (error) {
        console.error("Save Error:", error);
        alert("成績已送出，但無法儲存至雲端。請檢查網路或請管理員檢查資料庫權限。");
    } finally {
        btn.disabled = false;
        btn.textContent = "再次提交 (更新成績)";
        startTime = new Date();
    }
};

// ==========================================================================
// 載入歷史紀錄 (v1.9 Enhanced)
// ==========================================================================
async function loadHistory() {
    if (!currentUser || !currentArticle) return;

    const listDiv = document.getElementById('history-list');
    if (!listDiv) return;

    listDiv.innerHTML = '<div style="text-align:center; color:#888;">載入中...</div>';

    const targetClass = currentUser.class;
    const targetName = currentUser.name;

    try {
        const publicResultsRef = collection(db, 'artifacts', appId, 'public', 'data', 'quiz_results');
        const q = query(publicResultsRef, orderBy('timestamp', 'desc'));

        const snapshot = await getDocs(q);

        let records = [];

        snapshot.forEach((doc) => {
            const data = doc.data();

            const recordClass = data.classId || data.class || "";
            const recordName = data.studentName || data.name || "";

            // 篩選使用者與文章
            if (String(recordClass).trim() === String(targetClass).trim() &&
                String(recordName).trim() === String(targetName).trim()) {

                if (data.articleId == currentArticle.id) {
                    records.push({
                        ...data,
                        date: data.timestamp ? data.timestamp.toDate() : new Date()
                    });
                }
            }
        });

        if (records.length === 0) {
            listDiv.innerHTML = "<p style='color:#888; text-align:center;'>尚無本篇文章的練習紀錄。</p>";
            return;
        }

        // 找出最高分
        const maxScore = Math.max(...records.map(r => r.score || 0));

        // 計算平均分
        const avgScore = Math.round(records.reduce((sum, r) => sum + (r.score || 0), 0) / records.length);

        let html = '<div class="history-items-container">';

        records.forEach(r => {
            const score = r.score || 0;
            const time = r.timeTakenSeconds || 0;
            const isBest = score === maxScore && maxScore > 0;

            // 分數等級
            let scoreClass = 'low-score';
            let scoreIcon = '❌';
            if (score >= 90) {
                scoreClass = 'excellent';
                scoreIcon = '🏆';
            } else if (score >= 70) {
                scoreClass = 'good';
                scoreIcon = '✅';
            } else if (score >= 60) {
                scoreClass = 'pass';
                scoreIcon = '⚠️';
            }

            // 格式化日期
            const dateStr = r.date.toLocaleDateString('zh-TW', {
                month: '2-digit',
                day: '2-digit'
            });
            const timeStr = r.date.toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            html += `
                <div class="history-item ${isBest ? 'best-record' : ''}">
                    ${isBest ? '<div class="best-badge">🏆 最佳</div>' : ''}
                    <div class="history-main">
                        <div class="history-badge ${scoreClass}">
                            <span class="score-icon">${scoreIcon}</span>
                            <span class="score-value">${score}</span>
                            <span class="score-unit">分</span>
                        </div>
                        <div class="history-details">
                            <div class="detail-row">
                                <span class="detail-icon">⏱️</span>
                                <span class="detail-text">${time} 秒</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-icon">🗓️</span>
                                <span class="detail-text">${dateStr} ${timeStr}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // 添加統計摘要
        html += `
            <div class="history-summary">
                <div class="summary-item">
                    <span class="summary-label">測驗次數</span>
                    <span class="summary-value">${records.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">平均分數</span>
                    <span class="summary-value">${avgScore} 分</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">最高分數</span>
                    <span class="summary-value">${maxScore} 分</span>
                </div>
            </div>
        `;

        listDiv.innerHTML = html;

    } catch (error) {
        console.error("Load History Error:", error);
        listDiv.innerHTML = `<p style='color:red; font-size:0.8rem;'>讀取失敗，請檢查網路連線。</p>`;
    }
}

// ==========================================================================
// 錯誤訊息顯示
// ==========================================================================
function showError(message) {
    // 隱藏登入 Modal
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';

    // 顯示錯誤訊息
    const centerColumn = document.getElementById('center-column');
    if (centerColumn) {
        centerColumn.innerHTML = `
            < div class="error-message" >
                <h2>⚠️ 發生錯誤</h2>
                <p>${message}</p>
                <p><a href="index.html">← 返回首頁</a></p>
            </div >
            `;
    }

    // 隱藏右側欄
    const rightColumn = document.getElementById('right-column');
    if (rightColumn) rightColumn.style.display = 'none';
}

// ==========================================================================
// 增強錯誤訊息顯示 (v1.6 新增)
// ==========================================================================
function showErrorMessage(message) {
    // 隱藏登入 Modal
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';

    // 顯示友善的錯誤訊息
    const centerColumn = document.getElementById('center-column');
    if (centerColumn) {
        centerColumn.innerHTML = `
            < div class="error-message-box" >
                <div class="error-icon">⚠️</div>
                <h2>發生錯誤</h2>
                <p class="error-text">${message}</p>
                <div class="error-actions">
                    <button onclick="location.reload()" class="retry-btn">🔄 重新載入</button>
                    <a href="index.html" class="home-btn">🏠 返回首頁</a>
                </div>
            </div >
            `;
    }

    // 隱藏右側欄
    const rightColumn = document.getElementById('right-column');
    if (rightColumn) rightColumn.style.display = 'none';
}


// ==========================================================================
// v1.7: Progress Tracking Functions
// ==========================================================================
function updateProgress() {
    if (!currentArticle) return;

    const totalQuestions = currentArticle.questions.length;
    const answeredCount = selectedAnswers.size;
    const percentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');

    if (progressText) progressText.textContent = `${answeredCount}/${totalQuestions} 題已作答`;
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;

        if (percentage === 100) {
            progressFill.classList.add('complete');
        } else {
            progressFill.classList.remove('complete');
        }
    }
}

function initProgressTracking() {
    if (!currentArticle) return;

    const totalQuestions = currentArticle.questions.length;

    for (let i = 1; i <= totalQuestions; i++) {
        const radios = document.querySelectorAll(`input[name="q${i}"]`);
        radios.forEach(radio => {
            radio.addEventListener('change', function () {
                if (this.checked) {
                    selectedAnswers.set(i, this.value);
                    updateProgress();
                }
            });
        });
    }

    updateProgress();
}
