<template>
    <div class="color-picker"
        :style="pickerSize">   
        <div class="color-codes">
            <label>
                <span>#</span>
                <input type="text" 
                    maxlength="7"
                    class="hex"
                    :value="value | toHexNum"
                    @input="setHexColor"
                    @blur="refresh" />
            </label>
            <label v-for="(num, key) in rgb" :key="key">
                <span>{{key.toUpperCase()}}</span>
                <RangeInput :value="rgb[key]"/>
            </label>

        </div>
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
import {toHex, getRgba} from "../functions/color-functions";

// where will be more color picker modes,
// but first i need to find some nice components or to make it myself

export default {
    components: {Wheel},
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
    filters: {
        toHexNum: v => toHex(v).slice(1)
    },
    data() {
        return {
            mode: 'wheel',
            modes: ['wheel'],
            rgb: {}
        }
    },
    methods: {
        setHexColor(e) {
            let hexNum = e.target.value.replace("#", "");
            if(/^[0-9a-fA-F]{6}$/.test(hexNum)) {
                this.$emit("input", "#" + hexNum);
            }
        },
        refresh() {
            this.$forceUpdate();
        }
    },
    computed: {
        pickerSize() {
            return {
                width: this.size * 1.3 + "px",
                height: this.size + "px"
            };
        }
    }
}

</script>

<style lang="scss">
@import "../styles/index.scss";

.color-picker {
    position: relative;
    display: flex;
    justify-content: space-between;
}

.vc-chrome {
    max-width: 100%;
}

.color-codes {
    flex: 1 0 25%;
    max-width: 25%;
    padding-top: 10px;
    label {
        display: flex;
        span {
            margin-right: 2px;
            font: $font-tools;
        }
    }
    input {
        border: 1px solid $color-accent3;
        border-radius: 0;
        width: 32px;
        padding: 3px 2px;
        font: $font-input;
        font-size: .75em;
        text-align: center;
        &.hex { width: 42px; }
    }
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