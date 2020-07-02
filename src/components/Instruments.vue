<template>
    <Toolbar name="instruments">
        <div class="btn-container">
            <div v-for="t in instruments" 
            :key="t.name" 
            class="btn" 
            :class="{selected: $store.state.currentInstrument == t.name}"
            @click="() => select(t)">
                <img :src="t.icon">
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
          instruments: [
              {name: "brush", icon: require("@/assets/img/001-paintbrush.svg")},
              {name: "eraser", icon: require("@/assets/img/002-eraser.svg")},
              {name: "picker", icon: require("@/assets/img/002-eraser.svg")},
              {name: "fill", icon: require("@/assets/img/002-eraser.svg")},
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
    width: 60px;
    display: flex;
    flex-wrap: wrap;    
    .btn {
        flex: 1 0 30px;
        height: 30px;
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
