<template>
    <vue-select 
        :options="options"            
        :value="value"
        :label="vsLabel"
        :disabled="disabled"
        :reduce="reduce"
        :calculatePosition="calculatePosition"
        :clearable="false"
        :appendToBody="true"
        :searchable="false"
        @input="e => $emit('input', e)">
        <template v-slot:selected-option="option">
            <span>{{getLabel(option)}}</span>
        </template>
        <template v-slot:option="option">
            <span>{{getLabel(option)}}</span>
        </template>
    </vue-select>
</template>

<script>
import VueSelect from 'vue-select';
export default {
    components: { VueSelect },
    props: {
        options: {
            type: Array,
            default: () => []
        },
        disabled: {
            type: Boolean,
            default: false
        },
        value: {
            default: null
        },
        label: {
            type: [String, Function],
            default: null
        },
        reduce: {
            type: Function,
            default: opt => opt
        }
    },
    computed: {
        vsLabel() {
            return typeof this.label == "string" ? this.label : "k";
        }
    }, 
    methods: {
         getLabel(option) {
            if(this.label != null) {
                if(typeof this.label == "string") {
                    return option[this.label];
                } else {
                    return this.label(option);
                }
            } else return option.label;
        },
        calculatePosition(el, {$el}, {left, width}) {
            el.style.left = left;
            el.style.width = width;

            let parent = $el.getBoundingClientRect();  
            let list = el.getBoundingClientRect();
            if(parent.top + parent.height + list.height < window.innerHeight) {
                el.style.top = parent.top + parent.height + "px";
            }
            else {
                el.style.top = parent.top - list.height + "px";
            }

        },
    }
}

</script>

<style lang="scss">
@import '~vue-select/dist/vue-select.css';
@import "../assets/styles/index.scss";

$vs-dropdown-max-height: 30vh;

.vs__dropdown-option {
    font: $font-select-small;
}


.vs__dropdown-menu {
    z-index: $z-index_dropdown-list;
}

.vs__dropdown-option--highlight {
    background: $color-accent!important;
}


</style>