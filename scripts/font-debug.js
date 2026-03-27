const fs = require('fs');
const path = require('path');
const { createCanvas, registerFont } = require('canvas');

const FONT_PATH = path.join(__dirname, '../public/templates/druktextwidecyr-medium.otf');
const OUTPUT_PATH = path.join(__dirname, '../public/font-debug-test.png');

console.log('Testing font registration for:', FONT_PATH);

if (!fs.existsSync(FONT_PATH)) {
    console.error('Font file not found!');
    process.exit(1);
}

const namesToTest = ['DrukWide', 'Druk Text Wide Cyr', 'Druk Text Wide', 'CustomFont', 'Druk Text Wide Cyr Medium'];

const canvas = createCanvas(800, 600);
const ctx = canvas.getContext('2d');

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, 800, 600);
ctx.fillStyle = 'black';
ctx.textBaseline = 'top';

namesToTest.forEach((name, i) => {
    try {
        registerFont(FONT_PATH, { family: name });
        console.log(`Registered as: ${name}`);
        
        ctx.font = `40px "${name}"`;
        ctx.fillText(`${name}: 11.04.26 (Testing Font)`, 50, 50 + (i * 100));
        
        // Simple manual check: if width is same for all, it's falling back
        const metrics = ctx.measureText(`${name}: 11.04.26 (Testing Font)`);
        console.log(`  Metrics width for ${name}: ${metrics.width}`);
    } catch (e) {
        console.error(`  Failed for ${name}:`, e.message);
    }
});

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(OUTPUT_PATH, buffer);
console.log('Test image saved to:', OUTPUT_PATH);
console.log('Compare the widths in logs. If they are identical, they all fall back to default font.');
