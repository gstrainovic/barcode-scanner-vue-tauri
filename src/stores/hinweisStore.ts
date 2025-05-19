import config from '@/composables/config';
import { useToast } from "primevue/usetoast";
import { useBarcodeStore } from './barcodeStore';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useApi } from '@/composables/useApi';
import { storeToRefs } from 'pinia';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { message } from '@tauri-apps/plugin-dialog';
import { marked } from 'marked';
import { getErrorToastMessage, getSuccessToastMessage } from '@/utils/toastUtils';
import { defineStore } from 'pinia';

const toast = useToast();
const barcodeStore = useBarcodeStore();
const authStore = useAuthStore();
const appStore = useAppStore();
const { userRole, userId } = storeToRefs(authStore);
const { teamAndUserIds } = storeToRefs(appStore);
const { barcode } = storeToRefs(barcodeStore);

export const useHinweisStore = defineStore('hinweis', {
  state: () => ({
    barcodeId: '',
    hinweis: '',
    hinweisUmgesetzt: false,
  }),
  actions: {
    async ladeHinweis() {
      const { getHinweisFromBarcode } = await useApi();
      const result = await getHinweisFromBarcode(barcode.value);
      const umgesetzt: boolean = result.attributes.hinweis_umgesetzt_von.data.length > 0;
      this.hinweisUmgesetzt = umgesetzt;

      if (!result?.id) {
        this.hinweis = '';
        return;
      }
      this.barcodeId = result.id;
      this.hinweis = await marked.parse(result.attributes.hinweis || '');
      if (result.attributes.hinweis) {
        const Config = await config();
        message('Es gibt einen Hinweis zu Barcode ' + barcode.value, {
          title: Config.dialog.title,
          kind: 'warning',
        });
      }
    },

    async speichereHinweis() {
      if (!barcode) {
        const Config = await config();
        const message = 'Bitte Barcode zuerst scannen';
        toast.add(getErrorToastMessage(message));
        sendNotification({
          title: Config.dialog.title,
          body: message,
        });
        return;
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
      const { postHinweis } = await useApi();
      const result = await postHinweis(this.barcodeId, this.hinweis, createdBy, hinweisUmgesetztVon);

      const Config = await config();

      // wenn der result den barcode und die hinweis enthält, dann ist es erfolgreich
      if (result?.data?.attributes?.barcode && result?.data?.attributes?.hinweis == this.hinweis) {
        toast.add(getSuccessToastMessage('Hinweis gespeichert.'));
        sendNotification({
          title: Config.dialog.title,
          body: 'Hinweis zu Barcode ' + barcode.value + ' gespeichert.',
        });
        this.hinweisUmgesetzt = false; // Reset the toggle after saving
      } else {
        toast.add(getErrorToastMessage('Fehler beim Speichern der Hinweis.'));
        sendNotification({
          title: Config.dialog.title,
          body: 'Fehler beim Speichern der Hinweis.',
        });
      }
    },
  },
  persist: {
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});