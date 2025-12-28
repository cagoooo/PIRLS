const fs = require('fs');

// Read as binary buffer first
const buffer = fs.readFileSync('h:/PIRLS/assets/css/quiz.css');

console.log('First 200 bytes as hex:');
console.log(buffer.slice(0, 200).toString('hex'));

console.log('\nAs UTF-8 string:');
console.log(buffer.toString('utf8').substring(0, 300));

console.log('\nAs Latin1 string:');
console.log(buffer.toString('latin1').substring(0, 300));

console.log('\nSearching for "PIRLS" bytes...');
const pirlsIndex = buffer.indexOf(Buffer.from('PIRLS'));
if (pirlsIndex >= 0) {
    console.log('Found "PIRLS" at byte:', pirlsIndex);
    console.log('Context (50 bytes):');
    console.log(buffer.slice(pirlsIndex, pirlsIndex + 100).toString('utf8'));
}
