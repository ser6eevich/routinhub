const fs = require('fs');
const path = require('path');
const { createCanvas, Image, ImageData } = require('canvas');
const { readPsd, writePsd, initializeCanvas } = require('ag-psd');

initializeCanvas(createCanvas, (w, h) => new ImageData(w, h));

const TEMPLATE_PATH = 'public/templates/cover-template.psd';
const OUTPUT_PATH = 'public/uploads/test_verify_date.psd';
const TEST_DATE = '11.04.26';

if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('Template not found!');
    process.exit(1);
}

const buffer = fs.readFileSync(TEMPLATE_PATH);
const psd = readPsd(buffer);

let found = false;
const processLayers = (layers) => {
    for (const layer of layers) {
        if (layer.name === 'text_title') {
            console.log('Found layer text_title. Original text:', layer.text ? layer.text.text : 'no text');
            if (layer.text) {
                layer.text.text = TEST_DATE;
                found = true;
            }
        }
        if (layer.children) processLayers(layer.children);
    }
};

processLayers(psd.children || []);

if (found) {
    const outBuffer = writePsd(psd);
    fs.writeFileSync(OUTPUT_PATH, Buffer.from(outBuffer));
    console.log(`Success! Verification PSD saved to ${OUTPUT_PATH} with date ${TEST_DATE}`);
} else {
    console.error('Layer text_title not found in PSD!');
}
