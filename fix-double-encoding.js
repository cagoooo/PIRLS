const fs = require('fs');
const iconv = require('iconv-lite');

const sourceFile = 'h:/PIRLS/assets/css/quiz.css';
const backupFile = sourceFile + '.backup';

// Create backup
if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(sourceFile, backupFile);
    console.log('✅ Backup created');
}

// The file has double-encoded UTF-8 bytes
// Read as buffer and decode properly
const buffer = fs.readFileSync(sourceFile);

// Remove UTF-8 BOM if exists
let offset = 0;
if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    offset = 3;
}

// Read the rest as UTF-8, but the Chinese parts are wrong
let content = buffer.slice(offset).toString('utf8');

// The Chinese characters were originally UTF-8 encoded,
// then those bytes were interpreted as Latin-1,
// then saved as UTF-8 again.
// We need to reverse this: UTF-8 → Latin-1 bytes → UTF-8 decode

// Extract the garbled parts, convert back to Latin-1 bytes, then decode as UTF-8
function fixDoubleEncoding(text) {
    // Find all garbled patterns (Ã followed by strange chars)
    return text.replace(/[\u00C0-\u00FF][\u0080-\u00BF]+/g, (match) => {
        try {
            // Convert the garbled UTF-8 string back to Latin-1 bytes
            const latin1Bytes = Buffer.from(match, 'latin1');
            // Now decode those bytes as UTF-8
            return latin1Bytes.toString('utf8');
        } catch (e) {
            return match; // Keep original if conversion fails
        }
    });
}

content = fixDoubleEncoding(content);

// Save with UTF-8 BOM
const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
const contentBuffer = Buffer.from(content, 'utf8');
fs.writeFileSync(sourceFile, Buffer.concat([BOM, contentBuffer]));

console.log('✅ Encoding fixed!');
console.log('📄 Sample output:');
console.log(content.substring(0, 300));
