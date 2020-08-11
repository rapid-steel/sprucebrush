<template>
<div id="tools">
    <div class="btn-container">
        <div v-for="group in tools" :key="group.group" class="group">
            <div v-for="t in group.items" 
            :key="t.name" 
            class="btn" 
            :class="{selected: $store.state.currentTool == t.name}"
            @click="() => select(t)">
                <img :src="t.icon">
            </div>
        </div>       
    </div>
    <div class="current-instrument">        
        <img :src="currentItem.icon">
        <div>{{$t('tools.tools.' + currentTool)}}</div>
    </div>

    <div v-if="currentTool.indexOf('selection') !== -1" 
    class="controls">
        <div 
        v-for="action in selectionActions"
        :key="action.k" 
        v-show="action.show()"
        >
           <button class="ok-btn" 
           @click="action.action">{{$t(action.k)}}</button>
            <div class="hint" 
            v-if="action.key">{{action.key}}</div>
        </div>      
    </div>

    <div class="settings">
        <div v-for="s in actualSettings" :key="s.k">
            <div class="caption">{{$t('tools.settings.' + s.k)}}:</div>
            <RangeInput :min="s.min" :max="s.max" :step="s.step" :horizontal="true"
            v-model="currentSettings.values[s.k]"
            @input="v => set({values: {[s.k]: v}})" />
        </div>

        <div class="shapes" 
            :class="{disabled: !!currentSettings.values.texture}" 
            v-if="currentSettings.values.shape !== undefined">
            <div class="caption">{{$t('tools.settings.shape')}}</div>
            <div v-if="!currentSettings.values.texture">
                <div v-for="shape in shapes" 
                :key="shape.k" 
                class="shape"
                :class="{active: currentSettings.values.shape == shape.k, [shape.k]: true}"
                @click.stop="() => set({values: {shape: shape.k}})">
                </div>
            </div>
            <div class="input-checkbox" v-if="currentSettings.values.pixel !== undefined && !currentSettings.values.texture">
                <div class="caption">{{$t('tools.settings.pixel')}}</div>
                <input type="checkbox" 
                :checked="currentSettings.values.pixel" 
                @input="e => set({values: {pixel: !!e.target.checked}})" >
            </div>
        </div>

        <div class="textures" v-if="currentSettings.values.texture !== undefined">
            <div class="side-list-header">
                <div class="caption">{{$t('tools.settings.texture')}}</div>
                <SideList>
                    <div class="texture notexture" 
                        :class="{active: currentSettings.values.texture == false}"
                        @click.stop="() => set({values: {texture: false}})"
                        ></div>
                    <div class="texture"
                        v-for="texture in textures" 
                        :key="texture.k" 
                        :class="{active: currentSettings.values.texture == texture}"
                        @click.stop="() => set({values: {texture}})">
                        <button class="icon-btn small delete" 
                        @click.stop="() => deleteAsset('texture', texture.k)"></button>
                        <img :src="texture.src">                
                    </div>
                    <template slot=footer>
                        <button class="add-texture" 
                            :class="{active: currentSettings.values.texture == false}"
                            @click.stop="() => $refs.addTexture.click()"
                        >{{$t('tools.settings.importTexture')}}<input @change="importAsset"
                            type="file" id="texture-input"
                            ref="addTexture" accept="image/*">
                        </button>
                    </template>
                </SideList>
            </div>
            <div v-if="currentSettings.values.texture">
                <div class="texture current">
                    <button class="icon-btn small cancel" 
                    @click.stop="() => set({values: {texture: false}})"></button>
                    <img :src="currentSettings.values.texture.src"> 
                </div>
            </div>
             <div class="input-checkbox"  v-if="currentSettings.values.texture && currentSettings.values.textureColor !== undefined">
                <div class="caption">{{$t('tools.settings.textureColor')}}</div>
                <input type="checkbox" 
                :checked="currentSettings.values.textureColor" 
                @input="e => set({textureColor: !!e.target.checked})" >
            </div>

        </div>

        <div class="textures" v-if="currentSettings.values.pattern !== undefined">
            <div class="side-list-header">
                <div class="caption">{{$t('tools.settings.pattern')}}</div>
                <SideList>
                    <div class="texture notexture" 
                        :class="{active: currentSettings.values.pattern.enabled == false}"
                        @click.stop="() => set({values: {pattern: false}})"
                        ></div>
                    <div class="texture"
                        v-for="pattern in patterns" 
                        :key="pattern.k" 
                        :class="{active: currentSettings.values.pattern.k == pattern.k}"
                        @click.stop="() => set({values: {pattern}})">
                         <button class="icon-btn small delete" 
                        @click.stop="() => deleteAsset('pattern', pattern.k)"></button>
                        <img :src="pattern.src">                
                    </div>
                    <template slot=footer>
                        <button class="add-texture" 
                            :class="{active: currentSettings.values.pattern.enabled == false}"
                            @click.stop="() => $refs.addPattern.click()"
                        >{{$t('tools.settings.importPattern')}}<input @change="importAsset"
                            type="file" id="pattern-input"
                            ref="addPattern" accept="image/*">
                        </button>
                    </template>
                </SideList>
            </div>
            <div v-if="currentSettings.values.pattern">
                <div class="texture current">
                    <button class="icon-btn small cancel" 
                    @click.stop="() => set({pattern: false})"></button>
                    <img :src="currentSettings.values.pattern.src"> 
                </div>
            </div>

            <div class="gradient-length" v-if="!!currentSettings.values.pattern">
                <div class="caption">Scale</div>
                    <RangeInput :min=".1" :step=".01" :max="10" :horizontal="true"
                    v-model="currentSettings.values.pattern.scale"
                    @input="v => set({values: { pattern: {...currentSettings.values.pattern, scale } }})" />
            </div>   
        </div>


        <div class="gradients"
            v-if="currentSettings.values.gradient"
        >
            <div class="side-list-header">
                <div class="caption">{{$t('tools.settings.gradient')}}</div>
                <SideList>
                    <div class="gradient nogradient"
                        :class="{active: !currentSettings.values.gradient.enabled}"
                        @click.stop="resetGradient">{{$t('tools.settings.none')}}
                    </div>
                    <div v-for="(gradient,i) in gradients" 
                        :key="i" class="gradient"
                        :class="{active: currentSettings.values.gradient.k == gradient.k}"
                        :style="gradient | gradientBG"
                        @click.stop="() => set({
                            values: {
                                gradient: {
                                    ...currentSettings.values.gradient, 
                                    ...gradient,
                                    enabled: true
                                }
                            }
                        })">
                        <button class="icon-btn small edit" 
                        @click.stop="() => editGradient(i)"></button>
                        <button class="icon-btn small delete" 
                        @click.stop="() => $store.commit('deleteGradient', i)"></button>
                    </div>
                    <template slot=footer>
                        <button class="create-gradient" @click="createGradient">{{$t('tools.settings.createGradient')}}</button>
                    </template>
                </SideList>
            </div>

            <div v-if="currentSettings.values.gradient.enabled">
                <div class="gradient current" :style="{}">
                    <button class="icon-btn small cancel" 
                    @click.stop="resetGradient"></button>
                </div>
            </div>

            <div class="gradient-length" v-if="gradientLength">
                <div class="caption">{{$t('tools.settings.length')}}</div>
                    <RangeInput 
                    :min="gradientLength.min" 
                    :max="gradientLength.max" 
                    :step="gradientLength.step" 
                    :horizontal="true"
                    v-model="currentSettings.values.gradient.length"
                    @input="() => set({
                            values: {
                                gradient: {
                                    ...currentSettings.values.gradient, 
                                    length: v
                                }
                            }
                        })" />
            </div>       
        </div>


        
    </div>

    


    <GradientCreator 
        v-if="gradientToEdit" 
        v-model="gradientToEdit.gradient"
        @save="saveGradient"
        @close="() => gradientToEdit = null" 
    />
    

</div>

</template>

<script>
import {mapState} from "vuex";
import SideList from "./SideList";
import GradientCreator from "./GradientCreator";
import {round2n} from "../functions/math-functions";

export default {
    name: 'Tools',
    components: {
        SideList, GradientCreator
    },
    data() {
        return {
            selectionActions: [{
                k: 'tools.selection.apply', 
                action: () => this.$emit('apply-selection'),
                key: "Enter", 
                show: () => this.activSelection
            }, {
                k: "tools.selection.reset",
                action: () => this.$emit('reset-selection'),
                key: "Ctrl + Z", 
                show: () => this.activeSelection                
            }, {
                k: "tools.selection.clipnewlayer",
                action: () => this.$emit('clipnewlayer-selection'),
                show: () => this.activeSelection
            },{
                k: "tools.selection.crop",
                action: () => this.$emit('crop-selection'),
                key: "Ctrl + T", 
                show: () => this.activeSelection
            }, {
                k: "tools.selection.all",
                action: () => this.$emit('select-all'),
                key: "Ctrl + A", 
                show: () => true
            }],
            gradientTypes: {
                by_len: {length: {min: 10, max: 100000, step: 1} },
                radial: {},
                by_wid: {}                
            },
            dynamicsTypes: [
                {n: 0, k: "disabled"},
                {n: 1, k: "fade"},
                {n: 2, k: "periodic_max"},
                {n: 3, k: "pressure"},
                {n: 4, k: "periodic_ampl"},
                {n: 5, k: "circular"}
            ],
            gradientToEdit: null,
            settings: [
                {k: "radius", min: 1, max: 1000, step: 1},
                {k: "lineWidth", min: 1, max: 1000, step: 1},
                {k: "curveSmoothing", min: 1, max: 25, step: 1},
                {k: "angleSmoothing", min: 1, max: 25, step: 1},
                {k: "opacity",  min: .01, max: 1, step: .01},
                {k: "angle", min: 0, max: 359, step: 1},
                {k: "spacing",  min: 0.01, max: 10, step: .01},
                {k: "tolerance", min: 1, max: 255, step: 1}
            ],
            tools: [{
                group: "drawing",
                items: [
                    {name: "brush", icon: require("@/assets/img/brush.png")},
                    {name: "eraser", icon: require("@/assets/img/eraser.png")},               
                    {name: "marker", icon: require("@/assets/img/roller.png")},
                    {name: "fill", icon: require("@/assets/img/fill.png")},
                ]
            }, {
                group: "helpers",
                items: [
                    {name: "picker", icon: require("@/assets/img/picker.png")},
                    {name: "hand", icon: require("@/assets/img/hand.png")},
                ]
            },{
                group: "selection",
                items: [
                    {name: "selection_rect", icon: require("@/assets/img/selection-rect.png")},
                    {name: "selection_polygon", icon: require("@/assets/img/selection-polygon.png")},
                    {name: "selection_lasso", icon: require("@/assets/img/selection-lasso.png")},
                ]
            }
                
            ]
        }
    },
    computed: {
        ...mapState(['currentTool', 'types', 'patterns', 'shapes', 'gradients', 'currentColor', 'colorBG', 'activeSelection']),
        textures() {
            return this.$store.state.textures[this.currentSettings.textype];
        },
        actualSettings() {
            return this.settings.filter(s => this.currentSettings.values[s.k] != undefined);
        },
        currentItem() {
            for(let i = 0; i < this.tools.length; i++) {
                let item = this.tools[i].items.find(item => item.name == this.currentTool);
                if(item) return item;
            }
            return {};
        },
        currentSettings() {
            return this.$store.getters.currentSettings;
        },
        gradientLength() {
            return this.currentSettings.values.gradient ? 
            this.gradientTypes[this.currentSettings.values.gradient.type].length
            : false;
        }
    },
    mounted() {
    

    },
    methods: {
        resetGradient() {
            this.currentSettings.values.gradient.enabled = false;
            this.set({
                values: {
                    gradient: this.currentSettings.values.gradient 
                }
            });
        },
        importAsset(e) {
            const type = e.target.id.replace("-input", "");
            const textype = this.currentSettings.textype;
            Array.from(e.target.files).forEach(file => {
                let img = new Image();
                    img.onload = () => {
                        if(type.indexOf("texture") !== -1) {
                            let {k, w1,h1, imgW, imgH, dw, dh} = round2n(img.width, img.height);
                            let ctx = new OffscreenCanvas(w1, h1).getContext("2d");
                            ctx.drawImage(img, dw, dh, imgW, imgH);
                            img = new Image();
                            img.onload = () => {
                                this.$store.commit("addAsset", [
                                    {type, textype}, {
                                    k: Date.now(),
                                    src: img.src,
                                    ratio: k
                                }]);
                            };
                            ctx.canvas.convertToBlob({
                                type: "image/png"
                            })
                            .then(blob => img.src = URL.createObjectURL(blob));  
                            

                        } else {
                            this.$store.commit("addAsset", [{type}, {
                                k: Date.now(),
                                src: img.src
                            }]);
                        }
                    }
                    img.src = URL.createObjectURL(file);    
            });

        },
        deleteAsset(type, k) {
             this.$store.commit("deleteAsset", [
                {type, textype: type == 'texture' ? this.currentSettings.textype : 0}, k]);
        },
        createGradient() {
            this.gradientToEdit = {
                gradient: [this.currentColor, this.colorBG],
                index: null
            };
        },
        editGradient(i) {
              this.gradientToEdit = {
                gradient: this.gradients[i],
                index: i
            };

        },
        saveGradient() {
            if(this.gradientToEdit.index == null) {
                this.$store.commit("createGradient", this.gradientToEdit.gradient);
            } else {
                this.$store.commit("editGradient", this.gradientToEdit);
            }
            this.gradientToEdit = false;
        },
        select(instrument) {
            this.$store.commit("selectInstrument", instrument.name);
        },
        set(updates) {
            this.$store.commit("changeSettings", {
                instrument: this.currentTool,
                updates
            });
        }
    }
}
</script>

<style lang="scss">
@import "../assets/styles/colors";

#tools {
    width: $tool-panel-width;
}

.caption {
    font: $font-tools;
}

.btn-container {      
    .group {
        border: 1px solid black;
        display: flex;
        justify-content: flex-start;
        align-content: flex-start;
        align-items: flex-start;
        flex-wrap: wrap;  
        width: $tool-size * 2;
    }
    .btn {
        flex: 1 0 $tool-size;
        height: $tool-size;
        max-width: $tool-size;        
        img {
            width: 100%;
            height: 100%;
        }        
        &.selected {
            filter: invert(1);
        }
    }
}

.current-instrument {
    text-align: center;
    max-width: $tool-size * 2;
    font: $font-tool-title;
    margin: 10px 0 20px;
    img {
        max-width: $tool-selected-size;
        width: $tool-selected-size;
        height: $tool-selected-size;
    }
}

.settings {
    font: $font-tools;
    & > div {
        margin: 10px 0;
    }
}

.gradient-length {
    width: 100%;
}
.settings, .gradient-length {
    .range-input {
        text-align: right;
        margin-top: 5px;
        width: 100%;
    }
    input {
        border: $input-border;
        border-radius: 0;
        width: 40px;
        padding: 5px;
        font: $font-input;
        text-align: right;
    }
}




.shapes {
    &.disabled {
        opacity: .5;
        pointer-events: none;
    }
    & > div:nth-child(2) {
        display: flex;
        justify-content: space-around;
    }
    .shape {
        flex: 1 1 $shape-size;
        max-width: $shape-size * 1.5;
        margin: 5px;
        &.active {
            box-shadow: 0 0 1px 1px $color-accent2;
        }
        &::after {
            content: "";
            display: block;
            background: black;
            width: $shape-size;
            height: $shape-size;
            margin: 5px auto;
        }
        &.round::after {
            border-radius: 50%;            
        }
    }
}
.notexture {
    background-image: url("../assets/img/none.jpg");
    background-size: contain;
    background-repeat: no-repeat;
    background-color: lightgrey;
}

.nogradient {
    background-image: url("../assets/img/none.jpg");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}

.textures, .gradients {
    margin-top: 20px!important;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    .side-list-header {
        display: flex;
        justify-content: space-between;
        width: 100%;
    }
    .footer {
        flex: 2 0 100%;
    }
}

.gradients {
    .expanded-list {
        width: $gradient-list-size * 2 + 50px;
    }

}

.input-checkbox {
    display: flex;
    justify-content: space-between;
    input[type=checkbox] {
        -webkit-appearance: none;
        padding: 0;
        border: none;
        width: $ckbx-size;
        height: $ckbx-size;
        box-sizing: border-box;
        &::after {
            visibility: visible;
            border: $input-border;
            border-radius: 2px;
            width: $ckbx-size;
            height: $ckbx-size;
            display: inline-block;
            content: " ";
            pointer-events: none;
            line-height: $ckbx-size;
            text-align: center;
        }
        &:checked {
            &::after {
                background: $color-accent;                
                content: '\2713';
                color: white;
            }        
        }
    }
}

.gradient, 
.texture {
    position: relative;
    .icon-btn {
        position: absolute;
        opacity: 0;
        right: $icon-btn-size-small + 2.5px;
        &:last-of-type {
            right: 0;
        }
    }
    &:hover {
        .icon-btn { 
            opacity: 1;      
            z-index: 10;      
        }
    }
}

.texture {   
    height: $texture-size;
    flex: 1 0 $texture-size;
    max-width: $texture-size;
    margin: 2.5px;
    
    &.active {
        box-shadow: 0 0 1px 2px $color-accent2;
    }
    img {
        width: $texture-size;
        height: $texture-size;
    }
}
.gradient {
    flex: 1 0 $gradient-list-size;
    margin: 2.5px;
    width: $gradient-list-size;
    max-width: $gradient-list-size;
    &.active {
        box-shadow: 0 0 1px 2px $color-accent2;
    }
    height: 30px;
    border: 1px solid black;
    &.current {
        max-width: $tool-panel-width - 10px;
    }
    &.radial {
        width: $gradient-radial-size;
        height: $gradient-radial-size;
        border-radius: 50%;
    }
}


.controls {
    text-align: center;
    button.ok-btn {
        border: 2px black solid;
        padding: 5px;
        margin: 10px auto 0;
        font: $font-btn-small;
    }
    .hint {
        font: $font-hint;
        width: 100%;
        margin-top: 1px;
        margin-bottom: 5px;
        text-align: center;
    }
}


.footer {
    display: flex;
    justify-content: center;
    margin: 10px 0;
    button {
        background: $btn-bg;
        background: {
            size: 100% 100%;
            repeat: no-repeat;
        };
        border: none;
        padding: 12px 20px;
        margin: 0 10px;
        font: $font-btn;
    }
}

</style>
