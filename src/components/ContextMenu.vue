<template>
<div class="context-menu" 
    :style="menuPosition"
    @pointerdown.stop
    @pointerup.stop >
    <ActualSettings />
    <template v-if="currentSettings.webglTool == 'brush'">        
        <BrushTransformation />
    </template>

    <template v-if="activeSelection">

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
    padding: 10px;
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
    .brush-transformation {    
        margin-left: 10px;
        margin-top: 10px;
        .world-axes {
            width: 100px;
            height: 100px;
        }
    }
}

</style>