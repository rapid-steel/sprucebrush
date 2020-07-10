<template>
  <div id="app">    
    <div class="panel left">
      <Instruments />
    </div>
    <div id="center">
      <div class="panel top">
        <TopPanel 
          @save-image="saveToFile"
          @import-image="pasteImageFromFile"
        />
      </div>
          <div id="canvas-container" ref="container">
            <div id="canvas" 
            ref="canvas" 
            :style="{...canvasSizes, transform: getTransform() }">
              <canvas v-for="l in layers" 
              :key="l.id" 
              :style="{...canvasSizes, opacity: l.opacity + '%', visibility: l.visible ? 'visible' : 'hidden'}" 
              :width="sizes.width" 
              :height="sizes.height" 
              :ref="'layerEl' + l.id"></canvas>
              <canvas
              :style="{...canvasSizes, opacity: currentLayer ? currentLayer.opacity + '%' : 0}" 
              :width="sizes.width" 
              :height="sizes.height" 
              ref="temporary2"
              ></canvas>
              <canvas
              :style="{...canvasSizes, opacity: currentInstrument == 'eraser' ? 0 : currentLayer ? currentLayer.opacity + '%' : 0}" 
              :width="sizes.width" 
              :height="sizes.height" 
              ref="temporary"
              ></canvas>
              <canvas 
              :style="canvasSizes"
              :width="sizes.width" 
              :height="sizes.height" 
              ref="selectionImg"
              ></canvas>
              <canvas 
              :style="canvasSizes"
              :width="sizes.width" 
              :height="sizes.height" 
              ref="selection"
              ></canvas>
              <div id="cursor" :style="cursorStyles" :class="[currentInstrument, ...cursorClasses]"></div>
            </div>
          </div>

    </div>
    <div class="panel right">
       <Color-Picker />
        <Layers 
          :layers="layers" 
          :currentLayer="currentLayer"
          @add-layer="appendLayer"
          @layer-to-selection="layerToSelection"
          @select-layer="selectLayer"
          @reorder-layer="reorderLayer"
          @toggle-layer="toggleLayer"
          @remove-layer="removeLayer"
        />
    </div>
    



    
   



    

  </div>
</template>

<script>
import {mapState} from "vuex";
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import Selection from "./classes/Selection";
import SelectionPath from "./classes/SelectionPath";

import Instruments from "./components/Instruments";
import ColorPicker from "./components/ColorPicker";
import Layers from "./components/Layers";
import TopPanel from "./components/TopPanel";

function getRgba(color) {
  if(color.indexOf("rgb") == 0) {
    let vals = color.replace(")", "").split("(")[1].split(",").map(s => +s);
    if(vals.length == 3) vals.push(255)
    else vals[3] = 255 * vals[3]
    return vals;
  } 
  if(color.indexOf("#") == 0) {
    color = color.slice(1);
    let vals = [];
    while(color.length) {
      vals.push(parseInt(color.slice(0,2), 16));
      color = color.slice(2);
    }
    if(vals.length == 3) vals.push(255)
    return vals;
  }
}
function fill(pos, positions, pixels, color, color0, width, height, tolerance) {
  let pos1 = [];
  pos.forEach(([x,y]) => {
    let p = y * width + x
    positions[p] = 1;
    for(let i = 0; i < 4; i++) {
      pixels[p * 4 + i] = color[i] 
    }
    
    [
      [x - 1, y],  [x - 1, y-1],
      [x, y -1],  [x - 1, y+1],
      [x + 1, y],  [x + 1, y-1],
      [x, y + 1],  [x + 1, y - 1],
    ].forEach(([x1, y1]) => {
      let ind = y1 * width + x1
      if(ind < width * height && ind >= 0) {
        if(positions[ind] == 0) {
          positions[ind] = 1;
          let t = 0;
          for(let i = 0; i < 4; i++) {
            t += Math.abs(
              pixels[ind * 4 + i] - color0[i]
            )
          }
          if(t < tolerance) {
            pos1.push([x1, y1]);
          }
        }
      }
    })                 
  })
  if(pos1.length) {
      pixels = fill(pos1, positions, pixels, color, color0, width, height, tolerance)
      
    }

  return pixels;

}




class History {
  constructor(size) {
    this.size = size;
    this.array = new Array(size);
    this.index = 0;
  }
  append(el) {
    this.array[this.index] = el;
    this.index = (this.index+1) % this.size;
  }
  get() {
    return this.array[this.index];
  }
  remove() {
    this.index--;
    if(this.index < 0) {
      this.index = this.size - 1;
    }
    const el = this.array[this.index];
    if(el) {
      this.array[this.index] = null;
    } else {
      this.index = 0;
    }
    return el;
  }
}

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
      sizes: {},
      lastPoint: null,
      currentLayer: null,
      history: new History(10),
      cursorClasses: [],
      zoom: 1,
      selection: null     
    }
  },
  components: {
    Instruments, ColorPicker, Layers, TopPanel
  },
  computed: {
    ...mapState(['currentInstrument', 'currentColor']),
    historySize() {
      return this.$store.state.userPrefs.historySize;
    },
    currentBrush() {
      return this.$store.state.currentInstrumentSettings[this.currentInstrument];
    }

  },
  watch: {
    currentColor() {
    },
    currentBrush: {
      deep: true,
      handler(p) {
        this.setCursor();    
      
        if(this.currentInstrument.indexOf("selection") == 0) {
          if(this.selection) {
            //this.selection.startTransform(this.currentLayer.ctx);
          }
        }   
        if(["brush", "eraser"].indexOf(this.currentInstrument) != -1) {
          
          if(this.selection) {
          //  this.currentLayer.ctx.drawImage(this.$refs.selectionImg, 0, 0, this.sizes.width, this.sizes.height);
          //  this.selection.clear();
            this.tempCtx.restore();
            this.tempCtx2.restore();
            this.tempCtx.save();
            this.selection.rotate(this.tempCtx)
            this.selection.drawClipPath(this.tempCtx);
            this.tempCtx.clip();
            this.selection.rotate(this.tempCtx, -1)
            this.tempCtx2.save();
            this.selection.rotate(this.tempCtx2)
            this.selection.drawClipPath(this.tempCtx2);
            this.tempCtx2.clip();
            this.selection.rotate(this.tempCtx2, -1)
          } else {
            this.tempCtx.restore();
            this.tempCtx2.restore();
          }
          
        }
        
      }
    }
  },
  mounted() {
    this.setSize({
      width: 800,
      height: 600
    });
    this.tempCtx2 = this.$refs.temporary2.getContext("2d");
    this.tempCtx = this.$refs.temporary.getContext("2d");
    this.selImgCtx = this.$refs.selectionImg.getContext("2d");
    this.selCtx = this.$refs.selection.getContext("2d");

    this.newDrawing();
    this.initControls();
    this.setCursor();
  },
  methods: {
    
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
        this.$refs['layerEl' +l.id][0].toBlob(blob => {
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
      let c = document.createElement("canvas");
      c.width = this.sizes.width;
      c.height = this.sizes.height;
      let ctx = c.getContext("2d");
      this.layers.forEach(l => {
        ctx.drawImage(this.$refs['layerEl' +l.id][0], 0, 0);
      });
      c.toBlob(blob => {
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
                  this.currentLayer = sshot.prev;
                } else if(sshot.instrument == "remove-layer") {
                  this.layers.push(sshot.layer);
                  this.currentLayer = sshot.layer;
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
                  this.currentLayer = sshot.layer;
                }
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

          
      });

    },
    pickColor() {
      const data = Array.from(this.currentLayer.ctx.getImageData(this.lastPoint.x, this.lastPoint.y, 1, 1).data);
        this.$store.commit("selectColor", 
          (this.cursorStyles["background-color"] = `rgba(${data.join(",")})`)
        );
        this.$forceUpdate();
    },
    pasteImageFromFile(file) {
      let img = new Image();
      img.onload = () => {
        this.appendLayer("", {
        img,
        x: (this.sizes.width - img.width) / 2,
        y: (this.sizes.height - img.height) / 2,
      });
      }
      img.src = URL.createObjectURL(file);             
      console.log(file)
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
        this.currentLayer.ctx.drawImage(this.$refs.selectionImg, 0, 0, this.sizes.width, this.sizes.height);
        this.selection.drop();
        this.selection = null;           
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
        this.tempCtx.save();      
        this.selection.drawClipPath(this.tempCtx);
        this.tempCtx.clip();
        this.tempCtx.drawImage(this.$refs.temporary2, 0, 0);
        this.tempCtx.restore();


     } else {
        this.tempCtx.putImageData(
          new ImageData(data1, this.sizes.width), 0, 0, 0, 0, this.sizes.width, this.sizes.height);
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
      
      this.selection = new Selection(p1, this.selImgCtx, this.selCtx);
      this.selection.setPoint(p2);
      this.selection.startTransform(this.currentLayer.ctx);

    },
    applyTemp() {
      if(this.selection) {

         if(this.currentInstrument == "eraser") {
            
            this.selection.sourceCopy.globalCompositeOperation = "copy";
            this.selection.addSource(this.tempCtx2);
          } else  {            
            this.selection.sourceCopy.globalCompositeOperation = "source-over";
            this.selection.addSource(this.tempCtx);       
          }

      } else {
         if(this.currentInstrument == "eraser") {
            const currentCanvas = this.$refs["layerEl" + this.currentLayer.id][0];
            currentCanvas.style.opacity = 1;
            this.currentLayer.ctx.globalCompositeOperation = "copy";
            this.currentLayer.ctx.drawImage(this.$refs.temporary2, 0, 0);
          } else  {            
            this.currentLayer.ctx.globalCompositeOperation = "source-over";
            this.currentLayer.ctx.drawImage(this.$refs.temporary, 0, 0);               
          }
      }
      
        
          
          this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
          this.tempCtx2.clearRect(0,0,this.sizes.width, this.sizes.height);
    },
    draw(point1) {
      this.tempCtx.lineWidth = this.currentBrush.radius * (1 + this.currentBrush.pressure.radius * (this.lastPoint.pressure - 1));
      this.tempCtx.strokeStyle = this.currentColor;
      this.tempCtx.lineCap ="round";
      this.tempCtx.filter = "";
      if(this.currentBrush.blur) {
        let lineWidth = this.tempCtx.lineWidth;
        this.tempCtx.lineWidth = lineWidth * (.5 + (100 - this.currentBrush.blur) / 100) || 1;
        this.tempCtx.filter = `blur(${lineWidth / 200 * this.currentBrush.blur}px)`;
      } 
      
      let opacity = this.currentBrush.opacity * (1 + this.currentBrush.pressure.opacity * (this.lastPoint.pressure - 1));
        if(opacity < 1) {
          this.tempCtx.globalCompositeOperation = "destination-out";                
          this.tempCtx.globalAlpha = 1;
          this.tempCtx.beginPath();
          this.tempCtx.moveTo(this.lastPoint.x, this.lastPoint.y);
          this.tempCtx.lineTo(point1.x, point1.y);
          this.tempCtx.stroke();
        }
        this.tempCtx.globalAlpha = opacity;
        this.tempCtx.globalCompositeOperation = "source-over";
        this.tempCtx.beginPath();
        this.tempCtx.moveTo(this.lastPoint.x, this.lastPoint.y);
        this.tempCtx.lineTo(point1.x, point1.y);
        this.tempCtx.stroke();
    },
    erase(point1) {
      this.draw(point1);
      const currentCanvas = this.$refs["layerEl" + this.currentLayer.id][0];
      currentCanvas.style.opacity = 0;
      this.tempCtx2.globalCompositeOperation = "source-over";
      this.tempCtx2.drawImage(currentCanvas, 0, 0);
      
      this.tempCtx2.globalCompositeOperation = "destination-out";
      this.tempCtx2.drawImage(this.$refs.temporary, 0, 0);

    },
    setCursor() {
      this.cursorStyles.transform = null;
      if(["brush", "eraser"].indexOf(this.currentInstrument) == -1) {
        this.cursorStyles.width = "20px";
        this.cursorStyles.height = "20px";

        } else {
        this.cursorStyles.width = this.currentBrush.radius  + "px";
        this.cursorStyles.height =this.currentBrush.radius  + "px";
        this.cursorStyles["background-color"] = "transparent"; 

        }
    },
    setSize({width, height}) {
      width = Math.round(width)
      height - Math.round(height)
      this.sizes = {width, height};
      this.canvasSizes = {
        width: width + "px",
        height: height + "px"
      };
      this.canvasStyles = {
        ...this.canvasStyles, 
        ...this.canvasSizes
      }
    },
    newDrawing() {
      this.appendLayer("Layer 1");
    },
    appendLayer(name, paste) {
      if(!name) {
        name = this.layers.reduce((last, layer) => {
          if(/Layer (\d+)/.test(layer)) {
            if(layer > last) 
            return "Layer " + (1 + parseInt(layer.split(" ")[1]));
          }
          return last;
        }, "Layer " + (1 + this.layers.length));
        
      }
      const layer = {
        id: Date.now(), 
        name, 
        ref: null,
        opacity: 100,
        visible: true
      };
      this.layers.push(layer);
      let prev = this.currentLayer;
      this.currentLayer = layer;
      setTimeout(() => {
        let ref = this.$refs['layerEl' + layer.id];
        if(Array.isArray(ref)) ref = ref[0];
        this.currentLayer.ctx = ref.getContext("2d");

        if(paste) {
          this.currentLayer.ctx.drawImage(paste.img, paste.x, paste.y);
        }
        
        if(prev)
          this.history.append({
            instrument: "append-layer",
            layer: this.currentLayer,
            state:  this.currentLayer.ctx.getImageData(0, 0, this.sizes.width, this.sizes.height),
            prev
          });
      }, 100);
      
    },
    selectLayer(id) {
      this.currentLayer = this.layers.find(l => l.id == id);
      console.log(this.layers, this.currentLayer, id)
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
    },
    toggleLayer(id) {
      const layer = this.layers.find(l => l.id === id);
      layer.visible = !layer.visible;
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

    }
  }
}
</script>

<style lang="scss">
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
      flex: 1 1 200px;
      max-width: 200px;
    }
  }
  #canvas-container {
    flex: 2 1 100%;
    border: 2px solid black;
    overflow: auto;
    background: grey;
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
    
    &.brush, &.eraser, &.picker, &.fill {
      border-radius: 50%;
      border: 1px solid black;
      box-shadow: 0 0
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
</style>
