import config from '@/composables/config';
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    teamAndUserIds: [] as number[],
    isOnline: true as boolean,
  }),
  actions: {
    async onlineCheck() {
      const configData = await config();
      const url = configData.api.strapi.replace('/api', '');
      try {
        const response = await fetch(url, { method: 'GET' });
        const text = await response.text();
        if (response.status === 200 && text.includes('The server is running successfully')) {
          this.isOnline = true;
          return true;
        }
      } catch (error) {
        console.error('An error occurred:', error);
        this.isOnline = false;
        return false;
      }
      this.isOnline = false;
      return false;
    },
  },
  persist: {
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});