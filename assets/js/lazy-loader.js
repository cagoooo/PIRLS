// ==========================================================================
// PIRLS Lazy Loader - 圖片與內容懶載入
// Version: 2.2.0
// ==========================================================================

/**
 * 懶載入配置
 */
const LAZY_CONFIG = {
    rootMargin: '50px', // 提前 50px 開始載入
    threshold: 0.01,
    loadingClass: 'lazy-loading',
    loadedClass: 'lazy-loaded',
    errorClass: 'lazy-error',
    placeholderImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18" dy=".3em"%3E載入中...%3C/text%3E%3C/svg%3E'
};

/**
 * 懶載入管理器
 */
class LazyLoader {
    constructor(config = {}) {
        this.config = { ...LAZY_CONFIG, ...config };
        this.observer = null;
        this.imageObserver = null;
        this.init();
    }

    /**
     * 初始化 Intersection Observer
     */
    init() {
        // 檢查瀏覽器支援
        if (!('IntersectionObserver' in window)) {
            console.warn('[LazyLoader] IntersectionObserver not supported, loading all images immediately');
            this.loadAllImages();
            return;
        }

        // 建立圖片觀察器
        this.imageObserver = new IntersectionObserver(
            (entries) => this.handleImageIntersection(entries),
            {
                rootMargin: this.config.rootMargin,
                threshold: this.config.threshold
            }
        );

        // 建立內容觀察器
        this.contentObserver = new IntersectionObserver(
            (entries) => this.handleContentIntersection(entries),
            {
                rootMargin: this.config.rootMargin,
                threshold: this.config.threshold
            }
        );

        // 開始觀察現有元素
        this.observeImages();
        this.observeContent();

        console.log('[LazyLoader] Initialized');
    }

    /**
     * 觀察所有懶載入圖片
     */
    observeImages() {
        const images = document.querySelectorAll('img[data-src], img[data-srcset]');
        images.forEach((img) => {
            // 設定 placeholder
            if (!img.src) {
                img.src = this.config.placeholderImage;
            }
            this.imageObserver.observe(img);
        });

        if (images.length > 0) {
            console.log(`[LazyLoader] Observing ${images.length} images`);
        }
    }

    /**
     * 觀察所有懶載入內容
     */
    observeContent() {
        const contents = document.querySelectorAll('[data-lazy-content]');
        contents.forEach((element) => {
            this.contentObserver.observe(element);
        });

        if (contents.length > 0) {
            console.log(`[LazyLoader] Observing ${contents.length} content elements`);
        }
    }

    /**
     * 處理圖片進入視窗
     */
    handleImageIntersection(entries) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.imageObserver.unobserve(img);
            }
        });
    }

    /**
     * 處理內容進入視窗
     */
    handleContentIntersection(entries) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const element = entry.target;
                this.loadContent(element);
                this.contentObserver.unobserve(element);
            }
        });
    }

    /**
     * 載入單張圖片
     */
    loadImage(img) {
        const src = img.getAttribute('data-src');
        const srcset = img.getAttribute('data-srcset');

        if (!src && !srcset) return;

        // 添加載入中樣式
        img.classList.add(this.config.loadingClass);

        // 建立臨時圖片來預載
        const tempImg = new Image();

        tempImg.onload = () => {
            if (src) img.src = src;
            if (srcset) img.srcset = srcset;

            img.classList.remove(this.config.loadingClass);
            img.classList.add(this.config.loadedClass);

            // 移除 data 屬性
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');

            // 觸發自訂事件
            img.dispatchEvent(new CustomEvent('lazyloaded', {
                bubbles: true,
                detail: { src, srcset }
            }));

            console.log('[LazyLoader] Image loaded:', src || srcset);
        };

        tempImg.onerror = () => {
            img.classList.remove(this.config.loadingClass);
            img.classList.add(this.config.errorClass);

            // 顯示錯誤 placeholder
            img.src = this.getErrorPlaceholder();

            console.error('[LazyLoader] Image load failed:', src || srcset);
        };

        // 開始載入
        if (src) tempImg.src = src;
        if (srcset) tempImg.srcset = srcset;
    }

    /**
     * 載入內容
     */
    async loadContent(element) {
        const contentUrl = element.getAttribute('data-lazy-content');

        if (!contentUrl) return;

        element.classList.add(this.config.loadingClass);

        try {
            const response = await fetch(contentUrl);
            const html = await response.text();

            element.innerHTML = html;
            element.classList.remove(this.config.loadingClass);
            element.classList.add(this.config.loadedClass);
            element.removeAttribute('data-lazy-content');

            // 觸發自訂事件
            element.dispatchEvent(new CustomEvent('lazyloaded', {
                bubbles: true,
                detail: { url: contentUrl }
            }));

            console.log('[LazyLoader] Content loaded:', contentUrl);
        } catch (error) {
            element.classList.remove(this.config.loadingClass);
            element.classList.add(this.config.errorClass);
            element.innerHTML = '<p style="color: #999;">載入失敗</p>';

            console.error('[LazyLoader] Content load failed:', error);
        }
    }

    /**
     * 強制載入所有圖片（降級方案）
     */
    loadAllImages() {
        const images = document.querySelectorAll('img[data-src], img[data-srcset]');
        images.forEach((img) => this.loadImage(img));
    }

    /**
     * 強制載入所有內容
     */
    loadAllContent() {
        const contents = document.querySelectorAll('[data-lazy-content]');
        contents.forEach((element) => this.loadContent(element));
    }

    /**
     * 獲取錯誤 placeholder
     */
    getErrorPlaceholder() {
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23ffebee" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23c62828" font-size="18" dy=".3em"%3E載入失敗%3C/text%3E%3C/svg%3E';
    }

    /**
     * 手動觀察新元素
     */
    observe(element) {
        if (element.tagName === 'IMG') {
            this.imageObserver.observe(element);
        } else if (element.hasAttribute('data-lazy-content')) {
            this.contentObserver.observe(element);
        }
    }

    /**
     * 停止觀察元素
     */
    unobserve(element) {
        if (element.tagName === 'IMG') {
            this.imageObserver.unobserve(element);
        } else {
            this.contentObserver.unobserve(element);
        }
    }

    /**
     * 銷毀懶載入器
     */
    destroy() {
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
        if (this.contentObserver) {
            this.contentObserver.disconnect();
        }
        console.log('[LazyLoader] Destroyed');
    }
}

// 自動初始化
let lazyLoader;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        lazyLoader = new LazyLoader();
    });
} else {
    lazyLoader = new LazyLoader();
}

// 監聽動態新增的元素
const mutationObserver = new MutationObserver((mutations) => {
    if (!lazyLoader) return;

    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
                // 檢查是否是懶載入元素
                if (node.tagName === 'IMG' && (node.hasAttribute('data-src') || node.hasAttribute('data-srcset'))) {
                    lazyLoader.observe(node);
                } else if (node.hasAttribute('data-lazy-content')) {
                    lazyLoader.observe(node);
                }

                // 檢查子元素
                const lazyImages = node.querySelectorAll?.('img[data-src], img[data-srcset]');
                lazyImages?.forEach((img) => lazyLoader.observe(img));

                const lazyContents = node.querySelectorAll?.('[data-lazy-content]');
                lazyContents?.forEach((element) => lazyLoader.observe(element));
            }
        });
    });
});

// 開始觀察 DOM 變化
mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
});

// 導出為全域變數
window.lazyLoader = lazyLoader;

// ES Module 導出
export default LazyLoader;
export { lazyLoader, LAZY_CONFIG };
