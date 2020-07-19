<template>
    <div class="range-input" 
    :class="{horizontal}"
    ref="container"
    @mouseenter="setRangePosition"
    >
        <input type="number" 
            :min="min" 
            :max="max" 
            :step="step"
            :value="value"
            @input="e => $emit('input', Math.max(min, Math.min(max, +e.target.value)))"
            @change="e => $emit('input', Math.max(min, Math.min(max, +e.target.value)))"
            >
        <div class="range"
            :style="rangePosition"
        >
            <input type="range" 
            :min="min" 
            :max="max" 
            :step="step"
            :value="value" 
            @input="e => $emit('input', +e.target.value)" />            
        </div>
    </div>
</template>

<script>
export default {
    props: {
        value: { type: Number },
        min: { default: 1 },
        max: { default: 100 },
        step: { default: 1 },
        horizontal: { type: Boolean, default: false }
    },
    data() {
        return {
            rangePosition: {
                left: 0,
                top: 0
            }
        }
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
@import "../assets/styles/colors.scss";

.range-input {
    position: relative;
    .range {
        display: none;
        align-items: center;
        position: fixed;
        background: white;
        padding: 3px;
        border-radius: 3px;
        height: 16px;
        width: 112px;
        box-shadow: 0 0 5px rgba(0,0,0,.15);
        z-index: 100;
        input[type=range] {
            width: 100px;
        }
        
    }
    &:hover {
        .range { display: flex; }
    }
}

.range-input:not(.horizontal) {
     &:hover {
        .range { display: block; }
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