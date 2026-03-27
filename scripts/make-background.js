const fs = require('fs');
const path = require('path');
const { createCanvas, ImageData } = require('canvas');
const { readPsd, initializeCanvas } = require('ag-psd');

initializeCanvas(createCanvas, (w, h) => new ImageData(w, h));

const TEMPLATE_PATH = 'public/templates/cover-template.psd';
const OUTPUT_PATH = 'public/templates/background.png';

console.log('Generating clean background from PSD...');

const buffer = fs.readFileSync(TEMPLATE_PATH);
const psd = readPsd(buffer);

// Recursively find and hide 'text_title' layer
const hideLayer = (layers, name) => {
    for (const l of layers) {
        if (l.name === name) {
            l.hidden = true;
            console.log(`Layer ${name} hidden.`);
        }
        if (l.children) hideLayer(l.children, name);
    }
};

hideLayer(psd.children || [], 'text_title');

// Render the composite WITHOUT the text layer
// ag-psd's readPsd with initializeCanvas populates .canvas on the root psd object
const canvas = psd.canvas;
if (canvas) {
    const outBuffer = canvas.toBuffer('image/png');
    fs.writeFileSync(OUTPUT_PATH, outBuffer);
    console.log('Clean background saved to:', OUTPUT_PATH);
} else {
    console.error('Failed to get composite canvas from PSD');
}
