import { defineStore, storeToRefs } from 'pinia';
import { useAuthStore } from './authStore';
import { useTeamStore } from './teamStore';
import { config } from '@/utils/config';

export const useAppStore = defineStore('app', {
  state: () => ({
    isOnline: true as boolean,
    teamAndUserIds: [] as number[]
  }),
  actions: {
    async onlineCheck() {
      const url = config.api.strapi.replace('/api', '');
      try {
        const response = await fetch(url, { method: 'GET' });
        console.log('Überprüfe Serververbindung', response);
        const text = await response.text();
        if (response.status === 200 && text.includes('The server is running successfully')) {
          console.log('Online-Modus: Server ist erreichbar');
          this.isOnline = true;
          return true;
        }
        console.log('Offline-Modus: Server ist nicht erreichbar');
        this.isOnline = false;
        return false;
      } catch (_) {
        console.log('Offline-Modus: Server ist nicht erreichbar');
        this.isOnline = false;
        return false;
      }
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
    storage: sessionStorage // Speichert den Zustand im sessionStorage
  }
});
