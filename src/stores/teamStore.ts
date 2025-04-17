import { defineStore } from 'pinia';

export const useTeamStore = defineStore('team', {
  state: () => ({
    team: [] as LagerUser[],
    teamIds: [] as number[],
    checked: false,
  }),
});
