<template>
<div id="app" 
    :class="viewMode"
    @click.prevent>    
    <div class="panel left">
    <Toolbox
        @apply-selection="applySelection"
        @reset-selection="resetSelection"
        @select-all="() => selectArea([[0,0], [sizes.width, sizes.height]])"
        
    />
    </div>
    <div id="center">
        <div class="panel top" @click.prevent>
            <TopPanel 
                ref="topPanel"
                :sizes="sizes"
                @new-drawing="newDrawing"
                @change-sizes="setSize"
                @save-image="saveToFile"
                @import-image="e => pasteImageFromFile(...e)"
                @apply-filter="applyFilter"
                @cancel-preview-filter="cancelPreviewFilter"
                @preview-filter="previewFilter"
                @transform-canvas="transformCanvas"
            />
        </div>
        <div id="wrapper" 
            ref="wrapper">
            <div id="canvas-container" 
                @dragenter.prevent
                @dragover.prevent
                @drop.prevent="dropFile"
                ref="container">
                <div id="canvas" 
                    ref="canvas">
                <canvas ref="mainCanvas"   id="mainCanvas" ></canvas>
                <canvas ref="selection" id="selection"></canvas>
            </div>
            <div id="cursor" ref="cursor"
                :class="[shortcutTool||currentTool, ...cursorClasses]"></div>
            </div>
            <ContextMenu 
                v-if="contextMenu.show"
                :position="contextMenu.position"
                @apply-selection="applySelection"
                @reset-selection="resetSelection"
                @crop-selection="cropSelection"
                @clear-selection="clearSelection"
                @clipnewlayer-selection="clipToNewLayer"
                @close="() => contextMenu.show = false"
             />
        </div>
        <div class="panel bottom">
            <StatusBar
                @switch-view-mode="switchViewMode"
                @undo="undoLastAction"
                @redo="redoLastAction"
                @zoom-in="() => changeZoom(1)"
                @zoom-out="() => changeZoom(-1)"
            />
        </div>
    </div>
    <div class="panel right">
        <Color-Picker 
            :colorToEdit.sync="colorToEdit" 
        />
        <Layers 
            :layers="layers" 
            :currentLayer="currentLayer"
            @add-layer="appendLayer"
            @copy-layer="copyCurrentLayer"
            @layer-to-selection="layerToSelection"
            @select-layer="selectLayer"
            @reorder-layer="reorderLayer"
            @toggle-layer="toggleLayer"
            @remove-layer="removeLayer"
            @merge-layers="mergeLayers"
            @update:opacity="render"
            @update:blend="render"
            @toggle="toggleLayerProp"
        />
    </div>
    <img id="logo" src="./assets/img/пушинка.png">
    <svg style="position: fixed; z-index: -1;">
        <defs>
            <clipPath id="selectionClipPath">
                <path id="sClip" fill="black"/>
            </clipPath>        
            <filter id="outline">
                <feMorphology operator="dilate" radius=".5" result="dil" />
                <feMorphology operator="dilate" radius="1" result="dil1" />      
                <feComponentTransfer in="dil1" result="dil1w">
                    <feFuncR type="discrete" tableValues="1"></feFuncR>
                    <feFuncG type="discrete" tableValues="1"></feFuncG>
                    <feFuncB type="discrete" tableValues="1"></feFuncB>
                </feComponentTransfer>          
                <feComposite in="SourceGraphic" in2="dil" operator="xor" result="comp"/>   
                <feComposite in="SourceGraphic" in2="dil1w" operator="xor" result="comp1"/>  
                <feComposite in="comp" in2="comp1" operator="xor" result="comp2"/>      
                <feOffset in="comp2" dx="-3" dy="-3"/>           
            </filter>
             <filter id="bold">
                <feMorphology operator="dilate" radius="1" result="bold" />      
                <feComposite in="SourceGraphic" in2="bold" result="res"/>   
            </filter>
            <filter id="posterize">
                <feComponentTransfer color-interpolation-filters="sRGB">
                    <feFuncR type="discrete" tableValues="0 1" />
                    <feFuncG type="discrete" tableValues="0 1" />
                    <feFuncB type="discrete" tableValues="0 1" />
                </feComponentTransfer>
            </filter>
            <filter id="pixelate" x="0" y="0">
                <feFlood x="4" y="4" height="2" width="2"/>          
                <feComposite width="10" height="10"/>          
                <feTile result="a"/>          
                <feComposite in="SourceGraphic" in2="a" 
                            operator="in"/>          
                <feMorphology operator="dilate"
                                radius="5"/>
            </filter>
            <filter id="luminance">                
                <feColorMatrix type="matrix" id="lum-matrix" values="" />
            </filter>
            <filter id="duotone">                
                <feComponentTransfer color-interpolation-filters="sRGB">
                    <feFuncR type="table" tableValues=""></feFuncR>
                    <feFuncG type="table" tableValues=""></feFuncG>
                    <feFuncB type="table" tableValues=""></feFuncB>
                </feComponentTransfer>
            </filter>
                <filter id="ripple">
                    <feTurbulence type="fractalNoise" baseFrequency=".01"
                    numOctaves="1" result="ripple"/>  
                <feDisplacementMap in2="ripple" in="SourceGraphic"
                scale="100" xChannelSelector="R" yChannelSelector="B"/>
            </filter>
            <filter id="stereo">                
                <feOffset in="SourceGraphic" dx="-10" dy="0" result="R1"/>
                <feOffset in="SourceGraphic" dx="10" dy="0" result="L1"/>
            
                <feComponentTransfer in="L1" result="L2">
                    <feFuncR type="identity"></feFuncR>
                    <feFuncG type="discrete" tableValues="0"></feFuncG>
                    <feFuncB type="discrete" tableValues="0"></feFuncB>
                </feComponentTransfer>

                <feComponentTransfer in="R1" result="R2">
                    <feFuncR type="discrete" tableValues="0"></feFuncR>
                    <feFuncG type="identity"></feFuncG>
                    <feFuncB type="identity"></feFuncB>
                </feComponentTransfer>

                <feBlend in="L2" in2="R2" mode="screen" />
            </filter>
        </defs>
        
    </svg>
</div>
</template>

<script>
import {mapState, mapGetters} from "vuex";
import { saveAs } from 'file-saver';
import JSZip from 'jszip';



import Toolbox from "./components/Toolbox";
import ColorPicker from "./components/ColorPicker";
import Layers from "./components/Layers";
import TopPanel from "./components/TopPanel";
import StatusBar from "./components/StatusBar";
import ContextMenu from "./components/ContextMenu";

import FilterMixin from "./mixins/FilterMixin.js";
import HistoryMixin from "./mixins/HistoryMixin.js";
import CanvasMixin from "./mixins/CanvasMixin.js";
import SelectionMixin from "./mixins/SelectionMixin.js";
import CursorMixin from "./mixins/CursorMixin.js";


import {angle, sum, vec, angle_signed, rotateX, rotateY, invert, length} from "./functions/vector-functions";

 const BTN = Object.freeze({
    NONE:   0x1,
    LEFT:   0x2,
    MIDDLE: 0x4,
    RIGHT:  0x8,
});

const DBCLICK = Object.freeze({
    MS_MAX: 300,
    LENGTH_MAX: 3
});


export default {
    name: 'app',
    data() {
        return {
            layers: [],
            canvasSizes: {},
            sizes: {
                width: 800,
                height: 600,
                px_ratio: 1
            },
            lastPoint: null,
            currentLayer: null,
            currentLayerIndex: 0,
            shortcutTool: false,
            error: false,
            colorToEdit: "fg",
            contextMenu: {
                show: false,
                position: [0, 0]
            },
            translation: false,
            rotation: false
        }
    },
    components: {
        Toolbox, ColorPicker, Layers, TopPanel, StatusBar, ContextMenu
    },
    mixins: [FilterMixin, HistoryMixin, CanvasMixin, SelectionMixin, CursorMixin],
    computed: {
        ...mapState(['currentTool', 'currentColor', 'zoomLevels', 'activeSelection', 'colorBG', 'viewMode', 'zoom', 'title']),
        ...mapGetters(['currentSettings']),
        historySize() {
            return this.$store.state.userPrefs.historySize;
        },
        rotationAngle() {
            return this.$store.state.currentToolSettings.rotation.values.rAngle;
        }
    },
watch: {
    currentColor() {
        this.setToolParams();
    },
    rotationAngle() {
        let ra = this.rotationAngle / 180 * Math.PI;
        this.$refs.canvas.style.transformOrigin = "center"
        this.$refs.canvas.style.transform = ` translate3d(-50%,-50%,0)rotate(${this.rotationAngle}deg)`;
        this._setContainerSize();
    },
    currentSettings: {
        deep: true,
        handler(val, prev) {
            this.setCursor();
            this.setToolParams();
        }
    },
    currentTool() {
        if(!this.shortcutTool)
            this.pointerActions = this.pointerActionsMap[this.currentTool];

        this.setToolParams();
        this.setCursor();    
    
        if(this.selection) {            
            if(this.currentTool.indexOf("selection") == 0)
                this.startTransformSelection();
            else 
                this.updateSelectionSource();
        }        
    }
},
created() {
    this.pointerKeyMap = {
        down: {
            [BTN.MIDDLE]: e => this.setShortcutTool("hand", e),
        }
    };
    this.pointerActionsMap = {
        brush: {
            btn: BTN.LEFT,
            down: () => this.draw(this.lastPoint, this.brush),
            move: () => this.draw(this.lastPoint, this.brush),
            up:   () => this.endDraw(this.lastPoint, this.brush),
            out:  () => {}
        },
        eraser: {
            btn: BTN.LEFT,
            down: () => this.erase(this.lastPoint),
            move: () => this.erase(this.lastPoint),
            up:   () => this.endErase(this.lastPoint),
            out:  () => {},
        },
        marker: {
            btn: BTN.LEFT,
            down: () => this.draw(this.lastPoint, this.marker),
            move: () => {     
                    this.draw(this.lastPoint, this.marker);
                    this.setCursorAngle(this.marker);
            },
            up: () => {
                this.endDraw(this.lastPoint, this.marker);
                this.setCursorAngle(this.marker);
            },
            out: () => {},
        },

        fill: {
            btn: BTN.LEFT | BTN.RIGHT,
            down: () => this.fill(this.lastPoint.coords, {
                [BTN.RIGHT]: this.colorBG, 
                [BTN.LEFT]: this.currentColor
            }[this.lastEvent.btn]),
            move: () => {},
            up:   () => {},
            out:  () => {}
        },
        picker: {
            btn: BTN.LEFT | BTN.RIGHT,
            down: () => this.pickColor(this.lastPoint.coords, this._getColor()),
            move: () => this.pickColor(this.lastPoint.coords, this._getColor()),
            up:   () => {},
            out:  () => {}
        },
        selection_rect: {
            btn: BTN.LEFT,
            down: () => {
                if(!this.selection) {
                    this.newSelection();
                } else {
                    this.selection.applyTransform(this.lastPoint.coords, true);              
                }    
            },
            move: () => {                 
                if( this.selection) {
                    if(!this.selection.started) { 
                        this.selection.setPoint(this.lastPoint.coords); 
                    } else {
                        this.selection.applyTransform(this.lastPoint.coords, false, this.restrictedToAxis);         
                    }         
                }
                this.render();
            },
            up: () => {
                if(!this.selection.started) {
                    this.startTransformSelection();
                }
                this.render();
            },
            out: () => {}        
        },
        selection_polygon: {
            btn: BTN.LEFT | BTN.NONE,
            down: () => {
                if(!this.selection) {
                    this.newSelection();
                } else {
                    if(!this.selection.started) {
                        this.selection.addPoint(this.lastPoint.coords); 
                    } else {
                        this.selection.applyTransform(this.lastPoint.coords, true);     
                    }            
                }       
                this.render();
            },
            move: () => {
                if(this.lastEvent.btn == BTN.LEFT && this.selection.started) {
                    this.selection.applyTransform(this.lastPoint.coords, false, this.restrictedToAxis);
                }
                if(this.lastEvent.btn == BTN.NONE && this.selection && !this.selection.started) {
                    this.selection.setPoint(this.lastPoint.coords);           
                }
                this.render();
            },
            up: () => {
                if(this.selection && !this.selection.started && this.lastEvent.dblClick) {
                    this.startTransformSelection();
                }
                this.render();
                
            },
            out: () => {}
        },
        selection_lasso: {
            btn: BTN.LEFT,
            down: () => {
                if(!this.selection) {
                    this.newSelection();
                    } else {
                        this.selection.applyTransform(this.lastPoint.coords, true);    
                    }       
                this.render();
            },
            move: () => {
                if(this.selection){ 
                    if(!this.selection.started) 
                        this.selection.addPoint(this.lastPoint.coords); 
                    else if(this.pressure > 0)   
                        this.selection.applyTransform(this.lastPoint.coords, false, this.restrictedToAxis);
                    }
                this.render();
            },
            up: () => {
                if(this.selection && !this.selection.ready) {
                    this.startTransformSelection();
                }  
                this.render();
            },
            out: () => {}              
        },
        hand: {
            btn: BTN.LEFT | BTN.MIDDLE,
            down: () => this.startTranslateCanvas(),
            move: () => this.translateCanvas(),
            up:   () => this.endTranslateCanvas(),
            out:  () => {}
        },
        rotation: {
            btn: BTN.LEFT,
            down: () => this.startRotateCanvas(),
            move: () => this.rotateCanvas(),
            up:   () => this.endRotateCanvas(),
            out:  () => {}
        }
    };

    this.keyCodeMap = {        
        ctrlKey: {
            KeyA: e => {
                e.preventDefault();              
                this.selectArea([
                    [0,0], [this.sizes.width, this.sizes.height]
                ]);
            },
            KeyT: e => {
                e.preventDefault();
                this.cropSelection();
            }, 
            KeyE: e => {
                e.preventDefault();
                let ind = this.layers.indexOf(this.currentLayer);
                if(ind > 0) 
                    this.mergeLayers( 
                        this.layers.slice(ind-1, ind+1).map(l => l.id)
                    );
            },
            KeyS: e => {
                e.preventDefault();
                this.saveToFile();
            },
            KeyN: e => {
                e.preventDefault();
                this.newDrawing();
            },
            KeyX: e => this.copySelection(true),
            KeyC: e => this.copySelection(),
            KeyV: e => {
                this.applySelection();
                this.pasteFromClipboard();
            },
            KeyZ: e => {
                e.preventDefault();
                this.undoLastAction();  
            },
            KeyY: e => {
                e.preventDefault();
                this.redoLastAction();
            },
            NumpadAdd: e => {
                e.preventDefault();
                this.changeZoom(1);
            },
            Equal: e => {
                e.preventDefault();
                this.changeZoom(1);
            },
            NumpadSubtract: e => {
                e.preventDefault();
                this.changeZoom(-1);
            },
            Minus: e => {
                e.preventDefault();
                this.changeZoom(-1);
            },
            ControlLeft: e => {
                this.restrictToStraight(e);
            },
            ControlRight: e => {
                this.restrictToStraight(e);
            },
        },
        Enter: e => {
            e.preventDefault();
            this.applySelection();
        },
        AltLeft: e => {
            e.preventDefault();
            this.setShortcutTool("picker", e);
        },
        AltRight: e => {
            e.preventDefault();
            this.setShortcutTool("picker", e);
        },
        ShiftLeft: e => {
            this.restrictToAxis(e);
        },
        ShiftRight: e => {
            this.restrictToAxis(e);
        },
        Delete: e => {
            if(this.activeSelection) {
                this.clearSelection();
            } else if(this.selection) {
                if(this.selection.type == "polygon") {
                    if(this.selection.path.length > 2) {
                        this.selection.removePoint();
                        this.selection.setPoint(this.lastPoint.coords);
                    } else this.dropSelection();
                }
            }
        },
        KeyB: e => this.$store.commit("selectTool", "brush"),
        KeyE: e => this.$store.commit("selectTool", "eraser"),
        KeyR: e => this.$store.commit("selectTool", "marker"),
        KeyF: e => this.$store.commit("selectTool", "fill"),
        KeyC: e => this.$store.commit("selectTool", "picker"),
        KeyS: e => this.$store.commit("selectTool", "selection_rect"),
        KeyD: e => {
            this.$store.commit("selectColor", ["fg", "#000000"]);
            this.$store.commit("selectColor", ["bg", "#ffffff"]);
        },
        KeyW: e => this.switchViewMode()
    };

    this.pointerActions = this.pointerActionsMap[this.currentTool];
},
mounted() {
    document.getElementsByTagName("title")[0].innerText = this.$t("title");    
  
    this.setToolParams();
    this.setSize(this.sizes, true);   

    this.newDrawing();
    this.initControls();
    this.setCursor();
},
methods: {
    restrictToAxis(e) {
        this.restrictedToAxis = true;
        this.restrictedToStraight = true;
        
        this._onceKeyup(e.code, () => {
            this.restrictedToStraight = false;
            this.restrictedToAxis = false;
        });
    },
    restrictToStraight(e) {
        this.restrictedToStraight = true;
        this._onceKeyup(e.code, () => {
            this.restrictedToStraight = false;

        });
    },
    _onceKeyup(code, f) {
        const reset = event => {
            if(event.code == code) {
                event.preventDefault();
                event.stopPropagation();
                f();
                document.removeEventListener("keyup", reset);                    
            }
        }
        document.addEventListener("keyup", reset);
    },
    setShortcutTool(tool, event) {        
        this.shortcutTool = tool;
        this.pointerActions = this.pointerActionsMap[tool];
        this.setCursor();
        if(event.type == "keydown") {
            event.preventDefault();
            this._onceKeyup(event.code, () => this.resetShortcutTool());
        }
        else if(event.type == "pointerdown") {
            event.preventDefault();
            const reset = event1 => {
                event1.preventDefault();
                this.pointerActions.up();
                this.resetShortcutTool();
                document.removeEventListener("pointerup", reset);                
            };
            document.addEventListener("pointerup", reset);
        }
    },
    resetShortcutTool() {
        this.shortcutTool = false;
        this.pointerActions = this.pointerActionsMap[this.currentTool];
        this.setCursor();
    },
    dropFile(e) {
        Array.from(e.dataTransfer.files)
        .forEach(file => {
            if(file.type.indexOf("image/") == 0) {
                this.pasteImageFromFile(file);
            }
        });
    },
    transformCanvas(action) {        
        this.writeHistoryAction({...action, action: "transform"});
        if(action.rotate) {            
            let angle = (action.rotate * Math.PI / 180);            
            this.rotateDrawing(angle);
        }
        if(action.flip) {
            this.flipDrawing(action.flip);
        }
        this.render();
    },
    switchViewMode() {
        this.$store.commit('setViewMode', this.viewMode == "normal" ? "full" : "normal");
        this._setSizeFactor();
    },
    changeZoom(dir) {
        if(
            (dir > 0 && this.zoom < this.zoomLevels[this.zoomLevels.length-1]) || 
            this.zoom > this.zoomLevels[0]
        ) {
            let i = this.zoomLevels.reduce(
                (z, l, i) => Math.abs(this.zoom - z[1]) > Math.abs(this.zoom - l) ?
                    [i, l]
                    : z, 
                [0, this.zoomLevels[0]]
            )[0];
            i = Math.min(this.zoomLevels.length-1, Math.max(0, i + dir));
            this.$store.commit('setZoom', this.zoomLevels[i]);
            this.canvasSizes.width = this.sizes.width * this.zoom;
            this.canvasSizes.height = this.sizes.height * this.zoom;       

            ["canvas", "mainCanvas", "selection"].forEach(s => {
                if(!this.$refs[s]) return;
                this.$refs[s].style.width = this.canvasSizes.width + "px";
                this.$refs[s].style.height = this.canvasSizes.height + "px";
            });     
            if(this.lastPoint != null) {
                this.setCursorPosition();
            }
            this.render();
            if(this.selection) 
                this.selection.setZoom(this.zoom);
            this.setCursor();
            this._setSizeFactor();

            this._setContainerSize();
            
        }
    },
    _setSizeFactor() {
        const rect = this.$refs.wrapper.getBoundingClientRect();
        this.sizeFactor = [
            Math.max(1, (this.sizes.width * this.zoom - rect.width) / rect.width),
            Math.max(1, (this.sizes.height * this.zoom - rect.height) / rect.height)
        ];
    },
    saveToProfile() {
        let data = [];
        let imgs = {};
        let inc = 0;
        let zip = new JSZip();
        
        
        this.layers.forEach(l => {
            data.push({
            name: l.name,
            id: l.id,
            opacity: l.opacity
            });
            l.canvas.toBlob(blob => {
            zip.file(l.id + ".png", blob);
            inc++;
            if(inc == this.layers.length) {
                zip.file("layers.txt", JSON.stringify(data));
                zip.generateAsync({type: "blob"})
                .then(content => {
                    saveAs(content, "download.zip");
                });
            }
            })
        });

    },
    saveToFile(ext = "png") {
        this._canvasToBlob().then(blob => {
             saveAs(blob, `${this.title}.${ext}`);
        });
    },
    initControls() {       
        document.addEventListener("keydown", e => {     
            let action = (e.ctrlKey ? 
                this.keyCodeMap.ctrlKey 
                : this.keyCodeMap)[e.code];
            if(action) 
                action(e);
            else console.log(
                "There is one more key to bound something useful", 
                `Key: ${e.key}\nCode: ${e.code}\nCtrl: ${e.ctrlKey}\nAlt: ${e.altKey}\nShift: ${e.shiftKey}`
            );
        });   

       
        this.prevClick = {
            time: 0, coords: [0, 0]
        };
        this.lastEvent = {
            btn: BTN.NONE,
            dblClick: false
        };
        this.pressure = 0;


        this.$refs.container.addEventListener("pointerdown", event => {
            if(event.target == this.$refs.container) return;
            event.preventDefault();
            this.contextMenu.show = false;
            this.setLastPoint(event);

            this.lastEvent.btn = 1 << event.which;
            this.lastEvent.dblClick = false;



            if( (this.lastEvent.btn & this.pointerActions.btn) &&
                !(this.currentLayer.locked && this.currentSettings.modifying)
            ) {
                this.pointerActions.down(event);
            } else {
                let action = this.pointerKeyMap.down[this.lastEvent.btn];
                if(action) action(event);
            }
            
        });

        this.$refs.container.addEventListener("pointermove", event => {     
            event.preventDefault();
            this.setLastPoint(event);
            if(this.selection) {
                this.setCursorSelAction();  
            }
            if( (this.lastEvent.btn & this.pointerActions.btn) &&
                !(this.currentLayer.locked && this.currentSettings.modifying)
            ) {
                this.pointerActions.move(event);     
            }           

        });

        document.addEventListener("pointerup", event => {
            if(this.pressure == 0) return;
            event.preventDefault();
            event.stopPropagation();
            
            this.setLastPoint(event);
            
            let t = Date.now();
            this.lastEvent.dblClick = (t -this.prevClick.time) < DBCLICK.MS_MAX &&
                length(vec(this.prevClick.coords, this.lastPoint.coords)) < DBCLICK.LENGTH_MAX; 


            if( (this.lastEvent.btn & this.pointerActions.btn) &&
                !(this.currentLayer.locked && this.currentSettings.modifying)
            ) {
                this.pointerActions.up(event);
            }
               
            if(this.restrictedToAxis) {
                let p0 = this.lastTouchedPoint;
                let point = this.lastPoint
                let [dx, dy] = point.coords.map(
                    (c,i) => Math.abs(c - p0.coords[i])
                );
                this.lastTouchedPoint = Object.assign({}, this.lastPoint, {
                    coords:  dx > dy ? 
                    [point.coords[0], p0.coords[1]]
                    :  [p0.coords[0], point.coords[1]]
                });
            }
            else {
                this.lastTouchedPoint = Object.assign({}, this.lastPoint);
            }
            this.lastTouchedPoint.lastTouched = true;
            
            this.pressure = 0;
            this.lastEvent.btn = BTN.NONE;
            this.prevClick.time = t;  
            this.prevClick.coords = this.lastPoint.coords.slice();
        });
    
        this.$refs.container.addEventListener("contextmenu", event => {
            event.preventDefault();
            event.stopPropagation();
            this.contextMenu.show = true;
            this.contextMenu.position = this.lastPoint.pageCoords;
           
            const hideMenu = () => {
                this.contextMenu.show = false;
                document.removeEventListener("pointerdown", hideMenu);
            };
            document.addEventListener("pointerdown", hideMenu);
        });
        this.$refs.container.addEventListener("pointerout", event => {
            event.preventDefault();
            event.stopPropagation();
        /*    if(this.lastPoint && !this.restrictedToAxis) { 
                this.setLastPoint(event);
                this.pointerActions.out();      
                this.applyTemp();
                this.lastTouchedPoint = Object.assign({}, this.lastPoint);
            }        */   
        });
    },
    startTranslateCanvas() {
        this.translation = true;       
        this.setCursor();
    },
    translateCanvas() {        
        if(this.pressure > 0.25) {
            const delta = this.lastPoint.delta
            .map((c,i) => -c * this.sizeFactor[i] * 1.5);
            this.$refs.wrapper.scrollBy(...delta);
        }
    },
    endTranslateCanvas() {
        this.translation = false;
        this.setCursor();
    },
    startRotateCanvas() {
        this.rotation = true;       
        this.setCursor();
    },
    rotateCanvas() {        
        if(this.pressure > 0.25) {
            let container = this.$refs.container.getBoundingClientRect();
            let center = [container.width / 2, container.height / 2];
            let v = vec(center, this.lastPoint.containerCoords);
            let da = angle_signed(v, sum(v, this.lastPoint.delta));
            let rAngle = (this.currentSettings.values.rAngle + da * 180 / Math.PI) % 360;
            if(rAngle < 0) rAngle = 360 + rAngle;

            this.$store.commit("changeSettings", {
                tool: "rotation",
                updates: {
                    values: {
                        rAngle: rAngle
                    }
                }
            });

            this.$refs.canvas.style.transform = `rotate(${rAngle}deg)`;
        }
    },
    endRotateCanvas() {
        this.rotation = false;
        this.setCursor();
    },
    setLastPoint(event) {
        this.pressure =  event.pressure;
        if(event.pointerType == "mouse" && event.pressure > 0)
            this.pressure = 1;
        
        const offset = this.$refs.canvas.getBoundingClientRect();
        
        const coords = [event.offsetX, event.offsetY].map(p => p * this.sizes.px_ratio / this.zoom);
        let containerCoords = [ 
            Math.round(event.pageX - offset.left), 
            Math.round(event.pageY - offset.top) 
        ];

        const pageCoords = [event.pageX, event.pageY];
        let prev, delta;
        if(this.lastPoint) {
            prev = this.lastPoint.coords.slice();
            delta =  [
                pageCoords[0] - this.lastPoint.pageCoords[0],
                pageCoords[1] - this.lastPoint.pageCoords[1]
            ];
        } else {
            prev = coords.slice();
            delta = [0, 0];
        }       
        this.lastPoint = {
            coords,                    //for canvases
            delta,                     //for hand/rotation tools
            pageCoords,                //for cursor and contextmenu positioning
            containerCoords,           //for rotation tool
            pressure: this.pressure    //for drawing
        };        
        this.setCursorPosition();
    },


    pasteFromClipboard() {
        navigator.permissions.query({name: "clipboard-read"}).then(result => {
            if (result.state == "granted" || result.state == "prompt") {
            navigator.clipboard.read().then(res => {
                res.forEach(item => {
                let type = item.types.find(i => i.indexOf("image/") > -1)
                if(type) {
                    item.getType(type).then(blob => {
                        this.pasteImageFromFile(blob);             
                    });                                    
                }
                });
            });
            }
        });
    },
    _getColor() {
        if(this.lastEvent.btn == BTN.RIGHT) {
            return {
                bg: "fg",
                fg: "bg"
            }[this.colorToEdit];
        } 
        return this.colorToEdit;
    },
    pickColor(coord, colorType) {
        let color = this._pickColorAtCoord(coord);
        if(color) {
            this.$store.commit("selectColor", [ colorType, color]);
            this.setCursorColor(color);
        }
    },
    pasteImageFromFile(file, mode = "leave") {
        let img = new Image();
        img.onload = () => {
            if(mode == "resize_canvas") {
            this.setSize({
                width: img.width,
                height: img.height,
                origin: [
                    (this.sizes.width - img.width) / 2,
                    (this.sizes.height - img.height) / 2
                ]
            });
        }
        if(mode == "leave") {
            this.appendLayer("", {
                img,
                x: (this.sizes.width - img.width) / 2,
                y: (this.sizes.height - img.height) / 2,
                width: img.width,
                height: img.height
            });
        } else {
            this.appendLayer("", {
                img,
                x: 0,
                y: 0,
                width: this.sizes.width,
                height: this.sizes.height
            });
            } 
            this.$refs.topPanel.clearFileInput();
        };
        img.src = URL.createObjectURL(file);          
    },
    splitLayers(layers) {
        this.writeHistoryAction({
            action: "splitLayers", 
            layers
        });
        let index = this.layers.indexOf(layers[0]);
        this.layers = this.layers.slice(0, index+1)
        .concat(layers.slice(1))
        .concat(this.layers.slice(index+1));
        this.selectLayer(layers[layers.length-1].id);
    },
    layerToSelection(id) {
        this.selectLayer(id);
        let bbox = this._getCurrentLayerBbox();
        this.selectArea(bbox);      
    }, 
    
    setSize({width, height, px_ratio = this.sizes.px_ratio, resizeMode, originMode, origin}, init = false) {
        if(!init) {
            this.writeHistoryAction({
                action: "setSize",
                prev: Object.assign({}, this.sizes),
            });
        }
        if(this.selection) 
            this.applySelection();

        width = Math.round(width);
        height - Math.round(height);
        const dw = width - this.sizes.width;
        const dh = height - this.sizes.height;

        const oldCanvasSizes = Object.assign({}, this.sizes_hr);
        const rk = px_ratio / this.sizes.px_ratio;

        if(resizeMode == undefined) 
            resizeMode = origin ? "move" : "resize";
        if(resizeMode == "move" && originMode !== undefined) {
            let [y, x] = originMode.split("-");
            origin = [0, 0]
            origin[0] = {
                left: 0,
                center: dw * px_ratio / 2,
                right: dw * px_ratio
            }[x];
            origin[1] = {
                top: 0,
                center: dh * px_ratio / 2,
                bottom: dh / px_ratio
            }[y];
        }
       
        this._setSize(width, height, px_ratio);

        let rect = resizeMode == "move" ? 
            [...origin, oldCanvasSizes.width * rk, oldCanvasSizes.height * rk] 
        : [0, 0, this.sizes_hr.width, this.sizes_hr.height];

        this._updateCanvasesSize(rect);
       
        this.sizes.px_ratio = px_ratio;
        if(this.selection) 
            this.selection.setPxRatio(this.sizes.px_ratio);
        this.setToolParams();
               

        this.render();
    },
    _setContainerSize() {
        let a = this.rotationAngle / 180 * Math.PI;
        let sin = Math.abs(Math.sin(a));
        let cos = Math.abs(Math.cos(a));
        let {width, height} = this.canvasSizes;
        this.$refs.container.style.width = Math.round(width * cos + height * sin) + "px";
        this.$refs.container.style.height = Math.round(height * cos + width * sin) + "px";
    },
    newDrawing(title = this.$t('newDrawingTitle')) {
        this.currentLayerIndex = 0;
        this.layers = [];
        if(this.selection) {
            this.dropSelection();
        }
        this.$store.commit('setTitle', title);
        this.makeBGLayer();
        this.appendLayer(this.$t("layers.newLayer") + " 1");
        this.clearHistory();
    },
    copyCurrentLayer() {
        let nameBase = this.currentLayer.name.replace(/\s*copy\s*(\d*)\s*$/i, "");
        let regCopy = new RegExp(nameBase + ' copy\\s*(\\d*)\\s*$', "i");

        let name = this.layers.reduce((last, layer) => {
            if(regCopy.test(layer.name)) {
                let res = regCopy.exec(layer.name);
                let name1 = nameBase + " copy " + ((res[1].length ? parseInt(res[1]) : 1) + 1);
                if(name1.length > last.length || name1 > last) return name1;
            }
            return last;
        }, nameBase + " copy");

        let {blend, opacity, visible} = this.currentLayer;
        let paste = {
            img: this._getCurrentLayerImage(),
            x: 0, y: 0,
            ...this.sizes
        };
        
        this.appendLayer(name, paste, {blend, opacity, visible});
        this.render();      
    },
    _createLayer(name, paste, params = {}) {
        if(!name) {
            this.regLayer = this.regLayer || new RegExp(this.$t("layers.newLayer") + '\\s*(\\d+)$', "i");
            let nameBase = this.$t("layers.newLayer") + " ";
            name = this.layers.reduce((last, layer) => {
                if(this.regLayer.test(layer.name)) {
                    let name1 = nameBase + (parseInt(this.regLayer.exec(layer.name)[1]) + 1);
                    if(name1.length > last.length || name1 > last) return name1;
                }
                return last;
            }, nameBase + " 1");            
        }
        const layer = {
            id: Math.random(), 
            name, 
            opacity: 100,
            visible: true,
            locked: false,
            masked: false,
            background: false,
            blend: "source-over",
            compositeMode: "source-over",
            ctx: 0,
            ...params
        };

        layer.ctx = this._createLayerCtx(paste, params);
        return layer;
    },
    makeBGLayer(paste = null) {
        const layer = this._createLayer(this.$t('layers.background'), paste, {
            locked: true,
            background: true
        });
        
        this.layers = this.layers.slice(0, this.currentLayerIndex+1)
            .concat([layer])
            .concat(this.layers.slice(this.currentLayerIndex+1));

        this.render();    
    },
    appendLayer(name, paste) {
        const layer = this._createLayer(name, paste);
        
        this.layers = this.layers.slice(0, this.currentLayerIndex+1)
            .concat([layer])
            .concat(this.layers.slice(this.currentLayerIndex+1));
        let prev = this.currentLayer;
        this.selectLayer(layer.id);        

       
        if(prev)
            this.writeHistoryAction({action: "appendLayer", layer, prev });
        this.render();    
    },
    restoreLayer(layer, index) {
        this.layers = this.layers.slice(0, index)
            .concat([layer])
            .concat(this.layers.slice(index));
        let prev = this.currentLayer;
        this.selectLayer(layer.id);                
        this.writeHistoryAction({action: "appendLayer", layer, prev });
        this.render();    
    },
    selectLayer(id) {
        let index = this.layers.findIndex(l => l.id == id);
        if(index >= 0 && index !== this.currentLayerIndex) {
            this.currentLayerIndex = index;
            if(this.activeSelection) {
                this.updateSelectionSource();
            }
            this.currentLayer = this.layers[this.currentLayerIndex];
            if(this.activeSelection) {
                this.startTransformSelection();
            }
            this.render();
            this.setCursor();
        }
        
    },
    reorderLayer({oldIndex, newIndex}) {
        this.writeHistoryAction({
            action: "reorderLayer",
            oldIndex, newIndex
        });
        let oldIndex1 = this.layers.length - oldIndex - 1;
        let newIndex1 = this.layers.length - newIndex - 1;
        let reordered = this.layers.splice(oldIndex1, 1);
        this.layers = [
            ...this.layers.slice(0, newIndex1),
            ...reordered,
            ...this.layers.slice(newIndex1)
        ];
        this.render();
    },
    toggleLayer(id) {
        const layer = this.layers.find(l => l.id === id);
        layer.visible = !layer.visible;
        this.render();
    },
    removeLayer(id) {
        let index = this.layers.findIndex(l => l.id === id);
        let remove = this.layers[index];

        this.writeHistoryAction({action: "removeLayer", layer: remove, index});

        if(this.currentLayer.id == remove.id) {
            this.selectLayer(this.layers[(index ? index - 1 : 0)].id);
        }
        this.layers.splice(index, 1);
        this.render();
    },
    mergeLayers(ids) {
        const layers = this.layers.filter(l => ids.indexOf(l.id) !== -1);
        const merged = layers[0];
        this.writeHistoryAction({action: "mergeLayers", layers});

        layers.slice(1).forEach((layer) => {
            this._mergeLayersImages(merged, layer);
            this.layers.splice(this.layers.indexOf(layer), 1);
        });
        this.selectLayer(merged.id);
    },
    toggleLayerProp([l, prop]) {
        l[prop] = !l[prop];
        if(l == this.currentLayer && prop == 'locked') this.setCursor();
        if(prop == "masked") {
            l.compositeMode = l.masked ? "source-atop" : "source-over";
        }
    }
}
}
</script>

<style lang="scss">
@import '~vue-select/dist/vue-select.css';
@import "./assets/styles/colors.scss";

input[type=file] {
    width: 0;
    visibility: hidden;
}
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0; 
}
input[type=number] {
    -moz-appearance:textfield; 
}

*:focus {
    outline: none;
}

ul[role=listbox] {
    z-index: 10000000000000000;
}


.icon-btn {
    cursor: pointer;
    border: none;
    width: $icon-btn-size;
    flex: 0 0 $icon-btn-size;
    height: $icon-btn-size;
    
    background: {
        color: transparent;            
        position: center;
        repeat: no-repeat;
        size: 60% 60%;
    }
    &.toggle-btn {
        opacity: .8;
        &.active {
            opacity: 1;
            border: 1px black solid;
            border-radius: 5px;
        }
    }
    &.small {
        width: $icon-btn-size-small;
        flex: 0 0 $icon-btn-size-small;
        height: $icon-btn-size-small;
        background-size: 80% 80%;    
        &.delete {
            background-size: 70% 70%;
        }
        &.cancel {
            background-size: 60% 60%;
        }
    }
    &[disabled] {
        opacity: .5;
    }
    &.add { background-image: url("./assets/img/plus.svg"); }
    &.copy { background-image: url("./assets/img/copy.svg"); }
    &.edit { background-image: url("./assets/img/edit.svg"); }
    &.cancel { background-image: url("./assets/img/cancel.svg"); }
    &.merge { background-image: url("./assets/img/merge.svg"); }
    &.delete { background-image: url("./assets/img/trash.svg"); }
    
    &.lock { background-image: url("./assets/img/lock.svg"); }
    &.mask-layer { background-image: url("./assets/img/mask-layer.svg"); }
    &.visible { background-image: url("./assets/img/visible.svg"); }
    &.swap { background-image: url("./assets/img/swap.svg"); }
    &.link { background-image: url("./assets/img/link.svg"); }

    &.apply { background-image: url("./assets/img/check.svg"); }
    &.reset { background-image: url("./assets/img/none.gif"); }

    &.to-full-view { background-image: url("./assets/img/to-full-view.svg"); }
    &.to-normal-view { background-image: url("./assets/img/to-normal-view.svg"); }
    &.undo { background-image: url("./assets/img/undo.png"); }
    &.redo { background-image: url("./assets/img/redo.png"); }
    &.zoom-in { background-image: url("./assets/img/zoom-in.png"); }
    &.zoom-out { background-image: url("./assets/img/zoom-out.png"); }
}

body {
    overflow: hidden;
}



#app {
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    overflow: hidden;
    #center {
        flex: 2 1 100%;
        display: flex;
        flex-flow: column nowrap;
    }
    .panel {
        z-index: 100;
        padding: $panel_padding;       
        display: flex;
        flex-flow: column nowrap;
        align-items: center;
        position: relative;
        & > * {
            max-width: 100%;
        }
        &.top {
            flex: 0 0 $panel_top_height;
        }
        &.bottom {
            margin-top: 5px;
            flex: 0 0 $panel_bottom_height;
            max-height: $panel_bottom_height;
            padding: 0;
        }
        &.left {
            flex: 1 1 $panel_left_width;
            max-width: $panel_left_width;
        }
        &.right {
            flex: 1 1 $panel_right_width;
            max-width: $panel_right_width;
        }
    }
}

#wrapper {
    flex: 2 1 100%;
    width: $canvas_width;
    height: $canvas_height;
    max-height: $canvas_height;
    outline: 2px solid black;
    box-sizing: border-box;
    overflow: auto;
  //  overflow: hidden;
    background-image: url("./assets/img/forest.jpg");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-color: grey;
}

#canvas-container {    
    overflow: hidden;
    min-width: $canvas_width;
    min-height: $canvas_height;
    position: relative;
    cursor: none;
    #canvas {
        background: url("./assets/img/transparent.png");
        outline: 1px solid black;
        position: absolute;
        margin: auto;
        display: inline-block;
        vertical-align: middle;
        left: 50%;
        top: 50%;
        transform: translate3d(-50%,-50%,0)rotate(0deg);
        // needed for capturing pointer events on wrapper but outside the canvas
        // so offsetXY are still being in the canvas coordinate system
        &:before {
            width: 100vw;
            height: 100vh;
            position: fixed;
            left: 50%;
            top: 50%;
            z-index: 1;
            content: "";
            display: block;
            transform: translate(-50%,-50%)scale(2,2);
        }

    }
    &:hover  #cursor {
        z-index: $z-index_canvas-cursor;
        visibility: visible;
    }
    
    canvas {
        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;
        cursor: none;
        &#mainCanvas { z-index: 100; }
        &#selection  { z-index: 101; }
    }
}

#app.full {
    .panel {
        &.left, 
        &.right {
            width: 0!important;
            flex: 0 0 0!important;
            visibility: hidden;
        }
    }
    #logo { display: none; }
    #wrapper {
        width: $canvas_width_full;
    }
    #canvas-container {
        min-width: $canvas_width_full;
    }
}

#cursor {
    pointer-events: none;
    position: fixed;
    z-index: -1;
    visibility: hidden;
    transform: translate(-50%,-50%);
    transform-origin: 50% 50%;


    &.brush, &.eraser, &.picker, &.marker {
        border: .5px solid rgba(255,255,255,.75);
        box-shadow: 0 0 0 .5px rgba(0,0,0,.5);
    }
    
    &.brush, &.eraser {
        &.round {
            border-radius: 50%;
        }      
        &.texture {
            max-width: unset;
            background: {
                repeat: no-repeat;
                position: center;
                size: 100% 100%;                
            };
            border: none;
            box-shadow: none;
            filter: url(#outline);
        }
    }
    &.hand, 
    &.grab {
        width: 2px!important;
        height: 2px!important;
    }
    &.hand {
        &::after {
            background-image: url("./assets/img/hand.svg");
        }
    }
    &.grab {
        &::after {
            background-image: url("./assets/img/grab.svg");
        }
    }
    &.fill {
        width: 2px!important;
        height: 2px!important;
        &::after {
            background-image: url("./assets/img/fill_opaq.png");
        }
    }
    &.picker {
        width: 15px!important;
        height: 15px!important;
        border-radius: 50%;      
        &::after {
            background-image: url("./assets/img/picker_opaq.png");
        }
    }
    &.picker, &.fill, &.hand {
        transform: none!important;
        &::after {
            display: block;
            position: absolute;
            bottom: 50%;
            left: 50%;
            content: "";
            z-index: $z-index_canvas-cursor;
            width: 20px;
            height: 20px;
            background-size: 100% 100%;        
        }
    }

    &.selection_rect, &.selection_polygon, &.selection_lasso {
        transform: translate(-50%,-50%);
        background-image: url("./assets/img/crosshair.png");
        background-size: cover;
        width: 20px!important;
        height: 20px!important;
        &.rotate {
            width: 16px!important;
            height: 16px!important;
            background-image: url("./assets/img/rotate.svg");
        }
        &.resize {
            background-image: url("./assets/img/resize3.svg");
        }
    }

    &.rotation {
        transform: translate(-50%,-50%);
        background-image: url("./assets/img/crosshair.png");
        background-size: cover;
        width: 16px!important;
        height: 16px!important;
        background-image: url("./assets/img/rotate.svg");

    }

    &.locked {
        width: 16px!important;
        height: 16px!important;
        background-size: cover;
        border: none!important;
        background-image: url("./assets/img/none.gif")!important;
        box-shadow: none;
        &::after {
            display: none!important;
        }
    }
}

#logo {
    position: fixed;
    width: $logo_size;
    height: $logo_size;
    bottom: 0;
    right: 0;
    opacity: .5;
    z-index: -1;

}
</style>
