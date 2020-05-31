import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import bcDocument from '../views/bcDocument.vue';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
    },
    {
        path: '/bcdocument',
        name: 'bcDocument',
        // route level code-splitting
        // this generates a separate chunk (document.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: bcDocument,
        props: true,
    },
    {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component() {
            return import( /* webpackChunkName: "about" */ '../views/About.vue');
        },
    },
];

const router = new VueRouter({
    routes,
});

export default router;