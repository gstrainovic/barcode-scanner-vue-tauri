import { defineStore, storeToRefs } from 'pinia';
import { hostname } from '@tauri-apps/plugin-os';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const { userId } = storeToRefs(authStore);

export enum ZeiterfassungTypEnum {
  Login = "login",
  Logout = "logout",
  Nutzerwechsel = "nutzerwechsel",
  AppSchliessung = "app_schliessung"
}

export enum LoginOrLogoutEnum {
  Login = "login",
  Logout = "logout"
}

export enum AbteilungEnum {
  Produktion = "produktion",
  Lager = "lager",
}

interface ZeiterfassungBody {
  typ: ZeiterfassungTypEnum;
  mitarbeiter: number;
  login_or_logout: LoginOrLogoutEnum;
  geraete_name: string;
  abteilung: AbteilungEnum;
}

const protokolliereArbeitszeit = async (body: ZeiterfassungBody) => {
  const { fetchWithAuth } = await useApi();
  const data = {
    ...body,
    zeitpunkt: new Date().toISOString()
  };

  const result = await fetchWithAuth('zeit-erfassungen', data);
  console.log('protokolliereArbeitszeit:', result, data);
}


export const useArbeitszeitStore = defineStore('arbeitszeit', {
  state: () => ({
    deviceName: null as string | null,
  }),
  actions: {
    async setDeviceName() {
      this.deviceName =  await hostname();
      console.log('Host Name:', this.deviceName);
    },
    async login() {
      const userIdNumber = userId.value;
      if (!userIdNumber) {
        console.error('User ID is not available. Please log in first.');
        return;
      }
      const body: ZeiterfassungBody = {
        typ: ZeiterfassungTypEnum.Login,
        mitarbeiter: userIdNumber,
        login_or_logout: LoginOrLogoutEnum.Login,
        geraete_name: this.deviceName as string,
        abteilung: AbteilungEnum.Produktion
      };
      await protokolliereArbeitszeit(body);
    }
  },
  persist: {
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});