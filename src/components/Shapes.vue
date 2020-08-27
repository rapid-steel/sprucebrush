<template>
<div class="shapes" 
    :class="{disabled: !!currentSettings.texture}" >
    <div class="select-type" >
        <div v-for="shape in shapes" 
        :key="shape.k" 
        class="shape"
        :class="{active: currentSettings.values.shape == shape.k, [shape.k]: true}"
        @click.stop="() => setShape(shape)">
        </div>
    </div>
    <div class="input-checkbox" >
        <div class="caption">{{$t('tools.settings.pixel')}}</div>
        <input type="checkbox" 
            :class="{checked: currentSettings.values.pixel}"
            @click="e => setPixel(!currentSettings.values.pixel)" >
    </div>
</div>
</template>

<script>
import {mapState, mapGetters} from 'vuex';

export default {
      computed: {
        ...mapState(['currentTool', 'activeSelection', 'shapes']),
        ...mapGetters(['currentSettings'])
    },
    methods: {
        setShape(shape) {
            this.$store.commit('changeSettings', {
                tool: this.currentTool,
                updates: {values: {shape: shape.k}}
            });
        },
        setPixel(val) {
            this.$store.commit('changeSettings', {
                tool: this.currentTool,
                updates: {values: {pixel: val}}
            });
        }
    }
}

</script>


<style lang="scss">
@import "../assets/styles/index.scss";
.shapes {
    &.disabled {
        opacity: .5;
        pointer-events: none;
    }
    .shape {
        flex: 1 1 $shape-size;
        max-width: $shape-size * 1.5;
        margin: 5px;
        
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

</style>