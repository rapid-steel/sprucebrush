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
            this.backCounter = 0;
            this.$store.commit("setHistoryCounter", {undo: 0, redo: 0});
        },
        writeHistory() {
            this.writeHistoryAction({
                tool: this.currentTool,
                layer: this.currentLayer,
            });     
        },
        writeHistoryAction(sshot) {
            this.backCounter = 0;
            this.storedCounter++;
            sshot = {
                ...sshot,
                ...this._getState(sshot)
            };
            history.forward();
            history.put(sshot);
            this.$store.commit("setHistoryCounter", {
                undo: this.storedCounter, 
                redo: this.backCounter
            });
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
            this.$store.commit("setHistoryCounter", {
                undo: this.storedCounter, 
                redo: this.backCounter
            });
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
            this.$store.commit("setHistoryCounter", {
                undo: this.storedCounter, 
                redo: this.backCounter
            });
        },
        // the idea is that every action is opposed to another action 
        // or to itself, with opposite parameters
        // so it's possible to move through history in any direction
        
        processShot(sshot) {        
            if(sshot.action) {
                if(sshot.action == "appendLayer") {
                    this.selectLayer(sshot.prev.id);
                    this.removeLayer(sshot.layer.id);
                    this._restoreState(sshot);
                }
                if(sshot.action == "removeLayer") {
                    this.restoreLayer(sshot.layer, sshot.index);
                    this._restoreState(sshot);
                }
                if(sshot.action == "mergeLayers") {                    
                    this.splitLayers(sshot.layers);
                    this._restoreState(sshot);
                }
                if(sshot.action == "splitLayers") {
                    this.mergeLayers(sshot.layers.map(l => l.id));
                    this._restoreState(sshot);
                }
                if(sshot.action == "clipToNewLayer") {
                    this.writeHistoryAction({
                        ...sshot,
                        action: "undoClipToNewLayer",
                    });                    
                    this.layers.splice(sshot.index, 1);
                    this.selectLayer(sshot.layer.id); 
                    this._restoreState(sshot);                   
                    this.render();
                }
                if(sshot.action == "undoClipToNewLayer") {                            
                    this.clipToNewLayer();
                   // this._restoreState(sshot);
                    this.render();
                }
                if(sshot.action == "setSize") {
                    this.setSize(sshot.prev);           
                    this._restoreState(sshot);         
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
                this._restoreState(sshot);
                if(sshot.layer) {
                    if(sshot.layer !== this.currentLayer) 
                        this.selectLayer(sshot.layer.id);
                    else this.render();
                }               
            }                     
        },

    }
};