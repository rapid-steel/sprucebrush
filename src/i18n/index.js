import Vue from "vue"
import VueI18n from 'vue-i18n'

Vue.use(VueI18n);
export default new VueI18n({
    locale: 'en',
    messages: {
        en: {
            title: "Vasya's cheap photoshop",
            common: {
                ok: "Ok",
                save: "Save",
                close: "Close"
            },           
            topPanel: {
                newDrawing: {
                    title: "New drawing"
                },
                importMenu: {
                    title: "Import image",
                    leave: "Keep sizes, place to center",
                    'resize-img': "Adjust image size to canvas",
                    "resize-canvas": "Adjust canvas size to image"
                },
                sizesForm: {
                    title: "Change sizes",
                    width: "Width", height: "Height",
                    transform: "Transform the content",
                    resize: "Resize",
                    move: "Move"
                },
                filtersList: {
                    title: "Filters",
                    grayscale: {title: "Grayscale"},
                    invert: {title: "Invert"},
                    sepia: {title: "Sepia"},
                    'bright-contr': { title: "Brightness/contrast", brightness: "Brightness", contrast: "Contrast"},
                    'hue-saturate': { title: "Hue/saturation", hue: "Hue", saturation: "Saturation", luminance: "Luminance"},
                    duotone: { title: "Duotone", colors: "Colors" },
                    blur: {  title: "Blur", radius: "Radius" },
                    pixelate: { title: "Pixelation", size: "Pixel size"},
                    posterize: { title: "Posterization", levels: "Number of levels"},
                    ripple: {title: "Ripple", scale: "Scale", frequency: "Frequency"},
                    stereo: { title: "3D anaglyth effect"}
                },
                saveImage: {title: "Save image"}
            },
            layers: {
                layers: "Layers",
                newLayer: "Layer"
            },
            gradientCreator: {
                moveLeft: "Move color to left",
                remove: "Remove color",
                moveRight: "Move color to right"
            },
            colorPicker: {
                newPallete: "New pallete"
            },
            instruments: {
                instruments: {
                    brush: "Brush",
                    eraser: "Eraser",
                    fill: "Filling tool",
                    picker: "Color picker",
                    marker: "Roller",
                    pen: "Pen",
                    gradient: "Gradient",
                    "selection-rect": "Rectangular selection",
                    "selection-polygon": "Polygonal selection",
                    "selection-lasso": "Freehand selection",
                },
                settings: {
                    radius: "Diameter", 
                    blurRadius: "Softness",
                    lineWidth: "Width",
                    curveSmoothing: "Smooth curve",
                    angleSmoothing: "Smooth angle",
                    opacity: "Opacity",                
                    spacing: "Spacing",
                    tolerance: "Tolerance", 
                    shape: "Shape",
                    texture: "Texture",
                    textureColor: "Colorize",
                    importTexture: "Import texture",
                    pattern: "Pattern",
                    importPattern: "Import pattern",
                    pixel: "Pixel",
                    linearGradient: "Linear gradient",
                    length: "Length",
                    radialGradient: "Radial gradient",
                    createGradient: "Create gradient",
                    none: "None"
                },
                selection: {
                    apply: "Apply",
                    reset: "Reset",
                    crop: "Crop image",
                    clipnewlayer: "Clip to new layer",
                    all: "Select all"
                },
            }
        },
        ru: {
            title: "Китайский васин фотошоп",
            common: {
                ok: "Ок",
                save: "Сохранить",
                close: "Закрыть"
            },           
            topPanel: {
                newDrawing: {
                    title: "Начать заново"
                },
                importMenu: {
                    title: "Импорт изображения",
                    leave: "Сохранить исходные размеры",
                    'resize-img': "Масштабировать до размера холста",
                    "resize-canvas": "Подстроить размер холста под изображение"
                },
                sizesForm: {
                    title: "Изменить размеры",
                    width: "Ширина", height: "Высота",
                    transform: "Как изменить содержимое",
                    resize: "Масштабировать",
                    move: "Переместить"
                },
                filtersList: {
                    title: "Фильтры",
                    grayscale: {title: "Градации серого"},
                    invert: {title: "Инвертировать"},
                    sepia: {title: "Сепия"},
                    'bright-contr': { title: "Яркость/контраст", brightness: "Яркость", contrast: "Контраст"},
                    'hue-saturate': { title: "Тон/насыщенность", hue: "Тон", saturation: "Насыщенность", luminance: "Светлота"},
                    duotone: { title: "Дуотон", colors: "Цвета" },
                    blur: {  title: "Размытие", radius: "Радиус" },
                    pixelate: { title: "Пикселизация", size: "Размер пикселя"},
                    posterize: { title: "Постеризация", levels: "Число порогов"},
                    ripple: {title: "Рябь", scale: "Величина", frequency: "Частота"}
                },
                saveImage: {title: "Сохранить в файл"}
            },
            layers: {
                layers: "Слои",
                newLayer: "Слой"
            },
            gradientCreator: {
                moveLeft: "Переместить влево",
                remove: "Удалить",
                moveRight: "Переместить вправо"
            },
            colorPicker: {
                newPallete: "Новая палитра"
            },
            instruments: {
                instruments: {
                    brush: "Кисть",
                    eraser: "Ластик",
                    fill: "Заливка",
                    picker: "Пипетка",
                    marker: "Валик",
                    pen: "Перо",
                    gradient: "Градиент",
                    "selection-rect": "Прямоуг-е выделение",
                    "selection-polygon": "Полигон-е выделение",
                    "selection-lasso": "Свободное выделение",
                },
                settings: {
                    radius: "Диаметр", 
                    opacity: "Непрозр-ть",                
                    spacing: "Промежуток",
                    tolerance: "Допуск", 
                    lineWidth: "Ширина",
                    curveSmoothing: "Сглаживание кривой",
                    angleSmoothing: "Сглаживание угла",
                    shape: "Форма",
                    texture: "Текстура",
                    importTexture: "Импорт текстуры",
                    pattern: "Шаблон",
                    importPattern: "Импорт шаблона",
                    pixel: "Пиксельный край",
                    linearGradient: "Линейный градиент",
                    length: "Длина",
                    radialGradient: "Рад. градиент",
                    createGradient: "Создать градиент",
                    none: "Нет"
                },
                selection: {
                    apply: "Применить выделение",
                    reset: "Сбросить выделение",
                    crop: "Обрезать холст по выделению",
                    all: "Выделить всё"
                },
            }            
        }
    }
});