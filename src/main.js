import Vue from 'vue';
import App from './App.vue';
import store from './store';
import vSelect from 'vue-select';
import ColorPicker from 'vue-color-picker-wheel';
import RangeInput from "./components/RangeInput";

Vue.config.productionTip = false;

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

new Vue({
  store,
  render: h => h(App)
}).$mount('#app');
