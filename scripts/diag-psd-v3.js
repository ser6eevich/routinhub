const fs = require('fs');
const { createCanvas, ImageData } = require('canvas');
const { readPsd, initializeCanvas } = require('ag-psd');

initializeCanvas(createCanvas, (w, h) => new ImageData(w, h));

const buffer = fs.readFileSync('public/templates/cover-template.psd');
const psd = readPsd(buffer);

console.log('PSD Resolution:', psd.width, 'x', psd.height);
const findLayer = (layers, name) => {
    for (const l of layers) {
        if (l.name === name) return l;
        if (l.children) {
            const found = findLayer(l.children, name);
            if (found) return found;
        }
    }
    return null;
};

const layer = findLayer(psd.children || [], 'text_title');
if (layer) {
    if (layer.text) {
        console.log('--- Text Metadata ---');
        console.log('Full Text object:', JSON.stringify(layer.text, null, 2));
    }
}
