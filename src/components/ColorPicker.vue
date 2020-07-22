<template>
    <div class="color-picker">
        <color-picker :value="colorVal" @color-change="select" :width="180" :height="180"></color-picker>      
        <div class="select-pallete">
            <button class="" @click.stop="addPallete">+</button>
            <button class="edit" @click.stop="() => namePallete = !namePallete"></button>
             <button class="delete"
                        :disabled="palletes.length==1" 
                        @click.stop="deletePallete" />
            <v-select 
            :options="palletes"
            :label="'name'"
            v-model="pallete"
            :disabled="namePallete"
            :clearable="false"
            :searchable="false"  />
            <input type="text" 
            id="rename-pallete"
            v-show="namePallete" 
            :value="pallete.name"
            @blur="() => namePallete = false"
            @keyup.enter="renamePallete"
            @change="renamePallete">
        </div> 
        <div class="colors">
            <div class="colors-selected">
                <div class="color-selected background" 
                :class="{editing: colorToEdit === 'bg'}"
                @click="() => $emit('update:colorToEdit', 'bg')"
                :style="{backgroundColor: colorBG}"></div>
                <div class="color-selected foreground" 
                :class="{editing: colorToEdit === 'fg'}"
                @click="() => $emit('update:colorToEdit', 'fg')"
                :style="{backgroundColor: currentColor}"></div>
                
            </div>
            <div class="pallete">
                <div class="add-color">
                    <button 
                    v-show="!colorSelected" 
                    @click="() => addColor(colorVal)">+</button>
                    <button class="delete"
                        :disabled="!colorSelected" 
                        @click.stop="deleteSelected" />
                </div>
                <div v-for="c in pallete.colors" 
                :key="c" class="color" 
                :class="{active: colorSelected == c}"
                :style="{backgroundColor: c}" 
                @click="() => select(c, true)"></div>                
            </div>
        </div>

    </div>
</template>

<script>

import {toHex} from "../functions/color-functions";
import {mapState} from "vuex";

export default {
  name: 'Instruments',
  data() {
      return {
          colorSelected: false,
          pallete: null,
          namePallete: false
      }
  },
  props: ['colorToEdit'],
  computed: {
      ...mapState(['currentColor', 'colorBG']),
      palletes() { 
          return this.$store.state.userPref.palletes; 
        },
      colorVal() {
          return toHex(
            this.colorToEdit === "fg" ? 
              this.currentColor 
            : this.colorBG);
      }
  },
  watch: {
      colorVal() {
         this.colorSelected = this.pallete.colors.find(c => toHex(c) == toHex(this.colorVal));
      }
  },
  created() {
      this.pallete = this.palletes[0];
  },
  methods: {
      addColor(color) {
          this.$store.commit("addColorToPallete", [this.pallete.id, color]);
      },
      select(color, fromPallete) {
          if(fromPallete) 
            this.colorSelected = color;
           else if(this.colorSelected && toHex(color) != toHex(this.colorSelected)) 
            this.colorSelected = false;
          this.$store.commit("selectColor", [this.colorToEdit, color]);
      },
      selectPallete(e) {
          this.pallete = e;
      },
      deleteSelected() {
          this.$store.commit("deleteColorFromPallete", [this.pallete.id, this.colorSelected]);
          this.colorSelected = false;
      },
      addPallete() {
          this.$store.commit("addPallete");
          this.pallete = this.palletes[this.palletes.length-1];
          this.colorSelected = false;
      },
      deletePallete() {
          let i = this.palletes.indexOf(this.pallete);
          this.$store.commit("deletePallete", this.pallete.id);
          i = i > 0 ? i-1 : i;
          this.pallete = this.palletes[i];
      },
      renamePallete(e) {
           this.$store.commit("renamePallete", [this.pallete.id, e.target.value]);
           this.namePallete = false;
      }
  }
}
</script>

<style lang="scss">
@import "../assets/styles/colors";

.color-picker {
    height: 400px;
        button {
            width: 30px;
            height: 30px;
            border: none;
            background: none;
            line-height: 30px;
            font: $font-layer-button;
            background: {
                color: transparent;            
                size: 60% 60%;
                position: 50% 65%;
                repeat: no-repeat;
            }
            &.delete {
                background-image: url("../assets/img/trash.svg");
            }
            &.edit {
                background-image: url("../assets/img/edit.svg");
            }
            &:disabled {
                opacity: 0;
            }
        }
}

#color-wheel {
    margin: 0 auto;
}

.colors {
    display: flex;
    justify-content: space-between;
}

.pallete {
    flex: 1 1 100%;
    margin-left: 10px;
    margin-top: 10px;
    display: flex;
    flex-flow: row wrap;
    .add-color, .color {
        flex: 0 0 20px;
        border-radius: 2px;
        width: 20px;
        height: 20px;
        margin: 1px;
        &.active {
            box-shadow: 0 0 0 2px $color-accent;
        }
    }
    .add-color {
        cursor: pointer;
        flex: 2 0 100%;
        height: 30px;

    }
}

.colors-selected {
    position: relative;
    flex: 0 0 $color-selected-size * 1.5;
    width: $color-selected-size * .1.5;
    margin-right: 5px;
    margin-top: 20px;
    &::after {
        content: "";
        display: block;
        border-radius: 50%;
        border: 2px $color-bg solid;
        width: $color-selected-size;
        height: $color-selected-size;
        position: absolute;
        top:  0;
        left:  0;
        z-index: -2; 
        box-shadow: 0 0 0 2px $color-accent3;
    }
}

.color-selected {
    position: absolute;
    border-radius: 50%;
    border: 2px $color-bg solid;
    width: $color-selected-size;
    height: $color-selected-size;

    &.background {
        
        top:  $color-selected-size * .5;
        left:  $color-selected-size * .5;
        z-index: 0; 
        box-shadow: 0 0 0 2px $color-accent3;
    }
    &.editing {
        border-color: $color-accent2;
    }
}
.select-pallete {
    display: flex;
    justify-content: stretch;
    align-items: center;
    height: 30px;
    margin-top: 10px;
    position: relative;
    button {
        flex: 0 0 30px;
    }
    .v-select {
         .vs__dropdown-toggle {
             max-height: 30px;
             height: 30px;
         }
        font: $font-select;
        flex: 1 1 160px;
        height: 30px;
    }

    #rename-pallete {
        position: absolute;
        font: $font-select;
        width: 160px;
        height: 30px;
        right: 0;
        top: 0;
        border-radius: 4px;
        border: 1px solid  $color-accent;
        padding: 0 2px 0 8.5px;
        box-sizing: border-box;
        background: $color-bg;
        z-index: 10;
    }
}
.vs__dropdown-option--highlight {
    background: $color-accent!important;
}
</style>
