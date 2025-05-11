import { defineStore } from 'pinia';

export const useTeamStore = defineStore('hinweis', {
  state: () => ({
    hinweis: ''
  }),
});
