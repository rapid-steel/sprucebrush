<template>
    <div class="actual-settings" v-if="currentSettings.values">
        <div class="setting-value"
            v-for="s in actualSettings" 
            :key="s[0]">
            <img class="icon" 
                v-if="s[1].icon"
                :src="s[1].icon" 
                :title="$t('tools.settings.' + s[0])">
            <div class="caption"
                v-if="!s[1].icon"
                >{{$t('tools.settings.' + s[0])}}</div>
              <button class="icon-btn small reset"
                v-if="s[1].resetTo !== undefined"
                :style="{
                    visibility : currentSettings.values[s[0]] !== s[1].resetTo ? 'visible' : 'hidden' 
                }"
                :title="$t('common.reset')"
                @click="() => setValue({[s[0]]: s[1].resetTo})"></button>
            <RangeInput 
                :min="s[1].min" 
                :max="s[1].max" 
                :step="s[1].step" 
                :horizontal="true"
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