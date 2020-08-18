import {Selection, SelectionPath} from "../classes";

export default {
    created() {
        this.selection = null;
    },
    methods: {
        updateSelectionSource() {
            this.currentLayer.ctx.drawImage(
                this.selection.imgCtx.canvas, 
                0, 0, 
                this.currentLayer.ctx.canvas.width, 
                this.currentLayer.ctx.canvas.height
            );
        },
        newSelection() {
            const SelType = {
                rect: Selection,
                polygon: SelectionPath,
                lasso: SelectionPath
            }[this.currentSettings.type];

            this.selection = new SelType (
                this.lastPoint.coords, 
                this.selCtx, this.sizes.px_ratio, this.zoom);
        },
        dropSelection() {
            this.$store.commit("dropSelection");
            this.selection.drop();
            this.selection = null;
            this.setCursorSelAction();
        },
        startTransformSelection() {
            this.writeHistory();
            this.$store.commit("setActiveSelection");
            this.selection.startTransform(this.currentLayer.ctx);
        },
        copySelection(removeOriginal = false) {
            if(this.activeSelection) {            
                let c = document.createElement("canvas");
                c.width = this.selection.bbox[1][0] - this.selection.bbox[0][0];
                c.height = this.selection.bbox[1][1] - this.selection.bbox[0][1];
                let ctx = c.getContext("2d");      
                ctx.drawImage(this.selection.imgCtx.canvas, 
                    this.selection.bbox[0][0], this.selection.bbox[0][1],
                    c.width, c.height,
                    0, 0, c.width, c.height,
                );          
                c.toBlob(blob => {
                    navigator.clipboard.write([ // eslint-disable-next-line              
                        new ClipboardItem({[blob.type]: blob})              
                    ]).then(res => {
                        if(removeOriginal) {
                            this.dropSelection();
                        }
                    });
                });                
            }
        },
        applySelection() {
            if(this.activeSelection) {
                this.currentLayer.ctx.restore();
                this.currentLayer.ctx.globalCompositeOperation = "source-over";
                this.currentLayer.ctx.drawImage(
                    this.selection.imgCtx.canvas, 
                    0, 0, this.currentLayer.ctx.canvas.width, this.currentLayer.ctx.canvas.height);
                this.dropSelection();      
                this.setCursorSelAction();
                this.render();
            }
        },
        resetSelection() {
            if(this.selection) {
                this.currentLayer.ctx.drawImage(
                    this.selection.sourceCopy.canvas, 
                    0, 0, this.currentLayer.ctx.canvas.width, this.currentLayer.ctx.canvas.height);
                this.dropSelection();
                this.render();
            }    
        },
        cropSelection() {
            if(this.activeSelection) {
                let bbox = this.selection.getBbox();
                let rect = [bbox[0], bbox[1].map((b,i) => Math.round(b - bbox[0][i]))];
                this.applySelection();
    
                this.setSize({
                    width: rect[1][0],
                    height: rect[1][1],
                    origin: rect[0].map(r => -r)
                }, false);         
            }
        },
        clipToNewLayer() {
            if(this.activeSelection) {
                let layer = this._createLayer("", {
                    img: this.selection.imgCtx.canvas,
                    x: 0, y: 0,
                    ...this.sizes_hr
                });
                this.appendClipped(
                    layer, 
                    this.selection);
               this.dropSelection();
            }
        },
        appendClipped(layer, selection) {
            this.writeHistoryAction({
                action: "clipToNewLayer", 
                layer: this.currentLayer, 
                selection, index: this.currentLayerIndex+1,
                state: this.currentLayer.ctx.getImageData(0,0, this.sizes_hr.width, this.sizes_hr.height)
            });
            this.layers = this.layers.slice(0, this.currentLayerIndex+1)
            .concat([layer])
            .concat(this.layers.slice(this.currentLayerIndex+1));
            this.selectLayer(layer.id);
        },
        selectArea([p1, p2]) {
            const {width, height} = this.currentLayer.ctx.canvas;
            this.$store.commit("selectTool", "selection_rect");  
            this.selection = new Selection(p1,this.selCtx, this.sizes.px_ratio, this.zoom);
            this.selection.setPoint(p2);
            this.startTransformSelection();
        }, 
    }
}