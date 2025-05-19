import { AuthResponse } from '@/interfaces';
import config from '../composables/config';
import { defineStore } from 'pinia';

let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    id: 0 as number | null,
    rolle: '' as string | null,
    token: '' as string | null,
    username: '' as string | null,
  }),
  getters: {
    userRole: (state) => state.rolle,
    userName: (state) => state.username,
    userToken: (state) => state.token,
    userId: (state) => state.id,
  },
  actions: {
    async authenticateUser({ identifier, password }: { identifier: string; password: string }) {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      return new Promise<boolean>((resolve) => {
        debounceTimeout = setTimeout(async () => {
          const configData = await config();
          const url = configData.api.strapi + 'auth/local';

          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                identifier,
                password,
              }),
            });


            let data: AuthResponse;
            try {
              data = await response.json();
            } catch (error) {
              console.error('Failed to parse JSON response:', error);
              resolve(false);
              return;
            }

            if (
              data &&
              typeof data === 'object' &&
              'jwt' in data &&
              'user' in data &&
              typeof data.user === 'object' &&
              'rolle' in data.user &&
              'username' in data.user &&
              'id' in data.user
            ) {
              this.token = data.jwt;
              this.rolle = data.user.rolle;
              this.username = data.user.username;
              this.id = data.user.id;
              resolve(true);
            } else {
              console.error('Invalid response structure or missing properties:', data);
              resolve(false);
            }
          } catch (error) {
            console.error('Network error:', error);
            resolve(false);
          }
        }, 300); // Adjust debounce delay as needed
      });
    },
  },
  persist: {
    storage: sessionStorage,
  },
});