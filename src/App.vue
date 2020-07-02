<template>
  <div id="app">
    
    <div id="canvas-container" :style="canvasSizes">
      <div id="canvas" 
      ref="canvas" 
      :style="{...canvasSizes, transform: getTransform() }">
        <canvas v-for="l in layers" 
        :key="l.id" 
        :style="canvasSizes" 
        :width="sizes.width" 
        :height="sizes.height" 
        :ref="'layerEl' + l.id"></canvas>
        <canvas
        :style="canvasSizes" 
        :width="sizes.width" 
        :height="sizes.height" 
        ref="temporary2"
        ></canvas>
        <canvas
        :style="{...canvasSizes, opacity: currentInstrument == 'eraser' ? 0 : 1}" 
        :width="sizes.width" 
        :height="sizes.height" 
        ref="temporary"
        ></canvas>
        <div id="cursor" :style="cursorStyles" :class="currentInstrument"></div>
      </div>
    </div>

    <Instruments />
    <Color-Picker />
    <Layers 
      :layers="layers" 
      :currentLayer="currentLayer"
      @add-layer="appendLayer"
      @select-layer="selectLayer"
      @reorder-layer="reorderLayer"
      @remove-layer="removeLayer"
     />
     <Brush-Settings v-if="currentInstrument != 'picker'" />
     <Save-Settings 
     @save-to-file="saveToFile"
     />


    

  </div>
</template>

<script>
import {mapState} from "vuex";
import { saveAs } from 'file-saver';

import Instruments from "./components/Instruments";
import ColorPicker from "./components/ColorPicker";
import Layers from "./components/Layers";
import BrushSettings from "./components/BrushSettings";
import SaveSettings from "./components/SaveSettings";

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
      zoom: 1     
    }
  },
  components: {
    Instruments, ColorPicker, Layers, BrushSettings, SaveSettings
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
      width: window.innerWidth * .8,
      height: window.innerHeight * .8
    });
    this.tempCtx2 = this.$refs.temporary2.getContext("2d");
    this.tempCtx = this.$refs.temporary.getContext("2d");

    this.$store.commit("setPosition", {
      el: "saveSettings", x:  window.innerWidth  - 100, y: 600
    });
    this.$store.commit("setPosition", {
      el: "layers", x:  window.innerWidth  - 100, y: 300
    });
    this.$store.commit("setPosition", {
      el: "colorPicker", x:  window.innerWidth  - 250, y: 10
    });
    this.newDrawing();
    this.initControls();
    this.setCursor();
  },
  methods: {
    getTransform() {
      return (
        this.zoom >= 1 ? 
        "" 
        : `translate(${(1 - this.zoom)  * .5 * this.sizes.width}px,${(1 - this.zoom)  * .5 * this.sizes.height}px)`
      ) + `scale(${this.zoom},${this.zoom})`

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
            x: event.offsetX, 
            y: event.offsetY,
            pressure
          };
        if(pressure > 0) {              
            if(this.currentInstrument == "brush") {
              this.draw(this.lastPoint);           
            } else if(this.currentInstrument == "eraser") {
              this.erase(this.lastPoint);
            }                       
          }
        if(this.currentInstrument == "picker") {
          const data = Array.from(this.currentLayer.ctx.getImageData(this.lastPoint.x, this.lastPoint.y, 1, 1).data);
          this.$store.commit("selectColor", 
            (this.cursorStyles["background-color"] = `rgba(${data.join(",")})`)
          );
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
          if(this.lastPoint === null || this.currentInstrument == "picker") {
            this.lastPoint = point1;
          } else {
            if(pressure > 0) {              
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
          const data = Array.from(this.currentLayer.ctx.getImageData(this.lastPoint.x, this.lastPoint.y, 1, 1).data);
          this.$store.commit("selectColor", 
            (this.cursorStyles["background-color"] = `rgba(${data.join(",")})`)
          );
        }
          this.$forceUpdate();
      });
      this.$refs.canvas.addEventListener("pointerup", event => {
          this.lastPoint = null;       

          if(this.currentInstrument != "picker") {
            this.history.append({
              instrument: this.currentInstrument,
              layer: this.currentLayer,
              state:  this.currentLayer.ctx.getImageData(0, 0, this.sizes.width, this.sizes.height)
            });
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
      if(this.currentInstrument == "picker") {
        this.cursorStyles.width = "20px";
        this.cursorStyles.height = "20px";

        } else {
        this.cursorStyles.width = this.currentBrush.radius  + "px";
        this.cursorStyles.height =this.currentBrush.radius  + "px";
        this.cursorStyles["background-color"] = "transparent"; 

        }
    },
    setSize({width, height}) {
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
        ref: null
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
  #canvas-container {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
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
    
    &.brush, &.eraser, &.picker {
      border-radius: 50%;
      border: 1px solid black;
    }
    &.picker {

    }
  }
}
</style>
