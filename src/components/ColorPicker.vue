<template>
    <div class="color-picker"
        :style="pickerSize"
    >
        <div class="color-picker-mode"
            v-show="modes.length > 1"
        >
            <button 
                v-for="m in modes"
                :key="m"
                :class="{active: m == mode}"
                @click.stop="() => mode = m"        
            />
        </div>
             <wheel v-show="mode == 'wheel'"
                :value="value" 
                :width="size" 
                :height="size"
                @color-change="c => $emit('input', c)" />  
    </div>
</template>

<script>
import Wheel from 'vue-color-picker-wheel';

// where will be more color picker modes,
// but first i need to find some nice components or to make it myself

export default {
    components: {Wheel },
    props: {
        value: {
            type: String,
            default: "#000000"
        },
        size: {
            type: Number,
            default: 150
        }
    },
    data() {
        return {
            mode: 'wheel',
            modes: ['wheel']
        }
    },
    computed: {
        pickerSize() {
            return {
                width: this.size + "px",
                height: this.size + "px"
            };
        }
    }
}

</script>

<style lang="scss">
@import "../assets/styles/index.scss";

.color-picker {
    position: relative;
}

.vc-chrome {
    max-width: 100%;
}

.color-picker-mode {
    position: absolute;
    top: 0;
    right: calc(100% + 5px);
    button {
        width: 10px;
        height: 10px;
        padding: 0;
        box-shadow: 0 0 1px 2px $color-accent3;
        border: none;
        &.active {
            box-shadow: 0 0 1px 2px $color-accent;
        }
    }
}


</style>