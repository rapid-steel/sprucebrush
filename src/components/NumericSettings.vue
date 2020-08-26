<template>
    <div class="actual-settings" v-if="settings.values">
        <div class="setting-value"
            v-for="s in settingsList" 
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
                    visibility : valuesMap[s[0]] !== s[1].resetTo ? 'visible' : 'hidden' 
                }"
                :title="$t('common.reset')"
                @click="() => setValue({[s[0]]: s[1].resetTo})"></button>
            <RangeInput 
                :min="s[1].min" 
                :max="s[1].max" 
                :step="s[1].step" 
                :horizontal="true"
                v-model="valuesMap[s[0]]"
                @input="v => setValue({[s[0]]: v})" />
           
        </div>
    </div>
</template>
<script>
import { mapState, mapGetters } from 'vuex';
export default {
    name: "NumericSettings",
    props: {
        tool: {
            type: String
        },
        type: {
            type: String
        },
        keys: {
            type: Array
        }
    },
    computed: {
        ...mapState(['settings', 'currentToolSettings']),
        valuesMap() {
            return Object.fromEntries(this.keys.map(k =>  [
                k, this.currentToolSettings[this.tool][this.type][k]
            ]));
        },
        settingsList() {
            return this.keys.map(k =>  [
                k, this.settings[this.type][k]
            ]);
        },
    },
    methods: {
        setValue(updates) {
            this.$store.commit("changeSettings", {
                tool: this.tool,
                updates: {
                    [this.type]: Object.assign(
                        this.currentToolSettings[this.tool][this.type], 
                        updates
                    )
                }
            });
        }
    }
}

</script>

<style lang="scss">
@import "../assets/styles/colors";



</style>