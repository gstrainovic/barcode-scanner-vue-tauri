import { defineStore } from 'pinia';

export const useTeamStore = defineStore('team', {
  state: () => ({
    team: [] as LagerUser[],
    checked: false,
  }),
  persist: {
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});