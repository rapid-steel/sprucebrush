<template>
    <div id="layers">
        <button @click="() => $emit('add-layer', 'Layer ' + (1+layers.length))">Add layer</button>
        <draggable :list="layersReverse" group="layers" @end="e => $emit('reorder-layer', e)" >
            <div v-for="l in layersReverse" 
            :key="l.id"
            class="layer"
            :class="{current: currentLayer && l.id == currentLayer.id, visible: l.visible}"
            @click.ctrl.stop="() => $emit('layer-to-selection', l.id)"
            @click.exact.stop="() => $emit('select-layer', l.id)"
            ><input type="text" v-model="l.name" class="layer-name"> 
            <img class="img-icon" src="@/assets/img/opacity.svg" />
            <RangeInput 
            :min="0" 
            :max="100" 
            v-model="l.opacity" />
            <button class="visible"
                :disabled="layers.length == 1" 
                @click.stop="() => $emit('toggle-layer', l.id)" />
            <button class="delete"
                :disabled="layers.length == 1" 
                @click.stop="() => $emit('remove-layer', l.id)" />
            </div>
        </draggable>      

    </div>
</template>

<script>
import Draggable from 'vuedraggable';
import RangeInput from "./RangeInput";
export default {
  name: 'Layers',
  components: {
      Draggable, RangeInput
  },
  props: ['layers', 'currentLayer'],
  data() {
      return {
      }
  },
  computed: {
      layersReverse() {
          return this.layers.filter(l => l && l.id).reverse();
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
    max-width: 100%;
    opacity: .5;
    &.visible {
        opacity: 1;
    }
    .img-icon {
        width: 20px;
        height: 20px;
    }
    .visible, 
    .delete {
        width: 20px;
        height: 20px;
        background: {
            color: transparent;            
            size: 50% 50%;
            position: center;
            repeat: no-repeat;
        }
        border: none;
    }
    .delete {
        background-image: url("../assets/img/cancel.svg");
    }
    .visible {
        background-image: url("../assets/img/visible.svg");
    }
    .layer-name {
        width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        background: none;
        border: none;
        -webkit-box-shadow: none;
                box-shadow: none;
        outline: none;
        &:focus {
            background: white;
        }
    }
    &.current {
        background: grey;
    }
}

</style>
