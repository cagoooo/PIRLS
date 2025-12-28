const fs = require('fs');

// Fix quiz.html - remove duplicate home icon
let html = fs.readFileSync('h:/PIRLS/quiz.html', 'utf8');

// Replace the line with duplicate 🏠
html = html.replace(
    /style="margin-left: 8px; color: var\(--secondary-color\); text-decoration: none; font-weight: bold;">🏠\s+🏠 首頁<\/a>/,
    'style="margin-left: 8px; color: var(--secondary-color); text-decoration: none; font-weight: bold;">🏠 首頁</a>'
);

fs.writeFileSync('h:/PIRLS/quiz.html', html, 'utf8');
console.log('✅ Fixed quiz.html - removed duplicate 🏠');

// Fix quiz.css - enhance button styles
let css = fs.readFileSync('h:/PIRLS/assets/css/quiz.css', 'utf8');

// Replace the button styles section
const oldStyles = `.user-info-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.btn-switch {
    background: #f8f9fa !important;
    border: 1px solid #dee2e6 !important;
    color: #495057 !important;
    padding: 6px 12px !important;
    border-radius: 6px !important;
    font-size: 0.85rem !important;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-switch:hover,
.btn-switch:active {
    background: #e9ecef !important;
    border-color: #adb5bd !important;
}

.btn-home {
    color: var(--secondary-color);
    text-decoration: none;
    font-weight: bold;
    font-size: 0.9rem;
    white-space: nowrap;
}

.btn-home:hover {
    text-decoration: underline;
}`;

const newStyles = `.user-info-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.btn-switch {
    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%) !important;
    border: 1px solid #dee2e6 !important;
    color: #495057 !important;
    padding: 6px 14px !important;
    border-radius: 20px !important;
    font-size: 0.85rem !important;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.btn-switch:active {
    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%) !important;
    transform: scale(0.96);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-home {
    color: white !important;
    background: linear-gradient(135deg, var(--secondary-color) 0%, #009a5e 100%);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.85rem;
    padding: 6px 14px;
    border-radius: 20px;
    margin-left: 8px;
    box-shadow: 0 2px 4px rgba(0, 168, 107, 0.3);
    transition: all 0.3s ease;
    display: inline-block;
    white-space: nowrap;
}

.btn-home:active {
    background: linear-gradient(135deg, #009a5e 0%, #008550 100%);
    transform: scale(0.96);
    box-shadow: 0 1px 2px rgba(0, 168, 107, 0.4);
}

.btn-home-link {
    color: white !important;
    background: linear-gradient(135deg, var(--secondary-color) 0%, #009a5e 100%);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.85rem;
    padding: 6px 14px;
    border-radius: 20px;
    margin-left: 8px;
    box-shadow: 0 2px 4px rgba(0, 168, 107, 0.3);
    transition: all 0.3s ease;
    display: inline-block;
    white-space: nowrap;
}

.btn-home-link:active {
    background: linear-gradient(135deg, #009a5e 0%, #008550 100%);
    transform: scale(0.96);
    box-shadow: 0 1px 2px rgba(0, 168, 107, 0.4);
}`;

css = css.replace(oldStyles, newStyles);

fs.writeFileSync('h:/PIRLS/assets/css/quiz.css', css, 'utf8');
console.log('✅ Fixed quiz.css - enhanced button styles');

console.log('\n✅ All fixes applied successfully!');
