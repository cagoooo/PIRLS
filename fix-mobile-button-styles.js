const fs = require('fs');

// Read quiz.css
let css = fs.readFileSync('h:/PIRLS/assets/css/quiz.css', 'utf8');

// Remove old mobile button styles (lines 555-582)
const oldMobileStyles = `.btn-switch {
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

// Check if .btn-home-link already exists
const hasNewStyles = css.includes('.btn-home-link {');

if (hasNewStyles) {
    console.log('✅ New styles (.btn-home-link) already exist');
    // Just remove the old conflicting styles
    css = css.replace(oldMobileStyles, '/* Mobile button styles - see #user-info-bar section */');
} else {
    console.log('⚠️  New styles not found, will add them');
    // Replace old styles with new comprehensive styles
    const newMobileStyles = `/* Mobile top bar buttons - optimized styles */
#user-info-bar button {
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

#user-info-bar button:active {
    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
    transform: scale(0.96);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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

    css = css.replace(oldMobileStyles, newMobileStyles);
}

fs.writeFileSync('h:/PIRLS/assets/css/quiz.css', css, 'utf8');
console.log('✅ Mobile button styles fixed');

// Also check HTML to ensure it uses btn-home-link class
const html = fs.readFileSync('h:/PIRLS/quiz.html', 'utf8');
if (html.includes('class="btn-home-link"')) {
    console.log('✅ HTML already uses btn-home-link class');
} else {
    console.log('⚠️  HTML needs to be updated to use btn-home-link class');
}

console.log('\n✅ All mobile fixes applied!');
