import Config from '@/utils/config';
import { defineStore, storeToRefs } from 'pinia';
import { useAuthStore } from './authStore';
import { useTeamStore } from './teamStore';

export const useAppStore = defineStore('app', {
  state: () => ({
    isOnline: true as boolean,
    teamAndUserIds: [] as number[],
  }),
  actions: {
    async onlineCheck() {
      const config = await Config();
      const url = config.api.strapi.replace('/api', '');
      try {
        const response = await fetch(url, { method: 'GET' });
        const text = await response.text();
        if (response.status === 200 && text.includes('The server is running successfully')) {
          this.isOnline = true;
          return true;
        }
      } catch (error) {
        console.error(`An error occurred while accessing ${url}:`, error);
        this.isOnline = false;
        return false;
      }
      this.isOnline = false;
      return false;
    },
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
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});