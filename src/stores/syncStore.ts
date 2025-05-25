import { defineStore } from 'pinia';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { Ausnahmen, Leitcode, Settings, User } from '@/interfaces';

function isUserArray(arr: unknown): arr is User[] {
  return Array.isArray(arr) && arr.every(
    user => typeof user.id === 'number' && typeof user.username === 'string'
  );
}

function isSettingsObject(obj: unknown): obj is Settings {
  return typeof obj === 'object' && obj !== null && 'Barcode_Mindestlaenge' in obj && 'Leitcodes_Aktiv' in obj && 'Ausnahmen_Aktiv' in obj;
} 

function isAusnahmenArray(arr: unknown): arr is Ausnahmen[] {
  return Array.isArray(arr) && arr.every(
    ausnahme => typeof ausnahme.Barcode === 'string' && typeof ausnahme.Bedeutung === 'string'
  );
}

function isLeitcodeArray(arr: unknown): arr is Leitcode[] {
  return Array.isArray(arr) && arr.every(
    leitcode => typeof leitcode.Beschreibung === 'string' &&
                typeof leitcode.Mindeslaenge === 'number' &&
                typeof leitcode.Leitcode_Buchstabe === 'object' &&
                typeof leitcode.Produktion === 'boolean'
  );
}

export const useSyncStore = defineStore('sync', {
  state: () => ({
    users: [] as User[],
    settings: {} as Settings,
    ausnahmen: [] as Ausnahmen[],
    leitcodes: [] as Leitcode[],
  }),
  actions: {
    async strapi2localStorage() {
      const usersResponse = await fetchWithAuth('users');
      if (isUserArray(usersResponse)) {
        this.users = usersResponse;
        console.log('Benutzer erfolgreich synchronisiert:', this.users);
      } else {
        throw new Error('Ungültiges User-Array!');
      }

      const settingsResponseDataAttributes = await fetchWithAuth('einstellung');
      const settingsResponse = settingsResponseDataAttributes.data.attributes;
      if (isSettingsObject(settingsResponse)) {
        this.settings = settingsResponse;
        console.log('Einstellungen erfolgreich synchronisiert:', this.settings);
      } else {
        throw new Error('Ungültiges Einstellungen-Array!');
      }

      const ausnahmenData = await fetchWithAuth('ausnahmen');
      console.log('Ausnahmen Data Attributes:', ausnahmenData);
      const ausnahmen = ausnahmenData.data.map((item: { attributes: Ausnahmen }) => item.attributes);
      if (isAusnahmenArray(ausnahmen)) {
        this.ausnahmen = ausnahmen;
        console.log('Ausnahmen erfolgreich synchronisiert:', this.ausnahmen);
      } else {
        throw new Error('Ungültiges Ausnahmen-Array!');
      }

      const leitcodesData = await fetchWithAuth('leitcodes?populate=*');
      console.log('Leitcodes Data Attributes:', leitcodesData);
      const leitcodes = leitcodesData.data.map((item: { attributes: Leitcode }) => item.attributes);
      console.log('Leitcodes:', leitcodes);
      if (isLeitcodeArray(leitcodes)) {
        this.leitcodes = leitcodes;
        console.log('Leitcodes erfolgreich synchronisiert:', this.leitcodes);
      } else {
        throw new Error('Ungültiges Leitcode-Array!');
      }
    },
  },
  persist: {
    storage: localStorage, // Speichert den Zustand im localStorage
  },
});
