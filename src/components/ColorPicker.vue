<template>
    <color-picker v-model="colorVal" @color-change="select" :width="180" :height="180"></color-picker>       
</template>

<script>
import ColorPicker from 'vue-color-picker-wheel';

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function toHex(str) {
    
    if(str.indexOf("#") == 0) return str;
    if(str.indexOf("rgb") == 0) 
        return rgbToHex(...( str.replace(")", "").split("(")[1].split(",")).map(s => +s));
}

export default {
  name: 'Instruments',
  components: {
      ColorPicker
  },
  data() {
      return {
          colorVal: ""
      }
  },
  computed: {
      color() {
          return this.$store.state.currentColor;
      },
  },
  watch: {
      color() { 
        this.colorVal = toHex(this.color);
      }
  },
  mounted() {

  },
  methods: {
      select(color) {
          this.$store.commit("selectColor", color);
      }
  }
}
</script>

<style scoped lang="scss">

</style>
