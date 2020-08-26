<template>
    <div id="color-pallete">
        <div class="color-picker">            
            <div class="colors-selected">
                <div class="color-selected background" 
                    :class="{editing: colorToEdit === 'bg'}"
                    @click="() => $emit('update:colorToEdit', 'bg')"
                    :style="{backgroundColor: colorBG}"></div>
                <div class="color-selected foreground" 
                    :class="{editing: colorToEdit === 'fg'}"
                    @click="() => $emit('update:colorToEdit', 'fg')"
                    :style="{backgroundColor: currentColor}"></div>
                <button class="icon-btn swap" 
                @click.stop="swapColors"></button>                
            </div>
            <color-picker 
                :value="colorVal" 
                :width="wheelSize" 
                :height="wheelSize"
                @color-change="select"></color-picker>   
        </div>
   
        <div class="select-pallete">
            <button class="icon-btn small add" 
                @click.stop="addPallete"></button>
            <button class="icon-btn small edit" 
                @click.stop="() => editPalleteName = !editPalleteName"></button>
             <button class="icon-btn small delete"
                        :disabled="palletes.length==1" 
                        @click.stop="deletePallete" />
            <v-select 
                :options="palletes"
                :label="'name'"
                v-model="pallete"
                :disabled="editPalleteName"
                :clearable="false"
                :searchable="false"  />
            <input type="text" 
                id="rename-pallete"
                v-if="pallete"
                v-show="editPalleteName" 
                :value="pallete.name"
                @blur="() => editPalleteName = false"
                @keyup.enter="renamePallete"
                @change="renamePallete">
        </div> 
        <div class="colors">
            
            <div class="pallete">
                <div class="add-color">
                    <button class="icon-btn add"
                    v-show="!colorSelected" 
                    @click="() => addColor(colorVal)"></button>
                    <button class="icon-btn delete"
                        :disabled="!colorSelected" 
                        @click.stop="deleteSelected" />
                </div>
                <div v-if="pallete">
                    <div v-for="c in pallete.colors" 
                        :key="c" class="color" 
                        :class="{active: colorSelected == c}"
                        :style="{backgroundColor: c}" 
                        @click="() => select(c, true)"></div>      
                </div>          
            </div>
        </div>

    </div>
</template>

<script>

import {toHex} from "../functions/color-functions";
import {mapState} from "vuex";

export default {
    name: 'ColorPallete',
    data() {
      return {
            colorSelected: false,  // a color from the pallete matching to currentColor
            pallete: null,
            editPalleteName: false,
            wheelSize: 160
        };
    },
    props: ['colorToEdit'],
    computed: {
        ...mapState(['currentColor', 'colorBG', 'palletes']),
        colorVal() {
            return toHex(
                this.colorToEdit === "fg" ? 
                this.currentColor 
                : this.colorBG
            );
        }
    },
    watch: {
        palletes() {
            if(this.palletes.length && !this.pallete) this.pallete = this.palletes[0];
        },
        colorVal() {
            this.colorSelected = this.pallete.colors.find(c => 
                toHex(c) == toHex(this.colorVal)
            );
      }
    },
    methods: {
        addColor(color) {
            this.$store.dispatch("changePallete", {
                action: "addColor", 
                data: [this.pallete.id, color]
            });
        },
        swapColors() {
            const c = this.currentColor;
            this.$store.commit("selectColor", ['fg', this.colorBG]);
            this.$store.commit("selectColor", ['bg', c]);
        },
        select(color, fromPallete) {
            if(fromPallete) 
                this.colorSelected = color;
            else if(this.colorSelected && 
                toHex(color) != toHex(this.colorSelected)
            ) 
                this.colorSelected = false;
            this.$store.commit("selectColor", [this.colorToEdit, color]);
        },
        selectPallete(e) {
            this.pallete = e;
        },
        deleteSelected() {
            this.$store.dispatch("changePallete", {
                action: "deleteColor", 
                data: [this.pallete.id, this.colorSelected]
            });
            this.colorSelected = false;
        },
        addPallete() {
            this.$store.dispatch("changePallete", {
                action: "add", 
                data: this.$t("colorPicker.newPallete")
            });
            this.pallete = this.palletes[this.palletes.length-1];
            this.colorSelected = false;
        },
        deletePallete() {
            let i = this.palletes.indexOf(this.pallete);
            this.$store.dispatch("changePallete", {
                action: "delete", 
                data: this.pallete.id
            });
            i = i > 0 ? i-1 : i;
            this.pallete = this.palletes[i];
        },
        renamePallete(e) {
            this.$store.dispatch("changePallete", {
                action: "rename", 
                data:  [this.pallete.id, e.target.value]
            });
            this.editPalleteName = false;
        }
  }
}
</script>

<style lang="scss">
@import "../assets/styles/colors";



#color-pallete {
    z-index: $z-index-color-picker;
    flex: 1 0 $color-pallete-height;
    max-height: $color-pallete-height;
    overflow: hidden;
    position: relative;
     &:after {
        position: absolute;
        z-index: 1;
        bottom: 0;
        left: 0;
        right: 0;
        box-shadow: 0 0 5px 3px $color-bg;
        content: '';
        display: block;
    }
    &:hover {
        overflow: visible;
        &:after {
            display: none;
        }
    }
    button {
        &:disabled {
            opacity: 0;
        }
    }
}

.color-picker {
    height: $color-picker-height;
    display: flex;
    align-items: flex-end;
}

#color-wheel {
    float: right;
}

.colors {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    position: relative;
    
}

.color-picker {
    .colors {
        min-height: 120px;
    }
}

@media screen and (max-height: $max-height_sm) {
    #color-pallete {
        flex: 1 0 $color-pallete-height_sm;
        max-height: $color-pallete-height_sm;
    }
}

.pallete {
    flex: 1 1 100%;
    height: 100%;
    max-height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    & > div:nth-child(2) {
        flex: 1 1 100%;
        display: flex;
        padding-bottom: 10px;
        border-radius: 3px;
        flex-wrap: wrap;
        background-color: transparentize($color-bg, .15);
        .color {
            flex: 0 0 20px;
            border-radius: 2px;
            width: 20px;
            height: 20px;
            margin: 1px;
            &.active {
                box-shadow: 0 0 0 2px $color-accent;
            }
        }    
    }
    .add-color {
        cursor: pointer;
        flex: 0 0 $icon-btn-size;
        height: $icon-btn-size;
    }
}



.colors-selected {
    position: relative;
    flex: 0 0 $color-selected-size * 1.5;
    width: $color-selected-size * 1.5;
    height: $color-selected-size * 1.5;
    margin-right: 5px;
    margin-bottom: 5px;
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
    .swap {
        position: absolute;
        top: $color-selected-size;
        left: $color-selected-size / 2 - $icon-btn-size-small - 5px;                
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
        width: 170px;
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

</style>
