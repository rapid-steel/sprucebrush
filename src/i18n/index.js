import Vue from "vue"
import VueI18n from 'vue-i18n'

Vue.use(VueI18n);
export default new VueI18n({
    locale: 'en',
    messages: {
        en: {
            title: "Vasya's cheap photoshop"
        },
        ru: {
            title: "Китайский васин фотошоп"
        }
    }
});