import { defineStore, storeToRefs } from 'pinia';
import { Attributes, HinweisVorlage } from '@/interfaces';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useHinweisStore } from '@/stores/hinweisStore';
import { marked } from 'marked';



export const useHinweisVorlageStore = defineStore('hinweisVorlage', {
  state: () => ({
    hinweisVorlagen: [] as HinweisVorlage[],
    selectedVorlage: '',
  }),
  actions: {
    async checkBarcodeMatchWithVorlageBarcode(barcodeInput: string) {
      if (this.hinweisVorlagen.length > 0 && barcodeInput) {
        const barcodeVorlage = this.hinweisVorlagen.find((vorlage) => vorlage.barcode === barcodeInput);
        if (barcodeVorlage) {
          await this.setHinweis(barcodeVorlage);
          return true;
        }
      }
      return false;
    },
    async ladeHinweisVorlagen() {
      const response = await fetchWithAuth('hinweis-vorlagen?sort=strg:asc');
      const attributes = response.data.map((item: Attributes) => item.attributes);
      this.hinweisVorlagen = Array.isArray(attributes) ? attributes : [];
    },

    async setHinweis(event: HinweisVorlage | { text?: string; value?: string }) {
      const hinweisStore = useHinweisStore();
      const { hinweis } = storeToRefs(hinweisStore);
      console.log('setHinweis', event);
      const hinweisInput = (event as HinweisVorlage).text || (event as { value?: string }).value;
      console.log('hinweisInput', hinweisInput);
      if (hinweisInput && hinweisInput.length > 2) {
        hinweis.value = await marked.parse(hinweisInput) || '';
      } else {
        hinweis.value = '';
      }
      this.selectedVorlage = hinweisInput ?? '';
      await hinweisStore.speichereHinweis();
    },

  },
  persist: {
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});