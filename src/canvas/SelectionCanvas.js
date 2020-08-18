import {Selection, SelectionPath} from "../classes";
import CanvasBase from "./CanvasBase";

export default class SelectionCanvas extends CanvasBase {
    constructor() {
        super();
        this.active = false;
        this.selection = null;
        this.source = null;
    }
    init(el) {
        super.init(el);
    }
    setSize({width, height, px_ratio}) {
        
    }
    apply() {
        if(this.active) {
            this.updateSource();
            this.clear();        
        }
    }
    startTransform(drawingCanvas) {
        this.selection.startTransform(drawingCanvas.currentLayer.ctx);
        this.source = drawingCanvas.currentLayer;
        drawingCanvas.selection = this;
    }
    updateSource() {
        this.source.ctx.restore();
        this.source.ctx.globalCompositeOperation = "source-over";
        this.source.ctx.drawImage(
            this.selection.imgCtx.canvas, 
            0, 0, this.source.ctx.canvas.width, this.source.ctx.canvas.height);
    }
    reset() {
        if(this.active) {
            this.source.ctx.restore();
            this.source.ctx.globalCompositeOperation = "source-over";
            this.source.ctx.drawImage(
                this.selection.sourceCopy.canvas, 
                0, 0, this.source.ctx.canvas.width, this.source.ctx.canvas.height);
            this.clear();
        }
    }
    clear() {
        this.active = false;
        this.selection.clear();
        this.selection = null;
        this.source = null;
    }
    getSelectionBbox() {
        return this.selection.getBbox();
    }
}