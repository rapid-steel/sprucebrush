<template>
<div>
    <div class="btn-container">
        <div v-for="group in instruments" :key="group.group" class="group">
            <div v-for="t in group.items" 
            :key="t.name" 
            class="btn" 
            :class="{selected: $store.state.currentInstrument == t.name}"
            @click="() => select(t)">
                <img :src="t.icon">
            </div>
        </div>       
    </div>
    <div class="current-instrument">
        
        <img :src="currentItem.icon">
        <div>{{currentItem.title}}</div>
    </div>
    <div class="settings">
        <div v-for="s in actualSettings" :key="s.k">
            <div>{{s.label}}:</div>
            <RangeInput :min="s.min" :max="s.max" :step="s.step" :horizontal="true"
            v-model="currentBrush[s.k]"
            @input="v => set(s.k, v)" />
        </div>
    </div>
     <div v-if="currentBrush.type">
        <div v-for="(_, type) in types[currentInstrument]" :key="type" @click.stop="() => set('type', type)">
            {{type}}                        
        </div>
    </div>
</div>

</template>

<script>
import {mapState} from "vuex";
import RangeInput from "./RangeInput";
export default {
  name: 'Instruments',
  components: {RangeInput},
  data() {
      return {
          settings: [
              {k: "radius", label: "Radius", min: 1, max: 2500, step: 1},
              {k: "opacity", label: "Opacity", min: .01, max: 1, step: .01},
              {k: "hardness", label: "Hardness", min: .01, max: 1, step: .01},
              {k: "spacing", label: "Spacing", min: 0.001, max: 10, step: .001},
              {k: "tolerance", label: "Tolerance", min: 1, max: 255, step: 1}
          ],
          instruments: [{
              group: "drawing",
              items: [
                {name: "brush", icon: require("@/assets/img/brush.png"), title: "Brush"},
                {name: "eraser", icon: require("@/assets/img/eraser.png"), title: "Eraser"},
                {name: "picker", icon: require("@/assets/img/picker.png"), title: "Color picker"},
                {name: "fill", icon: require("@/assets/img/fill.png"), title: "Filling tool"},
              ]
          }, {
            group: "selection",
            items: [
                {name: "selection-rect", icon: require("@/assets/img/selection-rect.png"), title: "Rectangular selection"},
                {name: "selection-polygon", icon: require("@/assets/img/selection-polygon.png"), title: "Polygonal selection"},
                {name: "selection-lasso", icon: require("@/assets/img/selection-lasso.png"), title: "Freehand selection"},
            ]
          }
              
          ]
      }
  },
  computed: {
      ...mapState(['currentInstrument', 'types']),
      actualSettings() {
          return this.settings.filter(s => this.currentBrush[s.k] != undefined);
      },
      currentItem() {
          for(let i = 0; i < this.instruments.length; i++) {
              let item = this.instruments[i].items.find(item => item.name == this.currentInstrument);
              if(item) return item;
          }
          return {};
      },
      currentBrush() {
        return this.$store.getters.currentSettings;
        }
  },
  mounted() {

  },
  methods: {
      select(instrument) {
          this.$store.commit("selectInstrument", instrument.name);
      },
       set(prop, val) {
          this.$store.commit("changeSettings", {
              instrument: this.currentInstrument,
              prop, val
          });
      }
  }
}
</script>

<style scoped lang="scss">
.btn-container {      
    .group {
        border: 1px solid black;
        display: flex;
        justify-content: flex-start;
        align-content: flex-start;
        align-items: flex-start;
        flex-wrap: wrap;  
        width: 60px;
    }
    .btn {
        flex: 1 0 30px;
        height: 30px;
        max-width: 30px;
        
        img {
            width: 100%;
            height: 100%;
        }
        
        &.selected {
            filter: invert(1);
        }
    }
}

.current-instrument {
    text-align: center;
    max-width: 60px;
    font: bold 10px Helvetica;
    margin-top: 10px;
    img {
        max-width: 50px;
        width: 50px;
        height: 50px;
    }
}

.settings {
    input {
        width: 50px;
    }
}
</style>
