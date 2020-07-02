<template>
    <Toolbar name="layers">
        <button @click="() => $emit('add-layer', 'Layer ' + (1+layers.length))">Add layer</button>
        <draggable :list="layersReverse" group="layers" @end="e => $emit('reorder-layer', e)">
            <div v-for="l in layersReverse" 
            :key="l.id"
            class="layer"
            :class="{current: l.id == currentLayer.id}"
            @click="() => $emit('select-layer', l.id)"
            ><input type="text" v-model="l.name" > 
            <div class="range"><input type="number" min="0" max="100" v-model="l.opacity"></div>
            <button :disabled="layers.length == 1" @click="() => $emit('remove-layer', l.id)">X</button>
            </div>
        </draggable>       

    </Toolbar>
</template>

<script>
import Draggable from 'vuedraggable';
import Toolbar from "./Toolbar";
export default {
  name: 'Layers',
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
          return this.$store.state.userPref.layers;
      },
      layersReverse() {
          return this.layers.filter(l => l.id).reverse();
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
    display: flex;
    &.current {
        background: grey;
    }
}

</style>
