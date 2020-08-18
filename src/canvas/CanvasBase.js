export default class CanvasBase {
    constructor() {
        this.sizes = {
            width: 800, 
            height: 600, 
            realWidth: 800,
            realHeight: 600,
            px_ratio: 1
        };
    }
    init(el) {
        this.mainCanvas = el;
        this.mainCtx = el.getContext("2d");
        this.mainCtx.imageSmoothingEnabled = false;
        this.mainCtx.save();
        this.mainCtx.translate(0.5, 0.5);
    }
}