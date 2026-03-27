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
    console.log('Layer text_title properties:');
    console.log(JSON.stringify({
        top: layer.top,
        left: layer.left,
        right: layer.right,
        bottom: layer.bottom,
        opacity: layer.opacity,
        visible: layer.visible,
        text: layer.text ? {
            text: layer.text.text,
            transform: layer.text.transform,
            style: layer.text.style,
            paragraph: layer.text.paragraph
        } : 'NO TEXT DATA'
    }, null, 2));
} else {
    console.log('Layer text_title not found');
}
