<script setup lang="ts">
import AppConfigurator from './AppConfigurator.vue';
import { useRouter } from 'vue-router';
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { storeToRefs } from 'pinia';
import { ref, onMounted } from 'vue';
import { config } from '@/composables/config';

const version = ref('0.0.0')
const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();
const { toggleDarkMode, isDarkTheme } = useLayout();
const { isOnline } = storeToRefs(appStore)

onMounted(() => {
    const initialize = async () => {
        const Config = await config();
        version.value = Config.version;
    };
    initialize();
});

const logout = () => {
    sessionStorage.clear();
    router.push('/login');
};


const { userName, userRole } = storeToRefs(authStore);
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
