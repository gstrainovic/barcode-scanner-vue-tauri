import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/authStore';
import { createRouter, createWebHistory } from 'vue-router';

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
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/pages/LoginPage.vue')
        },
    ]
});

router.beforeEach((to, _, next) => {
    const authStore = useAuthStore();
    const publicPages = ['/login'];
    const authRequired = !publicPages.includes(to.path);

    if (authRequired && !authStore.token) {
        return next('/login');
    }

    next();
});

export default router;
