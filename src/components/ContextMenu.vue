<template>
<div class="context-menu" 
    :style="menuPosition"
    @pointerdown.stop
    @pointerup.stop >
    <template v-if="currentTool == 'brush'">
        <div>
            <div v-for="s in actualSettings" :key="s.k">
                <div class="caption">{{$t('tools.settings.' + s.k)}}:</div>
                <RangeInput :min="s.min" :max="s.max" :step="s.step" :horizontal="true"
                v-model="currentSettings[s.k]"
                @input="v => set({[s.k]: v})" />
            </div>

        </div>
    </template>

    <template v-if="activeSelection">

    </template>

</div>
</template>

<script>
import {mapState, mapGetters} from 'vuex';
export default {
    props: ['position'],
    data() {
        return {
            settings: [
                {k: "radius", min: 1, max: 1000, step: 1},
                {k: "lineWidth", min: 1, max: 1000, step: 1},
                {k: "curveSmoothing", min: 1, max: 25, step: 1},
                {k: "angleSmoothing", min: 1, max: 25, step: 1},
                {k: "opacity",  min: .01, max: 1, step: .01},
                {k: "spacing",  min: 0.001, max: 10, step: .001},
                {k: "tolerance", min: 1, max: 255, step: 1}
            ],
        };
    },
    computed: {
        
        actualSettings() {
            return this.settings.filter(s => this.currentSettings[s.k] != undefined);
        },
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

<style lang="scss" scoped>
@import "../assets/styles/colors";

.context-menu {
    background-color: $color-bg;
    position: fixed;
    z-index: $z-index-context-menu;
}

</style>