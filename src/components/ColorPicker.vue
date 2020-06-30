<template>
    <Toolbar name="colorPicker">
        <color-picker v-model="$store.state.currentColor" @color-change="select" :width="200" :height="200"></color-picker>        

    </Toolbar>
</template>

<script>
import ColorPicker from 'vue-color-picker-wheel';
import Toolbar from "./Toolbar";
export default {
  name: 'Instruments',
  components: {
      Toolbar, ColorPicker
  },
  data() {
      return {
      }
  },
  computed: {
      prefs() {
          return this.$store.state.userPref.colorPicker
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
