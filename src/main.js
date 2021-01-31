import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './quasar'
import axios from 'axios'

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

axios.get(window.apiURL + 'db/store_data')
.then(response => { 
    window.store = response.data; 
    window.__storeReady__ = true;

    new Vue({
        router,
        render: h => h(App)
    }).$mount('#app')
})
.catch(e => {
    window.__storeReady__ = false;
});

// new Vue({
//     router,
//     render: h => h(App)
// }).$mount('#app')