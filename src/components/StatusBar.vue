<template>
    <div id="statusBar">
        <input type="text" id="title"
            :value="title"
            @keydown.stop
            @change="e => $store.commit('setTitle', e.target.value)" 
        >
        <button class="icon-btn undo small" 
            :disabled="!historyCounter.undo"
            @click="$emit('undo')"></button>
        <button class="icon-btn redo small" 
            :disabled="!historyCounter.redo"
            @click="$emit('redo')"></button>
        <button class="icon-btn zoom-out small"
            :disabled="zoom <= zoomLevels[0]"
            @click="$emit('zoom-out')"></button>
        <div>{{zoom*100}}%</div>
        <button class="icon-btn zoom-in small"
            :disabled="zoom >= zoomLevels[zoomLevels.length-1]"
            @click="$emit('zoom-in')"></button>
        <button class="icon-btn small"
            :class="viewMode == 'normal' ? 'to-full-view' : 'to-normal-view'" 
            @click="() => $emit('switch-view-mode')"></button>
    </div>
</template>

<script>
import {mapState} from "vuex";

export default {
  name: 'saveSettings',
  computed: {
      ...mapState(['zoomLevels', 'zoom', 'viewMode', 'historyCounter', 'title']),
  }
}
</script>

<style scoped lang="scss">
@import "../styles/index.scss";


#statusBar {
    font: $font-status-bar;
    padding: 1px;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-right: 10px;
    button {
        background-size: 100% 100%;
        margin: 5px 10px;
    }
    position: relative;
}


#title {
    border: 1px solid transparent;
    font: $font-title;
    box-sizing: border-box;
    &:focus {

        border: $input-border;
    }
}


</style>
