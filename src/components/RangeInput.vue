<template>
    <div class="range-input" 
        :class="{horizontal, disabled}"
        ref="container"
        @mouseenter="setRangePosition"
        @wheel="e => $emit('input', Math.max(min, Math.min(max, value+step*Math.sign(e.deltaY))))"     
    >
        <input type="number" 
            :min="min" 
            :max="max" 
            :step="step"
            :value="value"           
            :disabled="disabled"
            @input="e => $emit('input', Math.max(min, Math.min(max, +e.target.value)))"
            @change="e => $emit('input', Math.max(min, Math.min(max, +e.target.value)))"
            >
        <div class="range"
            :class="type"
            :style="rangePosition">
            <input type="range"             
                :min="range.min" 
                :max="range.max" 
                :step="range.step"
                :value="toRangeScale(value)" 
                :disabled="disabled"
                @wheel.prevent
                @input="e => $emit('input', fromRangeScale(e.target.value))" />            
        </div>
    </div>
</template>

<script>
const TYPES = ["linear", "log10", "sqrt"];
export default {
    props: {
        value: { 
            type: Number 
        },
        min: {
            type: Number, 
            default: 1 
        },
        max: { 
            type: Number,
            default: 100 
        },
        step: { 
            type: Number,
            default: 1 
        },
        horizontal: { 
            type: Boolean, 
            default: false 
        },
        disabled: { 
            default: false 
        },
        scaleType: {
            required: false,
            type: String,
            validator: n => !n || TYPES.indexOf(n) > -1
        }
    },
    data() {
        return {
            rangePosition: {
                left: 0,
                top: 0
            }
        }
    },
    computed: {
        type() {
            if(this.scaleType) return this.scaleType;
            if(this.min > 0 && (this.max - this.min) / this.step > 1000) return 'log10';
            if((this.max - this.min) / this.step > 500) return 'sqrt';
            return 'linear';            
        },
        range() {
            if(this.type !== 'linear') {
                const func = Math[this.type];
                let min = func(this.min);
                let max = func(this.max);
                let step = (max - min) / (this.max - this.min) * this.step;
                return {
                    min, max, step
                };
            } 
            return {
                    min: this.min,
                    max: this.max,
                    step: this.step
            };            
        },
        fromRangeScale(n) {
            return {
                sqrt: n => Math.round(n * n / this.step) * this.step,
                log10: n => Math.round(Math.pow(10, n) / this.step) * this.step,
                linear: n => parseFloat(n)
            }[this.type];
        },
        toRangeScale(n) {
            return {
                sqrt: Math.sqrt,
                log10: Math.log10,
                linear: n => n
            }[this.type];
        },        
    },
    mounted() {

    },
    methods: {        
        setRangePosition(e) {
            let rect = this.$refs.container.getBoundingClientRect();
            this.rangePosition = {
                left: rect.left + "px",
                top: rect.top + rect.height + "px"
            }
        }
    }
};
</script>

<style lang="scss">
@import "../styles/index.scss";

.range-input {
    position: relative;
    &.disabled {
        opacity: .6;
    }
    .range {
        display: none;
        align-items: center;
        position: fixed;
        background: $color-bg;
        padding: 3px;
        border-radius: 3px;
        height: 16px;
        width: 112px;
        box-shadow: $box-shadow_range-input;
        z-index: $z-index_range-input;
        input[type=range] {
            width: 100px;
        }
        
    }
    &:not(.disabled) {
        &:hover {
            .range { display: flex; }
        }
    }
}

.range-input:not(.horizontal) {
    &:not(.disabled) {
        &:hover {
            .range { display: block; }
        }
    }
     
    .range {
        height: 105px;
        width: 20px;
        transform: translateX(7.5px);
        input[type=range] {
            transform-origin: 0 0;
            transform: rotate(-90deg)translate(-100%,0);
        }
    }

}

</style>