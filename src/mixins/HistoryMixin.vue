<template>
    <div></div>
</template>
<script>

import { History } from "../classes";

const history = new History();
export default {
    data() {
        return {
            storedCounter: 0,
            backCounter: 0,
        };
    },
    methods: {
        clearHistory() {
            history.clear();
            this.storedCounter = 0;
        },
        writeHistory() {
            this.backCounter = 0;
            if(this.storedCounter < history.size) 
                this.storedCounter++;
            history.forward();
            history.put({
                tool: this.currentTool,
                layer: this.currentLayer,
                state:  this.currentLayer.ctx.getImageData(0, 0, this.sizes_hr.width, this.sizes_hr.height)
            });          
        },
        writeHistoryAction(params) {
            this.backCounter = 0;
            if(params.action == "mergeLayers" || params.action == "splitLayers") {
                params.state = params.layers[0].ctx.getImageData(0, 0, this.sizes_hr.width, this.sizes_hr.height);
            }
            if(params.action == "setSize") {
                params.state = this.layers.map(l => l.ctx.getImageData(0, 0, this.sizes_hr.width, this.sizes_hr.height));
            }
            history.forward();
            history.put(params);
        },
        undoLastAction() {
            let c = this.backCounter;
            this.storedCounter -= 2;
            const sshot = history.get();
            if(sshot) {
                history.back();
                this.processShot(sshot);
                history.back();                
            }
            this.backCounter = ++c;
        },
        redoLastAction() {
            if(this.backCounter) {
                let c = this.backCounter;
                history.forward();
                const sshot = history.get();       
                if(sshot) {
                    history.back();   
                    this.processShot(sshot);                    
                }
                this.backCounter = --c;
            }
        },
        processShot(sshot) {        
            if(sshot.action) {
                if(sshot.action == "appendLayer") {
                    this.selectLayer(sshot.prev.id);
                    this.removeLayer(sshot.layer.id);
                }
                if(sshot.action == "removeLayer") {
                    this.restoreLayer(sshot.layer, sshot.index);
                }
                if(sshot.action == "mergeLayers") {
                    sshot.layers[0].ctx.clearRect(0, 0,  this.sizes_hr.width, this.sizes_hr.height);
                    sshot.layers[0].ctx.putImageData(sshot.state, 0, 0);
                    this.splitLayers(sshot.layers);
                }
                if(sshot.action == "splitLayers") {
                    sshot.layers[0].ctx.clearRect(0, 0,  this.sizes_hr.width, this.sizes_hr.height);
                    sshot.layers[0].ctx.putImageData(sshot.state, 0, 0);
                    this.mergeLayers(sshot.layers.map(l => l.id));
                }
                if(sshot.action == "clipToNewLayer") {
                    this.writeHistoryAction({
                        ...sshot,
                        action: "undoClipToNewLayer",
                    });
                    sshot.layer.ctx.clearRect(0, 0,  this.sizes_hr.width, this.sizes_hr.height);
                    sshot.layer.ctx.putImageData(sshot.state, 0, 0);
                    sshot.layer.ctx.drawImage(sshot.selection.sourceCopy.canvas, 0, 0);
                    this.layers.splice(sshot.index, 1);
                    this.selectLayer(sshot.layer.id);       
                    this.render();
                }
                if(sshot.action == "undoClipToNewLayer") {
                    sshot.layer.ctx.clearRect(0, 0,  this.sizes_hr.width, this.sizes_hr.height);
                    sshot.layer.ctx.putImageData(sshot.state, 0, 0);              
                    this.appendClipped(this.createLayer("", {
                        img: sshot.selection.imgCtx.canvas,
                        x: 0, y: 0,
                        ...this.sizes_hr
                    }), sshot.selection);
                    this.render();
                }
                if(sshot.action == "setSize") {
                    this.setSize(sshot.prev);
                    sshot.state.forEach((s, i) => {
                        this.layers[i].ctx.clearRect(0, 0,  this.sizes_hr.width, this.sizes_hr.height);
                        this.layers[i].ctx.putImageData(s, 0, 0);  
                    });
                    this.render();
                }
                if(sshot.action == "reorderLayer") {
                    this.reorderLayer({oldIndex: sshot.newIndex, newIndex: sshot.oldIndex});
                }
                if(sshot.action == "transform") {
                    this.transformCanvas({
                        flip: sshot.flip,
                        rotate: sshot.rotate ? - sshot.rotate : null
                    });
                    
                }

            } else {
                this.writeHistory();
                if(sshot.layer) {
                    if(sshot.tool.indexOf("selection") == 0 && this.selection) {
                        this.resetSelection();
                    } else {
                        sshot.layer.ctx.clearRect(0, 0,  this.sizes_hr.width, this.sizes_hr.height);
                        sshot.layer.ctx.putImageData(sshot.state, 0, 0);
                    }
                    if(sshot.layer !== this.currentLayer) 
                        this.selectLayer(sshot.layer.id);
                    else this.render();
                }               
            }                     
        },

    }
}

</script>