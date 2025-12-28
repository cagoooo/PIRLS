/**
 * PIRLS 學生帳號確認模組
 * 使用自定義對話框，避免被瀏覽器攔截
 */

(function () {
    'use strict';

    console.log('[Account Confirmation] 帳號確認模組已載入');

    let confirmedForThisSession = false;
    let dialogElement = null;

    // 創建自定義對話框
    function createDialog() {
        if (dialogElement) return;

        const dialog = document.createElement('div');
        dialog.id = 'account-confirm-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Microsoft JhengHei', sans-serif;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            max-width: 400px;
            text-align: center;
            animation: slideDown 0.3s ease;
        `;

        content.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">📢</div>
            <h2 style="color: #333; margin: 10px 0; font-size: 20px;">請確認登入帳號</h2>
            <div id="account-name" style="font-size: 24px; color: #ff1361; font-weight: bold; margin: 20px 0; padding: 15px; background: #fff3f8; border-radius: 10px;"></div>
            <p style="color: #666; margin: 15px 0; font-size: 16px;">❓ 這是您的帳號嗎？</p>
            <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: center;">
                <button id="confirm-yes" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    font-size: 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.2s;
                ">✅ 確定，繼續測驗</button>
                <button id="confirm-no" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    font-size: 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.2s;
                ">❌ 取消，重新登入</button>
            </div>
        `;

        // 添加動畫
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            #confirm-yes:hover { background: #45a049; transform: scale(1.05); }
            #confirm-no:hover { background: #da190b; transform: scale(1.05); }
        `;
        document.head.appendChild(style);

        dialog.appendChild(content);
        document.body.appendChild(dialog);
        dialogElement = dialog;

        console.log('[Account Confirmation] 自定義對話框已創建');
    }

    // 顯示對話框
    function showDialog(userName) {
        return new Promise((resolve) => {
            createDialog();

            document.getElementById('account-name').textContent = userName;
            dialogElement.style.display = 'flex';

            console.log('[Account Confirmation] 顯示對話框：', userName);

            const yesBtn = document.getElementById('confirm-yes');
            const noBtn = document.getElementById('confirm-no');

            function cleanup() {
                dialogElement.style.display = 'none';
                yesBtn.removeEventListener('click', handleYes);
                noBtn.removeEventListener('click', handleNo);
            }

            function handleYes() {
                console.log('[Account Confirmation] 用戶點擊：確定');
                cleanup();
                resolve(true);
            }

            function handleNo() {
                console.log('[Account Confirmation] 用戶點擊：取消');
                cleanup();
                resolve(false);
            }

            yesBtn.addEventListener('click', handleYes);
            noBtn.addEventListener('click', handleNo);
        });
    }

    function init() {
        const gridContainer = document.getElementById('article-grid');
        if (!gridContainer) {
            setTimeout(init, 500);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('grid-item')) {
                        attachConfirmation(node);
                    }
                });
            });
        });

        observer.observe(gridContainer, { childList: true, subtree: false });

        const existingCards = gridContainer.querySelectorAll('.grid-item');
        existingCards.forEach(card => attachConfirmation(card));

        if (existingCards.length > 0) {
            console.log(`[Account Confirmation] 已為 ${existingCards.length} 個文章卡片添加帳號確認功能`);
        }
    }

    function attachConfirmation(card) {
        if (card.dataset.confirmAttached === 'true') return;
        card.dataset.confirmAttached = 'true';

        card.addEventListener('click', async function (e) {
            const storedUser = localStorage.getItem('shimen_pirls_user');

            if (!storedUser) return;
            if (confirmedForThisSession) return;

            // 阻止事件
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();

            // 解析用戶資料
            let userDisplay = storedUser;
            try {
                const userData = JSON.parse(storedUser);
                if (userData.class && userData.name) {
                    userDisplay = `${userData.class} ${userData.name}`;
                } else if (userData.name) {
                    userDisplay = userData.name;
                }
            } catch (err) {
                // 使用原始值
            }

            // 顯示自定義對話框
            const confirmed = await showDialog(userDisplay);

            if (confirmed) {
                confirmedForThisSession = true;
                console.log('[Account Confirmation] 用戶確認，重新觸發點擊');

                requestAnimationFrame(() => {
                    card.click();
                });
            } else {
                const switchConfirm = window.confirm('是否要切換到您的帳號？');
                if (switchConfirm) {
                    localStorage.removeItem('shimen_pirls_user');
                    location.reload();
                }
            }

        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    setTimeout(init, 1000);

})();
