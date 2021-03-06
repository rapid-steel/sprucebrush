<template>
<div id="tools">
    <div class="tools-container">
        <div v-for="group in tools" :key="group.group" class="tool-group">
            <div v-for="t in group.items" 
                :key="t.name" 
                class="tool-icon"  
                :class="{
                    [t.icon]: true,
                    selected: $store.state.currentTool == t.name
                }"
                @click="() => select(t)">
            </div>
        </div>       
    </div>
    <div class="current-tool">        
        <div class="tool-icon" :class="currentItem.icon" />   
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
        <div v-if="currentSettings.webglTool == 'brush'">
            <NumericSettings 
                :tool="currentTool"
                :type="'values'"
                :keys="['diameter', 'opacity', 'hardness']" />

            <div class="side-list-header">
                <div class="caption">{{$t('tools.settings.shape')}}</div>                
                <SideList>
                    <div class="shape-settings">
                        <NumericSettings 
                            :tool="currentTool"
                            :type="'values'"
                            :keys="['spacing', 'scatter', 'angle', 'stretch']" />
                        <BrushTransformation />
                        <Shapes />                        
                    </div>
                </SideList>
            </div>           
        </div>

        <div v-else>
            <NumericSettings 
                :tool="currentTool"
                :type="'values'"
                :keys="Object.keys(currentSettings.values).filter(k => settings.values[k] !== undefined)" />
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
                        <div class="icon" 
                            :class="settings.values[k].icon" 
                            :title="$t('tools.settings.' + k)" />
                        <v-select 
                            :options="Object.values(settings.dynamics.types)
                                .filter(opt => opt.props == 'all' || opt.props.indexOf(k) > -1)"
                            :reduce="opt => opt.n"
                            :label="option => $t('tools.settings.dynamicTypes.' + option.k)"
                            v-model="dynamics.type"
                            @input="v => setDynamics(k, {type: v})"                        
                        />

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

                <NumericSettings 
                    :tool="currentTool"
                    :type="'pattern'"
                    :keys="['scale']" />
            </div>          
        </div>

        <div class="gradients"
            v-if="currentSettings.gradient">
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
                        @click.stop="() => deleteGradient(i)"></button>
                    </div>
                    <template slot=footer>
                        <button class="create-gradient" 
                        @click="createGradient">{{$t('tools.settings.createGradient')}}</button>
                    </template>
                </SideList>
            </div>

            <template v-if="currentSettings.gradient.enabled">
                <div class="select-type">
                    <div class="icon" 
                        v-for="type in currentSettings.gradientTypes"
                        :key="type"
                        :class="{
                            active: type == currentSettings.gradient.type, 
                            [settings.gradient.types[type].icon]: true
                        }"
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

                <NumericSettings 
                    :tool="currentTool"
                    :type="'gradient'"
                    :keys="['length']" />
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
import NumericSettings from "./NumericSettings";
import Shapes from "./Shapes";
import {round2n} from "../functions/math-functions";
import Ctx from "../functions/ctx";


export default {
    name: 'Tools',
    components: {
        SideList, GradientCreator, BrushTransformation, NumericSettings, Shapes
    },
    data() {
        return {
            gradientToEdit: null,          
            tools: [{
                group: "drawing",
                items: [
                    {name: "brush", icon: "brush"},
                    {name: "eraser", icon: "eraser"},               
                    {name: "roller", icon: "roller"},
                    {name: "fill", icon: "fill"},
                ]
            }, {
                group: "helpers",
                items: [
                    {name: "picker", icon: "picker"},
                    {name: "hand", icon: "hand"},
                    {name: "rotation", icon: "rotation"},
                ]
            },{
                group: "selection",
                items: [
                    {name: "selection_rect", icon: "selection-rect"},
                    {name: "selection_polygon", icon: "selection-polygon"},
                    {name: "selection_lasso", icon: "selection-lasso"},
                ]
            }]
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
            Object.assign(this.currentSettings.dynamics[prop], updates);
               this.$store.commit("changeSettings", {
                tool: this.currentTool,
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
                if(type == "pattern") {
                     Ctx.loadImg(
                        URL.createObjectURL(file)
                    ).then(ctx => {
                        const img = new Image();
                        img.onload = () => 
                            this.$store.dispatch("asset", {
                                action: "add",
                                data: [
                                    {type}, {
                                    src: img.src
                                }]
                            });
                        img.src = ctx.canvas.toDataURL();  
                    });
                    
                } else {
                    Ctx.loadImg(
                        URL.createObjectURL(file), 
                        (width, height) =>  round2n(width, height)
                    ).then(ctx => {
                        const img = new Image();
                        img.onload = () => {
                            this.$store.dispatch("asset", {
                                action: "add",
                                data: [
                                    {type, textype}, {
                                    src: img.src,
                                    ratio: img.width / img.height
                                }]
                            });
                        };
                        img.src = ctx.canvas.toDataURL();  
                    });
                }
            });

        },
        deleteAsset(type, k) {
             this.$store.dispatch("asset", {
                    action: "delete",
                    data: [{
                        type, 
                        textype: type == 'texture' ? this.currentSettings.textype : 0
                    }, k]
                });
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
                this.$store.dispatch("changeGradient", {
                    action: "add",
                    data: this.gradientToEdit.gradient
                });
            } else {
                this.$store.dispatch("changeGradient", {
                    action: "edit",
                    data: this.gradientToEdit
                });
            }
            this.setGradient(this.gradientToEdit.gradient);
            this.gradientToEdit = false;
            
        },
        deleteGradient(i) {
            this.$store.dispatch("changeGradient", {
                action: "delete",
                data: i
            });
        },
        select(tool) {
            this.$store.commit("selectTool", tool.name);
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
                tool: this.currentTool,
                updates
            });
        }
    }
}
</script>

<style lang="scss">
@import "../styles/index.scss";

#tools {
    width: $tool-panel-width;
}

.caption {
    font: $font-tools;
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

.shape-settings {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    max-height: 180px;
    width: 100%;
    overflow: hidden;
    .brush-transformation {
        margin: 5px;
        .world-axes {
            width: 100px;
            height: 100px;
        }
    }

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
    justify-content: flex-end;
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
                color: $color-bg;
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
        background: $img-bg-button;
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
