const fs = require('fs');
const { createCanvas, ImageData } = require('canvas');
const { readPsd, initializeCanvas } = require('ag-psd');

initializeCanvas(createCanvas, (w, h) => new ImageData(w, h));

const buffer = fs.readFileSync('public/templates/cover-template.psd');
const psd = readPsd(buffer);

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
    console.log('--- Layer Details ---');
    console.log('Name:', layer.name);
    console.log('Effects:', JSON.stringify(layer.effects, null, 2));
    if (layer.text) {
        console.log('Text Transform:', layer.text.transform);
        console.log('Text Style:', JSON.stringify(layer.text.style, null, 2));
        console.log('Text Paragraph:', JSON.stringify(layer.text.paragraph, null, 2));
    }
} else {
    console.log('Layer not found');
}
