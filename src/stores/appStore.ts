import { defineStore, storeToRefs } from 'pinia';
import { useAuthStore } from './authStore';
import { useTeamStore } from './teamStore';
import { useLocalStore } from './localStore';
import { getConfig } from '@/utils/config';

export const useAppStore = defineStore('app', {
  state: () => ({
    isOnline: true as boolean,
    teamAndUserIds: [] as number[]
  }),
  actions: {
    async onlineCheck() {
      const config = await getConfig();
      const url = config.api.strapi.replace('/api', '');
      try {
        const response = await fetch(url, { method: 'GET' });
        const text = await response.text();
        if (response.status === 200 && text.includes('The server is running successfully')) {
          this.isOnline = true;
          // is user authenticated?
          const authStore = useAuthStore();
          const { token } = storeToRefs(authStore);
          if (token.value) {
            const localStore = useLocalStore();
            await localStore.localStorage2strapi();
            await localStore.strapi2localStorage();
          }
          return true;
        }
        this.isOnline = false;
        return false;
      } catch (_) {
        this.isOnline = false;
        return false;
      }
    },
    // async sync() {
    //   const localStore = useLocalStore();
    //   if (this.isOnline) {
    //     await localStore.localStorage2strapi();
    //     await localStore.strapi2localStorage();
    //   }
    // },
    async setTeamAndUserIds() {
      const authStore = useAuthStore();
      const { userId } = storeToRefs(authStore);
      const teamStore = useTeamStore();
      const { teamIds } = storeToRefs(teamStore);
      const userIdNumber = userId.value;
      if (!userIdNumber) {
        console.error('User ID is not available. Please log in first.');
        return;
      }
      if (teamIds.value.length > 0) {
        this.teamAndUserIds = [...teamIds.value, userIdNumber];
      } else {
        this.teamAndUserIds = [userIdNumber];
      }
    }
  },
  persist: {
    storage: sessionStorage // Speichert den Zustand im sessionStorage
  }
});
