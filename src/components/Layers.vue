<template>
    <Toolbar name="layers">
        <button @click="() => $emit('add-layer', 'Layer ' + (1+layers.length))">Add layer</button>
        <draggable :list="layersReverse" group="layers" @end="e => $emit('reorder-layer', e)">
            <div v-for="l in layersReverse" 
            :key="l.id"
            class="layer"
            :class="{current: l.id == currentLayer.id}"
            @click="() => $emit('select-layer', l.id)"
            >{{l.name}}</div>
        </draggable>       

    </Toolbar>
</template>

<script>
import Draggable from 'vuedraggable';
import Toolbar from "./Toolbar";
export default {
  name: 'Instruments',
  components: {
      Toolbar, Draggable
  },
  props: ['layers', 'currentLayer'],
  data() {
      return {
      }
  },
  computed: {
      prefs() {
          return this.$store.state.userPref.layers
      },
      layersReverse() {
          return this.layers.slice().reverse()
      }
  },
  mounted() {

  },
  methods: {
      select(color) {

      }
  }
}
</script>

<style scoped lang="scss">
.layer {
    padding: 5px;
    margin: 1px;
    border: 1px lightgrey solid;
    &.current {
        background: grey;
    }
}

</style>
