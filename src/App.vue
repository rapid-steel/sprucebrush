<template>
  <div id="app">    
    <div class="panel left">
      <Instruments />
    </div>
    <div id="center">
      <div class="panel top"></div>
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

import Instruments from "./components/Instruments";
import ColorPicker from "./components/ColorPicker";
import Layers from "./components/Layers";


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

class Selection {
  constructor(p1, imgCtx, selCtx) {
    this.ready = false;
    this.started = false;
    this.bbox = [p1.slice(),p1.slice()];
    this.bboxOrd = this.bbox.slice();
    this.imgCtx = imgCtx;
    this.selCtx = selCtx;
    let sCopy = document.createElement("canvas");
    sCopy.width = this.imgCtx.canvas.width;
    sCopy.height = this.imgCtx.canvas.height;
    sCopy.style.width = this.imgCtx.canvas.width + "px";
    sCopy.style.height = this.imgCtx.canvas.height + "px";
    this.sourceCopy = sCopy.getContext("2d");

    this.rectW = 10;
    this.origin = [0,0];
    this.scale = [1, 1];
    this.angle = 0;

    this.calculateControls();
    this.drawSelection();
  }
  setPoint(p2) {
    this.bbox[1] = p2.slice();
    this.calculateControls();
    this.drawSelection();
  }
  startTransform(source) {
    this.imgCtx.save();
    this.imgCtx.rect(
      this.bboxOrd[0][0], 
      this.bboxOrd[0][1], 
      this.bboxOrd[1][0] - this.bboxOrd[0][0], 
      this.bboxOrd[1][1] - this.bboxOrd[0][1]
    );
    this.imgCtx.clip();
    this.imgCtx.drawImage(source.canvas, 0, 0, source.canvas.width, source.canvas.height);    
    this.sourceCopy.clearRect(0, 0, this.sourceCopy.canvas.width, this.sourceCopy.canvas.height);
    this.sourceCopy.drawImage(this.imgCtx.canvas, 0, 0, source.canvas.width, source.canvas.height);
    this.imgCtx.restore();

    source.globalCompositeOperation = "destination-out";
    source.fillRect(
      this.bboxOrd[0][0], 
      this.bboxOrd[0][1], 
      this.bboxOrd[1][0] - this.bboxOrd[0][0], 
      this.bboxOrd[1][1] - this.bboxOrd[0][1]
    );
    source.globalCompositeOperation = "source-over";
    this.started = true;
  }
  detectAction(p) {
    this.action = this.getAction(p); 
  }
  getAction(p) {
    let x1 = (p.x - this.center[0]);
    let y1 = (p.y - this.center[1]);
    let x0 = this.center[0] + x1 * Math.cos(-this.angle) - y1 * Math.sin(-this.angle);
    let y0 = this.center[1] + x1 * Math.sin(-this.angle) + y1 * Math.cos(-this.angle);
    let action = null;
    this.controls.forEach(([i, j, x, y]) => {
      if(Math.abs(x0 - x - i * this.rectW) <= this.rectW / 2 &&
         Math.abs(y0 - y - j * this.rectW) <= this.rectW / 2
      ) {
        action = {resize: 1, dir: [i, j]};     
        return;
      } 
    });
    if(!action) {
      action = this.bboxOrd[0][0] < x0 && x0 < this.bboxOrd[1][0] &&
               this.bboxOrd[0][1] < y0 && y0 < this.bboxOrd[1][1] ?
        {move: 1}
        : {rotate: 1}
    }
    return action;
  }
  applyTransform(p, recAction = false) {
    if(recAction) {
      this.movePoint = [p.x, p.y];
      this.detectAction(p);
    }

    
    let [dx, dy] = [p.x, p.y].map((c,i) => c - this.movePoint[i]);
    if(this.action.move) {
      this.origin[0] += dx
      this.origin[1] += dy 
      this.bbox = this.bbox.map(([x, y]) => [x+dx, y+dy]);
      this.calculateControls();      
    }

    if(this.action.resize) {
      let d = Math.sqrt(dx * dx + dy * dy);
      let a = Math.atan(dy / dx) + (dx < 0 ? Math.PI : 0);
      if(isNaN(a)) a = dy < 0 ? Math.PI / 2 : Math.PI * 1.5;
      a -= this.angle

      let dx1 = dx * Math.cos(-this.angle) - dy * Math.sin(-this.angle) 
      let dy1 = dx * Math.sin(-this.angle) + dy * Math.cos(-this.angle) 

      this.bbox = this.bboxOrd;
      let bbox = this.bbox.map( b => b.slice());

      
      const sin_2 = Math.sin(this.angle) / 2;
      const sin2_2 = sin_2 * sin_2; 


      if(this.action.dir[0] == -1) {
        bbox[0][0] += dx1 * (1 - sin2_2);
        this.origin[0] += dx1 * (1 - sin2_2);
        bbox[1][0] -= dx1 * sin2_2;        
        bbox[0][1] += dx1 * sin_2;
        bbox[1][1] += dx1 * sin_2;
        this.origin[1] += dx1 * sin_2;
      }
      else if(this.action.dir[0] == 1) {
        bbox[1][0] += dx1 * (1 - sin2_2);
        this.origin[0] -= dx1 * sin2_2;
        bbox[0][0] -= dx1 * sin2_2;        
        bbox[0][1] += dx1 * sin_2;
        bbox[1][1] += dx1 * sin_2;
        this.origin[1] += dx1 * sin_2;
      }
      if(this.action.dir[1] == -1) {
        bbox[0][1] += dy1 * (1 - sin2_2);
        bbox[1][1] -= dy1 * sin2_2;
        this.origin[1] += dy1 * (1 - sin2_2);
        bbox[0][0] -= dy1 * sin_2;
        bbox[1][0] -= dy1 * sin_2;
        this.origin[0] -= dy1 * sin_2;
      }
      else if(this.action.dir[1] == 1) {
        bbox[1][1] += dy1 * (1  + sin2_2);
        bbox[0][1] += dy1 * sin2_2;
        this.origin[1] += dy1 * sin2_2;
        bbox[0][0] += dy1 * sin_2;
        bbox[1][0] += dy1 * sin_2;
        this.origin[0] -= dy1 * sin_2;
      }  

      

      if(bbox[1][0] == bbox[0][0]) bbox[1][0] += .001;
      if(bbox[1][1] == bbox[0][1]) bbox[1][1] += .001;
      let scale = [
        (bbox[1][0] - bbox[0][0]) / (this.bbox[1][0] - this.bbox[0][0]),
        (bbox[1][1] - bbox[0][1]) / (this.bbox[1][1] - this.bbox[0][1])  
      ];
      if(scale[0] < 0) this.action.dir[0] = -this.action.dir[0]
      if(scale[1] < 0) this.action.dir[1] = -this.action.dir[1]

      
      
      this.bbox = bbox;
      this.scale = this.scale.map((s,i) => s * scale[i]);
      let dt = scale.map((s,i) => {
        return Math.abs(this.bbox[1][i] - this.bbox[0][i]) * (s - 1)
      });

      this.calculateControls();

 
    }    

    if(this.action.rotate) {
      
      let c1 = this.movePoint.map((c,i) => c - this.center[i]);
      let c2 = [p.x, p.y].map((c,i) => c - this.center[i]);
      let a1 = Math.atan(c1[1] / c1[0]);
      if(c1[0] < 0) a1 += Math.PI
      let a2 = Math.atan(c2[1] / c2[0]);
      if(c2[0] < 0) a2 += Math.PI
      this.angle += (a2 - a1);

    }

    
      this.imgCtx.save();      
      this.imgCtx.clearRect(0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height);
      
      this.imgCtx.translate(...this.center);   
      this.imgCtx.rotate(this.angle); 
      this.imgCtx.translate(...this.center.map(v => -v));

      this.imgCtx.translate(...this.bboxOrd[0]);   
      this.imgCtx.scale(...this.scale); 
      this.imgCtx.translate(...this.bboxOrd[0].map(v => -v));
      
      this.imgCtx.translate(...this.origin);      
      this.imgCtx.drawImage(this.sourceCopy.canvas, 0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height);   
      this.imgCtx.restore();      
    
    this.drawSelection();

    this.movePoint = [p.x, p.y];
  }
  calculateControls() {
    this.bboxOrd = [
      [ Math.min(this.bbox[0][0],this.bbox[1][0]), Math.min(this.bbox[0][1],this.bbox[1][1]) ],
      [ Math.max(this.bbox[0][0],this.bbox[1][0]), Math.max(this.bbox[0][1],this.bbox[1][1]) ]
    ]
    this.controls = [
      [-1, -1, ...this.bboxOrd[0] ],
      [-1,  0, this.bboxOrd[0][0], (this.bboxOrd[0][1] + this.bboxOrd[1][1]) / 2 ],
      [-1,  1, this.bboxOrd[0][0], this.bboxOrd[1][1] ],
      [ 0,  1, (this.bboxOrd[0][0] + this.bboxOrd[1][0]) / 2, this.bboxOrd[1][1] ],
      [ 1,  1, ...this.bbox[1] ],
      [ 1,  0, this.bboxOrd[1][0], (this.bboxOrd[0][1] + this.bboxOrd[1][1]) / 2 ],
      [ 1, -1, this.bboxOrd[1][0], this.bboxOrd[0][1] ],
      [ 0, -1, (this.bboxOrd[0][0] + this.bboxOrd[1][0]) / 2, this.bboxOrd[0][1] ],     
    ];
    this.center = this.bboxOrd[0].map((c,i) => (this.bboxOrd[1][i] + c) / 2 );
  }
  getCursor(point) {
    return this.getAction(point);
  }


  
  drawSelection() {
    this.selCtx.save();
    this.selCtx.clearRect(0, 0, this.selCtx.canvas.width, this.selCtx.canvas.height);


    this.selCtx.translate(...this.center);
    this.selCtx.rotate(this.angle);
    this.selCtx.translate(...this.center.map(c => -c));
    
    this.selCtx.setLineDash([3, 3]);
    this.selCtx.strokeStyle = "blue";    
    this.selCtx.strokeRect(
      this.bboxOrd[0][0], 
      this.bboxOrd[0][1], 
      this.bboxOrd[1][0] - this.bboxOrd[0][0], 
      this.bboxOrd[1][1] - this.bboxOrd[0][1]
    );

    if(this.ready) {
      this.selCtx.setLineDash([]);
      this.selCtx.strokeStyle = "black";

      this.controls.forEach(([i,j,x,y]) => {
        this.selCtx.strokeRect( x + (i - .5) * this.rectW, y + (j - .5) * this.rectW, this.rectW, this.rectW );
      });
    }
    this.selCtx.restore();
  }
  drop() {
    this.imgCtx.clearRect(0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height);
    this.imgCtx.restore();
    this.selCtx.clearRect(0, 0, this.selCtx.canvas.width, this.selCtx.canvas.height);
    this.started = false;
    this.ready = false;
    
  }
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
    Instruments, ColorPicker, Layers
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
          switch(e.key.toLowerCase()) {
            case "z":
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
              case "+":
                e.preventDefault();
                this.zoom *= 1.25
                break; 
              case "-":
                e.preventDefault();
                this.zoom *= .8
                break;    

          }
        }

      });   

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

          if(this.currentInstrument == "selection-rect") {
            if(this.selection.ready) {
              ///
            } else {
              this.selection.ready = true;
              this.selection.startTransform(this.currentLayer.ctx);
            }
            
          }



          if(this.currentInstrument == "brush") {
            
            this.currentLayer.ctx.globalCompositeOperation = "source-over";
            this.currentLayer.ctx.drawImage(this.$refs.temporary, 0, 0);               

          } else if(this.currentInstrument == "eraser") {
            const currentCanvas = this.$refs["layerEl" + this.currentLayer.id][0];
            currentCanvas.style.opacity = 1;
            this.currentLayer.ctx.globalCompositeOperation = "copy";
            this.currentLayer.ctx.drawImage(this.$refs.temporary2, 0, 0);
          }
          
          this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
          this.tempCtx2.clearRect(0,0,this.sizes.width, this.sizes.height);

          
      });

    },
    pickColor() {
      const data = Array.from(this.currentLayer.ctx.getImageData(this.lastPoint.x, this.lastPoint.y, 1, 1).data);
        this.$store.commit("selectColor", 
          (this.cursorStyles["background-color"] = `rgba(${data.join(",")})`)
        );
        this.$forceUpdate();
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
      this.currentLayer.ctx.putImageData(
        new ImageData(data1, this.sizes.width), 0, 0, 0, 0, this.sizes.width, this.sizes.height);

    },
    draw(point1) {
      this.tempCtx.lineWidth = this.currentBrush.radius * (1 + this.currentBrush.pressure.radius * (this.lastPoint.pressure - 1));
      this.tempCtx.strokeStyle = this.currentColor;
      this.tempCtx.lineCap ="round";
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
    appendLayer(name) {
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
        
        if(prev)
          this.history.append({
            instrument: "append-layer",
            layer: this.currentLayer,
            state:  this.currentLayer.ctx.getImageData(0, 0, this.sizes.width, this.sizes.height),
            prev
          });
      }, 50);
      
    },
    selectLayer(id) {
      this.currentLayer = this.layers.find(l => l.id == id);
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

        if(this.currentLayer.id == remove) {
          this.selectLayer(ind ? ind - 1 : 0);
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

    &.selection-rect {
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
