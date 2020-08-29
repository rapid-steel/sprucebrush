<template>
<div class="context-menu" 
    :style="menuPosition"
    @pointerdown.stop
    @pointerup.stop >

    <template v-if="currentSettings.webglTool"> 
        <div class="tool-settings">
            <NumericSettings 
                :tool="currentTool"
                :type="'values'"
                :keys="Object.keys(currentSettings.values).filter(k => settings.values[k] !== undefined)" />
            <div v-if="currentSettings.webglTool == 'brush'">
                <BrushTransformation />
                <Shapes />
            </div>
        </div>
    </template>
    

    <template v-else-if="currentTool.indexOf('selection') !== -1 && activeSelection">
        <div class="menu" @click="() => $emit('close')">
            <div class="menu-item" 
                v-for="action in menuActions.selection"
                :key="action.k" 
                @click="action.action"
                >
                <div class="label">{{$t(action.k)}}</div>
                <div class="hint" 
                    v-if="action.key">{{action.key}}</div>
            </div>     
        </div>
    </template>

    <template v-else-if="menuActions[currentTool]">
        <div class="menu" @click="() => $emit('close')">
            <div class="menu-item" 
                v-for="action in menuActions[currentTool]"
                :key="action.k" 
                @click="action.action"
                >
                <div class="label">{{$t(action.k)}}</div>
                <div class="hint" 
                    v-if="action.key">{{action.key}}</div>
            </div>     
        </div>
    </template>

</div>
</template>

<script>
import {mapState, mapGetters} from 'vuex';
import BrushTransformation from "./BrushTransformation";
import NumericSettings from "./NumericSettings";
import Shapes from "./Shapes";

export default {
    props: ['position', 'show'],
    data() {
        return {
            menuActions: {
                selection: [{
                    k: 'tools.selection.apply', 
                    action: () => this.$emit('apply-selection'),
                    key: "Enter", 
                }, {
                    k: "tools.selection.reset",
                    action: () => this.$emit('reset-selection'),
                    key: "Ctrl + Z",              
                }, {
                    k: 'tools.selection.clear', 
                    action: () => this.$emit('clear-selection'),
                    key: "Delete", 
                }, {
                    k: "tools.selection.clipnewlayer",
                    action: () => this.$emit('clipnewlayer-selection'),
                },{
                    k: "tools.selection.crop",
                    action: () => this.$emit('crop-selection'),
                    key: "Ctrl + T", 
                }],
                rotation: [{
                    k: "common.reset",
                    action: () => {
                        this.set({values: {rAngle: 0}});
                        this.$emit("close");
                    }
                }]
            },
        };
    },
    components: {
        BrushTransformation, NumericSettings, Shapes
    },
    computed: {
        menuPosition() {
            return { 
                left: this.position[0] + 'px',
                top: this.position[1] + 'px',
                display: this.show ? "block" : "none"
            };
        },
        ...mapState(['currentTool', 'activeSelection', 'settings']),
        ...mapGetters(['currentSettings'])
    },
    methods: {
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

.context-menu {
    background-color: $color-bg;
    position: fixed;
    z-index: $z-index-context-menu;
    display: flex;
    box-shadow: $box-shadow_content-menu;
    .actual-settings {
        .setting-value {
            margin: 8px;
            .icon {
                width: 30px;
                height: 30px;
                margin-right: 8px;
            }
            input{
                font-size: 1.2em;
                width: 60px;
            }
            
        }
    }
    .tool-settings {
        padding: 15px;
        display: flex;
    }
    .brush-transformation {    
        margin-left: 10px;
        margin-top: 10px;
        margin-right: 10px;
        .world-axes {
            width: 100px;
            height: 100px;
        }
    }
    .menu {
        display: flex;
        align-items: stretch;
        flex-direction: column;
        width: 250px;
        font: $font-contextmenu;
        .menu-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 12px;
            cursor: default;
            &:hover {
                background: $color-accent;
                font-weight: bold;
                color: $color-bg;
                .hint {
                    font-weight: normal;
                    color: $color-accent3;
                }
            }
            .hint {
                color: $color-accent;
            }
        }
    }
}

</style>