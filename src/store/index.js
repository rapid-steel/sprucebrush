import Vue from 'vue'
import Vuex from 'vuex'
import assets from "./assets.js";
import predefinedLists from "./predefined-lists";
import toolSettings from "./tool-settings.js";
import settingRanges from "./setting-ranges.js";

Vue.use(Vuex);


function generateId() {
    return Date.now();
}


export default new Vuex.Store({
    state: {
        settings: settingRanges,
        zoomLevels: [.25, .5, .75, 1, 1.25, 1.5, 2],
        activeSelection: false,
        currentTool: "brush",
        currentColor: "rgb(255,0,0)",
        colorBG: "rgb(255,255,255)",
        currentLayer: 0,
        viewMode: 'normal',
        zoom: 1,
        historyCounter: {undo: 0, redo: 0},
        title: "Васина мазня",
        textures: {
            brush: [],
            roller: []
        },
        patterns: [],
        shapes: [
            {k: "round"}, {k: "rect"}
        ],
        gradients: [],
        palettes: [],
        currentToolSettings: toolSettings,
        historySize: 10,
        sizes: {width: 800, height: 600, px_ratio: 1}
    },
    getters: {
        currentSettings(state) {
            return state.currentToolSettings[state.currentTool];
        }
    },
    mutations: {
        setSize(state, sizes) {
            state.sizes = Object.assign(state.sizes, sizes);
        },
        setZoom(state, zoom) {
            state.zoom = zoom;
        },
        setViewMode(state, viewMode) {
            state.viewMode = viewMode;
        },
        setHistoryCounter(state, counters) {
            Object.assign(state.historyCounter, counters);
        },
        setTitle(state, title) {
            state.title = title;
        },
        setActiveSelection(state) {
            state.activeSelection = true;
        },
        dropSelection(state) {
            state.activeSelection = false;
        },
        selectTool(state, inst) {
            state.currentTool = inst;
        },
        selectColor(state, [colorType, color]) {
            if(colorType == "fg") state.currentColor = color;
            else if(colorType == "bg") state.colorBG = color;
        },
        changeSettings(state, {tool, updates}) {
            ['values', 'dynamics', 'texture', 'gradient', 'pattern'].forEach(k => {
                if(updates[k] !== undefined) {           
                    if( typeof updates[k] == "object")     
                        state.currentToolSettings[tool][k] =    
                            Object.assign({}, state.currentToolSettings[tool][k]||{}, updates[k]); 
                    else state.currentToolSettings[tool][k] = updates[k];
                }
            });            
            
        },

        gradient_add(state, gradient) {
            state.gradients.push(gradient);
        },
        gradient_edit(state, {index, gradient}) {
            state.gradients[index] = gradient;
            state.gradients = state.gradients.slice();
        },
        gradient_delete(state, i) {
            state.gradients.splice(i, 1);
        },
        load(state, data) {
            Object.assign(state, data);
        },
        palette_add(state, name) {
            let e = state.palettes.filter(p => 
                p.name.replace(/[0-9]/ig, "").trim().toLowerCase() == name.toLowerCase()
            ).length;
            if(e > 0) name += " " + (e + 1);

            state.palettes.push({
                name, id: generateId(),
                colors: []
            });
        },
        palette_import(state, palettes) {
            palettes = palettes.filter(p => p.name && Array.isArray(p.colors))
            .map(p => ({ ...p, id: generateId()}));
            state.palettes = palettes.concat(state.palettes);
        },
        palette_rename(state, [id, name]) {
            state.palettes.find(p => p.id == id).name = name;
            state.palettes = state.palettes.slice();
        },
        palette_delete(state, id) {
            state.palettes.splice(
                state.palettes.findIndex(p => p.id == id), 1);
        },
        palette_addColor(state, [id, color]) {
            let palette = state.palettes.find(p => p.id == id);
            if(palette.colors.indexOf(color) == -1) {
                palette.colors.push(color);
                state.palettes = state.palettes.slice();
            }
        },
        palette_reorderColors(state, [id, {oldIndex, newIndex}]) {            
            let palette = state.palettes.find(p => p.id == id);
            palette.colors = palette.colors.slice();
        },
        palette_deleteColor(state, [id, color]) {
            let palette = state.palettes.find(p => p.id == id);
            palette.colors.splice(palette.colors.indexOf(color), 1);
            state.palettes = state.palettes.slice();
        },
        asset_add(state, [{type, textype = 0}, obj]) {
            let arr = state[type + "s"];
            if(arr) {
                if(textype) 
                    arr = arr[textype];
                obj.k = "u_" + (1 + arr.filter(a => a.k.indexOf("u") == 0).length);
                arr.push(obj);
            }
        },
        asset_delete(state, [{type, textype = 0}, k]) {
            let arr = state[type + "s"];
            if(arr) {
                if(textype) 
                arr = arr[textype];
                arr.splice(arr.findIndex(t => t.k == k), 1);
            }
        },
    },
    actions: {
        load({ commit, state }) {
            let data = getLocalStorageData();
            data = null;
            if(data) {
                commit("load", data);
            } else {
                commit("load", {
                    ...predefinedLists,
                    textures: {
                        brush: assets.textures_brush,
                        roller: assets.textures_roller
                    },
                    patterns: assets.patterns,
                    sizes: {width: 800, height: 600, px_ratio: 1}
                });
                setLocalStorageData(state);
            }
        },
        changePalette({ commit, state }, {action, data}) {
            commit("palette_" + action, data);
            setLocalStorageData(state);
        },
        changeGradient({commit, state}, {action, data}) {
            commit("gradient_" + action, data);
            setLocalStorageData(state);
        },
        asset({ commit, state }, {action, data}) {
            commit("asset_" + action, data);
            setLocalStorageData(state);
        },
        setSize({commit, state}, sizes) {
            commit("setSize", sizes);
            setLocalStorageData(state);
        }
        
    }
});

function getLocalStorageData() {
    let data = localStorage.getItem("spruceBrushData");
    if(!data) return null;
    data = JSON.parse(data);
    return data;
}

function setLocalStorageData({palettes, gradients, textures, patterns, sizes}) {
    localStorage.setItem("spruceBrushData", JSON.stringify({
        palettes, gradients, textures, patterns, sizes
    }));
}
