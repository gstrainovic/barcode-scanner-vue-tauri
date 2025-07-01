import { defineStore } from 'pinia';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import type { Attributes, Ausnahmen, Barcode2Strapi, BarcodeMitHinweise, HinweisVorlage, Leitcode, Settings, User, Zeiterfassung } from '@/interfaces';

const isUserArray = (arr: unknown): arr is User[] => {
  return Array.isArray(arr) && arr.every(
    user => typeof user.id === 'number' && typeof user.username === 'string'
  );
};
const isSettingsObject = (obj: unknown): obj is Settings => {
  return typeof obj === 'object' && obj !== null && 'Barcode_Mindestlaenge' in obj && 'Leitcodes_Aktiv' in obj && 'Ausnahmen_Aktiv' in obj;
};

const isAusnahmenArray = (arr: unknown): arr is Ausnahmen[] => {
  return Array.isArray(arr) && arr.every(
    ausnahme => typeof ausnahme.Barcode === 'string' && typeof ausnahme.Bedeutung === 'string'
  );
};

const isLeitcodeArray = (arr: unknown): arr is Leitcode[] => {
  return Array.isArray(arr) && arr.every(
    leitcode =>
      typeof leitcode.Mindeslaenge === 'number'
      && typeof leitcode.Leitcode_Buchstabe === 'object'
      && typeof leitcode.Produktion === 'boolean'
  );
};

const isHinweisVorlageArray = (arr: unknown): arr is HinweisVorlage[] => {
  return Array.isArray(arr) && arr.every(
    vorlage => typeof vorlage.titel === 'string'
      && typeof vorlage.text === 'string'
      && typeof vorlage.strg === 'number'
  );
};

const isBarcode2StrapiArray = (arr: unknown): arr is Barcode2Strapi[] => {
  return Array.isArray(arr) && arr.every(
    barcode => typeof barcode.barcode === 'string'
      && typeof barcode.hinweis === 'string'
      && typeof barcode.hinweis_erstellt_von === 'number'
      && Array.isArray(barcode.hinweis_umgesetzt_von)
  );
};

export const useLocalStore = defineStore('local', {
  state: () => ({
    users: [] as User[],
    settings: {} as Settings,
    ausnahmen: [] as Ausnahmen[],
    leitcodes: [] as Leitcode[],
    barcode2strapi: [] as Barcode2Strapi[],
    zeiterfassung2strapi: [] as Zeiterfassung[],
    hinweisVorlagen: [] as HinweisVorlage[],
    barcodeMitHinweise: [] as BarcodeMitHinweise[]
  }),
  actions: {
    async fetchBarcodeMitHinweise() {
      const response = await fetchWithAuth('barcodes?filters[hinweis][$notNull]=true&pagination[limit]=1000');
      if (!isBarcode2StrapiArray(response.data)) {
        throw new Error('Ungültige Antwort von Strapi für Barcodes mit Hinweisen!');
      }
      const data = response.data.map((item: { attributes: { barcode: string, hinweis: string } }) => ({
        barcode: item.attributes.barcode,
        hinweis: item.attributes.hinweis
      }));
      this.barcodeMitHinweise = Array.isArray(data) ? data : [];
    },
    async postBarcodes() {
      // bereinige die barcode2strapi Liste von leeren Barcodes
      this.barcode2strapi = this.barcode2strapi.filter(barcode => barcode.barcode.trim() !== '');
      // Kopie, damit das Array beim Entfernen nicht beeinflusst wird
      for (const data of [...this.barcode2strapi]) {
        const response = await fetchWithAuth('barcodes', data);
        if (response.data.attributes.barcode !== data.barcode) {
          throw new Error(`Fehler beim Posten des Barcodes: ${response}`);
        }
        // Lösche den Barcode anhand einer eindeutigen Eigenschaft (z.B. barcode oder id)
        const index = this.barcode2strapi.findIndex(item => item.barcode === data.barcode);
        if (index > -1) {
          this.barcode2strapi.splice(index, 1);
        } else {
          console.warn(`Barcode ${data.barcode} nicht gefunden zum Entfernen.`);
        }
      }
    },
    async postZeiterfassung() {
      // Kopie, damit das Array beim Entfernen nicht beeinflusst wird
      for (const zeiterfassung of [...this.zeiterfassung2strapi]) {
        const response = await fetchWithAuth('zeiterfassung', {
          method: 'POST',
          body: JSON.stringify(zeiterfassung),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`Fehler beim Posten der Zeiterfassung: ${response.statusText}`);
        }
        // Lösche die Zeiterfassung anhand einer eindeutigen Eigenschaft (z.B. id)
        const index = this.zeiterfassung2strapi.findIndex(
          item => item.zeitpunkt === zeiterfassung.zeitpunkt
        );
        if (index > -1) {
          this.zeiterfassung2strapi.splice(index, 1);
        }
      }
    },
    async fetchHinweisVorlagen() {
      const response = await fetchWithAuth('hinweis-vorlagen?sort=strg:asc');
      const data = response.data.map((item: Attributes) => item.attributes);
      if (!isHinweisVorlageArray(data)) {
        throw new Error('Ungültige Antwort von Strapi für Hinweisvorlagen!');
      }
      this.hinweisVorlagen = data;
    },
    async fetchUsers() {
      const usersResponse = await fetchWithAuth('users');
      if (!isUserArray(usersResponse)) {
        throw new Error('Ungültiges User-Array!');
      }
      this.users = usersResponse;
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
      if (!isAusnahmenArray(ausnahmen)) {
        throw new Error('Ungültiges Ausnahmen-Array!');
      }
      this.ausnahmen = ausnahmen;
    },
    async fetchLeitcodes() {
      const leitcodesData = await fetchWithAuth('leitcodes?populate=*');
      const leitcodes = leitcodesData.data.map((item: { attributes: Leitcode }) => item.attributes);
      if (!isLeitcodeArray(leitcodes)) {
        throw new Error('Ungültiges Leitcode-Array!');
      }
      this.leitcodes = leitcodes;
    },
    async strapi2localStorage() {
      Promise.all([
        this.fetchUsers(),
        this.fetchEinstellungen(),
        this.fetchAusnahmen(),
        this.fetchLeitcodes(),
        this.fetchHinweisVorlagen(),
        this.fetchBarcodeMitHinweise()
      ]).then(() => {
      }).catch((error) => {
        console.error('Fehler beim Synchronisieren der Daten:', error);
      });
    },
    async localStorage2strapi() {
      Promise.all([
        this.postBarcodes(),
        this.postZeiterfassung()
      ]).then(() => {
      }).catch((error) => {
        console.error('Fehler beim Synchronisieren der Daten:', error);
      });
    }
  },
  persist: {
    storage: localStorage // Speichert den Zustand im localStorage
  }
});
