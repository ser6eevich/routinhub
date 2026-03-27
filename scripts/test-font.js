const fs = require('fs');
const { createCanvas, registerFont } = require('canvas');
const path = require('path');

const fontPath = path.join(process.cwd(), 'public/templates/druktextwidecyr-medium.otf');
if (fs.existsSync(fontPath)) {
    try {
        // We register it with a specific name we control
        registerFont(fontPath, { family: 'DrukWide' });
        
        const canvas = createCanvas(200, 200);
        const ctx = canvas.getContext('2d');
        ctx.font = '20px "DrukWide"';
        const metrics = ctx.measureText('123');
        console.log('Font registered as DrukWide. Metrics width for "123":', metrics.width);
        
        // Let's also try to detect the internal name if we can... though canvas doesn't reveal it easily.
    } catch (e) {
        console.error('Registration failed:', e);
    }
} else {
    console.error('Font not found at', fontPath);
}
