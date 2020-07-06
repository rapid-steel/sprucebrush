<template>
    <Toolbar name="instruments">
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

    </Toolbar>
</template>

<script>
import Toolbar from "./Toolbar";
export default {
  name: 'Instruments',
  components: {
      Toolbar
  },
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
                {name: "selection-rect", icon: require("@/assets/img/fill.png")},
                {name: "selection-polygon", icon: require("@/assets/img/fill.png")},
                {name: "selection-lasso", icon: require("@/assets/img/fill.png")},
            ]
          }
              
          ]
      }
  },
  computed: {
      prefs() {
          return this.$store.state.userPref.instruments
      }
  },
  mounted() {

  },
  methods: {
      select(instrument) {
          this.$store.commit("selectInstrument", instrument.name);
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
        background: white;
        &.selected {
            filter: invert(1);
        }
    }
}
</style>
