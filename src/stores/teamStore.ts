import { defineStore } from 'pinia';
import { useAppStore } from './appStore';
import { useArbeitszeitStore } from './arbeitsZeitStore';
import { useLocalStore } from './localStore';
import type { User } from '@/interfaces';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export const useTeamStore = defineStore('team', {
  state: () => ({
    checked: true,
    lagerUsers: [] as User[],
    team: [] as User[],
    teamIds: [] as number[]
  }),
  actions: {
    async changeTeam(event: { value: User[] }) {
      const appStore = useAppStore();
      this.teamIds = event.value.map((user: User) => user.id);
      await appStore.setTeamAndUserIds();
      const arbeitszeitStore = useArbeitszeitStore();
      await arbeitszeitStore.nutzerWechsel();
    },
    onToggleChangeVerpackeAlleine(value: boolean) {
      const appStore = useAppStore();
      this.checked = value;
      if (this.checked) {
        this.team = [];
        this.teamIds = [];
        appStore.setTeamAndUserIds();
      }
    },
    async getUsersLager() {
      const appStore = useAppStore();
      let result = [];
      if (appStore.isOnline) {
        const response = await fetchWithAuth('users?filters[rolle][$eq]=Lager');
        result = Array.isArray(response) ? response : [];
      } else {
        console.log('Offline-Modus: Verwende lokale Benutzerdaten');
        const localStore = useLocalStore();
        const users = localStore.users.filter(u => u.rolle === 'Lager').map(u => ({
          username: u.username,
          id: u.id
        }));
        result = Array.isArray(users) ? users : [];
      }
      this.lagerUsers = result.map((user: User) => {
        return {
          username: user.username,
          id: user.id
        };
      });
    }
  },
  persist: {
    storage: sessionStorage // Speichert den Zustand im localStorage
  }
});
