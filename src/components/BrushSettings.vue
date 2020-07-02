<template>
    <Toolbar name="brushSettings">
        <input type="number" v-if="currentBrush.radius" @input="e => set('radius', e.target.value)" :value="currentBrush.radius" min="1"/>
        <input type="number" v-if="currentBrush.opacity" @input="e => set('opacity', e.target.value)" :value="currentBrush.opacity" min="0.01" max="1" step=".01"/>
        

    </Toolbar>
</template>

<script>
import {mapState} from "vuex";
import Toolbar from "./Toolbar";
export default {
  name: 'Instruments',
  components: {
      Toolbar
  },
  data() {
      return {
      }
  },
  computed: {
      prefs() {
          return this.$store.state.userPref.colorPicker
      },
      ...mapState(['currentInstrument']),
      currentBrush() {
        return this.$store.state.currentInstrumentSettings[this.currentInstrument];
     }
  },
  mounted() {

  },
  methods: {
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

</style>
