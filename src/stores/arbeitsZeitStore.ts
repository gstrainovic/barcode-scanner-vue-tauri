import { defineStore, storeToRefs } from 'pinia';
import { hostname } from '@tauri-apps/plugin-os';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
const authStore = useAuthStore();
const { userRole } = storeToRefs(authStore);

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
  abteilung: AbteilungEnum | string;
}

const protokolliereArbeitszeit = async (body: ZeiterfassungBody) => {
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
      this.deviceName = await hostname();
      console.log('Host Name:', this.deviceName);
    },
    async login(typ = ZeiterfassungTypEnum.Login) {
      const appStore = useAppStore();
      const { teamAndUserIds } = storeToRefs(appStore);
      const abteilung = userRole.value;
      if (!abteilung) {
        console.error('Abteilung is not available. Please log in first.');
        return;
      }
      // for (const userId of teamAndUserIds.value) {
      //   const body: ZeiterfassungBody = {
      //     typ,
      //     mitarbeiter: userId,
      //     login_or_logout: LoginOrLogoutEnum.Login,
      //     geraete_name: this.deviceName as string,
      //     abteilung
      //   };
      //   await protokolliereArbeitszeit(body);
      // }
      await Promise.all(
        teamAndUserIds.value.map(async (userId) => {
          const body: ZeiterfassungBody = {
            typ,
            mitarbeiter: userId,
            login_or_logout: LoginOrLogoutEnum.Login,
            geraete_name: this.deviceName as string,
            abteilung
          };
          await protokolliereArbeitszeit(body);
        })
      );
    },
    async logout(typ = ZeiterfassungTypEnum.Logout) {
      const appStore = useAppStore();
      const { teamAndUserIds } = storeToRefs(appStore);

      const abteilung = userRole.value;
      if (!abteilung) {
        console.error('Abteilung is not available. Please log in first.');
        return;
      }

      // for (const userId of teamAndUserIds.value) {
      //   const body: ZeiterfassungBody = {
      //     typ,
      //     mitarbeiter: userId,
      //     login_or_logout: LoginOrLogoutEnum.Logout,
      //     geraete_name: this.deviceName as string,
      //     abteilung
      //   };
      //   await protokolliereArbeitszeit(body);
      // }
      await Promise.all(
        teamAndUserIds.value.map(async (userId) => {
          const body: ZeiterfassungBody = {
            typ,
            mitarbeiter: userId,
            login_or_logout: LoginOrLogoutEnum.Logout,
            geraete_name: this.deviceName as string,
            abteilung
          };
          await protokolliereArbeitszeit(body);
        })
      );
    },
    async appSchliessung() {
      await this.logout(ZeiterfassungTypEnum.AppSchliessung);
    },
    async nutzerWechsel() {
      await this.logout(ZeiterfassungTypEnum.Nutzerwechsel);
      await this.login(ZeiterfassungTypEnum.Nutzerwechsel);
    },
  },
  persist: {
    storage: sessionStorage, // Speichert den Zustand im sessionStorage
  },
});