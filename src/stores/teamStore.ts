import { User } from '@/interfaces';
import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';

export const useTeamStore = defineStore('team', {
  state: () => ({
    team: [],
    teamIds: [] as number[],
    checked: true,
  }),
  actions: {
    changeTeam(event: { value: User[] }) {
      // console.log('changeTeam', event.value);
      this.teamIds = event.value.map((user: User) => user.id);
      const authStore = useAuthStore();
      const userId = authStore.userId;
      const teamAndUserIds = userId ? [...this.teamIds, userId] : this.teamIds;
      authStore.teamAndUserIds = teamAndUserIds;
      console.log('authStore.teamAndUserIds', authStore.teamAndUserIds);
    },
    onToggleChangeVerpackeAlleine (value: boolean) {
      this.checked = value;
      if (this.checked) {
        this.team = [];
        this.teamIds = [];
        const authStore = useAuthStore();
        authStore.teamAndUserIds = authStore.userId ? [authStore.userId] : [];
      }
    },
  },
  persist: {
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});