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
window.__isLoggenIn__ = false;
window.__storeReady__ = false;

window.store = {};

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
