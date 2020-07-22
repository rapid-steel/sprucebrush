import Vue from "vue"
import VueI18n from 'vue-i18n'

Vue.use(VueI18n);
export default new VueI18n({
    locale: 'en',
    messages: {
        en: {
            title: "Vasya's cheap photoshop",
            common: {
                ok: "Ok"
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
                    blur: {  title: "Blur", radius: "Radius" },
                    pixelate: { title: "Pixelation", size: "Pixel size"},
                    posterize: { title: "Posterization", levels: "Number of levels"}
                },
                saveImage: {title: "Save image"}
            },
        },
        ru: {
            title: "Китайский васин фотошоп",
            common: {
                ok: "Ок"
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
                    transform: "Как изменится содержимое",
                    resize: "Масштабировать",
                    move: "Переместить"
                },
                filtersList: {
                    title: "Фильтры",
                    grayscale: {title: "Градации серого"},
                    invert: {title: "Инвертировать"},
                    sepia: {title: "Сепия"},
                    'bright-contr': { title: "Яркость/контраст", brightness: "Яркость", contrast: "Контраст"},
                    blur: {  title: "Размытие", radius: "Радиус" },
                    pixelate: { title: "Пикселизация", size: "Размер пикселя"},
                    posterize: { title: "Постеризация", levels: "Число порогов"}
                },
                saveImage: {title: "Сохранить в файл"}
            },
        }
    }
});