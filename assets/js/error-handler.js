/**
 * PIRLS 統一錯誤處理與通知系統
 * @version 1.0
 * @date 2025-12-29
 */

class ErrorHandler {
    constructor() {
        this.toastContainer = null;
        this.loadingOverlay = null;
        this.init();
    }

    init() {
        // 創建 Toast 容器
        if (!document.getElementById('toast-container')) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        } else {
            this.toastContainer = document.getElementById('toast-container');
        }
    }

    /**
     * 顯示通知
     * @param {string} type - 類型: success, error, warning, info
     * @param {string} message - 主要訊息
     * @param {string} detail - 詳細說明（可選）
     * @param {number} duration - 顯示時長（毫秒），0 表示不自動關閉
     */
    show(type, message, detail = '', duration = 5000) {
        const toast = this.createToast(type, message, detail);
        this.toastContainer.appendChild(toast);

        // 觸發動畫
        setTimeout(() => toast.classList.add('show'), 10);

        // 自動關閉
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    createToast(type, message, detail) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getIcon(type);

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-message">${this.escapeHtml(message)}</div>
                ${detail ? `<div class="toast-detail">${this.escapeHtml(detail)}</div>` : ''}
            </div>
            <button class="toast-close" aria-label="關閉">✕</button>
        `;

        // 關閉按鈕事件
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toast);
        });

        return toast;
    }

    hide(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || '📌';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 快捷方法
    success(message, detail = '', duration = 5000) {
        return this.show('success', message, detail, duration);
    }

    error(message, detail = '', duration = 0) {
        return this.show('error', message, detail, duration);
    }

    warning(message, detail = '', duration = 5000) {
        return this.show('warning', message, detail, duration);
    }

    info(message, detail = '', duration = 5000) {
        return this.show('info', message, detail, duration);
    }

    /**
     * 顯示載入覆蓋層
     * @param {string} message - 載入訊息
     */
    showLoading(message = '載入中...') {
        let overlay = document.getElementById('loading-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-message">${this.escapeHtml(message)}</div>
                </div>
            `;
            document.body.appendChild(overlay);
            this.loadingOverlay = overlay;
        } else {
            overlay.querySelector('.loading-message').textContent = message;
        }

        // 延遲顯示，避免閃爍
        setTimeout(() => {
            overlay.classList.add('show');
        }, 100);

        return overlay;
    }

    /**
     * 隱藏載入覆蓋層
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    /**
     * 執行帶載入狀態的異步操作
     * @param {Function} asyncFn - 異步函數
     * @param {string} loadingMessage - 載入訊息
     * @param {string} successMessage - 成功訊息（可選）
     */
    async withLoading(asyncFn, loadingMessage = '處理中...', successMessage = '') {
        this.showLoading(loadingMessage);

        try {
            const result = await asyncFn();
            this.hideLoading();

            if (successMessage) {
                this.success(successMessage);
            }

            return result;
        } catch (error) {
            this.hideLoading();
            console.error('[ErrorHandler]', error);

            // 根據錯誤類型顯示不同訊息
            let errorMessage = '操作失敗';
            let errorDetail = '請稍後再試';

            if (error.code === 'auth/network-request-failed') {
                errorMessage = '網路連線失敗';
                errorDetail = '請檢查您的網路連線';
            } else if (error.code === 'permission-denied') {
                errorMessage = '權限不足';
                errorDetail = '您沒有執行此操作的權限';
            } else if (error.message) {
                errorDetail = error.message;
            }

            this.error(errorMessage, errorDetail);
            throw error;
        }
    }

    /**
     * 清除所有通知
     */
    clearAll() {
        const toasts = this.toastContainer.querySelectorAll('.toast');
        toasts.forEach(toast => this.hide(toast));
    }
}

// 創建全域實例
if (typeof window !== 'undefined') {
    window.errorHandler = new ErrorHandler();
    console.log('[ErrorHandler] Initialized successfully');
}
