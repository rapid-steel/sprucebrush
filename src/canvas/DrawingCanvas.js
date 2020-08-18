import {Brush, Marker} from "../webgl";
import CanvasBase from "./CanvasBase";

export default class DrawingCanvas extends CanvasBase {
    constructor() {
        super();
        this.currentColor = "#000000";
        this.canvasPattern = null;
    }
    init(el) {
        super.init(el);
        
        this.tempCtx =  document.createElement("canvas").getContext("2d");
        this.tempCtx2 = (new OffscreenCanvas(800, 600)).getContext("2d");
    
        this.brush = new Brush();
        this.marker = new Marker();       
    }
    setSize({width, height, px_ratio}) {
        
    }
    setToolSettings(settings) {
        this.currentColor = settings.color;
        if(settings.webglTool) {
            const {values, color, dynamics, gradient, texture, webglTool} = settings;
            const params = {
                values: Object.assign({}, values),
                dynamics, color, gradient, texture
            };
            if(values.radius) params.values.radius *= this.sizes.px_ratio;
            if(values.lineWidth) params.values.lineWidth *= this.sizes.px_ratio;

            this[webglTool].setParams(params);
        }
        if(settings.pattern) {
            if(!this.canvasPattern || 
                settings.pattern.src !== this.canvasPattern.img.src ||
                settings.pattern.scale !== this.canvasPattern.scale) {
                this.canvasPattern = {
                    scale: settings.pattern.scale,
                    img: new Image()
                };
                this.canvasPattern.img.onload = () => {
                    let c = document.createElement("canvas");
                    c.width = settings.pattern.scale * this.canvasPattern.img.width;
                    c.height = settings.pattern.scale * this.canvasPattern.img.height;
                    let ctx = c.getContext("2d");
                    ctx.drawImage(this.canvasPattern.img, 
                        0, 0, this.canvasPattern.img.width, this.canvasPattern.img.height, 
                        0, 0, c.width, c.height );

                    this.canvasPattern.pattern = 
                    this.tempCtx.createPattern(c, "repeat");
                };
                this.canvasPattern.img.src = settings.pattern.src;
            }
        } else this.canvasPattern = null;
    }
}