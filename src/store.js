import Vue from 'vue'
import Vuex from 'vuex'
import { resolve } from 'core-js/fn/promise';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    currentInstrument: "brush",
    currentColor: "rgb(0,0,0)",
    colorBG: "rgb(255,255,255)",
    currentLayer: 0,
    textures: [
      {k: "tex1", src: require("./assets/img/texture1.png") }
    ],
    shapes: [
      {k: "round"}, {k: "rect"}
    ],
    gradients: [
      ["rgb(255,0,0)", "rgb(255,255,0)", "rgb(0,255,0)", "rgb(0,255,255)", "rgb(0,0,255)", "rgb(255,0,255)"],
      ["#3F51B5", "#4caf50", "#ffeb3b"], 
      ["#673ab7", "#ff9800"]
    ],
    currentInstrumentSettings: {
      picker: {

      },
      brush: {
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
      },
      eraser: {
        radius: 5,
        opacity: 1,
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
        tolerance: 30
      },
      "selection-rect": {},
      "selection-polygon": {},
      "selection-lasso": {}
    },
    userPref: {
      historySize: 10,
      palletes: [{
        name: "New pallete",
        colors: []
      }]
    }

  },
  getters: {
    currentSettings(state) {
      const settings = state.currentInstrumentSettings[state.currentInstrument];
      if(settings.type) {
        const settings0 = state.types[state.currentInstrument][settings.type];
        const settings1 = {type: settings.type};
        for(let k in settings0) {
          settings1[k] = settings[k];
          if(settings1[k] == undefined) settings1[k] = settings0[k];
        }         
        return settings1;
      }
      return settings;
    }
  },
  mutations: {
    selectInstrument(state, inst) {
      state.currentInstrument = inst;
    },
    selectColor(state, [colorType, color]) {
      if(colorType == "fg") state.currentColor = color;
      else if(colorType == "bg") state.colorBG = color;
    },
    changeSettings(state, {instrument, prop, val}) {
      state.currentInstrumentSettings[instrument][prop] = val;
    },
    setPosition(state, {el, x, y}) {
      state.userPref[el].x = x;
      state.userPref[el].y = y;
    },


  },
  actions: {
    load({state}, {type, item}) {
      return new Promise((resolve) => {
        const image = new Image();
        if(type == "brush") {
          image.onload = () => {
            console.log(image)
            state.types.brush[item].image = image;
            state.types.brush[item].loaded = true;
            resolve();
          }
          image.src = "@/assets/img/" + state.types.brush[item].texture;         
        }
      });
    }

  }
})
