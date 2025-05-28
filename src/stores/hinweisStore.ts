import { config } from '@/utils/config';
import { useBarcodeStore } from './barcodeStore';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { storeToRefs } from 'pinia';
import { marked } from 'marked';
import { defineStore } from 'pinia';
import { strapi } from '@strapi/client';
import { invoke } from '@tauri-apps/api/core';

const getHinweisFromBarcode = async (barcode: string) => {
  const appStore = useAppStore();
  if (appStore.isOnline) {
    const response = await fetchWithAuth('barcodes?filters[barcode][$eq]=' + barcode + '&populate=*&pagination[limit]=1&sort=id:asc');
    return response.data[0];
  } else {
    throw new Error('Offline mode not implemented yet!');
  }
};

const postHinweis = async (id: string, hinweis: string, erstelltVon: number | null = null, hinweisUmgesetztVon: number[]) => {
  const appStore = useAppStore();
  if (appStore.isOnline) {
    const authStore = useAuthStore();
    const { userToken } = storeToRefs(authStore);
    if (!userToken.value) {
      throw new Error('User token is not available');
    }
    const client = strapi({
      baseURL: config.api.strapi,
      auth: userToken.value,
    });

    const barcodes = client.collection('barcodes');

    const updateData: { hinweis: string; hinweis_erstellt_von?: number; hinweis_umgesetzt_von?: number[] } = { hinweis: hinweis };
    if (erstelltVon !== null && erstelltVon !== undefined) {
      updateData.hinweis_erstellt_von = erstelltVon;
    }

    updateData.hinweis_umgesetzt_von = hinweisUmgesetztVon;

    const updatedBarcode = await barcodes.update(id, updateData);
    return updatedBarcode;
  }
};


export const useHinweisStore = defineStore('hinweis', {
  state: () => ({
    barcodeId: '',
    hinweis: '',
    hinweisUmgesetzt: false,
  }),
  actions: {

    async ladeHinweis() {
      const barcodeStore = useBarcodeStore();
      const { barcode } = storeToRefs(barcodeStore);
      const result = await getHinweisFromBarcode(barcode.value);
      const umgesetzt: boolean = result?.attributes?.hinweis_umgesetzt_von?.data?.length > 0;
      this.hinweisUmgesetzt = umgesetzt;

      if (!result?.id) {
        this.hinweis = '';
        return;
      }
      this.barcodeId = result.id;
      this.hinweis = await marked.parse(result.attributes.hinweis || '');
    },


    async speichereHinweis(umgesetzt: boolean = false) {
      const barcodeStore = useBarcodeStore();
      const { barcode } = storeToRefs(barcodeStore);
      const appStore = useAppStore();
      const { teamAndUserIds } = storeToRefs(appStore);
      const authStore = useAuthStore();
      const { userId, userRole } = storeToRefs(authStore);

      if (!barcode) {
        const message = '❗Bitte Barcode zuerst scannen.';
        invoke('show_notification', {message});
      }

      const userID: number = Number(userId.value);
      if (!userID) {
        console.error('Fehler: userId ist nicht definiert.');
        return;
      }

      // const teamUndUserIds = teamIds.value.concat(userID);
      const teamUndUserIds = teamAndUserIds.value;
      const createdBy = userRole.value === 'Produktion' ? userID : null;
      const hinweisUmgesetztVon = this.hinweisUmgesetzt ? teamUndUserIds : [];
      const result = await postHinweis(this.barcodeId, this.hinweis, createdBy, hinweisUmgesetztVon);

      // wenn der result den barcode und die hinweis enthält, dann ist es erfolgreich
      if (result?.data?.attributes?.barcode && result?.data?.attributes?.hinweis == this.hinweis) {
        const gespeichertOderUmgesetzt = umgesetzt ? ' umgesetzt.' : ' gespeichert.';
        invoke('show_notification', {
          message: ' ✅ Hinweis zu Barcode ' + barcode.value + gespeichertOderUmgesetzt,
        });
      } else {
        invoke('show_notification', {
          message: '❗Fehler beim Speichern des Hinweises.',
        });
        this.hinweisUmgesetzt = false;
      }
    },
  },
  persist: {
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});