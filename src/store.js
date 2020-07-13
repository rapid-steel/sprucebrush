import Vue from 'vue'
import Vuex from 'vuex'
import { resolve } from 'core-js/fn/promise';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    currentInstrument: "brush",
    currentColor: "black",
    currentLayer: 0,
    types: {
      brush: {
        plain: {
          radius: true, 
          opacity: true, 
          blur: true, 
          pressure: true,
          spacing: true
        },
        watercolor: {radius: true, texture: require("@/assets/img/texture-watercolor.jpg")}
      }
    },
    currentInstrumentSettings: {
      picker: {

      },
      brush: {
        hardness: 1,
        radius: 50,
        opacity: 1,
        spacing: .05,        
       // type: "plain",
        pressure: {
          radius: 1,
          opacity: 0
        },  
      },
      eraser: {
        radius: 5,
        opacity: 1,
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
    selectColor(state, color) {
      state.currentColor = color;
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
