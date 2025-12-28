const fs = require('fs');

// Read file
const content = fs.readFileSync('h:/PIRLS/assets/css/quiz.css', 'utf8');

console.log('=== First 300 characters ===');
console.log(content.substring(0, 300));

console.log('\n=== Checking encoding issues ===');
const firstLines = content.split('\n').slice(0, 10);
firstLines.forEach((line, i) => {
    if (line.includes('PIRLS') || line.includes('CSS')) {
        console.log(`Line ${i + 1}: ${line}`);
    }
});
