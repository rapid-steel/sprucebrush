<template>
    <div id="gradient-creator">
        <div id="gradient-colors"  
        title="Click to add color"
        @click.stop="addColor">
            <div class="gradient-big" :style="value | gradientBG"></div>
            <div class="colors">
                    <div class="color-container" 
                    v-for="(color, i) in value" 
                    :key="maxI + color + i"
                    :class="{active: i === editColor}"
                    :style="{left: 100 * (i / maxI) + '%'}"
                    >
                        <div class="color"
                        :style="{background: color}"
                        @click.exact.stop="() => editColor = i"
                        ></div>
                        <div class="controls">
                            <button :disabled="!i" class="move-left" 
                            :title="$t('gradientCreator.moveLeft')"
                            @click.stop="() => move(-1, i)"></button>
                            <button :disabled="maxI==1" class="remove" 
                            :title="$t('gradientCreator.remove')"
                            @click.stop="() => remove(i)"></button>
                            <button :disabled="i==maxI" class="move-right" 
                            :title="$t('gradientCreator.moveRight')"
                            @click.stop="() => move(1, i)"></button>    
                        </div>                    
                    
                    </div>
            </div>
        </div>
        
        <div id="gradient-colorpicker">
            <color-picker v-model="value[editColor]" :width="180" :height="180" />
        </div>


        <div class="footer">
            <button @click="() => $emit('save', gradient)">{{$t('common.save')}}</button>
            <button @click="() => $emit('close')">{{$t('common.close')}}</button>
        </div>
        
    </div>
</template>

<script>
import {mapState} from "vuex";

export default {
  name: 'GradientCreator',
  data() {
      return {
          editColor: 0
      }
  },
  props: {
      value: {
          type: Array,
          default: () => []
      }
  },
  computed: {
      maxI() { return this.value.length - 1; }

  },
  mounted() {

  },
  methods: {
      move(dir, i) {
          let min = dir > 0 ? i : i+dir;
          this.$emit('input', this.value.slice(0, min)
          .concat([this.value[i+dir], this.value[i]])
          .concat(this.value.slice(min+2)));
      },
      remove(i) {
          this.$emit('input', this.value.slice(0, i)
          .concat(this.value.slice(i+1)));

      },
      addColor(e) {
          let pos = Math.ceil(e.offsetX / e.target.clientWidth * this.maxI);

          this.$emit('input', this.value.slice(0, pos)
          .concat([this.value[this.editColor]])
          .concat(this.value.slice(pos)));
          this.editColor = pos;
      }
  }
}
</script>

<style scoped lang="scss">
@import "../assets/styles/colors";

#gradient-creator {
    position: fixed;
    left: 50%;
    top: 50%;
    z-index: 100000000;
    border: 1px solid black;
    background: $color-bg;
    transform: translate(-50%,-50%);
    display: flex;
    align-items: center;
    flex-direction: column;
    
    #gradient-colors {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 450px;
        margin: 5px 40px;
        position: relative;
    }
    #gradient-colorpicker {
        display: flex;
        justify-content: center;
    }
    .gradient-big {
        border: 1px solid black;
        flex: 1 0 50px;
    }
    

    .colors {
        flex: 1 0 50px;
        position: relative;
        margin-top: 10px;
        .color-container {
            position: absolute;
            top: 0;
            transform: translateX(-50%);
            width: 50px;
            display: flex;
            flex-direction: column;
            align-items: center;
            .color {
                width: 25px;
                height: 25px;
                border: 1px solid black;
                
            }
            &.active {
                .color {
                    outline: 2px $color-selected solid;
                }        
            }
            .controls {
                display: flex;
                justify-content: center;
                button {
                    border: none;
                    background-color: transparent;
                    background-size: cover;
                    background-position: center;
                    width: 20px;
                    height: 20px;
                    margin: 5px;
                    &:disabled {
                        opacity: .25;
                    }
                    &.remove {
                        background-image: url("../assets/img/cross.svg");
                    }
                    &.move-right, &.move-left {
                        background-image: url("../assets/img/arrow.svg");
                    }
                    &.move-left {
                        transform: scaleX(-1);
                    }
                }
            }

        }
        
        .add-color {
            height: 25px;
            width: 0;
            border: 2px solid black;
        }
    }
}

</style>
