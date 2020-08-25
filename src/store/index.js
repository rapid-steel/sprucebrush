import Vue from 'vue'
import Vuex from 'vuex'
import assets from "./assets.js";
import predefinedLists from "./predefined-lists";
import toolSettings from "./tool-settings.js";
import settingRanges from "./setting-ranges.js";

Vue.use(Vuex);





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
            marker: []
        },
        patterns: [],
        shapes: [
            {k: "round"}, {k: "rect"}
        ],
        gradients: [],
        palletes: [],
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
        pallete_add(state, name) {
            let e = state.palletes.filter(p => 
                p.name.replace(/[0-9]/ig, "").trim().toLowerCase() == name.toLowerCase()
            ).length;
            if(e > 0) name += " " + (e + 1);

            state.palletes.push({
                name, id: Date.now(),
                colors: []
            });
        },
        pallete_rename(state, [id, name]) {
            state.palletes.find(p => p.id == id).name = name;
            state.palletes = state.palletes.slice();
        },
        pallete_delete(state, id) {
            state.palletes.splice(
                state.palletes.findIndex(p => p.id == id), 1);
        },
        pallete_addColor(state, [id, color]) {
            let pallete = state.palletes.find(p => p.id == id);
            if(pallete.colors.indexOf(color) == -1) {
                pallete.colors.push(color);
                state.palletes = state.palletes.slice();
            }
        },
        pallete_deleteColor(state, [id, color]) {
            let pallete = state.palletes.find(p => p.id == id);
            pallete.colors.splice(pallete.colors.indexOf(color), 1);
            state.palletes = state.palletes.slice();
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
           // data = null;
            if(data) {
                commit("load", data);
            } else {
                commit("load", {
                    ...predefinedLists,
                    textures: {
                        brush: assets.textures_brush,
                        marker: assets.textures_roller
                    },
                    patterns: assets.patterns,
                    sizes: {width: 800, height: 600, px_ratio: 1}
                });
                setLocalStorageData(state);
            }
        },
        changePallete({ commit, state }, {action, data}) {
            commit("pallete_" + action, data);
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

function setLocalStorageData({palletes, gradients, textures, patterns, sizes}) {
    localStorage.setItem("spruceBrushData", JSON.stringify({
        palletes, gradients, textures, patterns, sizes
    }));
}
