Отличная мысль! Собрать всё в единый документ — правильный инженерный подход. Я обновил код и добавил новые параметры (тень и угол наклона) в ядро функции, чтобы модуль стал максимально гибким для «Рутина Хаб».

Теперь вы можете передавать угол наклона и настройки тени прямо из основного кода при вызове функции.

Вот полная, обновленная версия документации. Смело копируйте её в вашу базу знаний!

Документация модуля: Antigravity Render v2.0 (Canvas Render)
1. Общее описание
Antigravity Render — это внутренний микросервис платформы «Рутина Хаб», предназначенный для мгновенной генерации готовых изображений (обложек вебинаров, карточек и т.д.).

Модуль берет заранее подготовленную «пустую» фоновую картинку, загружает фирменный шрифт и программно отрисовывает текст по строго заданным координатам. Поддерживает умную подгонку размера текста (чтобы он не вылезал за края), а также визуальные эффекты из Photoshop: поворот (наклон) текста и падающую тень (Drop Shadow).

2. Стек и зависимости
Среда выполнения: Node.js

Библиотека: canvas (серверный движок рендеринга графики)

Установка зависимостей:

Bash
npm install canvas
3. Подготовка ассетов (Инструкция для дизайнера)
Для добавления нового шаблона в систему, дизайнер должен передать разработчику следующие данные:

Фон (background.jpg): Экспортированная картинка нужного разрешения (например, 1920x1080) с отключенным текстом даты.

Шрифт (font.ttf): Файл шрифта, который используется в макете.

Координаты (X, Y): Точка на пустом фоне, где должен находиться центр текста. (В Photoshop нажать F8 -> Панель «Инфо»).

Угол наклона: Если текст расположен по диагонали, дизайнер должен указать угол в градусах (например, -5 для наклона вверх).

Стили тени (Drop Shadow): Цвет, смещение (X, Y) и размытие тени (Blur), если она есть в макете.

4. Ядро модуля: Генерация с эффектами и авто-подгоном
Создайте файл antigravity-render.js и поместите туда этот код. Мы добавили объект options для гибкой настройки эффектов.

JavaScript
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');

// 1. Подключаем фирменный шрифт
registerFont('./assets/Montserrat-Bold.ttf', { family: 'AntigravityFont' });

/**
 * Главная функция генерации обложки
 * @param {string} text - Текст от пользователя (дата)
 * @param {number} x - Координата центра текста по горизонтали
 * @param {number} y - Координата центра текста по вертикали
 * @param {string} outputPath - Куда сохранить итог
 * @param {object} options - Дополнительные стили (тень, наклон)
 */
async function generateCover(text, x, y, outputPath, options = {}) {
    const width = 1920;
    const height = 1080;
    
    // Создаем холст и загружаем фон
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const background = await loadImage('./assets/background.jpg');
    ctx.drawImage(background, 0, 0, width, height);

    // Базовые настройки стиля
    let fontSize = options.fontSize || 80; // Размер по умолчанию
    ctx.fillStyle = options.color || '#FFFFFF'; // Цвет по умолчанию
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 2. УМНАЯ ПОДГОНКА РАЗМЕРА (Защита от длинного текста)
    const maxTextWidth = options.maxWidth || 1200; 
    ctx.font = `${fontSize}px "AntigravityFont"`;
    
    while (ctx.measureText(text).width > maxTextWidth) {
        fontSize -= 2;
        ctx.font = `${fontSize}px "AntigravityFont"`;
    }

    // 3. НАСТРОЙКА ТЕНИ (Drop Shadow)
    if (options.shadow) {
        ctx.shadowColor = options.shadow.color || 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = options.shadow.blur || 10;
        ctx.shadowOffsetX = options.shadow.offsetX || 0;
        ctx.shadowOffsetY = options.shadow.offsetY || 5;
    }

    // 4. ПОВОРОТ И ОТРИСОВКА
    ctx.save(); // Запоминаем прямое положение холста
    
    // Смещаем центр координат в нужную точку
    ctx.translate(x, y); 
    
    // Если передан угол поворота — применяем его (переводим градусы в радианы)
    if (options.angle) {
        const angleInRadians = options.angle * Math.PI / 180;
        ctx.rotate(angleInRadians);
    }

    // Рисуем текст в координатах (0, 0), так как мы уже сделали translate()
    ctx.fillText(text, 0, 0); 
    
    ctx.restore(); // Возвращаем холст в нормальное состояние

    // 5. СОХРАНЕНИЕ ФАЙЛА
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);
    console.log(`[Antigravity Render] Обложка готова: ${outputPath}`);
}

module.exports = { generateCover };
5. Пример вызова в основном коде «Рутина Хаб»
Теперь при создании проекта вы можете передавать любые настройки дизайна. Это делает систему универсальной для разных вебинаров.

JavaScript
const { generateCover } = require('./antigravity-render');

const userDate = "31 ДЕКАБРЯ, 20:00"; 
const newFileName = "./public/covers/webinar-new.jpg";

// Координаты из Photoshop
const coordX = 960;
const coordY = 800;

// Гибкие настройки дизайна для конкретного шаблона
const designOptions = {
    fontSize: 90,             // Стартовый размер шрифта
    color: '#FFD700',         // Золотой цвет текста
    angle: -5,                // Наклон вверх на 5 градусов
    shadow: {
        color: 'rgba(0, 0, 0, 0.8)', // Жесткая темная тень
        blur: 15,                    // Размытие тени
        offsetX: 2,                  // Смещение тени по горизонтали
        offsetY: 8                   // Смещение тени вниз
    }
};

// Запуск генерации
generateCover(userDate, coordX, coordY, newFileName, designOptions)
    .then(() => console.log("Успешно сгенерировано!"))
    .catch(err => console.error("Ошибка генерации:", err));
6. Решение возможных проблем
Текст отображается «квадратиками»: Убедитесь, что путь к файлу .ttf указан верно.

Текст крутится вокруг левого края, а не центра: Проверьте, что в коде строго указано ctx.textAlign = 'center'. Механизм поворота завязан на то, что текст выровнен по центру относительно координат X и Y.

Тень обрезается: Если тень очень большая (shadowBlur > 50), а текст близко к краю картинки, тень может визуально "упираться" в край холста. В таких случаях нужно корректировать координаты.