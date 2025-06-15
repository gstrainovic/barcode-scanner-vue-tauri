import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/authStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '/',
          name: 'Home',
          component: () => import('@/views/pages/HomePage.vue')
        },
        {
          path: '/team',
          name: 'Team',
          component: () => import('@/views/pages/TeamPage.vue')
        },
        {
          path: '/anleitung',
          name: 'Anleitung',
          component: () => import('@/views/pages/AnleitungPage.vue')
        },
        {
          path: '/login',
          name: 'login',
          component: () => import('@/views/pages/LoginPage.vue')
        }
      ]
    }
  ]
});

router.beforeEach((to, _, next) => {
  const authStore = useAuthStore();
  const publicPages = ['/login', '/anleitung'];
  const authRequired = !publicPages.includes(to.path);

  if (authRequired && !authStore.token) {
    return next('/login');
  }

  next();
});

export default router;
