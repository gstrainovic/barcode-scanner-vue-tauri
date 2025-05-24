import { defineStore } from 'pinia';

export const useBarcodeStore = defineStore('barcode', {
  state: () => ({
    barcode: '',
  }),
  persist: {
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});