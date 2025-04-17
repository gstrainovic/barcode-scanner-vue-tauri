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
                    component: () => import('@/views/pages/Home.vue')
                },
                {
                    path: '/team',
                    name: 'Team',
                    component: () => import('@/views/pages/Team.vue')
                },
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/pages/Login.vue')
        },
    ]
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const publicPages = ['/login'];
    const authRequired = !publicPages.includes(to.path);

    if (authRequired && !authStore.token) {
        return next('/login');
    }

    next();
});

export default router;
