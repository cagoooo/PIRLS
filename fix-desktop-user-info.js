const fs = require('fs');

// Fix quiz.html - optimize desktop user info block
let html = fs.readFileSync('h:/PIRLS/quiz.html', 'utf8');

// Find and replace the desktop-user-info section
const oldHtml = `            <!-- 桌機版使用者資訊 -->
            <div id="desktop-user-info"
                style="margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">
                <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">目前使用者</div>
                <div id="desktop-user-name" style="font-weight: bold; font-size: 1.2rem; margin-bottom: 10px;">未登入</div>
                <button onclick="resetUser()"
                    style="background: transparent; border: 1px solid white; color: white; padding: 4px 10px; font-size: 0.8rem; cursor: pointer; border-radius: 4px; width: 100%;">🔄 切換使用者</button>
                <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 10px;">
                    <a href="index.html" class="btn-home-link" style="color: white; text-decoration: none; display: block;">← 🏠 返回文章列表</a>
                </div>
            </div>`;

const newHtml = `            <!-- 桌機版使用者資訊 -->
            <div id="desktop-user-info">
                <div class="user-info-header">
                    <div class="user-label">目前使用者</div>
                    <div id="desktop-user-name" class="user-name-display">未登入</div>
                </div>
                
                <button onclick="resetUser()" class="btn-switch-user">
                    <span class="btn-icon">🔄</span>
                    <span class="btn-text">切換使用者</span>
                </button>
                
                <div class="divider"></div>
                
                <a href="index.html" class="btn-back-home">
                    <span class="btn-icon">🏠</span>
                    <span class="btn-text">返回文章列表</span>
                </a>
            </div>`;

html = html.replace(oldHtml, newHtml);

fs.writeFileSync('h:/PIRLS/quiz.html', html, 'utf8');
console.log('✅ quiz.html - optimized desktop user info block');

// Fix quiz.css - enhance styles
let css = fs.readFileSync('h:/PIRLS/assets/css/quiz.css', 'utf8');

// Replace the desktop-user-info styles section
const oldCss = `#desktop-user-info {
    margin-bottom: 20px;
    background: rgba(0, 0, 0, 0.2);
    padding: 15px;
    border-radius: 8px;
}`;

const newCss = `#desktop-user-info {
    margin-bottom: 20px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.15) 100%);
    padding: 18px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info-header {
    margin-bottom: 15px;
}

.user-label {
    font-size: 0.85rem;
    opacity: 0.85;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.user-name-display {
    font-weight: bold;
    font-size: 1.3rem;
    margin-bottom: 0;
    color: white;
}

.btn-switch-user {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
    border: none;
    color: var(--secondary-color);
    padding: 12px 16px;
    font-size: 0.95rem;
    cursor: pointer;
    border-radius: 10px;
    width: 100%;
    font-weight: 600;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-switch-user:hover {
    background: white;
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
}

.btn-switch-user:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
    margin: 15px 0;
}

.btn-back-home {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.95);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
}

.btn-back-home:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.btn-back-home:active {
    transform: translateY(0);
}

.btn-icon {
    font-size: 1.1em;
}

.btn-text {
    font-size: 1em;
}`;

css = css.replace(oldCss, newCss);

// Also need to remove the old styles at lines 473-513
const oldButtonStyles = `/* ========== Àu¤Æ«áªº°Ê§@«ö¶s¼Ë¦¡ ========== */
#desktop-user-info button,
#desktop-user-info a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 10px 15px;
    margin: 8px 0;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

#desktop-user-info button {
    background: rgba(255, 255, 255, 0.95);
    color: var(--secondary-color);
    border: 2px solid rgba(255, 255, 255, 0.3);
}

#desktop-user-info button:hover {
    background: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

#desktop-user-info a {
    background: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.5);
}

#desktop-user-info a:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: white;
    transform: translateY(-2px);
}`;

// Remove old button styles
css = css.replace(oldButtonStyles, '/* Desktop user info button styles moved to new classes above */');

fs.writeFileSync('h:/PIRLS/assets/css/quiz.css', css, 'utf8');
console.log('✅ quiz.css - enhanced desktop user info styles');

console.log('\n✅ All optimizations applied successfully!');
