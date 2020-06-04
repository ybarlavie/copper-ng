import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './quasar'

Vue.config.productionTip = false

window.apiURL = window.location.origin + window.location.pathname;
if (!window.apiURL.endsWith('/')) window.apiURL += '/';
window.apiURL += 'api/';

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
