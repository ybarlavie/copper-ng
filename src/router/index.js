import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Blank from '../views/Blank.vue'
import Login from '../views/Login.vue'

Vue.use(VueRouter)

const routes = [{
        path: '/',
        name: 'Home',
        component: Home,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/blank',
        name: 'Blank',
        component: Blank
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: {
            requiresAuth: false
        }
    },
    {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import( /* webpackChunkName: "about" */ '../views/About.vue')
    },
    {
        path: '/bcdocument',
        name: 'bcDocument',
        component: () => import( /* webpackChunkName: "bcDocument" */ '../views/bcDocument.vue'),
        props: true,
        meta: {
            requiresAuth: false
        }
    },
    {
        path: '/extdocument',
        name: 'extDocument',
        component: () => import( /* webpackChunkName: "bcDocument" */ '../views/extDocument.vue'),
        props: true,
        meta: {
            requiresAuth: false
        }
    },
    {
        path: '/location',
        name: 'Location',
        component: () => import( /* webpackChunkName: "bcDocument" */ '../views/Location.vue'),
        props: true,
        meta: {
            requiresAuth: false
        }
    },
    {
        path: '/person',
        name: 'Person',
        component: () => import( /* webpackChunkName: "bcDocument" */ '../views/Person.vue'),
        props: true,
        meta: {
            requiresAuth: false
        }
    },
    {
        path: '/resultGrid',
        name: 'resultGrid',
        component: () => import( /* webpackChunkName: "bcDocument" */ '../views/resultGrid.vue'),
        props: true,
        meta: {
            requiresAuth: false
        }
    },
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

const _isLoggedIn = () => {
    try {
        window.tokenData = JSON.parse(window.localStorage.getItem(window.JWT_COOKIE));
        return (window.tokenData && window.tokenData.expires > Math.floor(Date.now() / 1000));
    } catch {
        return false;
    }
}

router.beforeEach((to, from, next) => {
    const publicPages = ['/login', '/register'];
    const authRequired = !publicPages.includes(to.path);
    const loggedIn = _isLoggedIn();
  
    // trying to access a restricted page + not logged in
    // redirect to login page
    console.log("needs login: " + (authRequired && !loggedIn))
    if (authRequired && !loggedIn) {
        next('/login');
    } else {
        next();
    }
});

export default router