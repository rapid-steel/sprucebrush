import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    currentInstrument: "brush",
    currentColor: "black",
    currentLayer: 0,
    currentInstrumentSettings: {
      picker: {

      },
      brush: {
        radius: 5,
        opacity: 1,
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
          opacity: 0
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
    }

  },
  actions: {

  }
})
