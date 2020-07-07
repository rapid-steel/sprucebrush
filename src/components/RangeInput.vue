<template>
    <div class="range-input" :class="{horizontal}" draggable="false" 
    >
        <input type="number" 
            :min="min" 
            :max="max" 
            :step="step"
            :value="value"
            @input="e => $emit('input', Math.max(min, Math.min(max, +e.target.value)))"
            @change="e => $emit('input', Math.max(min, Math.min(max, +e.target.value)))"
            >
        <div class="range" @wheel="inc" >
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
    methods: {
        inc(e) {
        }
    }
};
</script>

<style lang="scss">
.range-input {
    position: relative;
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0; 
    }
    input[type=number] {
        -moz-appearance:textfield; /* Firefox */
    }
    .range {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        padding: 3px;
        border-radius: 3px;
        height: 20px;
        width: 105px;
        box-shadow: 0 0 5px rgba(0,0,0,.15);
        z-index: 100;
        input[type=range] {
            width: 100px;
        }
    }
    &:hover {
        .range { display: block; }
    }
}

.range-input:not(.horizontal) {
    .range {
        height: 105px;
        width: 20px;
        input[type=range] {
            transform-origin: 0 0;
            transform: rotate(-90deg)translate(-100%,0);
        }
    }

}

</style>