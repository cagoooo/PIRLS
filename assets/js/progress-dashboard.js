/**
 * PIRLS 學習進度儀表板
 * @version 1.0
 * @date 2025-12-29
 */

class ProgressDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.charts = {};
        this.data = null;
    }

    /**
     * 初始化儀表板
     * @param {Object} progressData - 進度數據 {articleId: {maxScore, totalTime, attempts}}
     */
    async init(progressData) {
        this.data = progressData || {};
        await this.render();
    }

    async render() {
        if (!this.container) {
            console.warn('[ProgressDashboard] Container not found');
            return;
        }

        // 讀取儲存的展開/收合狀態
        const isCollapsed = localStorage.getItem('dashboard_collapsed') === 'true';
        const icon = isCollapsed ? '📈' : '📉';

        this.container.innerHTML = `
            <div class="dashboard-header">
                <h3>📊 我的學習進度</h3>
                <button class="dashboard-toggle" onclick="window.progressDashboard.toggle()" aria-label="展開收合儀表板">
                    <span class="icon">${icon}</span>
                </button>
            </div>
            
            <div class="dashboard-content ${isCollapsed ? 'collapsed' : ''}">
                <div class="dashboard-grid">
                    <!-- 統計卡片 -->
                    <div class="stats-cards">
                        ${this.renderStatsCards()}
                    </div>
                    
                    <!-- 進度環形圖 -->
                    <div class="chart-card">
                        <h4>完成進度 <small style="color: #999; font-weight: normal;">(點擊查看)</small></h4>
                        <div class="chart-wrapper">
                            <canvas id="progressChart"></canvas>
                            <div class="chart-center-text">
                                <div class="percentage">${this.getCompletionPercentage()}%</div>
                                <div class="label">完成率</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 成績趨勢圖 -->
                    <div class="chart-card chart-wide">
                        <h4>成績趨勢 <small style="color: #999; font-weight: normal;">(點擊跳轉)</small></h4>
                        <canvas id="scoreChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        // 等待 Chart.js 載入
        await this.waitForChartJS();

        // 初始化圖表
        await this.initCharts();
    }

    async waitForChartJS() {
        let retries = 0;
        while (typeof Chart === 'undefined' && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (typeof Chart === 'undefined') {
            console.error('[ProgressDashboard] Chart.js not loaded');
        }
    }

    renderStatsCards() {
        const stats = this.calculateStats();

        return `
            <div class="stat-card stat-card-1">
                <div class="stat-icon">📝</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.completed}</div>
                    <div class="stat-label">已完成</div>
                </div>
            </div>
            
            <div class="stat-card stat-card-2">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.avgScore}</div>
                    <div class="stat-label">平均分數</div>
                </div>
            </div>
            
            <div class="stat-card stat-card-3">
                <div class="stat-icon">🏆</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.maxScore}</div>
                    <div class="stat-label">最高分數</div>
                </div>
            </div>
            
            <div class="stat-card stat-card-4">
                <div class="stat-icon">⏱️</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalTime}</div>
                    <div class="stat-label">總時長</div>
                </div>
            </div>
        `;
    }

    async initCharts() {
        if (typeof Chart === 'undefined') {
            console.error('[ProgressDashboard] Chart.js not available');
            return;
        }

        // 進度環形圖
        this.createProgressChart();

        // 成績趨勢圖
        this.createScoreChart();
    }

    createProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        const stats = this.calculateStats();

        // 銷毀舊圖表
        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        this.charts.progress = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['已完成', '未完成'],
                datasets: [{
                    data: [stats.completed, stats.uncompleted],
                    backgroundColor: ['#4CAF50', '#E0E0E0'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '80%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const percentage = ((value / stats.total) * 100).toFixed(1);
                                return `${label}: ${value} 篇 (${percentage}%)`;
                            }
                        }
                    }
                },
                // 添加點擊事件
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        // 0 = 已完成, 1 = 未完成
                        if (index === 0 && stats.completed > 0) {
                            // 跳轉到已完成篩選
                            const filterBtn = document.querySelector('[data-filter="completed"]');
                            if (filterBtn) {
                                filterBtn.click();

                                // 滾動到文章網格區域（平滑動畫）
                                setTimeout(() => {
                                    const grid = document.getElementById('article-grid');
                                    if (grid) {
                                        const gridTop = grid.getBoundingClientRect().top + window.pageYOffset - 100;
                                        window.scrollTo({
                                            top: gridTop,
                                            behavior: 'smooth'
                                        });

                                        // 添加閃爍效果提示用戶
                                        grid.style.transition = 'background-color 0.3s';
                                        grid.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                                        setTimeout(() => {
                                            grid.style.backgroundColor = '';
                                        }, 600);
                                    }
                                }, 100);
                            }
                        } else if (index === 1 && stats.uncompleted > 0) {
                            // 跳轉到未完成篩選
                            const filterBtn = document.querySelector('[data-filter="uncompleted"]');
                            if (filterBtn) {
                                filterBtn.click();

                                // 滾動到文章網格區域（平滑動畫）
                                setTimeout(() => {
                                    const grid = document.getElementById('article-grid');
                                    if (grid) {
                                        const gridTop = grid.getBoundingClientRect().top + window.pageYOffset - 100;
                                        window.scrollTo({
                                            top: gridTop,
                                            behavior: 'smooth'
                                        });

                                        // 添加閃爍效果提示用戶
                                        grid.style.transition = 'background-color 0.3s';
                                        grid.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
                                        setTimeout(() => {
                                            grid.style.backgroundColor = '';
                                        }, 600);
                                    }
                                }, 100);
                            }
                        }
                    }
                }
            }
        });
    }

    createScoreChart() {
        const ctx = document.getElementById('scoreChart');
        if (!ctx) return;

        const scoreData = this.getScoreHistory();

        // 銷毀舊圖表
        if (this.charts.score) {
            this.charts.score.destroy();
        }

        this.charts.score = new Chart(ctx, {
            type: 'line',
            data: {
                labels: scoreData.labels,
                datasets: [{
                    label: '測驗分數',
                    data: scoreData.scores,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,  // 增大顯示半徑
                    pointBackgroundColor: '#2196F3',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 10,  // 增大hover半徑
                    pointHoverBackgroundColor: '#1976D2',
                    pointHoverBorderWidth: 3,
                    pointHitRadius: 20  // 關鍵：增大點擊檢測半徑到20px
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            afterLabel: (context) => {
                                return '點擊查看文章';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => value + ' 分',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                // 添加點擊事件
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const articleId = scoreData.articleIds[index];
                        if (articleId) {
                            // 先切換到「全部」篩選，確保文章可見
                            const allFilterBtn = document.querySelector('[data-filter="all"]');
                            if (allFilterBtn && !allFilterBtn.classList.contains('active')) {
                                allFilterBtn.click();
                            }

                            // 稍微延遲以確保篩選完成
                            setTimeout(() => {
                                // 找到對應的文章卡片
                                const articleCard = document.querySelector(`[data-article-id="${articleId}"]`);

                                if (articleCard) {
                                    // 滾動到文章卡片位置
                                    const cardTop = articleCard.getBoundingClientRect().top + window.pageYOffset - 150;
                                    window.scrollTo({
                                        top: cardTop,
                                        behavior: 'smooth'
                                    });

                                    // 添加高亮動畫效果
                                    articleCard.style.transition = 'all 0.4s ease';
                                    articleCard.style.transform = 'scale(1.05)';
                                    articleCard.style.boxShadow = '0 8px 24px rgba(33, 150, 243, 0.4)';
                                    articleCard.style.border = '3px solid #2196F3';

                                    // 3秒後恢復
                                    setTimeout(() => {
                                        articleCard.style.transform = '';
                                        articleCard.style.boxShadow = '';
                                        articleCard.style.border = '';
                                    }, 3000);

                                    // 顯示提示
                                    if (window.errorHandler) {
                                        errorHandler.info(
                                            `已定位到篇章 ${articleId}`,
                                            '點擊卡片即可開始測驗',
                                            3000
                                        );
                                    }
                                } else {
                                    // 如果找不到卡片（比如篩選隱藏了），則跳轉到測驗頁面
                                    window.location.href = `quiz.html?id=${articleId}`;
                                }
                            }, 300);
                        }
                    }
                }
            }
        });
    }

    calculateStats() {
        if (!this.data || Object.keys(this.data).length === 0) {
            // 動態獲取文章總數
            const gridItems = document.querySelectorAll('.grid-item');
            const total = gridItems.length || 53;

            return {
                completed: 0,
                uncompleted: total,
                total: total,
                avgScore: 0,
                maxScore: 0,
                totalTime: '0分'
            };
        }

        // v2.2.2: 分別計算「已完成」(100分) 和「已作答」(所有分數)
        let completed = 0;  // 只計算100分，用於「已完成」卡片
        let attempted = 0;   // 所有作答文章數，用於平均分計算
        let totalScore = 0;
        let maxScore = 0;
        let totalSeconds = 0;

        Object.values(this.data).forEach(article => {
            const score = article.maxScore || 0;

            // 只有100分才算「已完成」
            if (score === 100) {
                completed++;
            }

            // 所有作答都計入
            attempted++;
            totalScore += score;
            maxScore = Math.max(maxScore, score);
            totalSeconds += article.totalTime || 0;
        });

        // 平均分使用所有作答文章計算（更合理）
        const avgScore = attempted > 0 ? Math.round(totalScore / attempted) : 0;
        const totalTime = this.formatTime(totalSeconds);

        // 動態獲取文章總數
        const gridItems = document.querySelectorAll('.grid-item');
        const total = gridItems.length || 53;
        const uncompleted = total - completed;

        return {
            completed,
            uncompleted,
            total,
            avgScore,
            maxScore,
            totalTime
        };
    }

    getCompletionPercentage() {
        const stats = this.calculateStats();
        return Math.round((stats.completed / stats.total) * 100);
    }

    getScoreHistory() {
        if (!this.data || Object.keys(this.data).length === 0) {
            return { labels: [], scores: [], articleIds: [] };
        }

        // 取得最近10篇已完成的文章
        const entries = Object.entries(this.data)
            .map(([id, data]) => ({
                id: parseInt(id),
                score: data.maxScore || 0
            }))
            .sort((a, b) => a.id - b.id)
            .slice(-10);

        return {
            labels: entries.map(e => `篇章 ${e.id}`),
            scores: entries.map(e => e.score),
            articleIds: entries.map(e => e.id) // 添加文章 ID 用於點擊跳轉
        };
    }

    formatTime(seconds) {
        if (!seconds || seconds === 0) return '0分';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}小時${minutes}分`;
        }
        return `${minutes}分`;
    }

    toggle() {
        const content = this.container.querySelector('.dashboard-content');
        const icon = this.container.querySelector('.dashboard-toggle .icon');

        if (content && icon) {
            const isCollapsed = content.classList.toggle('collapsed');
            icon.textContent = isCollapsed ? '📈' : '📉';

            // 儲存狀態到 localStorage
            localStorage.setItem('dashboard_collapsed', isCollapsed);
            console.log('[ProgressDashboard] State saved:', isCollapsed ? 'collapsed' : 'expanded');
        }
    }

    /**
     * 更新數據並重新渲染
     */
    async update(newData) {
        this.data = newData;
        await this.render();
    }

    /**
     * 銷毀所有圖表
     */
    destroy() {
        if (this.charts.progress) {
            this.charts.progress.destroy();
        }
        if (this.charts.score) {
            this.charts.score.destroy();
        }
    }
}

// 創建全域實例
if (typeof window !== 'undefined') {
    window.ProgressDashboard = ProgressDashboard;
    window.progressDashboard = null;
    console.log('[ProgressDashboard] Class loaded successfully');
}
