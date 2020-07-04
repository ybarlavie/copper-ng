import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './quasar'

Vue.config.productionTip = false

window.apiURL = window.location.origin + window.location.pathname;
if (!window.apiURL.endsWith('/')) window.apiURL += '/';
window.apiURL += 'api/';

window.JWT_COOKIE = "copper-ng-jwt";
window.tokenData = {};

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
