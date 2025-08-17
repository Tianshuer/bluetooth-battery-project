import Vue from 'vue'
import App from './App'
import store from './store/index.js'
import networkMgr from './utils/networkMgr.js';

Vue.config.productionTip = false

Vue.prototype.$networkMgr = networkMgr

App.mpType = 'app'

const app = new Vue({
  store,
  ...App
})
app.$mount()
