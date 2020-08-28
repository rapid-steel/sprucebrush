<template>
    <div id="color-palette">
        <div class="color-picker-container">            
            <div class="colors-selected">
                <div class="color-selected background" 
                    :title="colorBG | toHex"
                    :class="{editing: colorToEdit === 'bg'}"
                    @click="() => $emit('update:colorToEdit', 'bg')"
                    :style="{backgroundColor: colorBG}"></div>
                <div class="color-selected foreground" 
                    :title="currentColor | toHex"
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
   
        <div class="palette-name">             
            <button class="icon-btn small add" 
                :title="$t('palette.addPalette')"
                @click.stop="addPalette"/>
            <button class="icon-btn small edit" 
                :title="$t('palette.renamePalette')"
                @click.stop="() => editPaletteName = !editPaletteName"/>
            <v-select 
                :options="palettes"
                :label="'name'"
                v-model="palette"
                :disabled="editPaletteName"
                :clearable="false"
                :searchable="false"  />
            <input type="text" 
                v-if="palette"
                v-show="editPaletteName" 
                :value="palette.name"
                @blur="() => editPaletteName = false"
                @keyup.enter="renamePalette"
                @change="renamePalette">
        </div> 
        <div class="palette-controls">
            <div class="controls_colors">
                <button class="icon-btn small downward"
                    :title="$t('palette.addColor')"
                    v-show="colorSelectedIndex == -1" 
                    @click="() => addColor(colorVal)"></button>
                <button class="icon-btn small color-wheel toggle-btn"
                    :title="$t('palette.editColor')"
                    v-show="colorSelectedIndex !== -1" 
                    :class="{active: editColorSelected}"
                    @click.stop="() => editColorSelected = !editColorSelected" />
                <button class="icon-btn small cancel"
                    :title="$t('palette.deleteColor')"
                    v-show="colorSelectedIndex !== -1" 
                    @click.stop="deleteColorSelected" />
            </div>
            <div class="controls_palette">
                <button class="icon-btn small export" 
                    :title="$t('palette.exportPalette')"
                    @click.stop="exportPalette"></button>
                <button class="icon-btn small import"
                    :title="$t('palette.importPalette')"
                    @click.stop="$refs.importPalette.click">
                    <input 
                        type="file" multiple
                        ref="importPalette" 
                        @change="importPalette">
                </button>
                <button class="icon-btn small delete"
                    :title="$t('palette.deletePalette')"
                    :disabled="palettes.length==1" 
                    @click.stop="deletePalette" />
            </div>      
        </div>
        <div class="palette-colors">          
                <draggable 
                    v-if="palette"
                    :list="palette.colors" 
                    group="colors" 
                    @end="reorderColors" >
                <div v-for="(c, i) in palette.colors" 
                    :title="c | toHex"
                    :key="c + i" class="color" 
                    :class="{active: colorSelectedIndex == i}"
                    :style="{backgroundColor: c}" 
                    @click="() => selectFromPallete(i)"></div>      
                </draggable>
        
        </div>

    </div>
</template>

<script>

import {toHex, validateRgb} from "../functions/color-functions";
import {mapState} from "vuex";
import {saveAs} from 'file-saver';

const patternHex = /(#)?[0-9a-f]{6}/ig;
const patternRgb = /rgb\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}\)/ig;
const patternRgba = /rgba\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3},[\.0-9]+\)/ig;

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

export default {
    name: 'ColorPalette',
    data() {
      return {
            colorSelectedIndex: -1,  // index of a color from the palette matching to currentColor
            editColorSelected: false,
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
            const hex = toHex(this.colorVal);
            if(this.editColorSelected) {                
                 this.$store.dispatch("changePalette", {
                        action: "editColor", 
                        data: [this.palette.id, {
                            index: this.colorSelectedIndex,
                            color: hex
                        }]
                    });
            } else {
                this.colorSelectedIndex = this.palette.colors.findIndex(c => 
                    toHex(c) == hex
                );
            }
      }
    },
    filters: {
        toHex
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
        select(color) {
            this.$store.commit("selectColor", [this.colorToEdit, color]);
        },
        selectFromPallete(i) {
            this.colorSelectedIndex = i;
            this.editColorSelected = false;
            this.$store.commit("selectColor", [this.colorToEdit, this.palette.colors[i]]);
        },
        selectPalette(e) {
            this.palette = e;
        },
        deleteColorSelected() {
            this.$store.dispatch("changePalette", {
                action: "deleteColor", 
                data: [this.palette.id, this.colorSelectedIndex]
            });
            this.colorSelectedIndex = -1;
            this.editColorSelected = false;
        },
        addPalette() {
            this.$store.dispatch("changePalette", {
                action: "add", 
                data: this.$t("palette.newPalette")
            });
            this.palette = this.palettes[this.palettes.length-1];
            this.colorSelectedIndex = -1;
            this.editColorSelected = false;
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
        _parseAsText(text, filename) {
            let colors = [];
            let colorsHex = text.match(patternHex);
            if(colorsHex) colors = colors.concat(colorsHex.map(c => c.toLowerCase()));
            let colorsRgb = text.match(patternRgb);
            if(colorsRgb) colors = colors.concat(colorsRgb.filter(validateRgb).map(toHex));
            let colorsRgba = text.match(patternRgba);
            if(colorsRgba) colors = colors.concat(colorsRgba.filter(validateRgb).map(toHex));

            let codes = {};
            let colors_uniq = [];
            for(let i = 0; i < colors.length; i++) {
                if(!codes[colors[i]]) {
                    codes[colors[i]] = 1;
                    colors_uniq.push(colors[i]);
                }
            }
            colors = colors_uniq;


            if(colors.length) {
                return {
                    parsed: {
                        name: capitalize(filename.split(".")[0]),
                        colors
                    }
                };
            } 
            return {};
        },
        parsePaletteFile(f) {
            return f.text()
                .then(text =>  {
                    if(f.type.indexOf("json") != -1) {
                        const parsed = JSON.parse(text);
                        if(Array.isArray(parsed.colors)) {
                            return { parsed };
                        } else return this._parseAsText(text, f.name);
                    }
                    if(f.type.indexOf("text") != -1) {
                        return this._parseAsText(text, f.name);
                    }
                    return {};
                });
        },
        importPalette(e) {
            Promise.all(
                Array.from(e.target.files)
                .map(f => this.parsePaletteFile(f))
            ).then(palettes => {
                palettes = palettes.filter(p => p.parsed).map(p => p.parsed);
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
    position: relative;
}

#color-wheel {
    float: right;
}



@media screen and (max-height: $max-height_sm) {
    #color-palette {
        flex: 1 0 $color-palette-height_sm;
        max-height: $color-palette-height_sm;
    }
}


$box-shadow_color-selected: 0 0 1px 1px $color-accent3;
$border_color-selected: 2px $color-bg solid;

.colors-selected {
    position: absolute;
    bottom: 5px;
    left: 5px;
    z-index: 10;
    flex: 0 0 $color-selected-size * 1.5;
    width: $color-selected-size * 1.5;
    height: $color-selected-size * 1.5;
    &::after {
        content: "";
        display: block;
        border-radius: 50%;
        border: $border_color-selected;
        width: $color-selected-size;
        height: $color-selected-size;
        box-shadow: $box-shadow_color-selected;
        position: absolute;
        top:  0;
        left:  0;
        z-index: -2;         
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
    border: $border_color-selected;
    width: $color-selected-size;
    height: $color-selected-size;
    &.background {        
        top:  $color-selected-size * .5;
        left:  $color-selected-size * .5;
        z-index: 0; 
        box-shadow: $box-shadow_color-selected
    }
    &.editing {
        border-color: $color-accent;
        box-shadow: none;
    }
}
.palette-name {
    $pallete-name-width: $panel-right-width - $panel-padding;
    $pallete-name-height: $icon-btn-size;
    $input-width: $pallete-name-width - $icon-btn-size * 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 0 0 $pallete-name-height;
    margin-top: 10px;
    position: relative;
    .v-select {
         .vs__dropdown-toggle {
             max-height: $pallete-name-height;
             height: $pallete-name-height;
         }
        font: $font-select;
        flex: 1 0 $input-width;
        min-width: $input-width;
        max-width: $input-width;
        box-sizing: border-box;
        height: $pallete-name-height;
    }
    input[type=text] {
        position: absolute;
        font: $font-select;
        width: $input-width;
        height: $pallete-name-height;
        right: 0;
        top: 0;
        border-radius: 4px;
        border: 1px solid  $color-accent;
        padding: 1px 2px 0 8.5px;
        box-sizing: border-box;
        background: $color-bg;
        z-index: 10;
    }
}
.palette-controls {
    display: flex;
    flex: 0 0 $icon-btn-size-small;
    padding: 5px 2px 7px;
    justify-content: space-between;
    & > * {
        display: flex;
    }
}

$palette-color-size: 19px; 
.palette-colors {
    flex: 1 2 50%;
    position: relative;
    overflow: hidden;    
    &:after {
        position: absolute;
        z-index: 1;
        bottom: 0;
        left: 0;
        right: 0;
        box-shadow: 0 -1px 7px 5px $color-bg;
        content: '';
        display: block;
    }
    &:hover {
        overflow: visible;
        &:after {
            display: none;
        }
    }
    & > div {
        flex: 1 1 100%;
        display: flex;
        padding-bottom: 10px;
        border-radius: 3px;
        flex-wrap: wrap;
        align-content: flex-start;
        background-color: transparentize($color-bg, .15);
        .color {
            flex: 0 0 $palette-color-size;
            border-radius: 2px;
            width: $palette-color-size;
            height: $palette-color-size;
            margin: 1px;
            &.active {
                box-shadow: 0 0 1px 1px black;
            }
        }    
    }
}
</style>
