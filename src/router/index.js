import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

  const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/bcdocument',
    name: 'bcDocument',
    component: () => import( /* webpackChunkName: "bcDocument" */ '../views/bcDocument.vue'),
    props: true,
  },
  {
    path: '/extdocument',
    name: 'extDocument',
    component: () => import( /* webpackChunkName: "bcDocument" */ '../views/extDocument.vue'),
    props: true,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
