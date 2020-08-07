import Vue from 'vue'
import Vuex from 'vuex'
import { resolve } from 'core-js/fn/promise';
import assets from "./assets.js";

console.log(assets)


Vue.use(Vuex);


export default new Vuex.Store({
    state: {
        zoomLevels: [.25, .5, .75, 1, 1.25, 1.5, 2],
        currentTool: "brush",
        currentColor: "rgb(0,0,0)",
        colorBG: "rgb(255,255,255)",
        currentLayer: 0,
        textures: {
            brush: assets.textures_brush,
            marker: assets.textures_roller
        },
        patterns: assets.patterns,
        shapes: [
            {k: "round"}, {k: "rect"}
        ],
        gradients: [
            ["rgb(255,0,0)", "rgb(255,255,0)", "rgb(0,255,0)", "rgb(0,255,255)", "rgb(0,0,255)", "rgb(255,0,255)"],
            ["#3F51B5", "#4caf50", "#ffeb3b"], 
            ["#673ab7", "#ff9800"]
        ],
        currentToolSettings: {
            picker: { 
                
            },
            brush: {
                textype: "brush",
                hardness: 1,
                radius: 50,
                opacity: 1,
                spacing: .05,  
                shape: "round",
                pixel: false,      
                texture: false,
                linearGradient: false,
                linearGradientLength: 100,
                radialGradient: false,
                pressure: {
                    radius: 1,
                    opacity: 0
                },  
                overlay: false,
            },
            eraser: {
                textype: "brush",
                radius: 5,
                opacity: 1,
                spacing: .05,  
                shape: "round",
                pixel: false,      
                texture: false,
                pressure: {
                    radius: 1,
                    opacity: 0,
                    blur: 0
                },  
            },
            fill: {
                tolerance: 30,
                pattern: false,
                patternScale: 1
            },
            marker: {
                textype: "marker",
                lineWidth: 20,
                blurRadius: 5,
                angleSmoothing: 10,
                curveSmoothing: 3,
                opacity: 1,
                texture: false,
                textureColor: false,
                linearGradient: false,
                linearGradientLength: 1,
                radialGradient: false,
                overlay: false,
                pressure: {
                radius: 1,
                opacity: 0
                },  
            },
            pen: {
                
            },
            selection_rect: {},
            selection_polygon: {},
            selection_lasso: {}
        },
        userPref: {
            historySize: 10,
            palletes: [{
                name: "Bright pallete", id: 1,
                colors: [
                "rgb(26,19,52)",   "rgb(38,41,74)",   "rgb(1,84,90)",
                "rgb(1,115,81)",   "rgb(3,195,131)",   "rgb(170,217,98)",
                "rgb(251,191,69)",   "rgb(239,106,50)",   "rgb(237,3,69)",
                "rgb(161,42,94)",   "rgb(113,1,98)",   "rgb(17,1,65)"
                ]
            }, {
                name: "Board", id: 2,
                colors: [
                "rgb(203,203,77)",    "rgb(171,203,77)",    "rgb(140,203,77)",
                "rgb(108,203,77)",    "rgb(77,203,77)",    "rgb(77,203,108)",
                "rgb(77,203,140)",    "rgb(77,203,171)",    "rgb(77,203,203)",
                "rgb(77,171,203)",    "rgb(77,140,203)",    "rgb(77,108,203)",
                "rgb(77,77,203)",    "rgb(108,77,203)",    "rgb(140,77,203)",
                "rgb(172,77,203)",    "rgb(203,77,203)",    "rgb(203,77,171)",
                "rgb(203,77,140)",    "rgb(203,77,108)",    "rgb(203,77,77)",
                "rgb(210,241,244)",    "rgb(195,254,183)",    "rgb(216,250,188)",
                "rgb(160,186,160)",    "rgb(235,241,100)",    "rgb(224,233,21)",
                "rgb(200,126,17)",    "rgb(211,13,13)",    "rgb(43,55,66)"
                ]
            }]
        }
    },
    getters: {
        currentSettings(state) {
            return state.currentToolSettings[state.currentTool];
        }
    },
    mutations: {
        selectInstrument(state, inst) {
            state.currentTool = inst;
        },
        selectColor(state, [colorType, color]) {
            if(colorType == "fg") state.currentColor = color;
            else if(colorType == "bg") state.colorBG = color;
        },
        changeSettings(state, {instrument, settings}) {
            Object.assign(state.currentToolSettings[instrument], settings);
        },
        setPosition(state, {el, x, y}) {
            state.userPref[el].x = x;
            state.userPref[el].y = y;
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
        load({state}, {type, item}) {
        return new Promise((resolve) => {
            const image = new Image();
            if(type == "brush") {
            image.onload = () => {
                state.types.brush[item].image = image;
                state.types.brush[item].loaded = true;
                resolve();
            }
            image.src = "@/assets/img/" + state.types.brush[item].texture;         
            }
        });
        }
    }
});
