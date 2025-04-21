import { defineStore } from 'pinia';

export const useTeamStore = defineStore('hinweise', {
  state: () => ({
    hinweise: ''
  }),
});
