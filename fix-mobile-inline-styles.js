const fs = require('fs');

// Remove inline styles from mobile buttons in quiz.html
let html = fs.readFileSync('h:/PIRLS/quiz.html', 'utf8');

// Remove inline style from the switch button
html = html.replace(
    /\<button onclick="resetUser\(\)"\s+style="[^"]+">🔄 切換<\/button>/,
    '<button onclick="resetUser()" class="btn-mobile-switch">🔄 切換</button>'
);

// Remove inline style from the home link
html = html.replace(
    /\<a href="index\.html" class="btn-home-link"\s+style="[^"]+">🏠 首頁<\/a>/,
    '<a href="index.html" class="btn-home-link">🏠 首頁</a>'
);

fs.writeFileSync('h:/PIRLS/quiz.html', html, 'utf8');
console.log('✅ Removed inline styles from mobile buttons');

// Add btn-mobile-switch class styles to CSS
let css = fs.readFileSync('h:/PIRLS/assets/css/quiz.css', 'utf8');

// Find where to add the new styles (after user-info-bar section)
const newButtonClass = `
/* Mobile切換按鈕樣式 */
.btn-mobile-switch {
    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
    border: 1px solid #dee2e6;
    color: #495057;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.btn-mobile-switch:active {
    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
    transform: scale(0.96);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
`;

// Check if it already exists
if (!css.includes('.btn-mobile-switch')) {
    // Find #user-info-bar button section and add after it
    css = css.replace(
        /#user-info-bar button:hover {[^}]+}/,
        match => match + '\n' + newButtonClass
    );
    fs.writeFileSync('h:/PIRLS/assets/css/quiz.css', css, 'utf8');
    console.log('✅ Added .btn-mobile-switch styles');
} else {
    console.log('✅ .btn-mobile-switch styles already exist');
}

console.log('\n✅ Mobile buttons fully optimized!');
