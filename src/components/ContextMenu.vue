<template>
<div class="context-menu" 
    :style="menuPosition"
    @pointerdown.stop
    @pointerup.stop >

    <template v-if="currentSettings.webglTool"> 
        <div class="tool-settings">
            <ActualSettings />
            <BrushTransformation  
                v-if="currentSettings.webglTool == 'brush'" />
        </div>
    </template>
    

    <template v-if="currentTool.indexOf('selection') !== -1 && activeSelection">
        <div class="menu">
            <div class="menu-item" 
                v-for="action in activeSelectionActions"
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
import ActualSettings from "./ActualSettings";

export default {
    props: ['position'],
    data() {
        return {
            activeSelectionActions: [{
                k: 'tools.selection.apply', 
                action: () => this.$emit('apply-selection'),
                key: "Enter", 
            }, {
                k: "tools.selection.reset",
                action: () => this.$emit('reset-selection'),
                key: "Ctrl + Z",              
            }, {
                k: "tools.selection.clipnewlayer",
                action: () => this.$emit('clipnewlayer-selection'),
            },{
                k: "tools.selection.crop",
                action: () => this.$emit('crop-selection'),
                key: "Ctrl + T", 
            }],
        };
    },
    components: {
        BrushTransformation, ActualSettings
    },
    computed: {
        menuPosition() {
            return { 
                left: this.position[0] + 'px',
                top: this.position[1] + 'px'
            };
        },
        ...mapState(['currentTool', 'activeSelection']),
        ...mapGetters(['currentSettings'])
    },
    methods: {
        set(settings) {
            this.$store.commit("changeSettings", {
                instrument: this.currentTool,
                settings
            });
        }
    }

}
</script>

<style lang="scss">
@import "../assets/styles/colors";

.context-menu {
    background-color: $color-bg;
    position: fixed;
    z-index: $z-index-context-menu;
    display: flex;
    box-shadow: 0 0 10px rgba(0,0,0, .3);
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
                color: white;
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