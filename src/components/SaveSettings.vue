<template>
    <Toolbar name="saveSettings">
        <button @click="$emit('save-to-file')">Save to file</button>
        <button @click="$emit('save-to-profile')">Save to profile</button>

    </Toolbar>
</template>

<script>
import {mapState} from "vuex";
import Toolbar from "./Toolbar";
export default {
  name: 'saveSettings',
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
