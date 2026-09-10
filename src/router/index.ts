import HomeView from '@/views/HomeView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
    { path: '/genres', name: 'genres', component: () => import('@/views/GenresView.vue') },
    { path: '/genres/:slug', name: 'genre', component: () => import('@/views/GenreView.vue') },
    { path: '/shows/:id', name: 'show', component: () => import('@/views/ShowView.vue') },
    { path: '/list', name: 'list', component: () => import('@/views/ListView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', redirect: { name: 'home' } }
  ]
})

export default router
