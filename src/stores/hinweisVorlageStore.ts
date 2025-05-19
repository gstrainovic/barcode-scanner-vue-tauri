import { defineStore, storeToRefs } from 'pinia';
import { HinweisVorlage } from '@/interfaces';
import { useApi } from '@/composables/useApi';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { useHinweisStore } from '@/stores/hinweisStore';
import { marked } from 'marked';

const hinweisStore = useHinweisStore();
const { hinweis } = storeToRefs(hinweisStore);

export const useHinweisVorlageStore = defineStore('hinweisVorlage', {
  state: () => ({
    hinweisVorlagen: [] as HinweisVorlage[],
    selectedVorlage: '',
  }),
  actions: {
    async checkBarcodeMatchWithVorlageBarcode (barcodeInput: string) {
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
      const { getHinweisVorlagen } = await useApi();
      this.hinweisVorlagen = await getHinweisVorlagen();
    },
    async registerHinweisVorlagenShortcuts() {
      // Erst abmelden, dann beide Varianten registrieren
      await unregisterAll();
      for (const vorlage of this.hinweisVorlagen) {
        const hotkeyMain = 'CommandOrControl+' + vorlage.strg; // z.B. CommandOrControl+1
        const hotkeyNumpad = 'CommandOrControl+Numpad' + vorlage.strg; // z.B. CommandOrControl+Numpad1


        await register(hotkeyMain, async (event) => {
          if (event.state === "Released") {
            await this.setHinweis(vorlage);
            await hinweisStore.speichereHinweis();
          }
        });
        await register(hotkeyNumpad, async (event) => {
          if (event.state === "Released") {
            await this.setHinweis(vorlage);
            await hinweisStore.speichereHinweis();
          }
        });
      }
    },
    async setHinweis(event: HinweisVorlage | { text?: string; value?: string }) {
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