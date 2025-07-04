<script setup lang="ts">
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useTeamStore } from '@/stores/teamStore';
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useArbeitszeitStore } from '@/stores/arbeitsZeitStore';
const appStore = useAppStore();
const router = useRouter();
const password = ref('');
const loginFailed = ref(false);
const email = ref('');
const { isDarkTheme } = useLayout();
const arbeitszeitStore = useArbeitszeitStore();

onMounted(async () => {
  await arbeitszeitStore.setDeviceName(); // einmalig den Gerätenamen setzen
  await appStore.onlineCheck(); // einmalig den Online-Status setzen
});

const login = async () => {
  email.value = email.value.charAt(0).toUpperCase() + email.value.slice(1).toLowerCase();
  const authStore = useAuthStore();
  if (await authStore.authenticateUser({ identifier: email.value, password: password.value })) {
    const { userRole } = storeToRefs(authStore);
    const teamStore = useTeamStore();
    await teamStore.getUsersLager(); // einmalig die User für Lager holen
    await appStore.setTeamAndUserIds();
    await arbeitszeitStore.login();
    if (userRole.value === 'Lager') {
      router.push('/team');
    } else {
      router.push('/');
    }
  } else {
    loginFailed.value = true;
  }
};
</script>

<template>
  <div
    tabindex="0" class="pt-8 bg-surface-50 dark:bg-surface-950 flex items-center justify-center overflow-hidden"
    @keyup.enter="login"
  >
    <div class="flex flex-col items-center justify-center">
      <div
        style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)"
      >
        <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
          <div class="col-12 mt-2 xl:mt-0 text-center">
            <img
              :src="isDarkTheme ? '/images/logo.svg' : '/images/logo-white.svg'"
              class="b-8 w-16 shrink-0 mx-auto mb-12" style="width:300px; height:100px;"
            >
          </div>
          <div>
            <label
              for="email1"
              class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
            >Benutzername</label>
            <InputText
              id="email1" v-model="email" type="text"
              placeholder="Benutzername"
              class="w-full md:w-[30rem] mb-8"
            />
            <label
              for="password1"
              class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2"
            >Passwort</label>
            <Password
              id="password1" v-model="password" placeholder="Passwort"
              :toggle-mask="true"
              class="mb-4" fluid :feedback="false"
            />
            <Button label="Anmelden" class="w-full p-3 text-xl" @click.prevent="login" />
            <Message v-if="loginFailed" severity="error">
              Anmeldung fehlgeschlagen.
            </Message>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
