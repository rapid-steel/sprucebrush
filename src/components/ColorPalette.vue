<template>
    <div id="color-palette">
        <div class="color-picker-container">            
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
                :size="wheelSize" 
                @input="select"></color-picker>   
        </div>
   
        <div class="select-palette">
            <button class="icon-btn small delete"
                :disabled="palettes.length==1" 
                @click.stop="deletePalette" />
            <button class="icon-btn small add" 
                @click.stop="addPalette"></button>
            <button class="icon-btn small edit" 
                @click.stop="() => editPaletteName = !editPaletteName"></button>
             
            <v-select 
                :options="palettes"
                :label="'name'"
                v-model="palette"
                :disabled="editPaletteName"
                :clearable="false"
                :searchable="false"  />
            <input type="text" 
                id="rename-palette"
                v-if="palette"
                v-show="editPaletteName" 
                :value="palette.name"
                @blur="() => editPaletteName = false"
                @keyup.enter="renamePalette"
                @change="renamePalette">
        </div> 
        <div class="colors">
            
            <div class="palette">
                <div class="add-color">
                    <button class="icon-btn add"
                        v-show="!colorSelected" 
                        @click="() => addColor(colorVal)"></button>
                    <button class="icon-btn delete"
                        :disabled="!colorSelected" 
                        @click.stop="deleteSelected" />
                     <button class="icon-btn export" 
                        @click.stop="exportPalette"></button>
                    <button class="icon-btn import"
                        @click.stop="$refs.importPalette.click">
                         <input 
                            type="file" accept="application/json" multiple
                            ref="importPalette" 
                            @change="importPalette">
                    </button>
                </div>
                <div v-if="palette">
                    <draggable 
                        :list="palette.colors" 
                        group="colors" 
                        @end="reorderColors" >
                    <div v-for="c in palette.colors" 
                        :key="c" class="color" 
                        :class="{active: colorSelected == c}"
                        :style="{backgroundColor: c}" 
                        @click="() => select(c, true)"></div>      
                    </draggable>
                </div>          
            </div>
        </div>

    </div>
</template>

<script>

import {toHex} from "../functions/color-functions";
import {mapState} from "vuex";
import {saveAs} from 'file-saver';

export default {
    name: 'ColorPalette',
    data() {
      return {
            colorSelected: false,  // a color from the palette matching to currentColor
            palette: null,
            editPaletteName: false,
            wheelSize: 160
        };
    },
    props: ['colorToEdit'],
    computed: {
        ...mapState(['currentColor', 'colorBG', 'palettes']),
        colorVal() {
            return toHex(
                this.colorToEdit === "fg" ? 
                this.currentColor 
                : this.colorBG
            );
        }
    },
    watch: {
        palettes() {
            if(this.palettes.length && !this.palette) this.palette = this.palettes[0];
        },
        colorVal() {
            this.colorSelected = this.palette.colors.find(c => 
                toHex(c) == toHex(this.colorVal)
            );
      }
    },
    methods: {
        addColor(color) {
            this.$store.dispatch("changePalette", {
                action: "addColor", 
                data: [this.palette.id, color]
            });
        },    
        reorderColors(d) {
            this.$store.dispatch("changePalette", {
                action: "reorderColors", 
                data: [this.palette.id, d]
            });
        },        
        swapColors() {
            const c = this.currentColor;
            this.$store.commit("selectColor", ['fg', this.colorBG]);
            this.$store.commit("selectColor", ['bg', c]);
        },
        select(color, fromPalette) {
            if(fromPalette) 
                this.colorSelected = color;
            else if(this.colorSelected && 
                toHex(color) != toHex(this.colorSelected)
            ) 
                this.colorSelected = false;
            this.$store.commit("selectColor", [this.colorToEdit, color]);
        },
        selectPalette(e) {
            this.palette = e;
        },
        deleteSelected() {
            this.$store.dispatch("changePalette", {
                action: "deleteColor", 
                data: [this.palette.id, this.colorSelected]
            });
            this.colorSelected = false;
        },
        addPalette() {
            this.$store.dispatch("changePalette", {
                action: "add", 
                data: this.$t("colorPicker.newPalette")
            });
            this.palette = this.palettes[this.palettes.length-1];
            this.colorSelected = false;
        },
        deletePalette() {
            let i = this.palettes.indexOf(this.palette);
            this.$store.dispatch("changePalette", {
                action: "delete", 
                data: this.palette.id
            });
            i = i > 0 ? i-1 : i;
            this.palette = this.palettes[i];
        },
        renamePalette(e) {
            this.$store.dispatch("changePalette", {
                action: "rename", 
                data:  [this.palette.id, e.target.value]
            });
            this.editPaletteName = false;
        },
        exportPalette() {
            saveAs(
                new Blob([JSON.stringify(this.palette)], {type: "text"}), 
                `${this.palette.name}.json`
            );
        },
        importPalette(e) {
            Promise.all(
                Array.from(e.target.files)
                .map(f => f.text()
                           .then(text =>  JSON.parse(text))
                )
            ).then(palettes => {
                this.$store.dispatch("changePalette", {
                    action: "import", 
                    data: palettes
                });
                this.palette = this.palettes[0];
            })
        }
  }
}
</script>

<style lang="scss">
@import "../assets/styles/index.scss";



#color-palette {
    z-index: $z-index-color-picker;
    flex: 1 0 $color-palette-height;
    max-height: $color-palette-height;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    button {
        &:disabled {
            opacity: 0;
        }
    }
}

.color-picker-container {
    flex: 1 0 $color-picker-height;
    height: $color-picker-height;
    display: flex;
    align-items: flex-end;
     .colors {
        min-height: 120px;
    }
}

#color-wheel {
    float: right;
}

.colors {
    flex: 1 2 50%;
    position: relative;
    overflow: hidden;    
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
}

@media screen and (max-height: $max-height_sm) {
    #color-palette {
        flex: 1 0 $color-palette-height_sm;
        max-height: $color-palette-height_sm;
    }
}

.palette {
    height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
   
    & > div:nth-child(2) > * {
        flex: 1 1 100%;
        display: flex;
        padding-bottom: 10px;
        border-radius: 3px;
        flex-wrap: wrap;
        align-content: flex-start;
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
.select-palette {
    display: flex;
    justify-content: stretch;
    align-items: center;
    flex: 0 0 30px;
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

    #rename-palette {
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
