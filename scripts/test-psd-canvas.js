const fs = require('fs');
const { createCanvas, Image, ImageData } = require('canvas');
const { readPsd, initializeCanvas } = require('ag-psd');
initializeCanvas(createCanvas, (w, h) => new ImageData(w, h));

try {
    const buffer = fs.readFileSync('public/templates/cover-template.psd');
    const psd = readPsd(buffer, { skipLayerData: false, skipCompositeImageData: false });
    console.log('Main canvas exists:', !!psd.canvas);
    if (psd.canvas) {
        console.log('Canvas dimensions:', psd.canvas.width, 'x', psd.canvas.height);
        const out = fs.createWriteStream('public/test-psd-render.png');
        const stream = psd.canvas.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => console.log('The PNG file was created.'));
    }
} catch (e) {
    console.error('Error during test:', e);
}
