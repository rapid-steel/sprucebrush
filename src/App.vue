<template>
  <div id="app">
    
    <div id="canvas-container">
      <div id="canvas" :style="canvasSizes" ref="canvas">
        <canvas v-for="l in layers" 
        :key="l.id" 
        :style="canvasSizes" 
        :width="sizes.width" 
        :height="sizes.height" 
        :ref="'layerEl' + l.id"></canvas>
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
     />
     <Brush-Settings />
     <Save-Settings 
     @save-to-file="saveToFile"
     />


    

  </div>
</template>

<script>
import Pressure from "pressure";
import {mapState} from "vuex";
import { saveAs } from 'file-saver';

import Instruments from "./components/Instruments";
import ColorPicker from "./components/ColorPicker";
import Layers from "./components/Layers";
import BrushSettings from "./components/BrushSettings";
import SaveSettings from "./components/SaveSettings";

export default {
  name: 'app',
  data() {
    return {
      layers: [],
      cursorStyles: {},
      canvasSizes: {},
      sizes: {},
      lastPoint: null,
      currentLayer: {},
      
    }
  },
  components: {
    Instruments, ColorPicker, Layers, BrushSettings, SaveSettings
  },
  computed: {
    ...mapState(['currentInstrument', 'currentColor']),
    currentBrush() {
      return this.$store.state.currentInstrumentSettings[this.currentInstrument];
    }

  },
  watch: {
    currentColor() {
    }
  },
  mounted() {
    this.setSize({
      width: window.innerWidth * .8,
      height: window.innerHeight * .8
    });
    this.newDrawing();
    this.initControls();
  },
  methods: {
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

      

      Pressure.set('#canvas', {
        start: function(event){
            pressure = 0;            
        },
        end: function(){
            pressure = 0
        },
        change: function(force, event){
            pressure = force;
            console.log(pressure)
        },
      });

      this.$refs.canvas.addEventListener("pointerdown", event => {
          this.lastPoint = {
            x: event.offsetX, 
            y: event.offsetY,
            pressure
          };
      });
      this.$refs.canvas.addEventListener("pointermove", event => {       
          const point1 = {
            x: event.offsetX, 
            y: event.offsetY,
            pressure
          };
          if(this.lastPoint === null) {
            this.lastPoint = point1;
          } else {
            if(pressure > 0) {
              this.currentLayer.ctx.lineWidth = this.currentBrush.radius * (1 + this.currentBrush.pressure.radius * (pressure - 1));

              if(this.currentInstrument == "brush") {
                this.currentLayer.ctx.globalCompositeOperation = "source-over";

              } else if (this.currentInstrument == "eraser") {
                this.currentLayer.ctx.globalCompositeOperation = "destination-out";

              }
              this.currentLayer.ctx.strokeStyle = this.currentColor;
              this.currentLayer.ctx.lineCap ="round";

              this.currentLayer.ctx.beginPath();
              this.currentLayer.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
              this.currentLayer.ctx.lineTo(point1.x, point1.y);
              this.currentLayer.ctx.stroke();

            }
            
            this.lastPoint = point1;
          }          
          this.cursorStyles.left = this.lastPoint.x + "px";
          this.cursorStyles.top =  this.lastPoint.y + "px";
          this.$forceUpdate();
      });
      this.$refs.canvas.addEventListener("pointerup", event => {
          this.lastPoint = null;
      });

    },
    setSize({width, height}) {
      this.sizes = {width, height};
      this.canvasSizes = {
        width: width + "px",
        height: height + "px"
      };
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
      this.currentLayer = layer;
      setTimeout(() => {
        let ref = this.$refs['layerEl' + layer.id];
        if(Array.isArray(ref)) ref = ref[0];
        this.currentLayer.ctx = ref.getContext("2d");
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
    cursor: none;
    &:hover #cursor {
      display: block;
    }
    canvas {
      position: absolute;
      top: 0;
      left: 0;
    }
  }
  #cursor {
    display: none;
    pointer-events: none;
    position: absolute;
    z-index: 10000000000;
    transform: translate(-50%,-50%);
    
    &.brush, &.eraser {
      border-radius: 50%;
      border: 1px solid black;

    }
  }
}
</style>
