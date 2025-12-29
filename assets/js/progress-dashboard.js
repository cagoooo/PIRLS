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

        this.container.innerHTML = `
            <div class="dashboard-header">
                <h3>📊 我的學習進度</h3>
                <button class="dashboard-toggle" onclick="window.progressDashboard.toggle()">
                    <span class="icon">📉</span>
                </button>
            </div>
            
            <div class="dashboard-content">
                <div class="dashboard-grid">
                    <!-- 統計卡片 -->
                    <div class="stats-cards">
                        ${this.renderStatsCards()}
                    </div>
                    
                    <!-- 進度環形圖 -->
                    <div class="chart-card">
                        <h4>完成進度</h4>
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
                        <h4>成績趨勢</h4>
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
                cutout: '80%',  // 增加到 80% 讓中間空間更大
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
                    pointRadius: 5,
                    pointBackgroundColor: '#2196F3',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#1976D2',
                    pointHoverBorderWidth: 3
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
                }
            }
        });
    }

    calculateStats() {
        if (!this.data || Object.keys(this.data).length === 0) {
            return {
                completed: 0,
                uncompleted: 53,
                total: 53,
                avgScore: 0,
                maxScore: 0,
                totalTime: '0分'
            };
        }

        const completed = Object.keys(this.data).length;
        const total = 53;
        const uncompleted = total - completed;

        let totalScore = 0;
        let maxScore = 0;
        let totalSeconds = 0;

        Object.values(this.data).forEach(article => {
            totalScore += article.maxScore || 0;
            maxScore = Math.max(maxScore, article.maxScore || 0);
            totalSeconds += article.totalTime || 0;
        });

        const avgScore = completed > 0 ? Math.round(totalScore / completed) : 0;
        const totalTime = this.formatTime(totalSeconds);

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
            return { labels: [], scores: [] };
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
            scores: entries.map(e => e.score)
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
            content.classList.toggle('collapsed');
            icon.textContent = content.classList.contains('collapsed') ? '📈' : '📉';
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
