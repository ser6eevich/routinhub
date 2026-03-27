const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

// --- ЖЕЛЕЗОБЕТОННЫЙ МЕТОД РЕГИСТРАЦИИ (ДО ХОЛСТА) ---
// Пытаемся использовать именно TTF (который пользователь добавил)
const fontPath = path.join(__dirname, '../public/templates/druktextwidecyr-medium.ttf');
const BACKGROUND_PATH = path.join(__dirname, '../public/templates/background.png');
const OUTPUT_PATH = path.join(__dirname, '../public/test-render-110426.png');

if (!fs.existsSync(fontPath)) {
    console.error(`[ОШИБКА] Файл шрифта не найден: ${fontPath}`);
} else {
    // 3. Регистрируем шрифт ДО создания холста
    registerFont(fontPath, { family: 'AntigravityFont' });
    console.log('[Система] Custom шрифт AntigravityFont успешно зарегистрирован!');
}

async function testRender() {
    console.log('--- Начинаем рендеринг теста 11.04.2026 ---');
    
    // Загружаем фон
    const bgImage = await loadImage(BACKGROUND_PATH);
    
    // Создаем холст ПОСЛЕ регистрации
    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext('2d');
    
    // Рисуем фон
    ctx.drawImage(bgImage, 0, 0);

    ctx.save();
    
    // ПРИМЕНЯЕМ ПОЛНУЮ МАТРИЦУ ДЛЯ ИСКАЖЕНИЯ (Skew + Scale + Rotate)
    // a=1.69, b=-0.17, c=0.016, d=1.70, tx=640, ty=459.4
    ctx.setTransform(1.692023, -0.176767, 0.016947, 1.700746, 640, 459.436);

    // СТИЛИ ЭФФЕКТОВ
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;
    
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 4. Используем имя шрифта в одинарных кавычках, как в инструкции
    ctx.font = "84px 'AntigravityFont'";
    
    ctx.fillText('11.04.26', 0, 0);
    ctx.restore();

    fs.writeFileSync(OUTPUT_PATH, canvas.toBuffer('image/png'));
    console.log('\n--- ОПЕРАЦИЯ ЗАВЕРШЕНА ---');
    console.log(`Посмотри результат: d:/coding/RoutinHub/public/test-render-110426.png`);
}

testRender().catch(err => console.error('[Fatal Error]:', err));
