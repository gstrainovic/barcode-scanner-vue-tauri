import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
  state: () => ({
    scanner: '' as string,
  }),
});
