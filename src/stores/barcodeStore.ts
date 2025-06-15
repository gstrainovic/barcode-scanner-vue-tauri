import { defineStore, storeToRefs } from 'pinia';
import { invoke } from '@tauri-apps/api/core';
import { useHinweisStore } from './hinweisStore';
import { useHinweisVorlageStore } from './hinweisVorlageStore';
import { useAuthStore } from './authStore';
import { useAppStore } from './appStore';
import { useTeamStore } from './teamStore';
import { useLocalStore } from './localStore';
import { useHistoryStore } from './historyStore';
import type { Barcode2Strapi } from '@/interfaces';

export const useBarcodeStore = defineStore('barcode', {
  state: () => ({
    barcode: '',
    barcodeInput: ''
  }),
  actions: {
    async processBarcode(binp = '') {
      const hinweisStore = useHinweisStore();
      const { hinweis, hinweisUmgesetzt, allowChangeHinweis } = storeToRefs(hinweisStore);
      const hinweisVorlageStore = useHinweisVorlageStore();
      const { selectedVorlage } = storeToRefs(hinweisVorlageStore);
      const authStore = useAuthStore();
      const { userRole, userId, userToken } = storeToRefs(authStore);
      const appStore = useAppStore();
      const { isOnline } = storeToRefs(appStore);
      const teamStore = useTeamStore();
      const { teamIds } = storeToRefs(teamStore);
      const localStore = useLocalStore();
      const { settings, ausnahmen, leitcodes } = storeToRefs(localStore);
      const historyStore = useHistoryStore();

      // Falls es einen Hinweis gibt, muss dieser zuerst Beachtet werden
      if (hinweis.value && !hinweisUmgesetzt.value && userRole.value === 'Lager') {
        const message = `❗Bitte Hinweis zu Barcode ${this.barcode} zuerst beachten.`;
        invoke('show_notification', { message });
        this.barcodeInput = '';
        return;
      }

      selectedVorlage.value = '';
      const barcodeValue = binp || this.barcodeInput;
      const barcodeMatch = await hinweisVorlageStore.checkBarcodeMatchWithVorlageBarcode(barcodeValue);
      if (barcodeMatch) {
        this.barcodeInput = '';
        return;
      }

      this.barcode = barcodeValue;
      if (!this.barcode || this.barcode === '') {
        invoke('show_notification', { message: '❗Bitte zuerst Barcode scannen.' });
        return;
      }
      this.barcodeInput = '';

      const userID = Number(userId.value);
      if (!userID) {
        console.error('Fehler: userId ist nicht definiert.');
        return;
      }

      const result: unknown = await invoke('process_barcode', {
        barcode: this.barcode,
        uid: userID,
        jwt: userToken.value,
        luids: teamIds.value,
        rolle: userRole.value,
        einstellungen: settings.value,
        ausnahmen: ausnahmen.value,
        leitcodes: leitcodes.value,
        offline: !isOnline.value
      });

      const errorType = (result as any)?.error_type;
      if (errorType === 'Ok' || errorType === 'KeineNummern' || errorType === 'BereitsGesendet') {
        allowChangeHinweis.value = true;
      } else {
        allowChangeHinweis.value = false;
        this.barcodeInput = '';
        this.barcode = '';
      }

      if (!isOnline.value) {
        const barcode2strapi: Barcode2Strapi = {
          barcode: this.barcode,
          users_permissions_user: userID,
          lager_mitarbeiter: teamIds.value
        };
        localStore.barcode2strapi.push(barcode2strapi);
      }

      historyStore.loadHistory();
      hinweisStore.ladeHinweis();
    }
  },
  persist: {
    storage: sessionStorage // Speichert den Zustand im sessionStorage
  }
});
