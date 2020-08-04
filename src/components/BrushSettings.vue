<template>
    <Toolbar name="brushSettings">
        <input type="number" v-if="currentSettings.radius" @input="e => set('radius', e.target.value)" :value="currentSettings.radius" min="1"/>
        <input type="number" v-if="currentSettings.opacity" @input="e => set('opacity', e.target.value)" :value="currentSettings.opacity" min="0.01" max="1" step=".01"/>

        <button v-if="currentTool.indexOf('selection') == 0 && selectionReady">Apply selection (Enter)</button>        

    </Toolbar>
</template>

<script>
import {mapState} from "vuex";
import Toolbar from "./Toolbar";
export default {
  name: 'Tools',
  components: {
      Toolbar
  },
  data() {
      return {
      }
  },
  props: ['selectionReady'],
  computed: {
      prefs() {
          return this.$store.state.userPref.brushSettings
      },
      ...mapState(['currentTool']),
      currentSettings() {
        return this.$store.state.currentToolSettings[this.currentTool];
     }
  },
  mounted() {

  },
  methods: {
      set(prop, val) {
          this.$store.commit("changeSettings", {
              instrument: this.currentTool,
              prop, val
          });
      }
  }
}
</script>

<style scoped lang="scss">

</style>
