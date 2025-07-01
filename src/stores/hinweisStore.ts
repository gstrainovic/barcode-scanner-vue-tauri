import { defineStore, storeToRefs } from 'pinia';
import { marked } from 'marked';
import { strapi } from '@strapi/client';
import { invoke } from '@tauri-apps/api/core';
import { useBarcodeStore } from './barcodeStore';
import { useLocalStore } from './localStore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { getConfig } from '@/utils/config';

const getHinweisFromBarcode = async (barcode: string) => {
  const appStore = useAppStore();
  const isOnline = await appStore.onlineCheck();
  if (isOnline) {
    const response = await fetchWithAuth(`barcodes?filters[barcode][$eq]=${barcode}&populate=*&pagination[limit]=1&sort=id:asc`);
    return response.data[0];
  } else {
    const localStore = useLocalStore();
    const { barcodeMitHinweise } = storeToRefs(localStore);
    return barcodeMitHinweise.value.find(item => item.barcode === barcode) || null;
  }
};

const postHinweis = async (id: string, hinweis: string, erstelltVon: number, hinweisUmgesetztVon: number[]) => {
  const appStore = useAppStore();
  const isOnline = await appStore.onlineCheck();
  const config = await getConfig();
  if (isOnline) {
    const authStore = useAuthStore();
    const { userToken } = storeToRefs(authStore);
    if (!userToken.value) {
      throw new Error('User token is not available');
    }
    const client = strapi({
      baseURL: config.api.strapi,
      auth: userToken.value
    });

    const barcodes = client.collection('barcodes');

    const updateData: { hinweis: string, hinweis_erstellt_von?: number, hinweis_umgesetzt_von?: number[] } = { hinweis };
    if (erstelltVon !== null && erstelltVon !== undefined) {
      updateData.hinweis_erstellt_von = erstelltVon;
    }

    updateData.hinweis_umgesetzt_von = hinweisUmgesetztVon;

    const updatedBarcode = await barcodes.update(id, updateData);
    return updatedBarcode;
  } else {
    const localStore = useLocalStore();
    const { barcodeMitHinweise } = storeToRefs(localStore);
    const existingBarcode = barcodeMitHinweise.value.find(item => item.barcode === id);

    if (existingBarcode) {
      existingBarcode.hinweis = hinweis;
      existingBarcode.hinweis_erstellt_von = erstelltVon;
      existingBarcode.hinweis_umgesetzt_von = hinweisUmgesetztVon;
      return existingBarcode;
    } else {
      throw new Error('Barcode not found in local storage');
    }
  }
};

export const useHinweisStore = defineStore('hinweis', {
  state: () => ({
    barcodeId: '',
    hinweis: '',
    hinweisUmgesetzt: false,
    allowChangeHinweis: false
  }),
  actions: {
    async ladeHinweis() {
      const barcodeStore = useBarcodeStore();
      const { barcode } = storeToRefs(barcodeStore);
      const result = await getHinweisFromBarcode(barcode.value);
      const authStore = useAuthStore();
      const { userRole } = storeToRefs(authStore);
      const umgesetzt: boolean = result?.attributes?.hinweis_umgesetzt_von?.data?.length > 0;
      this.hinweisUmgesetzt = umgesetzt;

      if (!result?.id) {
        this.hinweis = '';
        return;
      }
      this.barcodeId = result.id;
      this.hinweis = await marked.parse(result.attributes.hinweis || '');

      if (!this.hinweisUmgesetzt && userRole.value === 'Lager' && this.hinweis) {
        invoke('show_notification', {
          message: `🔍 Bitte Hinweis beachten: ${this.hinweis}`
        });
      }
    },

    async speichereHinweis() {
      const barcodeStore = useBarcodeStore();
      const { barcode } = storeToRefs(barcodeStore);
      const appStore = useAppStore();
      const { teamAndUserIds } = storeToRefs(appStore);
      const authStore = useAuthStore();
      const { userId } = storeToRefs(authStore);

      if (!this.allowChangeHinweis) {
        return;
      }

      if (!barcode) {
        const message = '❗Bitte Barcode zuerst scannen.';
        invoke('show_notification', { message });
      }

      const userID = Number(userId.value);
      if (!userID) {
        console.error('Fehler: userId ist nicht definiert.');
        return;
      }

      // const teamUndUserIds = teamIds.value.concat(userID);
      const teamUndUserIds = teamAndUserIds.value;
      // const createdBy = userRole.value === 'Produktion' ? userID : null;
      const hinweisUmgesetztVon = this.hinweisUmgesetzt ? teamUndUserIds : [];
      const result = await postHinweis(this.barcodeId, this.hinweis, userID, hinweisUmgesetztVon);

      // wenn der result den barcode und die hinweis enthält, dann ist es erfolgreich
      if (result?.data?.attributes?.barcode && result?.data?.attributes?.hinweis === this.hinweis) {
        invoke('show_notification', {
          message: ` ✅ Hinweis zu Barcode ${barcode.value} gespeichert.`
        });
      } else {
        invoke('show_notification', {
          message: '❗Fehler beim Speichern des Hinweises.'
        });
        this.hinweisUmgesetzt = false;
      }
    }
  },
  persist: {
    storage: sessionStorage // Speichert den Zustand im sessionStorage
  }
});
