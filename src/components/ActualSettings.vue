<template>
    <div class="actual-settings">
        <div class="setting-value"
            v-for="s in actualSettings" 
            :key="s[0]">
            <img class="icon" 
                :src="require('../assets/img/' + s[1].icon)" 
                :title="$t('tools.settings.' + s[0])">
            <RangeInput :min="s[1].min" :max="s[1].max" :step="s[1].step" :horizontal="true"
            v-model="currentSettings.values[s[0]]"
            @input="v => setValue({[s[0]]: v})" />
        </div>
    </div>
</template>
<script>
import { mapState, mapGetters } from 'vuex';
export default {
    computed: {
        ...mapState(['settings', 'currentTool']),
        ...mapGetters(['currentSettings']),
        actualSettings() {
            return Object.entries(this.settings.values)
            .filter(([k,v]) => !v.special && this.currentSettings.values[k] != undefined);
        },
    },
    methods: {
        setValue(values) {
            this.$store.commit("changeSettings", {
                instrument: this.currentTool,
                updates: {values}
            });
        }
    }
}

</script>

<style lang="scss">
@import "../assets/styles/colors";



</style>