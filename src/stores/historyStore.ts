import { invoke } from '@tauri-apps/api/core';
import { defineStore } from 'pinia';

export const useHistoryStore = defineStore('history', {
  state: () => ({
    history: [] as { status: string, barcode: string, timestamp: string }[]
  }),
  actions: {
    async loadHistory() {
      this.history = await invoke<[]>('load_history');
    }
  },
  persist: {
    storage: sessionStorage // Speichert den Zustand im sessionStorage
  }
});
