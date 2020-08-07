<template>
<div id="app" 
    @click.prevent>    
    <div class="panel left">
    <Toolbox
        :selection="selection && selection.started"
        @apply-selection="applySelection"
        @reset-selection="resetSelection"
        @select-all="() => selectArea([[0,0], [sizes.width, sizes.height]])"
        @crop-selection="cropSelection"
        @clipnewlayer-selection="clipToNewLayer"
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
            />
        </div>
        <div id="wrapper">
            <div id="canvas-container" 
                @dragenter.prevent
                @dragover.prevent
                @drop.prevent="dropFile"
                ref="container">
                <div id="canvas" 
                    ref="canvas">
                <canvas ref="blender"
                    :style="{
                        zIndex: 100
                    }" ></canvas>
                <canvas ref="selection"
                    :style="{
                        zIndex: layers.length + 120
                    }"            
                ></canvas>
            </div>
            <div id="cursor" ref="cursor"
                :style="cursorStyles" 
                :class="[currentTool, ...cursorClasses]"></div>
            </div>
        </div>
        <div class="panel bottom">
            <StatusBar
                :zoom="zoom"
                :emptyHistory="!storedCounter"
                :noUndone="!backCounter"
                :title.sync="title"
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
            :disabled="!!selection"
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
                <feComposite in="comp" in2="comp1" operator="or" result="comp2"/>      
                <feOffset in="comp2" dx="-3" dy="-3"/>           
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
import {Selection, SelectionPath, Brush, Marker} from "./classes";


import Toolbox from "./components/Toolbox";
import ColorPicker from "./components/ColorPicker";
import Layers from "./components/Layers";
import TopPanel from "./components/TopPanel";
import StatusBar from "./components/StatusBar";

import FilterMixin from "./mixins/FilterMixin";
import HistoryMixin from "./mixins/HistoryMixin";

import {getRgba, getGlColor} from "./functions/color-functions";
import {fill} from "./functions/pixel-functions";
import {angle, vec} from "./functions/vector-functions";





export default {
    name: 'app',
    data() {
        return {
            layers: [],
            cursorStyles: {},
            canvasSizes: {},
            canvasStyles: {},
            sizes: {
                width: 800,
                height: 600,
                px_ratio: 1
            },
            lastPoint: null,
            currentLayer: null,
            currentLayerIndex: 0,
            cursorClasses: [],
            zoom: 1,
            selection: null,
            texture: null,
            canvasPattern: null,
            colorToEdit: "fg",
            backgroundColor: "#ffffff",
            title: ""
        }
    },
    components: {
        Toolbox, ColorPicker, Layers, TopPanel, StatusBar
    },
    mixins: [FilterMixin, HistoryMixin],
    computed: {
        ...mapState(['currentTool', 'currentColor', 'zoomLevels']),
        ...mapGetters(['currentSettings']),
        historySize() {
            return this.$store.state.userPrefs.historySize;
        }
    },
watch: {
    currentColor() {
        this.setBrushParams();
    },
    currentSettings: {
    deep: true,
    handler(val, prev) {
        this.setCursor();
        this.setBrushParams();
        if(val.pattern) {
            if(!this.canvasPattern || 
                val.pattern.src !== this.canvasPattern.img.src ||
                val.patternScale !== this.canvasPattern.scale) {
                this.canvasPattern = {
                    scale: val.patternScale,
                    img: new Image()
                };
                this.canvasPattern.img.onload = () => {
                    let c = document.createElement("canvas");
                    c.width = val.patternScale * this.canvasPattern.img.width;
                    c.height = val.patternScale * this.canvasPattern.img.height;
                    let ctx = c.getContext("2d");
                    ctx.drawImage(this.canvasPattern.img, 
                        0, 0, this.canvasPattern.img.width, this.canvasPattern.img.height, 
                        0, 0, c.width, c.height );

                    this.canvasPattern.pattern = 
                    this.tempCtx.createPattern(c, "repeat");
                };
                this.canvasPattern.img.src = val.pattern.src;
            }
        } else 
        this.canvasPattern = null;
    }
    },
    currentTool() {
        this.pointerActions = this.pointerActionsMap[this.currentTool];
        this.setBrushParams();
        this.setCursor();    
    
        if(this.selection) {            
            if(this.currentTool.indexOf("selection") == 0)
                this.startTransformSelection();
            else 
                this.currentLayer.ctx.drawImage(
                    this.selection.imgCtx.canvas, 
                    0, 0, this.currentLayer.ctx.canvas.width, this.currentLayer.ctx.canvas.height
                );
        }        
    }
},
created() {
    this.pointerActionsMap = {
        brush: {
            down: () => this.draw(this.lastPoint, this.brush),
            move: () => {
                if(this.pressure > 0) 
                this.draw(this.lastPoint, this.brush);
            },
            up: () => {
                this.endDraw(this.lastPoint, this.brush);
            },
            out: () => {
                this.endDraw(this.lastPoint, this.brush);
            }
        },
        eraser: {
            down: () => this.erase(this.lastPoint),
            move: () => {
                if(this.pressure > 0) 
                    this.erase(this.lastPoint);
            },
            up: () => {
                this.endErase(this.lastPoint);
            },
            out: () => {
                this.endErase(this.lastPoint);        
            },
        },
        marker: {
            down: () => this.draw(this.lastPoint, this.marker),
            move: () => {
                if(this.pressure > 0) {            
                    let angleDeg = angle(
                        [1, 0], 
                        vec(this.marker.points.length ? this.marker.points[this.marker.points.length-1].coords : this.lastPoint.prev, this.lastPoint.coords)
                    ) / Math.PI * 180;
                    this.cursorStyles.transform = `translate(-50%,-50%)rotate(${angleDeg}deg)`;
                    this.draw(this.lastPoint, this.marker);
                }
            },
            up: () => {
                this.endDraw(this.lastPoint, this.marker);
                this.cursorStyles.transform = null;
            },
            out: () => {
                this.endDraw(this.lastPoint, this.marker);
                this.cursorStyles.transform = null;
            },
        },

        fill: {
            down: () => this.fill(this.lastPoint.coords),
            move: () => {},
            up: () => {
                this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0, 0);
            },
            out: () => {}
        },
        picker: {
            down: () => this.pickColor(this.lastPoint.coords),
            move: () => {
                if(this.pressure > .25) 
                    this.pickColor(this.lastPoint.coords);
            },
            up: () => {},
            out: () => {}
        },
        selection_rect: {
            down: () => {
                if(!this.selection) {
                    this.selection = new Selection(
                        this.lastPoint.coords, 
                        this.selCtx, this.sizes.px_ratio, this.zoom);
                } else {
                    this.selection.applyTransform(this.lastPoint.coords, true);              
                }    
            },
            move: () => {
                if(this.pressure > 0) {
                    if(this.selection.started) {                    
                        this.selection.applyTransform(this.lastPoint.coords);
                    } else {
                        this.selection.setPoint(this.lastPoint.coords);            
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
            down: () => {
                if(!this.selection) {
                    this.selection = new SelectionPath(
                        this.lastPoint.coords, 
                        this.selCtx, this.sizes.px_ratio, this.zoom);
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
                if(this.selection) { 
                    if(!this.selection.started) 
                        this.selection.setPoint(this.lastPoint.coords); 
                    else if(this.pressure > 0)   
                        this.selection.applyTransform(this.lastPoint.coords);  
                    }
                this.render();
            },
            up: () => {
                if(!this.selection.ready) {
                    if(Date.now() - this.prevClick.time < 300) {
                        this.startTransformSelection();
                    }
                }
                this.render();
                
            },
            out: () => {}
        },
        selection_lasso: {
            down: () => {
                if(!this.selection) {
                this.selection = new SelectionPath(
                    this.lastPoint.coords, 
                    this.selCtx, this.sizes.px_ratio, this.zoom);
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
                    this.selection.applyTransform(this.lastPoint.coords);  
                }
                this.render();
            },
            up: () => {
                if(!this.selection.ready) {
                    this.startTransformSelection();
                }  
                this.render();
            },
            out: () => {}              
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
            }
        },
        Enter: e => {
            e.preventDefault();
            this.applySelection();
        },
        KeyB: e => this.$store.commit("selectInstrument", "brush"),
        KeyE: e => this.$store.commit("selectInstrument", "eraser"),
        KeyR: e => this.$store.commit("selectInstrument", "marker"),
        KeyF: e => this.$store.commit("selectInstrument", "fill"),
        KeyC: e => this.$store.commit("selectInstrument", "picker"),
        KeyS: e => this.$store.commit("selectInstrument", "selection_rect"),
        KeyD: e => {
            this.$store.commit("selectColor", ["fg", "#000000"]);
            this.$store.commit("selectColor", ["bg", "#ffffff"]);
        }
    };

    this.pointerActions = this.pointerActionsMap[this.currentTool];
},
mounted() {
    if(process.env.NODE_ENV === 'production')
        if(navigator.languages[0].indexOf("ru") == 0)
            this.$i18n.locale = "ru";
    document.getElementsByTagName("title")[0].innerText = this.$t("title");

    this.tempCtx =  document.createElement("canvas").getContext("2d");
    this.tempCtx2 = (new OffscreenCanvas(800, 600)).getContext("2d");

    this.blender = this.$refs.blender.getContext("2d");
    this.blender.imageSmoothingEnabled = false;
    this.blender.save();
    this.blender.translate(0.5, 0.5);
    this.brush = new Brush();
    this.marker = new Marker();
    this.selCtx = this.$refs.selection.getContext("2d");

    this.setBrushParams();
    this.setSize({
        width: 800,
        height: 600
    }, true);   

    this.newDrawing();
    this.initControls();
    this.setCursor();
},
methods: {
    dropFile(e) {
        Array.from(e.dataTransfer.files)
        .forEach(file => {
            if(file.type.indexOf("image/") == 0) {
                this.pasteImageFromFile(file);
            }
        });
    },
    setBrushParams() {
        if(this.currentTool == "brush" || this.currentTool == "eraser")
            this.brush.setParams({
            ...this.currentSettings, 
            radius: this.currentSettings.radius * this.sizes.px_ratio,
            color: getGlColor(this.currentColor),
            linearGradient: this.currentSettings.linearGradient ? 
                this.currentSettings.linearGradient.map(getGlColor) 
            : false,
            radialGradient: this.currentSettings.radialGradient ? 
                this.currentSettings.radialGradient.map(getGlColor) 
            : false,
        });

        if(this.currentTool == "marker" )
            this.marker.setParams({
            ...this.currentSettings, 
            lineWidth: this.currentSettings.lineWidth * this.sizes.px_ratio,
            color: getGlColor(this.currentColor)
        });
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
            this.zoom = this.zoomLevels[i];
            this.canvasStyles.width = this.canvasSizes.width * this.zoom + "px";
            this.canvasStyles.height = this.canvasSizes.height * this.zoom + "px";       

            ["canvas", "blender", "selection"].forEach(s => {
                if(!this.$refs[s]) return;
                this.$refs[s].style.width = this.canvasStyles.width;
                this.$refs[s].style.height = this.canvasStyles.height;
            });     
            if(this.lastPoint != null) {
                this.setCursorPosition();
            }
            this.render();
            if(this.selection) 
                this.selection.setZoom(this.zoom);
            this.setCursor();
        }
    },
    getTransform() {    
        if(this.$refs.container) {
            let {width, height} = this.$refs.container.getBoundingClientRect();
            let dx = Math.max( (width - this.sizes.width * this.zoom),  0) / 2;
            let dy = Math.max( (height - this.sizes.height * this.zoom),  0) / 2;
            return `translate(${dx}px,${dy}px)` + 
            `scale(${this.zoom},${this.zoom})`
        }
        return "";
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
        this.render()
        let c = document.createElement("canvas").getContext("2d");
        Object.assign(c.canvas, this.sizes);
        c.canvas.style.width = this.sizes.width + "px";
        c.canvas.style.height = this.sizes.height + "px";
        c.drawImage(this.blender.canvas,
            0, 0, this.sizes_hr.width, this.sizes_hr.height, 
            0, 0, this.sizes.width, this.sizes.height, );
        c.canvas.toBlob(blob => {
            saveAs(blob, `${this.title}.${ext}`);
        });
    },
    initControls() {
        this.pressure = 0;

        this.cursorStyles.width = this.currentSettings.radius * 2 + "px";
        this.cursorStyles.height = this.currentSettings.radius * 2 + "px";


    document.addEventListener("keydown", e => {     
        let action = (e.ctrlKey ? 
            this.keyCodeMap.ctrlKey 
            : this.keyCodeMap)[e.code];
        if(action) 
            action(e);
        });   

        this.prevClick = {
            time: 0, x: 0, y: 0
        };


        this.$refs.container.addEventListener("pointerdown", event => {
            event.preventDefault();
            event.stopPropagation();
            this.setLastPoint(event);
            this.pointerActions.down();
        });
        this.$refs.container.addEventListener("pointermove", event => {     
            event.preventDefault();
            event.stopPropagation();
            this.setLastPoint(event);

            if(this.selection) {
                this.setCursorSelAction();  
                this.$forceUpdate();  
            }
            this.pointerActions.move();        

        });
        this.$refs.container.addEventListener("pointerup", event => {
            event.preventDefault();
            event.stopPropagation();
            this.setLastPoint(event);
            let t = Date.now();
            this.pointerActions.up();
            this.applyTemp();
            this.prevClick.time = t;     
            this.lastPoint = null;   
            this.pressure = 0;
        });
        this.$refs.container.addEventListener("pointerout", event => {
            event.preventDefault();
            event.stopPropagation();
            if(this.lastPoint) {
                this.setLastPoint(event);
                this.pointerActions.out();      
                this.applyTemp();
                this.lastPoint = null; 
            }            
        });
    },
    setLastPoint(event) {
        this.pressure =  event.pressure;
        if(event.pointerType == "mouse" && event.pressure > 0)
            this.pressure = 1;
        
        const offset = this.$refs.canvas.getBoundingClientRect();
        const coords = [ 
            Math.round(event.pageX - offset.left), 
            Math.round(event.pageY - offset.top) 
        ].map(p => p * this.sizes.px_ratio / this.zoom);
        
        
        this.lastPoint = {
            prev: this.lastPoint ? this.lastPoint.coords.slice(): coords,
            coords,
            pageCoords: [event.pageX, event.pageY],
            pressure: this.pressure
        };        
        this.setCursorPosition();
    },
    setCursorPosition() {
        this.$refs.cursor.style.left = this.lastPoint.pageCoords[0] + "px";
        this.$refs.cursor.style.top =  this.lastPoint.pageCoords[1] + "px";
    },
    setCursorSelAction() {
        if(this.selection && this.selection.ready) {
            let c = this.selection.getCursor(this.lastPoint.coords);
            this.cursorClasses = [];
            if(c.resize) {
                this.cursorClasses.push("resize");
                let angle = this.selection.angle / Math.PI * 180;
                if(c.dir[0]) {
                    if(c.dir[1]) {
                        this.cursorStyles.transform = `translate(-50%,-50%)rotate(${angle+45 + (c.dir[0] == c.dir[1] ? 90 : 0)}deg)`;
                    } else {
                        this.cursorStyles.transform = `translate(-50%,-50%)rotate(${angle+90}deg)`;
                    }
                }
                else if(c.dir[1]) {
                    this.cursorStyles.transform = `translate(-50%,-50%)rotate(${angle}deg)`;
                }            
            }
            if(c.rotate) {
                this.cursorClasses.push("rotate");
            }

        } else {
            this.cursorClasses = [];
            this.cursorStyles.transform = "translate(-50%,-50%)";
        }
    },
    
    startTransformSelection() {
        this.writeHistory();
        this.selection.startTransform(this.currentLayer.ctx);
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
    pickColor(coords) {
        const data = Array.from(this.blender.getImageData(...coords, 1, 1).data);
        if(data.find(n => !!n))
            this.$store.commit("selectColor", 
            [  this.colorToEdit,
                (this.cursorStyles["background-color"] = `rgb(${data.slice(0,3).join(",")})`)]
            );
        this.$forceUpdate();
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
    copySelection(removeOriginal = false) {
        if(this.selection && this.selection.ready) {
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
                new ClipboardItem({
                    [blob.type]: blob
                })              
            ]).then(res => {
                if(removeOriginal) {
                    this.selection.drop();
                    this.selection = null;
                }
            });
        });                
    } 

    },
    applySelection() {
        if(this.selection && this.selection.started) {
            this.currentLayer.ctx.restore();
            this.currentLayer.ctx.globalCompositeOperation = "source-over";
            this.currentLayer.ctx.drawImage(
                this.selection.imgCtx.canvas, 
                0, 0, this.currentLayer.ctx.canvas.width, this.currentLayer.ctx.canvas.height);
            this.selection.drop();
            this.selection = null;           
            this.setCursorSelAction();
            this.render();
        }
    },
    resetSelection() {
        if(this.selection) {
            this.currentLayer.ctx.drawImage(
                this.selection.sourceCopy.canvas, 
                0, 0, this.currentLayer.ctx.canvas.width, this.currentLayer.ctx.canvas.height);
            this.selection.drop();
            this.selection = null;
            this.render();
        }    
    },
    cropSelection() {
        if(this.selection && this.selection.started) {
            let bbox = this.selection.bbox.slice();
            let rect = [bbox[0], bbox[1].map((b,i) => Math.round(b - bbox[0][i]))];
            this.applySelection();

            this.setSize({
                width: rect[1][0],
                height: rect[1][1],
                origin: rect[0]
            }, false);         
        }
    },
    clipToNewLayer() {
        if(this.selection && this.selection.started) {
            let layer = this.createLayer("", {
                img: this.selection.imgCtx.canvas,
                x: 0, y: 0,
                ...this.sizes_hr
            });
            this.appendClipped(
                layer, 
                this.selection);
           
            this.selection.drop();
            this.selection = null;
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
    fill(coords) {
        let accuracy = this.sizes.px_ratio * 2;
        let sizes = [this.sizes_hr.width, this.sizes_hr.height].map(c => Math.round(c / accuracy));
        this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0, 0, ...sizes);

        let data = this.tempCtx.getImageData(0, 0, ...sizes).data;
        let positions = new Int8Array(sizes[0] * sizes[1] );
        let color = getRgba(this.currentColor);
        let color0 = Array.from(this.currentLayer.ctx.getImageData(...coords, 1, 1).data);         


        let data1 = fill([coords.map(c => Math.round(c / accuracy))], positions, data, color, color0, ...sizes, this.currentSettings.tolerance);
        let imgData = new ImageData(data1, sizes[0]);
        this.tempCtx.clearRect(0,0, ...sizes);
        this.tempCtx2.clearRect(0, 0,  this.sizes_hr.width, this.sizes_hr.height);
        this.tempCtx2.putImageData(imgData, 0, 0); 
        

        if(this.selection) {                  
            if(this.currentSettings.pattern && this.canvasPattern) {    
                this.tempCtx2.globalCompositeOperation = "source-in";
                this.tempCtx2.fillStyle = this.canvasPattern.pattern;
                this.tempCtx2.fillRect( 0, 0,this.sizes_hr.width, this.sizes_hr.height);
                this.tempCtx2.globalCompositeOperation = "source-over"; 
            } 
            this.tempCtx.clearRect(0,0, this.sizes_hr.width, this.sizes_hr.height);
            this.selection.clip(this.tempCtx);
            this.tempCtx.drawImage(this.tempCtx2.canvas, 0, 0, ...sizes, 0, 0, this.sizes_hr.width, this.sizes_hr.height);
            this.tempCtx.restore();
        } else {
            this.tempCtx.drawImage(this.tempCtx2.canvas, 0, 0, ...sizes, 0, 0, this.sizes_hr.width, this.sizes_hr.height);
        }

        if(this.currentSettings.pattern && this.canvasPattern) {    
            this.tempCtx.globalCompositeOperation = "source-in";
            this.tempCtx.fillStyle = this.canvasPattern.pattern;
            this.tempCtx.fillRect( 0, 0, this.sizes_hr.width, this.sizes_hr.height);
            this.tempCtx.globalCompositeOperation = "source-over"; 
        }       

        this.writeHistory();
        this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0, 0);
        
        this.applyTemp();
    },
    layerToSelection(id) {
        this.selectLayer(id);
        const {width, height} = this.currentLayer.ctx.canvas;
        const data = this.currentLayer.ctx.getImageData(0, 0, width, height).data;
        const amount = width * height;
        let bbox = [
            [Infinity, Infinity], [-Infinity, -Infinity]
        ];

        for(let i = 0; i < amount; i++) {
            if(data[i*4+3] != 0) {
                let y = Math.floor(i / width);
                let x = i % width;
                if(x < bbox[0][0]) bbox[0][0] = x;
                if(y < bbox[0][1]) bbox[0][1] = y;
                if(x > bbox[1][0]) bbox[1][0] = x;
                if(y > bbox[1][1]) bbox[1][1] = y;
            }
        }
        this.selectArea(bbox);      
    },
    selectArea([p1, p2]) {
        const {width, height} = this.currentLayer.ctx.canvas;
        this.$store.commit("selectInstrument", "selection_rect");  
        this.selection = new Selection(p1,this.selCtx, this.sizes.px_ratio, this.zoom);
        this.selection.setPoint(p2);
        this.startTransformSelection();
    },
    applyTemp() {        
        this.tempCtx.clearRect(0,0, this.sizes_hr.width, this.sizes_hr.height);
        this.render();
            
    },
    render(temp) {
        const {width, height} = this.blender.canvas;
        this.blender.clearRect(0,0, width, height);
        this.blender.fillStyle = this.backgroundColor;
        this.blender.fillRect(0,0, width, height);      
        
        this.layers.forEach(l => {
            if(l.visible) {
                this.blender.globalCompositeOperation = l.blend;
                this.blender.globalAlpha = l.opacity / 100;
                if(l == this.currentLayer) {
                    if(temp)
                        this.blender.drawImage(this.tempCtx.canvas, 0, 0);
                    else           
                        this.blender.drawImage(l.ctx.canvas, 0, 0);

                    if(this.selection) 
                        this.blender.drawImage(this.selection.imgCtx.canvas, 0, 0);
                } else this.blender.drawImage(l.ctx.canvas, 0, 0);     
            }            
        });    
    },
    endDraw(point, tool) {
        if(tool.notEmpty()) {
            tool.addPoint(point);
            this.currentLayer.ctx.globalCompositeOperation = "source-over";
            this.writeHistory();
            if(this.selection) {
                this.selection.clip(this.currentLayer.ctx);
            } 
            tool.drawToCtx(this.currentLayer.ctx);
            if(this.selection) 
                this.currentLayer.ctx.restore();
            tool.dropLine();  
            this.render();
        }    
    },
    draw(point, tool) {
        this._draw(point, tool);       
        this.render(true);
        
    },
    endErase(point) {
        if(this.brush.notEmpty()) {
            this._draw(point, this.brush, "destination-out");       
            this.writeHistory();
            this.currentLayer.ctx.globalCompositeOperation = "copy";
            this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0, 0);
            this.brush.dropLine();
        }
    },
    _draw(point, tool, compositeOperation = "source-over") {
        tool.addPoint(point);
        this.tempCtx.globalCompositeOperation = "copy";
        this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0, 0);
        if(this.selection) {
            this.selection.clip(this.tempCtx);
        }             
        this.tempCtx.globalCompositeOperation = compositeOperation;
        tool.drawToCtx(this.tempCtx);            
        if(this.selection) 
            this.tempCtx.restore();
    },
    erase(point) {
        this._draw(point, this.brush, "destination-out");       
        this.render(true);        
    },
    setCursor() {
        this.cursorStyles.transform = null;
        this.cursorStyles["background-image"] = null;
        if(["brush", "eraser", "marker"].indexOf(this.currentTool) == -1) {
            this.cursorStyles.width = "20px";
            this.cursorStyles.height = "20px";

            } else {
            if(this.currentTool == "marker") {
                this.cursorStyles.height = this.currentSettings.lineWidth  + "px";
                this.cursorStyles.width = "15px";

            } else {
                this.cursorStyles.width = this.currentSettings.radius * this.zoom  + "px";
                this.cursorStyles.height =this.currentSettings.radius * this.zoom  + "px";
            }
            this.cursorStyles["background-color"] = "transparent"; 
            if(this.currentSettings.texture) {
                this.cursorClasses = ["texture"];
                this.cursorStyles["background-image"] = `url(${this.currentSettings.texture.src})`;
            } else {
                this.cursorClasses = [this.currentSettings.shape];
            }        
        }
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
        const realCanvasSizes = {
            width: Math.round(width * px_ratio),
            height: Math.round(height * px_ratio)
        };
        const canvasPageSizes = {
            width: width * this.zoom,
            height: height * this.zoom
        }

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
       
        this.canvasSizes.width =  width;
        this.canvasSizes.height = height;

        this.canvasStyles.width = canvasPageSizes.width + "px";
        this.canvasStyles.height = canvasPageSizes.height + "px";       
        this.sizes_hr = realCanvasSizes;     

        ['canvas', "blender", "selection"].forEach(s => {
            this.$refs[s].width = this.sizes_hr.width;
            this.$refs[s].height = this.sizes_hr.height;
            this.$refs[s].style.width = this.canvasStyles.width;
            this.$refs[s].style.height = this.canvasStyles.height;
        });     

       
        ["tempCtx", "tempCtx2"].forEach(s => {
            this[s].canvas.width = this.sizes_hr.width;
            this[s].canvas.height = this.sizes_hr.height;
        })

        let rect = resizeMode == "move" ? 
            [...origin, oldCanvasSizes.width, oldCanvasSizes.height] 
        : [0, 0, oldCanvasSizes.width, oldCanvasSizes.height];

        let rect1 = [0, 0, oldCanvasSizes.width, oldCanvasSizes.height];
        
        this.layers.forEach(layer => {
            this.tempCtx.clearRect(0, 0, this.tempCtx.canvas.width, this.tempCtx.canvas.height);
            this.tempCtx.drawImage(layer.ctx.canvas, ...rect1, ...rect);

            layer.ctx.clearRect(0, 0, layer.ctx.canvas.width, layer.ctx.canvas.height);        
            layer.ctx.canvas.width = this.sizes_hr.width;
            layer.ctx.canvas.height = this.sizes_hr.height;            
            layer.ctx.drawImage(this.tempCtx.canvas, 0, 0, this.sizes_hr.width, this.sizes_hr.height);    
        }); 
        Object.assign(this.sizes, {width, height});   
        
        this.brush.setSizes(this.sizes_hr);
        this.marker.setSizes(this.sizes_hr);

        if(px_ratio != this.sizes.px_ratio) {
            this.sizes.px_ratio = px_ratio;
            if(this.selection) 
                this.selection.setPxRatio(this.sizes.px_ratio);
            this.setBrushParams();
        }

        this.render();
    },
    newDrawing(title = this.$t('newDrawingTitle')) {
        this.layers = [];
        if(this.selection) {
            this.selection.drop();
            this.selection = null;
        }
        this.clearHistory();
        this.title = title;
        this.appendLayer(this.$t("layers.newLayer") + " 1");
    },
    copyCurrentLayer() {
        let nameBase = this.currentLayer.name.replace(/\s*copy\s*(\d*)\s*$/i, "");
        let regCopy = new RegExp(nameBase + ' copy\\s*(\\d*)\\s*$', "i");

        let name = this.layers.reduce((last, layer) => {
            if(regCopy.test(layer.name)) {
                let res = regCopy.exec(layer.name);
                let name1 = nameBase + " copy " + ((res[1].length ? parseInt(res[1]) : 1) + 1);
                if(name1 > last) return name1;
            }
            return last;
            }, nameBase + " copy");

        let {blend, opacity, visible} = this.currentLayer;
        this.appendLayer(name, {
            img: this.currentLayer.ctx.canvas,
            x: 0, y: 0,
            ...this.sizes
        });
        Object.assign(this.currentLayer, {blend, opacity, visible});
        this.render();      
    },
    createLayer(name, paste) {
        if(!name) {
            this.regLayer = this.regLayer || new RegExp(this.$t("layers.newLayer") + '\\s*(\\d+)$', "i");
            let nameBase = this.$t("layers.newLayer") + " ";
            name = this.layers.reduce((last, layer) => {
            if(this.regLayer.test(layer.name)) {
                let name1 = nameBase + (parseInt(this.regLayer.exec(layer.name)[1]) + 1);
                if(name1 > last) return name1;
            }
            return last;
            }, nameBase + " 1");            
        }
        const layer = {
            id: Date.now(), 
            name, 
            opacity: 100,
            visible: true,
            blend: "source-over"
        };
        layer.ctx = (new OffscreenCanvas(this.sizes_hr.width, this.sizes_hr.height)).getContext("2d");
         if(paste) {
            layer.ctx.drawImage(paste.img, 
            ...[paste.x, paste.y, paste.width, paste.height].map(v => v * this.sizes.px_ratio));
        }        
        return layer;
    },
    appendLayer(name, paste) {
        const layer = this.createLayer(name, paste);
        
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
        this.currentLayerIndex = this.layers.findIndex(l => l.id == id);
        if(this.currentLayerIndex >= 0) {
            this.currentLayer = this.layers[this.currentLayerIndex];
            this.render();
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
            merged.ctx.drawImage(layer.ctx.canvas, 0, 0, this.sizes_hr.width, this.sizes_hr.height);
            this.layers.splice(this.layers.indexOf(layer), 1);
        });
        this.selectLayer(merged.id);
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
    &.visible { background-image: url("./assets/img/visible.svg"); }
    &.swap { background-image: url("./assets/img/swap.svg"); }
    &.link { background-image: url("./assets/img/link.svg"); }

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
    padding: 5px;
    flex: 1 1 50px;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    position: relative;
    & > * {
        max-width: 100%;
    }
    &.top {
        flex: 0 0 60px;
    }
    &.bottom {
        margin-top: 5px;
        flex: 0 0 30px;
        max-height: 30px;
        padding: 0;
    }
    &.right {
        flex: 1 1 250px;
        max-width: 250px;
    }
}
$canvas_height: calc(100vh - 105px);
#wrapper {
  // overflow: hidden;
   flex: 2 1 100%;
   width: calc(100vw - 360px);
   height: $canvas_height;
   max-height: $canvas_height;
   &:hover  #cursor {
        z-index: $z-index_canvas-cursor;
        visibility: visible;
    }
}
#canvas-container {    
    border: 2px solid black;
    overflow: auto;
    background-image: url("./assets/img/forest.jpg");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-color: grey;
    width: calc(100vw - 360px);
    height: $canvas_height;
    max-height: $canvas_height;
    line-height: $canvas_height;
    text-align: center;
    position: relative;
    vertical-align: middle;
    cursor: none;


    #canvas {
        background: white;
        position: relative;
        margin: auto;
        display: inline-block;
        vertical-align: middle;
    }
    
    canvas {
        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;
        cursor: none;
    }
}
#cursor {
    pointer-events: none;
    position: fixed;
    z-index: -1;
    visibility: hidden;
    transform: translate(-50%,-50%);

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
    &.marker {
        transform-origin: center;
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
    &.picker, &.fill {
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
        &.rotate {
            width: 15px!important;
            height: 15px!important;
            background-image: url("./assets/img/rotate.svg");
        }
        &.resize {
            background-image: url("./assets/img/resize3.svg");
        }
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

}
</style>
