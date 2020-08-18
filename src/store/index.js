import Vue from 'vue'
import Vuex from 'vuex'
import assets from "./assets.js";
import predefinedLists from "./predefined-lists";
import toolSettings from "./tool-settings.js"
import settingRanges from "./setting-ranges.js"

console.log(assets)

Vue.use(Vuex);


export default new Vuex.Store({
    state: {
        settings: settingRanges,
        zoomLevels: [.25, .5, .75, 1, 1.25, 1.5, 2],
        activeSelection: false,
        currentTool: "brush",
        currentColor: "rgb(0,0,0)",
        colorBG: "rgb(255,255,255)",
        currentLayer: 0,
        viewMode: 'normal',
        zoom: 1,
        historyCounter: {undo: 0, redo: 0},
        title: "Васина мазня",
        textures: {
            brush: assets.textures_brush,
            marker: assets.textures_roller
        },
        patterns: assets.patterns,
        shapes: [
            {k: "round"}, {k: "rect"}
        ],
        gradients: predefinedLists.gradients,
        currentToolSettings: toolSettings,
        userPref: {
            historySize: 10,
            palletes: predefinedLists.palletes
        }
    },
    getters: {
        currentSettings(state) {
            return state.currentToolSettings[state.currentTool];
        }
    },
    mutations: {
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

        createGradient(state, gradient) {
            state.gradients.push(gradient);
        },
        editGradient(state, {index, gradient}) {
            state.gradients[index] = gradient;
            state.gradients = state.gradients.slice();
        },
        deleteGradient(state, i) {
            state.gradients.splice(i, 1);
        },
        addPallete(state, name) {
            let e = state.userPref.palletes.filter(p => 
                p.name.replace(/[0-9]/ig, "").trim().toLowerCase() == name.toLowerCase()
            ).length;
            if(e > 0) name += " " + (e + 1);

            state.userPref.palletes.push({
                name, id: Date.now(),
                colors: []
            });
        },
        renamePallete(state, [id, name]) {
            state.userPref.palletes.find(p => p.id == id).name = name;
            state.userPref.palletes = state.userPref.palletes.slice();
        },
        deletePallete(state, id) {
            state.userPref.palletes.splice(
                state.userPref.palletes.findIndex(p => p.id == id), 1);
        },
        addColorToPallete(state, [id, color]) {
            let pallete = state.userPref.palletes.find(p => p.id == id);
            if(pallete.colors.indexOf(color) == -1) {
                pallete.colors.push(color);
                state.userPref.palletes = state.userPref.palletes.slice();
            }
        },
        deleteColorFromPallete(state, [id, color]) {
            let pallete = state.userPref.palletes.find(p => p.id == id);
            pallete.colors.splice(pallete.colors.indexOf(color), 1);
            state.userPref.palletes = state.userPref.palletes.slice();
        },
        addAsset(state, [{type, textype = 0}, obj]) {
            let arr = state[type + "s"];
            if(arr) {
                if(textype) 
                arr = arr[textype];
                arr.push(obj);
            }
        },
        deleteAsset(state, [{type, textype = 0}, k]) {
            let arr = state[type + "s"];
            if(arr) {
                if(textype) 
                arr = arr[textype];
                arr.splice(arr.findIndex(t => t.k == k), 1);
            }
        },
    },
    actions: {

    }
});
