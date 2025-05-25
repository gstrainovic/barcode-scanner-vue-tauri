<script setup lang="ts">
import AppConfigurator from './AppConfigurator.vue';
import { useRouter } from 'vue-router';
import { useLayout } from '@/layout/composables/layout';
import { useHinweisVorlageStore } from '@/stores/hinweisVorlageStore';
import { useHinweisStore } from '@/stores/hinweisStore';
import { useBarcodeStore } from '@/stores/barcodeStore';
import { useAuthStore } from '@/stores/authStore';
import { useArbeitszeitStore } from '@/stores/arbeitsZeitStore';
import { useAppStore } from '@/stores/appStore';
import { storeToRefs } from 'pinia';
import { ref, onMounted } from 'vue';
import { config } from '@/utils/config';
import { listen } from '@tauri-apps/api/event';
const version = ref('0.0.0')
const router = useRouter();
const hinweisVorlageStore = useHinweisVorlageStore();
const hinweisStore = useHinweisStore();
const barcodeStore = useBarcodeStore();
const authStore = useAuthStore();
const appStore = useAppStore();
const { userName, userRole } = storeToRefs(authStore);
const { toggleDarkMode, isDarkTheme } = useLayout();
const { isOnline } = storeToRefs(appStore)

const reset = () => {
    // delete all stores from pinia
    hinweisVorlageStore.$reset();
    hinweisStore.$reset();
    barcodeStore.$reset();
    authStore.$reset();
    appStore.$reset();
    
    sessionStorage.clear();
};

const logout = async () => {
    const arbeitszeitStore = useArbeitszeitStore();
    await arbeitszeitStore.logout();
    reset();
    router.push('/login');
};

const closeapp = () => {
    const arbeitszeitStore = useArbeitszeitStore();
    arbeitszeitStore.appSchliessung();
    reset();
};


listen('closeapp', () => {
    closeapp();
});

onMounted(async () => {
    version.value = config.version;
});
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <img :src="isDarkTheme ? '/images/logo.svg' : '/images/logo-white.svg'" alt="Gravurzeile Logo" class="w-32">
        </div>

        <i class="pi pi-qrcode" style="font-size: 1.5rem"></i>
        <p class="text-xl ml-3">Barcode Scanner</p>
        <p class="text-lg ml-3">{{  version }}</p>
        <p class="text-lg ml-3"> {{ isOnline ? 'Online' : 'Offline' }}</p>
        <p class="text-xl ml-12">{{ userName }}</p>
        <p class="text-xl ml-12">{{ userRole }}</p>
        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button" class="layout-topbar-action layout-topbar-action-highlight">
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action" @click="logout">
                        <i class="pi pi-sign-out"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
