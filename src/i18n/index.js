import Vue from "vue"
import VueI18n from 'vue-i18n'
import en from "./en";
import ru from "./ru";

Vue.use(VueI18n);
export default new VueI18n({
    locale: 'en',
    messages: { en, ru }
});