import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './quasar'

Vue.config.productionTip = false

var pn = window.location.pathname;
if (pn.indexOf('/copper/') >= 0) {
  pn = '/copper/';
} else {
  pn = '/';
}
window.apiURL = window.location.origin + pn;
if (!window.apiURL.endsWith('/')) window.apiURL += '/';
window.apiURL += 'api/';

console.log(window.apiURL);

window.JWT_COOKIE = "copper-ng-jwt";
window.tokenData = {};
window.__isLoggenIn__ = false;
window.__storeReady__ = false;

window.store = {};

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
