import { User } from '@/interfaces';
import { useAppStore } from './appStore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { defineStore } from 'pinia';

const appStore = useAppStore();

export const useTeamStore = defineStore('team', {
  state: () => ({
    checked: true,
    lagerUsers: [] as User[],
    team: [] as User[],
    teamIds: [] as number[],
  }),
  actions: {
    changeTeam(event: { value: User[] }) {
      this.teamIds = event.value.map((user: User) => user.id);
      appStore.setTeamAndUserIds();
    },
    onToggleChangeVerpackeAlleine(value: boolean) {
      this.checked = value;
      if (this.checked) {
        this.team = [];
        this.teamIds = [];
        appStore.setTeamAndUserIds();
      }
    },
    async getUsersLager() {
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