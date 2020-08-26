import Vue from 'vue';
import App from './App.vue';
import store from './store/index';
import i18n from "./i18n";

import ColorPicker from './components/ColorPicker';
import RangeInput from "./components/RangeInput";
import vSelect from "./components/VSelect";
import Draggable from "vuedraggable";

Vue.config.productionTip = false;

if(process.env.NODE_ENV === 'production')
  if(navigator.languages[0].indexOf("ru") == 0)
    i18n.locale = "ru";

Vue.filter('gradientBG', function(gradient, gradientType="linear", dir="to right") {
  if(gradientType == 'radial') 
    return {
        background: `radial-gradient(${gradient.join(", ")})`
    };
  return {
      background: `linear-gradient(${dir}, ${gradient.join(", ")})`
  }
});

Vue.component('v-select', vSelect);
Vue.component("RangeInput", RangeInput);
Vue.component("color-picker", ColorPicker);
Vue.component("draggable", Draggable);



  

new Vue({
  store, i18n,
  render: h => h(App)
}).$mount('#app');
