<template>
  <div id="app">    
    <div class="panel left">
      <Instruments
        :selection="selection && selection.started"
        @apply-selection="applySelection"
        @redo-selection="redoSelection"
        @select-all="() => selectArea([[0,0], [sizes.width, sizes.height]])"
        @crop-selection="cropSelection"
       />
    </div>
    <div id="center">
      <div class="panel top">
        <TopPanel 
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
          <div id="canvas-container" ref="container">
            <div id="canvas" 
            ref="canvas" 
            :style="{width: canvasSizes.width, height: canvasSizes.height, transform: getTransform() }">
              <canvas
              :style="{
                ...canvasSizes, 
                zIndex: 100
              }" 
              ref="blender"></canvas>
              <canvas 
              :style="{
                ...canvasSizes,
                zIndex: layers.length + 120
              }"
              ref="selectionImg"
              ></canvas>
              <canvas 
              :style="{
                ...canvasSizes,
                zIndex: layers.length + 120
              }"
              ref="selection"
              ></canvas>
              <div id="cursor" :style="cursorStyles" :class="[currentInstrument, ...cursorClasses]"></div>
            </div>
          </div>

    </div>
    <div class="panel right">
       <Color-Picker :colorToEdit.sync="colorToEdit" />
        <Layers 
          :layers="layers" 
          :currentLayer="currentLayer"
          @add-layer="appendLayer"
          @layer-to-selection="layerToSelection"
          @select-layer="selectLayer"
          @reorder-layer="reorderLayer"
          @toggle-layer="toggleLayer"
          @remove-layer="removeLayer"
          @update:opacity="render"
          @update:blend="render"
        />
    </div>
    <svg style="position: fixed; z-index: -1;">
      <defs>
        <clipPath id="selectionClipPath">
          <path id="sClip" fill="black"/>
        </clipPath>        
         <filter id="outline">
          <feMorphology operator="dilate" radius="1" result="dil" />
          <feComposite in2="SourceGraphic" in="dil" operator="xor" result="comp"/>
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
      </defs>
    
  </svg>
  <img id="logo" src="./assets/img/пушинка.png">
  </div>
</template>

<script>
import {mapState} from "vuex";
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import Selection from "./classes/Selection";
import SelectionPath from "./classes/SelectionPath";
import Brush from "./classes/Brush";
import History from "./classes/History";

import Instruments from "./components/Instruments";
import ColorPicker from "./components/ColorPicker";
import Layers from "./components/Layers";
import TopPanel from "./components/TopPanel";

import FilterMixin from "./mixins/FilterMixin";

import {getRgba, getGlColor} from "./functions/color-functions";
import {fill} from "./functions/pixel-functions";




function getPressure(event) {
  if(event.pointerType == "mouse") {
    return event.pressure > 0 ? 1 : 0;
  } else return event.pressure;
}

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
        height: 600
      },
      lastPoint: null,
      currentLayer: null,
      currentLayerIndex: 0,

      history: new History(10),
      cursorClasses: [],
      zoom: 1,
      selection: null,
      texture: null,
      canvasPattern: null,
      colorToEdit: "fg",
      backgroundColor: "#ffffff"
    }
  },
  components: {
    Instruments, ColorPicker, Layers, TopPanel
  },
  mixins: [FilterMixin],
  computed: {
    ...mapState(['currentInstrument', 'currentColor']),
    historySize() {
      return this.$store.state.userPrefs.historySize;
    },
    currentBrush() {
      return this.$store.getters.currentSettings;
    }

  },
  watch: {
    currentColor() {
      this.setBrushParams();
    },
    currentBrush: {
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
            }
            this.canvasPattern.img.src = val.pattern.src;
          }
        } else this.canvasPattern = null;
      }
    },
    currentInstrument() {
        this.setCursor();    
      
        if(this.currentInstrument.indexOf("selection") == 0) {
          if(this.selection) {            
            this.selection.startTransform(this.currentLayer.ctx);
          }
        }   
        if(["brush", "eraser"].indexOf(this.currentInstrument) != -1) {
          
          if(this.selection) {
            this.currentLayer.ctx.drawImage(this.$refs.selectionImg, 0, 0, this.sizes.width, this.sizes.height);
          }
          
        }        
      
    }
  },
  mounted() {
    //if(navigator.languages[0].indexOf("ru") == 0)this.$i18n.locale = "ru";
    document.getElementsByTagName("title")[0].innerText = this.$t("title");


    this.tempCtx =  (document.createElement("canvas")).getContext("2d");
    this.tempCtx2 = (new OffscreenCanvas(800, 600)).getContext("2d");

    this.blender = this.$refs.blender.getContext("2d");
    this.brush = new Brush();
    this.setBrushParams();
    this.setSize({
      width: 800,
      height: 600
    }, true);
    
    this.selImgCtx = this.$refs.selectionImg.getContext("2d");
    this.selCtx = this.$refs.selection.getContext("2d");

    this.newDrawing();
    this.initControls();
    this.setCursor();

    window.addEventListener("resize", () => {
      this.$forceUpdate();
    })
  },
  methods: {
    setBrushParams() {
      this.brush.setParams({
        ...this.currentBrush, 
        color: getGlColor(this.currentColor),
        linearGradient: this.currentBrush.linearGradient ? 
          this.currentBrush.linearGradient.map(getGlColor) 
        : false,
        radialGradient: this.currentBrush.radialGradient ? 
          this.currentBrush.radialGradient.map(getGlColor) 
        : false,
      });
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
    saveToFile() {
      this.render()
      this.blender.canvas.toBlob(blob => {
        saveAs(blob, "img.png");
    });
    },
    initControls() {
      let pressure = 0;

      this.cursorStyles.width = this.currentBrush.radius * 2 + "px";
      this.cursorStyles.height = this.currentBrush.radius * 2 + "px";


      document.addEventListener("keydown", e => {     
        if(e.key == "Enter") {
          e.preventDefault();
          this.applySelection();
        }
        if(e.ctrlKey) {
          switch(e.code) {
            case "KeyA":
              e.preventDefault();
              
              this.selectArea([[0,0], [this.sizes.width, this.sizes.height]]);
              break;
            case "KeyT":
              e.preventDefault();
              this.cropSelection();
              break;
            case "KeyX":
              this.copySelection(true);
              break;
            case "KeyC":
              this.copySelection();             
              break;
            case "KeyV":
              this.applySelection();
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
              
              break;
            case "KeyZ":
              e.preventDefault();
              const sshot = this.history.remove();
              if(sshot) {
                if(sshot.instrument == "append-layer") {
                  this.layers.splice(this.layers.indexOf(sshot.layer), 1);
                  this.selectLayer(sshot.prev.id);
                } else if(sshot.instrument == "remove-layer") {
                  this.layers.push(sshot.layer);
                  this.selectLayer(sshot.layer.id);
                  setTimeout(() => {
                    let ref = this.$refs['layerEl' + sshot.layer.id];
                    if(Array.isArray(ref)) ref = ref[0];
                    this.currentLayer.ctx = ref.getContext("2d");
                    this.currentLayer.ctx.putImageData(sshot.state, 0, 0);

                  }, 50);                   

                } else {
                  if(sshot.instrument.indexOf("selection") == 0 && this.selection) {
                    this.selection.drop();
                    this.selection = null;
                  }
                  sshot.layer.ctx.putImageData(sshot.state, 0, 0);
                  this.selectLayer(sshot.layer.id);
                }
                this.render();
              }             
              break;        
              case "NumpadAdd":
              case "Equal":
                e.preventDefault();
                this.zoom *= 1.25
                break; 
              case "NumpadSubtract":
              case "Minus":
                e.preventDefault();
                this.zoom *= .8
                break;    

          }
        }

      });   

      let prevClick = {
        time: 0, x: 0, y: 0
      };

      this.$refs.canvas.addEventListener("pointerdown", event => {
        event.preventDefault();
        pressure = getPressure(event);
          this.lastPoint = {
            x: Math.round(event.offsetX), 
            y: Math.round(event.offsetY),
            pressure
          };
        if(pressure > 0) {           
          if(["picker"].indexOf(this.currentInstrument) == -1) {
            this.history.append({
              instrument: this.currentInstrument,
              layer: this.currentLayer,
              state:  this.currentLayer.ctx.getImageData(0, 0, this.sizes.width, this.sizes.height)
            });
          }
          
          if(this.currentInstrument == "selection-rect") {
            if(!this.selection) {
              this.selection = new Selection([ this.lastPoint.x, this.lastPoint.y ], this.selImgCtx, this.selCtx);
            } else {
              this.selection.applyTransform(this.lastPoint, true);              
            }            
          }
          if(this.currentInstrument == "selection-polygon") {
            if(!this.selection) {
              this.selection = new SelectionPath([ this.lastPoint.x, this.lastPoint.y ], this.selImgCtx, this.selCtx);
            } else {
              if(!this.selection.started) {
                this.selection.addPoint([this.lastPoint.x, this.lastPoint.y]); 
              } else {
                this.selection.applyTransform(this.lastPoint, true);     
              }            
            }            
          }

          if(this.currentInstrument == "selection-lasso") {
            if(!this.selection) {
              this.selection = new SelectionPath([ this.lastPoint.x, this.lastPoint.y ], this.selImgCtx, this.selCtx);
            } else {
              this.selection.applyTransform(this.lastPoint, true);    
            }            
          }
          
           if(this.currentInstrument == "fill") {
            this.fill(this.lastPoint);
           }
            if(this.currentInstrument == "brush") {
              this.draw(this.lastPoint);           
            } else if(this.currentInstrument == "eraser") {

              this.erase(this.lastPoint);
            }                       
          }
        if(this.currentInstrument == "picker") {
          this.pickColor();
        }
      });
      this.$refs.canvas.addEventListener("pointermove", event => {     
        event.preventDefault();
        pressure = getPressure(event);

          const point1 = {
            x: event.offsetX, 
            y: event.offsetY,
            pressure
          };

          if(this.selection) {
            if(this.selection.ready) {
              let c = this.selection.getCursor(point1);
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
            }
            this.$forceUpdate();
            
          }

          if(this.currentInstrument == "selection-polygon" && this.selection && !this.selection.started) {
              this.lastPoint = point1;
              this.selection.setPoint([ this.lastPoint.x, this.lastPoint.y ]);                              
            }

          if(this.currentInstrument == "selection-lasso" && this.selection && !this.selection.started) {
              this.lastPoint = point1;
              this.selection.addPoint([ this.lastPoint.x, this.lastPoint.y ]);                              
            }
         

          if(this.lastPoint === null || this.currentInstrument == "picker" || this.currentInstrument == "fill") {
            this.lastPoint = point1;
          } else {
         
            if(pressure > 0) {              
              if(this.currentInstrument == "selection-rect") {
                  this.lastPoint = point1;
                  if(this.selection.started) {
                    
                    this.selection.applyTransform(this.lastPoint);
                  } else {
                    this.selection.setPoint([ this.lastPoint.x, this.lastPoint.y ]);            
                  }                  
                }

              if((this.currentInstrument == "selection-polygon" || this.currentInstrument == "selection-lasso") && this.selection.started) {
                  this.lastPoint = point1;
                   this.selection.applyTransform(this.lastPoint);                          
                }
              if(this.currentInstrument == "brush") {
                this.draw(point1);           
              } else if(this.currentInstrument == "eraser") {
                this.erase(point1);
              }                       
            }
            
            this.lastPoint = point1;
          }          
          this.cursorStyles.left = this.lastPoint.x + "px";
          this.cursorStyles.top =  this.lastPoint.y + "px";
          if(this.currentInstrument == "picker" && pressure > .25) {
            this.pickColor();
        }
          this.$forceUpdate();
      });
      this.$refs.canvas.addEventListener("pointerup", event => {
          this.lastPoint = null;       
          let t = Date.now();
          



          if(this.currentInstrument == "selection-rect") {
            if(!this.selection.ready) {
              this.selection.startTransform(this.currentLayer.ctx);
            }            
          }

          if(this.currentInstrument == "selection-lasso") {
            if(!this.selection.ready) {
              this.selection.startTransform(this.currentLayer.ctx);
            }            
          }

          if(this.currentInstrument == "selection-polygon") {
            if(!this.selection.ready) {
              if(t - prevClick.time < 300) {
                this.selection.startTransform(this.currentLayer.ctx);
              }
            }            
          }




         
          this.applyTemp();

          prevClick.time = t;

          
      }, false);

    },
    pickColor() {
      const data = Array.from(this.blender.getImageData(this.lastPoint.x, this.lastPoint.y, 1, 1).data);
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
        if(mode == "resize-canvas") {
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

      }
      img.src = URL.createObjectURL(file);          
    },
    copySelection(clip = false) {
      if(this.selection && this.selection.ready) {
          let c = document.createElement("canvas");
          c.width = this.selection.bbox[1][0] - this.selection.bbox[0][0];
          c.height = this.selection.bbox[1][1] - this.selection.bbox[0][1];
          let ctx = c.getContext("2d");      
          ctx.drawImage(this.$refs.selectionImg, 
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
              
              if(clip) {
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
        this.currentLayer.ctx.drawImage(this.$refs.selectionImg, 0, 0, this.sizes.width, this.sizes.height);
        this.selection.drop();
        this.selection = null;           
        this.render();
      }
    },
    redoSelection() {
      if(this.selection) {
        this.selection.drop();
        this.selection = null;
        let sshot = this.history.remove();
        sshot.layer.ctx.putImageData(sshot.state, 0, 0);
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
    fill(point) {
      let data = this.currentLayer.ctx.getImageData(0, 0, this.sizes.width, this.sizes.height).data;
      let positions = new Int8Array( this.sizes.width * this.sizes.height );
      let color = getRgba(this.currentColor);
      let color0 = Array.from(
        data.slice(
          (point.y * this.sizes.width + point.x) * 4,
          (point.y * this.sizes.width + point.x) * 4 + 4
        )
      );             

     let data1 = fill([[point.x, point.y]], positions, data, color, color0, this.sizes.width, this.sizes.height, this.currentBrush.tolerance);

     if(this.selection) {
        this.tempCtx2.putImageData(
          new ImageData(data1, this.sizes.width), 0, 0, 0, 0, this.sizes.width, this.sizes.height);        
        if(this.currentBrush.pattern && this.canvasPattern) {    
          this.tempCtx2.globalCompositeOperation = "source-in";
          this.tempCtx2.fillStyle = this.canvasPattern.pattern;
          this.tempCtx2.fillRect( 0, 0, this.sizes.width, this.sizes.height);
          this.tempCtx2.globalCompositeOperation = "source-over"; 
        } 
        this.tempCtx.save();      
        this.selection.drawClipPath(this.tempCtx);
        this.tempCtx.clip();
        this.tempCtx.drawImage(this.tempCtx.canvas, 0, 0);
        this.tempCtx.restore();


     } 
       this.tempCtx.putImageData(
          new ImageData(data1, this.sizes.width), 0, 0, 0, 0, this.sizes.width, this.sizes.height);

       if(this.currentBrush.pattern && this.canvasPattern) {    
          this.tempCtx.globalCompositeOperation = "source-in";
          this.tempCtx.fillStyle = this.canvasPattern.pattern;
          this.tempCtx.fillRect( 0, 0, this.sizes.width, this.sizes.height);
          this.tempCtx.globalCompositeOperation = "source-over"; 
       } 
        
     
      
      this.applyTemp();
    },
    layerToSelection(id) {
      this.selectLayer(id);
      const {width, height} = this.sizes;
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
      this.$store.commit("selectInstrument", "selection-rect");
      this.history.append({
              instrument: this.currentInstrument,
              layer: this.currentLayer,
              state:  this.currentLayer.ctx.getImageData(0, 0, this.sizes.width, this.sizes.height)
            });
      
      this.selection = new Selection(p1, this.selImgCtx, this.selCtx);
      this.selection.setPoint(p2);
      this.selection.startTransform(this.currentLayer.ctx);

    },
    applyTemp() {
     
         if(this.currentInstrument == "eraser") {

            this.currentLayer.ctx.globalCompositeOperation = "copy";
            this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0, 0);
            this.brush.dropLine();

          } else if(this.currentInstrument == "brush")  {            
            this.currentLayer.ctx.globalCompositeOperation = "source-over";
            this.brush.update = false;
            this.brush.render();

            if(this.selection) {
                this.currentLayer.ctx.save();
                this.selection.drawClipPath(this.currentLayer.ctx);
                this.currentLayer.ctx.clip();
            } 
            this.currentLayer.ctx.drawImage(this.brush.canvas, 0, 0, this.sizes.width, this.sizes.height);   
            if(this.selection) 
              this.currentLayer.ctx.restore();

            
            this.brush.dropLine();   

 
              
          } else if(this.currentInstrument == "fill") {
            this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0, 0);
          }             
        
          
          this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
          this.render();
            
    },
    render(temp) {
      this.blender.clearRect(0,0, this.sizes.width, this.sizes.height);
      this.blender.fillStyle = this.backgroundColor;
      this.blender.fillRect(0,0, this.sizes.width, this.sizes.height);
      
      this.layers.forEach(l => {
        if(l.visible) {
          this.blender.globalCompositeOperation = l.blend;
          this.blender.globalAlpha = l.opacity / 100;
          if(temp && l == this.currentLayer) {
            this.blender.drawImage(this.tempCtx.canvas, 0, 0);
          } else {          
            this.blender.drawImage(l.ctx.canvas, 0, 0);
          }       

        }
        
      });
      
    },
    draw(point) {
      this.brush.addPoint([point.x, point.y], point.pressure);
      this.brush.onNextRedraw = () => {
         
          this.tempCtx.globalCompositeOperation = "copy";
          this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0, 0);

          this.tempCtx.globalCompositeOperation = "source-over";
          this.tempCtx.drawImage(this.brush.canvas, 0, 0);

          this.render(true);
      };
    },
    erase(point) {
      this.brush.addPoint([point.x, point.y], point.pressure);

      this.brush.onNextRedraw = () => {
         
          this.tempCtx.globalCompositeOperation = "copy";
          this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0, 0);

          this.tempCtx.globalCompositeOperation = "destination-out";
          this.tempCtx.drawImage(this.brush.canvas, 0, 0);

          this.render(true);
      };

     

    },
    setCursor() {
      this.cursorStyles.transform = null;
       this.cursorStyles["background-image"] = null;
      if(["brush", "eraser"].indexOf(this.currentInstrument) == -1) {
        this.cursorStyles.width = "20px";
        this.cursorStyles.height = "20px";

        } else {
        this.cursorStyles.width = this.currentBrush.radius  + "px";
        this.cursorStyles.height =this.currentBrush.radius  + "px";
        this.cursorStyles["background-color"] = "transparent"; 
        if(this.currentBrush.texture) {
          this.cursorClasses = ["texture"];
          this.cursorStyles["background-image"] = `url(${this.currentBrush.texture.src})`;
        } else {
          this.cursorClasses = [this.currentBrush.shape];
        }        
      }
    },
    setSize({width, height, resizeMode, originMode, origin}, init = false) {
      if(!init) {
        this.history.append({
          instrument: "set-size",
          layer: this.currentLayer,
          prev: Object.assign({}, this.sizes)
        });
      }
      width = Math.round(width)
      height - Math.round(height)
      if(resizeMode == undefined) resizeMode = origin ? "move" : "resize";
      if(resizeMode == "move" && originMode !== undefined) {
        let [y, x] = originMode.split("-");
        origin = [0, 0]
        origin[0] = {
          left: 0,
          center: (this.sizes.width - width) / 2,
          right: this.sizes.width - width
        }[x];
        origin[1] = {
          top: 0,
          center: (this.sizes.height- height) / 2,
          bottom: this.sizes.height - height
        }[y];
      }
      
      ["blender", "selectionImg", "selection"].forEach(s => {
        this.$refs[s].width = width;
        this.$refs[s].height = height;
        this.$refs[s].style.width = width + "px";
        this.$refs[s].style.height = height + "px";
      });     
      ["tempCtx", "tempCtx2", "brush"].forEach(s => {
        this[s].canvas.width = width;
        this[s].canvas.height = height;
      })

      let rect = resizeMode == "move" ? 
        [...origin, width, height] 
      : [0, 0, this.sizes.width, this.sizes.height];

      this.layers.forEach(layer => {
          this.tempCtx.clearRect(0, 0, this.sizes.width, this.sizes.height);
          this.tempCtx.drawImage(layer.ctx.canvas, ...rect, 0, 0, width, height);
          layer.ctx.clearRect(0, 0, this.sizes.width, this.sizes.height);
                  
          layer.ctx.canvas.width = width;
          layer.ctx.canvas.height = height;
          
          layer.ctx.drawImage(this.tempCtx.canvas, 0, 0, width, height);
          
        }); 
       

      this.sizes = {width, height};
      this.canvasSizes.width =  width + "px";
      this.canvasSizes.height = height + "px";

      
      
      this.canvasStyles = {
        ...this.canvasStyles, 
        ...this.canvasSizes
      };
      this.brush.setSizes(this.sizes);

      this.render();
    },
    newDrawing(title = "New drawing") {
      this.layers = [];
      this.title = title;
      this.appendLayer("Layer 1");
    },
    appendLayer(name, paste) {
      if(!name) {
        name = this.layers.reduce((last, layer) => {
          if(/Layer (\d+)/.test(layer)) {
            if(layer >= last) 
            return "Layer " + (1 + parseInt(layer.split(" ")[1]));
          }
          return last;
        }, "Layer " + (1 + this.layers.length));
        
      }
      const layer = {
        id: Date.now(), 
        name, 
        opacity: 100,
        visible: true,
        blend: "source-over"
      };
      layer.ctx = (new OffscreenCanvas(this.sizes.width, this.sizes.height)).getContext("2d");
      this.layers = this.layers.slice(0, this.currentLayerIndex+1)
      .concat([layer])
      .concat(this.layers.slice(this.currentLayerIndex+1));
      let prev = this.currentLayer;
      this.selectLayer(layer.id);

     

      if(paste) {
        this.currentLayer.ctx.drawImage(paste.img, paste.x, paste.y, paste.width, paste.height);
      }
      
      if(prev)
        this.history.append({
          instrument: "append-layer",
          layer: this.currentLayer,
          state:  this.currentLayer.ctx.getImageData(0, 0, this.sizes.width, this.sizes.height),
          prev
        });

        this.render();
      
    },
    selectLayer(id) {
      this.currentLayerIndex = this.layers.findIndex(l => l.id == id);
      this.currentLayer = this.layers[this.currentLayerIndex];
      this.render();
    },
    reorderLayer({oldIndex, newIndex}) {
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
      let ind = this.layers.findIndex(l => l.id === id);
      let remove = this.layers[ind];

       this.history.append({
          instrument: "remove-layer",
          layer: remove,
          state:  remove.ctx.getImageData(0, 0, this.sizes.width, this.sizes.height)
        });

        if(this.currentLayer.id == remove.id) {
          this.selectLayer(this.layers[(ind ? ind - 1 : 0)].id);
        }

        this.layers.splice(ind, 1);

        this.render();

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
    -moz-appearance:textfield; /* Firefox */
}

*:focus {
    outline: none;
}


.underlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}


#app {
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
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
    &.right {
      flex: 1 1 250px;
      max-width: 250px;
    }
  }
  #canvas-container {
    flex: 2 1 100%;
    border: 2px solid black;
    overflow: auto;
    background-image: url("./assets/img/forest.jpg");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-color: grey;
    max-width: calc(100vw - 360px);
    max-height: calc(100vh - 80px);
    #canvas {
      transform-origin: 0 0;
      background: white;
    }
    
    &:hover #cursor {
      display: block;
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
    display: none;
    pointer-events: none;
    position: absolute;
    z-index: 10000000000;
    transform: translate(-50%,-50%);
    
    &.brush, &.eraser {
      border: 1px solid black;
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
        
        border-color: transparent;
        filter: url(#outline);
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
      width: 10px!important;
      height: 10px!important;
      border-color: transparent;
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
        z-index: 1000000;
        width: 20px;
        height: 20px;
        background-size: 100% 100%;        
      }
    }

    &.selection-rect, &.selection-polygon, &.selection-lasso {
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
