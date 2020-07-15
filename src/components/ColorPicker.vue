<template>
    <div class="color-picker">
        <color-picker :value="colorVal" @color-change="select" :width="180" :height="180"></color-picker>       
        <div class="colors">
            <div class="color-selected foreground" 
            :style="{backgroundColor: currentColor}"></div>
            <div class="color-selected background" :style="{backgroundColor: colorBG}"></div>
            <div class="pallete">
                <div class="add-color" @click="() => addColor(colorVal)">+</div>
                <div v-for="c in pallete" :key="c" class="color" :style="{backgroundColor: c}" @click="() => select(c)"></div>
                
            </div>
        </div>
    </div>
</template>

<script>
import ColorPicker from 'vue-color-picker-wheel';
import {toHex} from "../functions/color-functions";
import {mapState} from "vuex";

export default {
  name: 'Instruments',
  components: {
      ColorPicker
  },
  data() {
      return {
          colorToEdit: "fg",
          pallete: []
      }
  },
  computed: {
      ...mapState(['currentColor', 'colorBG']),
      colorVal() {
          return toHex(
            this.colorToEdit === "fg" ? 
              this.currentColor 
            : this.colorBG);
      }
  },
  mounted() {

  },
  methods: {
      addColor(color) {
          this.pallete.push(color);
      },
      select(color) {
          this.$store.commit("selectColor", [this.colorToEdit, color]);
      }
  }
}
</script>

<style scoped lang="scss">

.color-picker {
    margin-bottom: 15px;
}

.colors {
    display: flex;
    justify-content: space-between;
}

.pallete {
    flex: 1 1 100%;
    margin-left: 10px;
    margin-top: 10px;
    display: flex;
    flex-flow: row wrap;
    .add-color, .color {
        flex: 0 0 20px;
        border-radius: 2px;
        width: 20px;
        height: 20px;
        margin: 1px;
    }
    .add-color {
        text-align: center;
        font: bold 28px monospace;
        line-height: 20px;
        cursor: pointer;
    }
}

.color-selected {
    border-radius: 50%;
    width: 40px;
    flex: 0 0 40px;
    height: 40px;
}

</style>
