import { defineStore } from 'pinia';
import config from '../composables/config';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem('token') || null, // Token aus sessionStorage laden
    rolle: sessionStorage.getItem('rolle') || null, // Rolle aus sessionStorage laden
    username: sessionStorage.getItem('username') || null, // Benutzername aus sessionStorage laden
    id: sessionStorage.getItem('id') || null, // Benutzername aus sessionStorage laden
  }),
  getters: {
    userRole: (state) => state.rolle,
    userName: (state) => state.username,
    userToken: (state) => state.token,
    userId: (state) => state.id,
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

      console.log('authStore.authenticateUser', data);

      if (data.jwt) {
        this.token = data.jwt;
        this.rolle = data.user.rolle; // Rolle speichern
        this.username = data.user.username; // Benutzername speichern
        this.id = data.user.id;
        sessionStorage.setItem('token', data.jwt); // Token im sessionStorage speichern
        sessionStorage.setItem('rolle', data.user.rolle); // Rolle im sessionStorage speichern
        sessionStorage.setItem('username', data.user.username); // Benutzername im sessionStorage speichern
        sessionStorage.setItem('id', data.user.id); // Benutzername im sessionStorage speichern

        console.log('authStore.authenticateUser2', this.token, this.rolle, this.username, this.id);

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
      sessionStorage.removeItem('token'); // Token aus sessionStorage entfernen
      sessionStorage.removeItem('rolle'); // Rolle aus sessionStorage entfernen
      sessionStorage.removeItem('username'); // Benutzername aus sessionStorage entfernen
      sessionStorage.removeItem('id'); // Benutzername aus sessionStorage entfernen
    },
  },
});
