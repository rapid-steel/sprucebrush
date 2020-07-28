<template>
    <div id="layers">
        <div>
            <button class="add" @click="() => $emit('add-layer')"></button>
            <button class="copy" @click="() => $emit('copy-layer')"></button>
            <button class="merge" @click="() => $emit('merge-layers', layers.map(l => l.id))"></button>
            <div class="caption">{{$t('layers.layers')}}</div>
        </div>
        <draggable :list="layersReverse" group="layers" @end="e => $emit('reorder-layer', e)" >
            <div v-for="(l,i) in layersReverse" 
            :key="l.id"
            class="layer"
            :class="{
                current: currentLayer && l.id == currentLayer.id, 
                selected: multipleSelection.indexOf(l.id) !== -1, 
                visible: l.visible}"
            @click.ctrl.stop="() => selectMultiple(l.id)"
            @click.shift.stop="() => $emit('layer-to-selection', l.id)"
            @click.exact.stop="() => $emit('select-layer', l.id)"
            >
            <div>
                <input type="text" v-model="l.name" class="layer-name"> 
                <img class="img-icon" src="@/assets/img/opacity.svg" />
                <RangeInput 
                :min="0" 
                :max="100" 
                v-model="l.opacity" 
                @input="() => $emit('update:opacity')"
                />
                <button class="visible"
                    :disabled="layers.length == 1" 
                    @click.stop="() => $emit('toggle-layer', l.id)" />
                <button class="delete"
                    :disabled="layers.length == 1" 
                    @click.stop="() => $emit('remove-layer', l.id)" />
            </div>
            <div>                
                <button class="merge"
                    v-if="i != layersReverse.length - 1"
                    @click.stop="() => $emit('merge-layers', layersReverse.slice(i, i+2).map(l => l.id))" />
                <img class="img-icon" src="@/assets/img/compose.svg" />
                <v-select 
                :options="blendModes"            
                v-model="l.blend"
                @input="() => $emit('update:blend')"
                :disabled="!l.visible"
                :clearable="false"
                :appendToBody="true"
                :searchable="false"  />
            </div>

            </div>
        </draggable>      

    </div>
</template>

<script>
import Draggable from 'vuedraggable';
export default {
  name: 'Layers',
  components: {
      Draggable
  },
  props: ['layers', 'currentLayer'],
  data() {
      return {
          blendModes: [
              'source-over',
              'lighter',
              'xor', 
              'darken',
              'multiply',
              'lighten',
              'screen',
              'overlay',
              'color-dodge',
              'color-burn',
              'hard-light',
              'soft-light',
              'difference',
              'exclusion',
              'hue',
              'saturation',
              'color',
              'luminosity'
          ],
          multipleSelection: []
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
      
      selectMultiple(id) {
          this.multipleSelection.push(id);          
      }
  }
}
</script>

<style lang="scss">

@import "../assets/styles/colors";

#layers {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    & > * {
        background: $color-bg;
    }
    & > div:first-child {
        display: flex;
        align-items: center;
        & > button {
            cursor: pointer;
            width: 30px;
            flex: 0 0 30px;
            height: 30px;
            border: none;
            background: {
                color: transparent;            
                size: 60% 60%;
                position: center;
                repeat: no-repeat;
            }
            &.add { background-image: url("../assets/img/plus.svg"); }
            &.copy { background-image: url("../assets/img/copy.svg"); }
            &.merge { background-image: url("../assets/img/merge.svg"); }
            margin: 1px;
        }
        .caption {
            flex: 2 2 100%;
            text-align: right;
            padding-right: 20px;
            font-size: 14px;
        }
    }
    & > div:nth-child(2) {
        max-height: 300px;
        overflow-x: hidden;
        overflow-y: auto;
    }
}

.layer {
    padding: 5px;
    margin: 1px;
    opacity: .5;
    border: $layer-border;  
    max-width: 100%;
    overflow-y: hidden;
    & > div {       
        display: flex;
        align-items: center;;
        justify-content: flex-end;
        max-width: 100%;        
        height: 30px;

    }

    .v-select {
         .vs__dropdown-toggle {
             max-height: 25px;
             height: 25px;
         }
        font: $font-select-small;
        flex: 1 1 140px;
        max-width: 140px;
        margin-left: 3px;
        height: 25px;
    }
    
    input[type=number] {
        border: $layer-border;
        border-radius: 0;
        width: 25px;
        padding: 3px;
        margin: 0 5px;
        font: $font-input-small;
        text-align: center;
    }
    &.visible {
        opacity: 1;
    }
    .img-icon {
        width: 13px;
        height: 13px;
        display: inline-block;
    }
    button {
        width: 20px;
        height: 20px;
        background: {
            color: transparent;            
            size: 80% 80%;
            position: center;
            repeat: no-repeat;
        }
        border: none;
        &.delete {
            background-image: url("../assets/img/trash.svg");
            background-size: 70% 70%;
        }
        &.visible {
            background-image: url("../assets/img/visible.svg");
        }
        &.merge {
            background-image: url("../assets/img/merge.svg");
        }
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
        font: $font-layer;
        &:focus {
            background: white;
        }
    }
    &.selected {
        background:$color-accent3;
    }
    &.current {
        background:$color-accent;
        .layer-name {
            font-weight: bold;
        }
    }
}

.vs__dropdown-option {
    font: $font-select-small;
}


</style>
