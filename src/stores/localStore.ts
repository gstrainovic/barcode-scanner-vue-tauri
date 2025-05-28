import { defineStore } from 'pinia';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { Attributes, Ausnahmen, Barcode2Strapi, BarcodeMitHinweise, HinweisVorlage, Leitcode, Settings, User, Zeiterfassung } from '@/interfaces';

const isUserArray = (arr: unknown): arr is User[] => {
  return Array.isArray(arr) && arr.every(
    user => typeof user.id === 'number' && typeof user.username === 'string'
  );
}

const isSettingsObject = (obj: unknown): obj is Settings => {
  return typeof obj === 'object' && obj !== null && 'Barcode_Mindestlaenge' in obj && 'Leitcodes_Aktiv' in obj && 'Ausnahmen_Aktiv' in obj;
}

const isAusnahmenArray = (arr: unknown): arr is Ausnahmen[] => {
  return Array.isArray(arr) && arr.every(
    ausnahme => typeof ausnahme.Barcode === 'string' && typeof ausnahme.Bedeutung === 'string'
  );
}

const isLeitcodeArray = (arr: unknown): arr is Leitcode[] => {
  return Array.isArray(arr) && arr.every(
    leitcode => typeof leitcode.Beschreibung === 'string' &&
      typeof leitcode.Mindeslaenge === 'number' &&
      typeof leitcode.Leitcode_Buchstabe === 'object' &&
      typeof leitcode.Produktion === 'boolean'
  );
}

export const useLocalStore = defineStore('local', {
  state: () => ({
    users: [] as User[],
    settings: {} as Settings,
    ausnahmen: [] as Ausnahmen[],
    leitcodes: [] as Leitcode[],
    barcode2strapi: [] as Barcode2Strapi[],
    zeiterfassung2strapi: [] as Zeiterfassung[],
    hinweisVorlagen: [] as HinweisVorlage[],
    barcodeMitHinweise: [] as BarcodeMitHinweise[],
  }),
  actions: {
    async fetchBarcodeMitHinweise() {
      const response = await fetchWithAuth('barcodes?filters[hinweis][$notNull]=true&pagination[limit]=1000');
      const data = response.data.map((item: { attributes: { barcode: string; hinweis: string } }) => ({
        barcode: item.attributes.barcode,
        hinweis: item.attributes.hinweis,
      }));
      this.barcodeMitHinweise = Array.isArray(data) ? data : [];
    },
    async ladeHinweisVorlagen() {
      const response = await fetchWithAuth('hinweis-vorlagen?sort=strg:asc');
      const attributes = response.data.map((item: Attributes) => item.attributes);
      this.hinweisVorlagen = Array.isArray(attributes) ? attributes : [];
    },
    async fetchUsers() {
      const usersResponse = await fetchWithAuth('users');
      if (isUserArray(usersResponse)) {
        this.users = usersResponse;
      } else {
        throw new Error('Ungültiges User-Array!');
      }
    },
    async fetchEinstellungen() {
      const settingsResponseDataAttributes = await fetchWithAuth('einstellung');
      const settingsResponse = settingsResponseDataAttributes.data.attributes;
      if (isSettingsObject(settingsResponse)) {
        this.settings = settingsResponse;
      } else {
        throw new Error('Ungültiges Einstellungen-Array!');
      }
    },
    async fetchAusnahmen() {
      const ausnahmenData = await fetchWithAuth('ausnahmen');
      const ausnahmen = ausnahmenData.data.map((item: { attributes: Ausnahmen }) => item.attributes);
      if (isAusnahmenArray(ausnahmen)) {
        this.ausnahmen = ausnahmen;
      } else {
        throw new Error('Ungültiges Ausnahmen-Array!');
      }
    },
    async fetchLeitcodes() {
      const leitcodesData = await fetchWithAuth('leitcodes?populate=*');
      const leitcodes = leitcodesData.data.map((item: { attributes: Leitcode }) => item.attributes);
      if (isLeitcodeArray(leitcodes)) {
        this.leitcodes = leitcodes;
      } else {
        throw new Error('Ungültiges Leitcode-Array!');
      }
    },
    async strapi2localStorage() {
      Promise.all([
        this.fetchUsers(),
        this.fetchEinstellungen(),
        this.fetchAusnahmen(),
        this.fetchLeitcodes(),
        this.ladeHinweisVorlagen(),
        this.fetchBarcodeMitHinweise(),
      ]).then(() => {
      }).catch((error) => {
        console.error('Fehler beim Synchronisieren der Daten:', error);
      });
    },
  },
  persist: {
    storage: localStorage, // Speichert den Zustand im localStorage
  },
});
