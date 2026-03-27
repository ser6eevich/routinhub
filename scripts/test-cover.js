const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'templates', 'cover-template.png');
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'test-cover-result.png');

async function testCover() {
    const title = 'ТЕСТОВЫЙ ПРОЕКТ';
    const date = '27.03.2026';
    const width = 1280;
    const height = 720;

    console.log('Starting cover generation test...');
    
    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error('Template not found at:', TEMPLATE_PATH);
        return;
    }

    try {
        const svgBuffer = Buffer.from(`
          <svg width="${width}" height="${height}">
            <text x="80" y="400" font-family="Arial, sans-serif" font-size="84" font-weight="900" fill="white" style="font-style: italic;">
              ${title.toUpperCase()}
            </text>
            <rect x="80" y="440" width="120" height="8" fill="#4f46e5" rx="4" />
            <text x="80" y="520" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#94a3b8">
              ${date}
            </text>
          </svg>
        `);

        await sharp(TEMPLATE_PATH)
            .resize(width, height)
            .composite([{ input: svgBuffer, top: 0, left: 0 }])
            .png()
            .toFile(OUTPUT_PATH);

        console.log('Cover generated successfully at:', OUTPUT_PATH);
    } catch (err) {
        console.error('Error during generation:', err);
    }
}

testCover();
