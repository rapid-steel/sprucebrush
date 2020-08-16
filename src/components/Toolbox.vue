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

    <div v-if="currentTool.indexOf('selection') !== -1 && this.activeSelection" 
        class="controls">
        <button class="icon-btn apply"
            :title="$t('tools.selection.apply')"
            @click="() => $emit('apply-selection')"></button>
        <button class="icon-btn reset"
            :title="$t('common.reset')"
            @click="() => $emit('reset-selection')"></button>
      
    </div>





    <div class="settings">
        <ActualSettings />


        <div v-if="currentSettings.webglTool == 'brush'">
            <BrushTransformation />
            <Shapes />
        </div>

        <div class="dynamics" v-if="currentSettings.webglTool">
              <div class="side-list-header">
                <div class="caption">{{$t('tools.settings.dynamics')}}</div>                
                <SideList>
                    <div class="dynamic-header">
                        <div></div>
                        <div class="caption">{{$t('tools.settings.dynamicsLength')}}</div>
                        <div class="caption">{{$t('tools.settings.dynamicsRange')}}</div>
                    </div>
                    <div v-for="(dynamics, k) in currentSettings.dynamics" 
                        class="setting-dynamic"
                        :key="k">
                        <img class="icon" 
                            :src="settings.values[k].icon" 
                            :title="$t('tools.settings.' + k)">
                        <v-select 
                            :options="Object.values(settings.dynamics.types)
                                .filter(opt => opt.props == 'all' || opt.props.indexOf(k) > -1)"
                            :reduce="opt => opt.n"
                            v-model="dynamics.type"
                            :label="'k'"
                            :clearable="false"
                            :appendToBody="true"
                            :searchable="false"   
                            @input="v => setDynamics(k, {type: v})"                        >
                            <template v-slot:selected-option="option">
                                <span>{{$t('tools.settings.dynamicTypes.' + option.k)}}</span>
                            </template>
                            <template v-slot:option="option">
                                <span>{{$t('tools.settings.dynamicTypes.' + option.k)}}</span>
                            </template>
                        </v-select>

                        <RangeInput v-for="d in Object.entries(settings.dynamics.props)" 
                            :key="d[0]"
                            :disabled="settings.dynamics.types[dynamics.type][d[0]] == undefined"
                            :min="d[1].min" 
                            :max="d[1].max" 
                            :step="d[1].step" 
                            :horizontal="true"
                            v-model="dynamics[d[0]]"
                            @input="v => setDynamics(k, {[d[0]]: v})"
                        />
                    </div>
                </SideList>
              </div>
            
        </div>

        

        <div class="textures" v-if="currentSettings.texture !== undefined">
            <div class="side-list-header">
                <div class="caption">{{$t('tools.settings.texture')}}</div>
                <SideList>
                    <div class="texture notexture" 
                        :class="{active: currentSettings.texture == false}"
                        @click.stop="() => set({texture: false})"
                        ></div>
                    <div class="texture"
                        v-for="texture in textures" 
                        :key="texture.k" 
                        :class="{active: currentSettings.texture == texture}"
                        @click.stop="() => set({texture})">
                        <button class="icon-btn small delete" 
                        @click.stop="() => deleteAsset('texture', texture.k)"></button>
                        <img :src="texture.src">                
                    </div>
                    <template slot=footer>
                        <button class="add-texture" 
                            :class="{active: currentSettings.texture == false}"
                            @click.stop="() => $refs.addTexture.click()"
                        >{{$t('tools.settings.importTexture')}}<input @change="importAsset"
                            type="file" id="texture-input"
                            ref="addTexture" accept="image/*">
                        </button>
                    </template>
                </SideList>
            </div>
            <div v-if="currentSettings.texture">
                <div class="texture current">
                    <button class="icon-btn small cancel" 
                    @click.stop="() => set({texture: false})"></button>
                    <img :src="currentSettings.texture.src"> 
                </div>
            </div>

        </div>

        <div class="textures" v-if="currentSettings.pattern !== undefined">
            <div class="side-list-header">
                <div class="caption">{{$t('tools.settings.pattern')}}</div>
                <SideList>
                    <div class="texture notexture" 
                        :class="{active: currentSettings.pattern.enabled == false}"
                        @click.stop="() => set({pattern: {...currentSettings.pattern, enabled: false }})"
                        ></div>
                    <div class="texture"
                        v-for="pattern in patterns" 
                        :key="pattern.k" 
                        :class="{active: currentSettings.pattern.k == pattern.k}"
                        @click.stop="() => set({pattern: {...currentSettings.pattern, ...pattern, enabled: true}})">
                         <button class="icon-btn small delete" 
                        @click.stop="() => deleteAsset('pattern', pattern.k)"></button>
                        <img :src="pattern.src">                
                    </div>
                    <template slot=footer>
                        <button class="add-texture" 
                            :class="{active: currentSettings.pattern.enabled == false}"
                            @click.stop="() => $refs.addPattern.click()"
                        >{{$t('tools.settings.importPattern')}}<input @change="importAsset"
                            type="file" id="pattern-input"
                            ref="addPattern" accept="image/*">
                        </button>
                    </template>
                </SideList>
            </div>
            <div v-if="currentSettings.pattern.enabled">
                <div class="texture current">
                    <button class="icon-btn small cancel" 
                    @click.stop="() => set({pattern: {...currentSettings.pattern, enabled: false }})"></button>
                    <img :src="currentSettings.pattern.src"> 
                </div>

                 <div class="setting-value">
                    <div class="caption">{{$t('tools.settings.scale')}}</div>
                        <RangeInput :min=".1" :step=".01" :max="10" :horizontal="true"
                        v-model="currentSettings.pattern.scale"
                        @input="scale => set({ pattern: {...currentSettings.pattern, scale }})" />
                </div>   
            </div>

           
        </div>


        <div class="gradients"
            v-if="currentSettings.gradient"
        >
            <div class="side-list-header">
                <div class="caption">{{$t('tools.settings.gradient')}}</div>
                <SideList>
                    <div class="gradient nogradient"
                        :class="{active: !currentSettings.gradient.enabled}"
                        @click.stop="resetGradient">{{$t('tools.settings.none')}}
                    </div>
                    <div v-for="(gradient,i) in gradients" 
                        :key="i" class="gradient"
                        :class="{active: currentSettings.gradient.colors == gradient}"
                        :style="gradient | gradientBG"
                        @click.stop="() => setGradient(gradient, i)">
                        <button class="icon-btn small edit" 
                        @click.stop="() => editGradient(i)"></button>
                        <button class="icon-btn small delete" 
                        @click.stop="() => $store.commit('deleteGradient', i)"></button>
                    </div>
                    <template slot=footer>
                        <button class="create-gradient" 
                        @click="createGradient">{{$t('tools.settings.createGradient')}}</button>
                    </template>
                </SideList>
            </div>

            <template v-if="currentSettings.gradient.enabled">
                <div class="select-type">
                    <img class="icon" 
                        v-for="type in currentSettings.gradientTypes"
                        :key="type"
                        :class="{active: type == currentSettings.gradient.type}"
                        :src="settings.gradient.types[type].icon"
                        @click.stop="() => setGradientType(type)"                                                         
                     />
                </div>
                
                <div>
                    <div class="gradient current" :class="currentSettings.gradient.type"
                        :style="currentSettings.gradient.colors | 
                        gradientBG(currentSettings.gradient.type, currentSettings.gradient.type == 'by_wid' ? 'to bottom' : 'to right')">
                        <button class="icon-btn small cancel" 
                        @click.stop="resetGradient"></button>
                    </div>
                </div>

                <div class="setting-value"  v-if="currentSettings.gradient.type == 'by_len'">
                    <div class="caption">{{$t('tools.settings.length')}}</div>
                    <RangeInput 
                        :min="settings.gradient.length.min" 
                        :max="settings.gradient.length.max" 
                        :step="settings.gradient.length.step" 
                        :horizontal="true"
                        v-model="currentSettings.gradient.length"
                        @input="setGradientLength" />
                </div>     
            </template>

         
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
import BrushTransformation from "./BrushTransformation";
import ActualSettings from "./ActualSettings";
import Shapes from "./Shapes";
import {round2n} from "../functions/math-functions";

export default {
    name: 'Tools',
    components: {
        SideList, GradientCreator, BrushTransformation, ActualSettings, Shapes
    },
    data() {
        return {
            gradientToEdit: null,          
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
                    {name: "rotation", icon: require("@/assets/img/rotation.png")},
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
        ...mapState(['settings', 'currentTool', 'types', 'patterns',  'gradients', 'currentColor', 'colorBG', 'activeSelection']),
        textures() {
            return this.$store.state.textures[this.currentSettings.textype];
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
            return this.currentSettings.gradient ? 
            this.gradientTypes[this.currentSettings.gradient.type].length
            : false;
        }
    },
    mounted() {
    

    },
    methods: {
        setDynamics(prop, updates) {
            console.log(prop, updates)
            Object.assign(this.currentSettings.dynamics[prop], updates);
               this.$store.commit("changeSettings", {
                instrument: this.currentTool,
                updates: {
                    dynamics: Object.assign({}, this.currentSettings.dynamics)
                }
            });
        },
        setGradient(colors,i) {
            this.currentSettings.gradient.enabled = true;
            this.currentSettings.gradient.colors = colors;
            this.currentSettings.gradient.k = i;
            this.set({
                gradient: Object.assign({}, this.currentSettings.gradient)                
            });
        },
        setGradientType(type) {
            this.currentSettings.gradient.type = type;
            this.set({
                gradient: Object.assign({}, this.currentSettings.gradient)                
            });
        },
        resetGradient() {
            this.currentSettings.gradient.enabled = false;
            this.set({
                gradient: Object.assign({}, this.currentSettings.gradient)                
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
        setValue(obj) {
            this.set({values: obj});
        },
        setGradientLength(v) {
            this.currentSettings.gradient.length = v;
            this.set({
                values: {
                    gradient: Object.assign({}, this.currentSettings.gradient)
                }
            });
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
    .setting-value {
        display: flex;
        justify-content: space-between;
    }
}

.gradient-length {
    width: 100%;
}

.setting-value {
    margin: 5px 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    .caption {
        margin-right: 25px;
    }
}
.settings, 
.gradient-length {
    .range-input {
        text-align: right;
    }
    .setting-value,
    .input-checkbox {
        margin-right: 3px;
    }
}
input[type=number] {
    border: $input-border;
    border-radius: 0;
    width: 40px;
    padding: 5px;
    font: $font-input;
    text-align: right;
}
img.icon {
    width: $settings-icon-size;
    height: $settings-icon-size;
    display: inline-block;
}


.select-type {
    display: flex;
    justify-content: space-around;
    & > .active {
        box-shadow: 0 0 1px 1px $color-accent2;
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

.side-list-header {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.textures, .gradients {
    margin-top: 20px!important;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;
    .footer {
        flex: 2 0 100%;
    }
}

.gradients {
    .expanded-list {
        width: $gradient-list-size * 2 + 50px;
    }
}
.dynamics {
    .expanded-list {
        width: 350px;
    }
}
.setting-dynamic,
.dynamic-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .v-select { flex: 2 0 150px; }
}
.dynamic-header {
    & > * { 
        flex: 1 0 52px; 
        text-align: center;
    }
    & > :first-child { flex: 3 1 100%; }    
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
        &.checked {
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
        margin: 5px auto 8px;
    }
    &.radial {
        width: $gradient-radial-size;
        height: $gradient-radial-size;
        border-radius: 50%;
    }
}

.brush-transformation .world-axes {
    width: 60px;
    height: 60px;
}

.controls {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
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

.setting-dynamic {
    width: 100%;
    display: flex;
}

</style>
