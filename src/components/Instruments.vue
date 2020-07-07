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
    <div class="settings">
        <div v-if="currentBrush.radius">
            <div>Radius:</div>
            <RangeInput :min="1" :max="2500" :horizontal="true"
            v-model="currentBrush.radius"
            @input="v => set('radius', v)" />
        </div>
        <div v-if="currentBrush.opacity">
            <div>Opacity:</div>
            <RangeInput :min=".01" :max="1" :step=".01" :horizontal="true"
            v-model="currentBrush.opacity"
            @input="v => set('opacity', v)" />

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
          instruments: [{
              group: "drawing",
              items: [
                {name: "brush", icon: require("@/assets/img/brush.png")},
                {name: "eraser", icon: require("@/assets/img/eraser.png")},
                {name: "picker", icon: require("@/assets/img/picker.png")},
                {name: "fill", icon: require("@/assets/img/fill.png")},
              ]
          }, {
            group: "selection",
            items: [
                {name: "selection-rect", icon: require("@/assets/img/selection-rect.png")},
                {name: "selection-polygon", icon: require("@/assets/img/selection-polygon.png")},
                {name: "selection-lasso", icon: require("@/assets/img/selection-lasso.png")},
            ]
          }
              
          ]
      }
  },
  computed: {
      ...mapState(['currentInstrument']),
      currentBrush() {
        return this.$store.state.currentInstrumentSettings[this.currentInstrument];
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

.settings {
    input {
        width: 50px;
    }
}
</style>
