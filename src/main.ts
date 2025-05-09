import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { invoke } from '@tauri-apps/api/core';
import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import { useLayout } from '@/layout/composables/layout';

invoke('start_looper')
invoke('update')

const { layoutConfig } = useLayout();

if (layoutConfig.darkTheme) {
    document.documentElement.classList.add('app-dark');
}

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate);
const app = createApp(App);

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
app.use(pinia)

app.mount('#app');