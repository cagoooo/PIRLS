const fs = require('fs');
const path = require('path');

const sourceFile = path.join('h:', 'PIRLS', 'assets', 'css', 'quiz.css');
const backupFile = sourceFile + '.backup';

// Create backup
if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(sourceFile, backupFile);
    console.log('✅ Backup created:', backupFile);
}

// Read file with UTF-8
let content = fs.readFileSync(sourceFile, 'utf8');

// Remove duplicate BOM if exists
if (content.startsWith('\uFEFF\uFEFF')) {
    content = content.substring(2);
    console.log('✓ Removed duplicate BOM');
} else if (content.startsWith('\uFEFF')) {
    content = content.substring(1);
    console.log('✓ Removed BOM');
}

// Define replacements for garbled Chinese comments  
// Using regex to catch variations
content = content.replace(/PIR
const BOM = '\uFEFF';
fs.writeFileSync(sourceFile, BOM + content, 'utf8');

console.log(`\n✅ Encoding fixed! Total replacements: ${replacementCount}`);
console.log(`📁 File: ${sourceFile}`);
console.log(`📁 Backup: ${backupFile}`);
