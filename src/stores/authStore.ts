import { defineStore } from 'pinia';
import config from '../composables/config';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string | null,
    rolle: '' as string | null,
    username: '' as string | null,
    id: 0 as number | null,
    teamAndUserIds: [] as number[],
  }),
  getters: {
    userRole: (state) => state.rolle,
    userName: (state) => state.username,
    userToken: (state) => state.token,
    userId: (state) => state.id,
    userTeamAndUserIds: (state) => state.teamAndUserIds,
  },
  actions: {
    async authenticateUser({ identifier, password }: { identifier: string; password: string }) {
      const configData = await config();
      const url = configData.api.strapi + 'auth/local';

      const response = await fetch(url, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            identifier,
            password,
        }),
      });

      const data = await response.json();

      if (data.jwt) {
        this.token = data.jwt;
        this.rolle = data.user.rolle;
        this.username = data.user.username;
        this.id = data.user.id;
        this.teamAndUserIds = [data.user.id];
        return true;
      } else {
        return false;
      }
    },
    removeToken() {
      this.token = null;
      this.rolle = null;
      this.username = null;
      this.id = null;
      this.teamAndUserIds = [];
    },
  },
  persist: {
    storage: sessionStorage
  },
});