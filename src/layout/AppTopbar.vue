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
import { useTeamStore } from '@/stores/teamStore';
import { storeToRefs } from 'pinia';
import { ref, onMounted } from 'vue';
import { config } from '@/utils/config';
import { listen } from '@tauri-apps/api/event';
const version = ref('0.0.0')
const router = useRouter();
const teamStore = useTeamStore();
const hinweisVorlageStore = useHinweisVorlageStore();
const hinweisStore = useHinweisStore();
const barcodeStore = useBarcodeStore();
const authStore = useAuthStore();
const appStore = useAppStore();
const arbeitszeitStore = useArbeitszeitStore();
const { userName, userRole } = storeToRefs(authStore);
const { toggleDarkMode, isDarkTheme } = useLayout();
const { isOnline } = storeToRefs(appStore)

const reset = () => {
    // delete all stores from pinia
    appStore.$reset();
    arbeitszeitStore.$reset();
    authStore.$reset();
    barcodeStore.$reset();
    hinweisStore.$reset();
    hinweisVorlageStore.$reset();
    // historyStore don't need to be reset, as it is used for logging and should persist
    // localStore don't need to be reset, as it is used for long-term storage
    teamStore.$reset();

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

<style scoped>
img.logo {
    width: 100%;
    height: auto;
    max-width: 120px;
    /* oder gewünschte Maximalbreite */
    display: block;
}
</style>

<template>
    <div class="layout-topbar">
        <div class="">
            <img :src="isDarkTheme ? '/images/logo.svg' : '/images/logo-white.svg'" alt="Gravurzeile Logo"
                class="logo mr-8" />
        </div>

        <div class="flex items-center justify-between w-full px-4">
            <!-- Links: Logo -->
            <div class="flex items-center">
            </div>
            <!-- Mitte: Zentrierte Elemente -->
            <div class="flex items-center gap-8">
                <!-- <i class="pi pi-qrcode" style="font-size: 1.5rem"></i> -->
                <p class="text-xl">Barcode Scanner {{ version }}</p>
                <p class="text-xl"> {{ isOnline ? 'Online' : 'Offline' }}</p>
                <p class="text-xl">{{ userName }}</p>
                <p class="text-xl">{{ userRole }}</p>
            </div>
            <!-- Rechts: Weitere Elemente -->
            <div class="flex items-center gap-4">
            </div>
        </div>

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
