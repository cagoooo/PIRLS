import fs from 'fs';

const indexPath = 'h:\\\\PIRLS\\\\index.html';
let content = fs.readFileSync(indexPath, 'utf-8');

// 替換 Service Worker 註冊邏輯
const oldSW = `                const swPath = window.location.pathname.includes('/') ? getBasePath() + '/sw.js' : '/sw.js';`;

const newSW = `                // Calculate base path directly
                const pathname = window.location.pathname;
                const lastSlashIndex = pathname.lastIndexOf('/');
                const basePath = pathname.substring(0, lastSlashIndex);
                const swPath = basePath ? \`\${basePath}/sw.js\` : '/sw.js';
                
                console.log('[SW] Attempting to register Service Worker:', swPath);`;

if (content.includes(oldSW)) {
    content = content.replace(oldSW, newSW);
    fs.writeFileSync(indexPath, content, 'utf-8');
    console.log('✅ Service Worker registration fixed!');
} else {
    console.log('⚠️ Target code not found, SW registration might already be fixed');
}
