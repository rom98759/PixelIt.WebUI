import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [{
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
},
{
    path: '/options',
    name: 'Options',
    component: () => import('../views/Options.vue')
},
{
    path: '/sensorsbuttons',
    name: 'Sensors & Buttons',
    component: () => import('../views/SensorsButtons.vue')
},
{
    path: '/testarea',
    name: 'TestArea',
    component: () => import('../views/TestArea.vue')
},
{
    path: '/statistics',
    name: 'Statistics',
    component: () => import('../views/Statistics.vue')
},
{
    path: '/update',
    name: 'Update',
    component: () => import('../views/Update.vue')
},
{
    path: '/gallery',
    name: 'Gallery',
    component: () => import('../views/Gallery.vue')
},
{
    path: '/creator',
    name: 'Creator',
    component: () => import('../views/Creator.vue')
},
]

const router = new VueRouter({
    routes
})

export default router