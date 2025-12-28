// ========================================
// 手機版 Tab 切換介面功能
// ========================================

// 全域變數
let currentTab = 'article';
const tabs = ['guide', 'article', 'questions'];

// 初始化 Tab 介面
function initMobileTabs() {
    // 只在手機版執行
    if (window.innerWidth > 900) return;

    // 創建 Tab 導航欄
    createTabNavigation();

    // 創建 Tab 內容區
    createTabContainer();

    // 設置內容監聽器（監聽動態載入的內容）
    setupContentObserver();

    // 設置滑動手勢
    setupSwipeGestures();

    // 顯示首次使用提示
    showSwipeHintOnce();

    // 載入記憶的 Tab
    const lastTab = localStorage.getItem('lastActiveTab') || 'article';
    switchTab(lastTab);
}

// 創建 Tab 導航欄
function createTabNavigation() {
    const userInfoBar = document.getElementById('user-info-bar');
    if (!userInfoBar) return;

    const navHTML = `
        <div class="mobile-tab-nav">
            <button class="tab-btn active" data-tab="article" onclick="switchTab('article')">
                <span class="tab-icon">📖</span>
                <span class="tab-label">閱讀文章</span>
            </button>
            <button class="tab-btn" data-tab="questions" onclick="switchTab('questions')">
                <span class="tab-icon">✏️</span>
                <span class="tab-label">答題</span>
                <span class="tab-badge" id="progress-badge">0/0</span>
            </button>
            <button class="tab-btn" data-tab="guide" onclick="switchTab('guide')">
                <span class="tab-icon">💡</span>
                <span class="tab-label">說明</span>
            </button>
        </div>
    `;

    userInfoBar.insertAdjacentHTML('afterend', navHTML);
}

// 創建 Tab 內容區
function createTabContainer() {
    const container = document.querySelector('.container');
    if (!container) return;

    // 創建手機版容器
    const mobileContainer = document.createElement('div');
    mobileContainer.className = 'mobile-tab-container';

    // 創建三個 Tab Pane
    mobileContainer.innerHTML = `
        <!-- Tab 1: 閱讀文章 -->
        <div class="tab-pane active" id="article-pane">
            <h1 id="article-title-mobile"></h1>
            <div id="article-body-mobile"></div>
        </div>
        
        <!-- Tab 2: 測驗問題 -->
        <div class="tab-pane" id="questions-pane">
            <h2>閱讀理解問題</h2>
            <div id="questions-container-mobile"></div>
            <button id="submit-btn-mobile" class="submit-button" onclick="submitQuiz()">提交答案</button>
        </div>
        
        <!-- Tab 3: 使用說明 -->
        <div class="tab-pane" id="guide-pane">
            <h2>使用指南</h2>
            <div id="guide-content-mobile"></div>
        </div>
    `;

    container.insertAdjacentElement('afterend', mobileContainer);

    // 複製內容到手機版
    copyContentToMobile();
}

// 複製內容到手機版 Tab
function copyContentToMobile() {
    // 複製文章標題和內容
    const articleTitle = document.getElementById('article-title-display');
    const articleBody = document.getElementById('article-body');
    if (articleTitle && articleBody) {
        document.getElementById('article-title-mobile').innerHTML = articleTitle.innerHTML;
        document.getElementById('article-body-mobile').innerHTML = articleBody.innerHTML;
    }

    // 複製題目
    const questionsContainer = document.getElementById('questions-container');
    if (questionsContainer) {
        document.getElementById('questions-container-mobile').innerHTML = questionsContainer.innerHTML;
    }

    // 複製使用說明
    const leftColumn = document.getElementById('left-column');
    if (leftColumn) {
        const steps = leftColumn.querySelectorAll('.step');
        const guideContent = document.getElementById('guide-content-mobile');
        guideContent.innerHTML = ''; // 清空避免重複
        steps.forEach(step => {
            guideContent.appendChild(step.cloneNode(true));
        });
    }

    // 更新進度指示器
    updateProgressBadge();
}

// 監聽桌面版內容變化，自動同步到手機版
function setupContentObserver() {
    let hasInitiallyLoaded = false; // 添加標誌，防止重複複製

    // 監聽題目容器的變化
    const questionsContainer = document.getElementById('questions-container');
    if (questionsContainer) {
        const observer = new MutationObserver((mutations) => {
            // 只在初次載入時複製內容，避免用戶答題時狀態被清除
            const mobileQuestionsContainer = document.getElementById('questions-container-mobile');

            // 檢查是否是骨架屏被真實內容替換（初次載入）
            const hasSkeletonLoader = questionsContainer.querySelector('.skeleton-loader');
            const hasRealQuestions = questionsContainer.querySelector('.question');

            // 只在以下情況才複製：
            // 1. 還沒有初始化過 AND
            // 2. 有真實題目但手機版還是空的或有骨架屏
            if (!hasInitiallyLoaded && hasRealQuestions && mobileQuestionsContainer) {
                const mobileHasContent = mobileQuestionsContainer.querySelector('.question');

                if (!mobileHasContent || mobileQuestionsContainer.querySelector('.skeleton-loader')) {
                    console.log('[ContentObserver] Initial load detected, copying content...');
                    mobileQuestionsContainer.innerHTML = questionsContainer.innerHTML;

                    // 重新綁定手機版 radio button 的事件監聽器
                    setupMobileRadioListeners();

                    // 同步桌面版已選擇的答案
                    syncAnswersToMobile();

                    updateProgressBadge();

                    hasInitiallyLoaded = true; // 標記為已初始化
                    console.log('[ContentObserver] Content loaded, observer will now ignore changes');
                }
            }
        });

        observer.observe(questionsContainer, {
            childList: true,

            subtree: true
        });
    }

    // 監聽文章內容的變化
    const articleBody = document.getElementById('article-body');
    if (articleBody) {
        const observer = new MutationObserver((mutations) => {
            const mobileArticleBody = document.getElementById('article-body-mobile');
            if (mobileArticleBody && articleBody.innerHTML) {
                mobileArticleBody.innerHTML = articleBody.innerHTML;
            }
        });

        observer.observe(articleBody, {
            childList: true,
            subtree: true
        });
    }

    // 監聽文章標題的變化
    const articleTitle = document.getElementById('article-title-display');
    if (articleTitle) {
        const observer = new MutationObserver((mutations) => {
            const mobileArticleTitle = document.getElementById('article-title-mobile');
            if (mobileArticleTitle && articleTitle.innerHTML) {
                mobileArticleTitle.innerHTML = articleTitle.innerHTML;
            }
        });

        observer.observe(articleTitle, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
}

// Tab 切換功能
function switchTab(tabName) {
    // 更新按鈕狀態
    document.querySelectorAll('.mobile-tab-nav .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.mobile-tab-nav .tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // 更新內容區
    document.querySelectorAll('.mobile-tab-container .tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    const activePane = document.getElementById(`${tabName}-pane`);
    if (activePane) {
        activePane.classList.add('active');
    }

    // 記錄當前 Tab
    currentTab = tabName;
    localStorage.setItem('lastActiveTab', tabName);

    // 如果切換到答題 Tab，同步答案
    if (tabName === 'questions') {
        syncAnswersToMobile();
    }
}

// 同步答案到手機版
function syncAnswersToMobile() {
    const desktopRadios = document.querySelectorAll('.container input[type="radio"]:checked');
    desktopRadios.forEach(radio => {
        const mobileRadio = document.querySelector(`.mobile-tab-container input[name="${radio.name}"][value="${radio.value}"]`);
        if (mobileRadio) {
            mobileRadio.checked = true;
        }
    });
    updateProgressBadge();
}

// 更新進度指示器
function updateProgressBadge() {
    // 確保手機版容器存在
    const mobileContainer = document.querySelector('.mobile-tab-container');
    if (!mobileContainer) {
        console.log('[Progress] Mobile container not found');
        return;
    }

    // 計算總問題數
    const allQuestions = mobileContainer.querySelectorAll('.question');
    const totalQuestions = allQuestions.length;

    if (totalQuestions === 0) {
        console.log('[Progress] No questions found');
        return;
    }

    // 計算已回答的問題數（使用 Set 確保不重複計數）
    const answeredSet = new Set();

    allQuestions.forEach((question, index) => {
        const checkedRadio = question.querySelector('input[type="radio"]:checked');
        if (checkedRadio) {
            answeredSet.add(index);
        }
    });

    const answeredQuestions = answeredSet.size;


    // 更新 Tab badge
    const badge = document.getElementById('progress-badge');
    if (badge) {
        badge.textContent = `${answeredQuestions}/${totalQuestions}`;

        // 全部答完時改變顏色
        if (answeredQuestions === totalQuestions && totalQuestions > 0) {
            badge.style.background = '#ffd700'; // 金色
            badge.style.color = '#333';
        } else {
            badge.style.background = 'var(--secondary-color)';
            badge.style.color = 'white';
        }
    }

    // 更新手機版提交按鈕狀態
    const mobileSubmitBtn = document.getElementById('submit-btn-mobile');
    if (mobileSubmitBtn) {
        // 始終啟用提交按鈕（與桌面版行為一致）
        mobileSubmitBtn.disabled = false;

        if (answeredQuestions === totalQuestions) {
            mobileSubmitBtn.classList.add('ready');
            mobileSubmitBtn.textContent = '✅ 提交答案';
        } else if (answeredQuestions > 0) {
            mobileSubmitBtn.classList.remove('ready');
            mobileSubmitBtn.textContent = `提交答案 (${answeredQuestions}/${totalQuestions})`;
        } else {
            mobileSubmitBtn.classList.remove('ready');
            mobileSubmitBtn.textContent = '提交答案';
        }
    }
}

// 設置滑動手勢
function setupSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 75;

    const tabContainer = document.querySelector('.mobile-tab-container');
    if (!tabContainer) return;

    tabContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    tabContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) < swipeThreshold) {
            return;
        }

        const currentIndex = tabs.indexOf(currentTab);

        if (diff > 0 && currentIndex < tabs.length - 1) {
            // 向左滑，下一個 tab
            switchTab(tabs[currentIndex + 1]);
        } else if (diff < 0 && currentIndex > 0) {
            // 向右滑，上一個 tab
            switchTab(tabs[currentIndex - 1]);
        }
    }
}

// 首次使用提示
function showSwipeHintOnce() {
    const hasSeenHint = localStorage.getItem('hasSeenSwipeHint');

    if (!hasSeenHint && window.innerWidth <= 900) {
        const hint = document.createElement('div');
        hint.className = 'swipe-hint';
        hint.innerHTML = '💡 提示：可左右滑動切換 Tab';
        document.body.appendChild(hint);

        setTimeout(() => {
            hint.remove();
            localStorage.setItem('hasSeenSwipeHint', 'true');
        }, 3500);
    }
}

// 設置手機版 radio button 的事件監聽器
function setupMobileRadioListeners() {
    // 不需要額外綁定，全域 change 事件監聽器已經處理了
}

// 監聽手機版 radio button 的 change 事件
document.addEventListener('change', (e) => {
    // 只處理手機版容器內的 radio button
    if (e.target.type === 'radio' && e.target.closest('.mobile-tab-container')) {
        const radio = e.target;

        // 更新視覺樣式
        updateOptionStyles(radio);

        // 更新進度指示器
        updateProgressBadge();

        // 不再實時同步到桌面版，避免觸發連鎖反應
        // 只在提交時同步即可
    }
});

// 更新選項的視覺狀態
function updateOptionStyles(radioInput) {
    const questionDiv = radioInput.closest('.question');
    if (!questionDiv) return;

    // 取消同一題目中所有 radio 的選中狀態
    questionDiv.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });

    // 確保當前 radio 被選中
    radioInput.checked = true;

    // 移除所有選項的選中視覺樣式
    questionDiv.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // 為選中的選項添加 selected class
    const selectedOption = radioInput.closest('.option');
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }

}

// 頁面載入時初始化
window.addEventListener('DOMContentLoaded', () => {
    // 延遲執行，等待其他內容載入
    setTimeout(() => {
        initMobileTabs();
    }, 500);
});

// 視窗大小改變時重新初始化
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // 如果從桌面切到手機或反向，重新載入頁面
        location.reload();
    }, 500);
});

// ==========================================================================
// 全域函數宣告（供 HTML onclick 使用）
// ==========================================================================

// 手機版提交答案函數
window.submitQuiz = function () {
    // 同步手機版的答案到桌面版
    const mobileRadios = document.querySelectorAll('.mobile-tab-container input[type="radio"]:checked');

    mobileRadios.forEach(radio => {
        const desktopRadio = document.querySelector('.container input[name="' + radio.name + '"][value="' + radio.value + '"]');
        if (desktopRadio) {
            desktopRadio.checked = true;
        }
    });

    // 呼叫桌面版的 checkAnswers 函數
    if (typeof window.checkAnswers === 'function') {
        window.checkAnswers();

        // 等待結果渲染後，切換到文章 Tab 顯示結果
        setTimeout(() => {
            if (typeof window.switchTab === 'function') {
                switchTab('article');
            }

            // 將桌面版的結果複製到手機版
            setTimeout(() => {
                const statsDiv = document.getElementById('current-stats');
                const mobileArticlePane = document.getElementById('article-pane');

                if (statsDiv && statsDiv.innerHTML && mobileArticlePane) {
                    let mobileStats = mobileArticlePane.querySelector('#current-stats-mobile');
                    if (!mobileStats) {
                        mobileStats = document.createElement('div');
                        mobileStats.id = 'current-stats-mobile';
                        mobileStats.style.cssText = statsDiv.style.cssText;
                        mobileArticlePane.appendChild(mobileStats);
                    }
                    mobileStats.innerHTML = statsDiv.innerHTML;
                    mobileStats.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }, 300);
    }
};

// Tab 切換函數（供 HTML onclick 使用）
window.switchTab = switchTab;
