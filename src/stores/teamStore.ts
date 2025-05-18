import { User } from '@/interfaces';
import { useMyFetch } from '@/composables/myFetch';
import { useAuthStore } from './authStore';
import { useAppStore } from './appStore';
import { defineStore } from 'pinia';

export const useTeamStore = defineStore('team', {
  state: () => ({
    team: [] as User[],
    teamIds: [] as number[],
    checked: true,
    lagerUsers: [] as User[],
  }),
  actions: {
    changeTeam(event: { value: User[] }) {
      this.teamIds = event.value.map((user: User) => user.id);
      const authStore = useAuthStore();
      const appStore = useAppStore();
      const userId = authStore.userId;
      const teamAndUserIds = userId ? [...this.teamIds, userId] : this.teamIds;
      appStore.teamAndUserIds = teamAndUserIds;
      console.log('authStore.teamAndUserIds', appStore.teamAndUserIds);
    },
    onToggleChangeVerpackeAlleine(value: boolean) {
      this.checked = value;
      if (this.checked) {
        this.team = [];
        this.teamIds = [];
        const authStore = useAuthStore();
        const appStore = useAppStore();
        appStore.teamAndUserIds = authStore.userId ? [authStore.userId] : [];
      }
    },
    async getUsersLager() {
      const { fetchWithAuth } = await useMyFetch();
      const appStore = useAppStore();
      await appStore.onlineCheck();
      let result = [];
      if (appStore.isOnline) {
        const response = await fetchWithAuth('users?filters[rolle][$eq]=Lager');
        result = Array.isArray(response) ? response : [];
      } else {
        // result = await window.pywebview.api.get_lager_users();
        throw new Error('Offline mode not implemented yet!');
        // TODO: Implement offline mode for getUsersLager
      }

      this.lagerUsers = result.map((user: User) => {
        return {
          username: user.username,
          id: user.id,
        }
      });
    },
  },
  persist: {
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});