import { defineStore, storeToRefs } from 'pinia';
import { marked } from 'marked';
import type { HinweisVorlage } from '@/interfaces';
import { useHinweisStore } from '@/stores/hinweisStore';
import { useLocalStore } from '@/stores/localStore';

export const useHinweisVorlageStore = defineStore('hinweisVorlage', {
  state: () => ({
    selectedVorlage: ''
  }),
  actions: {
    async checkBarcodeMatchWithVorlageBarcode(barcodeInput: string) {
      const localStore = useLocalStore();
      const { hinweisVorlagen } = storeToRefs(localStore);
      if (hinweisVorlagen.value.length > 0 && barcodeInput) {
        const barcodeVorlage = hinweisVorlagen.value.find(vorlage => vorlage.barcode === barcodeInput);
        if (barcodeVorlage) {
          await this.setHinweis(barcodeVorlage);
          return true;
        }
      }
      return false;
    },
    async setHinweis(event: HinweisVorlage | { text?: string, value?: string }) {
      const hinweisStore = useHinweisStore();
      const { hinweis } = storeToRefs(hinweisStore);
      const hinweisInput = (event as HinweisVorlage).text || (event as { value?: string }).value;
      if (hinweisInput && hinweisInput.length > 2) {
        hinweis.value = await marked.parse(hinweisInput) || '';
      } else {
        hinweis.value = '';
      }
      this.selectedVorlage = hinweisInput ?? '';
      await hinweisStore.speichereHinweis();
    }
  },
  persist: {
    storage: sessionStorage // Speichert den Zustand im sessionStorage
  }
});
