<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { onMounted, ref } from 'vue';
import HistoryComponent from '@/components/HistoryComponent.vue';
import HinweisComponent from '@/components/HinweisComponent.vue';
import HinweisVorlagenComponent from '@/components/HinweisVorlagenComponent.vue';
import { useTeamStore } from '@/stores/teamStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useHinweisVorlageStore } from '@/stores/hinweisVorlageStore';
import { useHinweisStore } from '@/stores/hinweisStore';
import { useBarcodeStore } from '@/stores/barcodeStore';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useLocalStore } from '@/stores/localStore';
// import { getCurrentWindow } from '@tauri-apps/api/window';
import type { Barcode2Strapi } from '@/interfaces';
const teamStore = useTeamStore();
const localStore = useLocalStore();
const appStore = useAppStore();
const barcodeInput = ref('');
const authStore = useAuthStore();
const { userRole, userId, userToken } = storeToRefs(authStore);
const { team, checked, teamIds, lagerUsers } = storeToRefs(teamStore);
const { settings, ausnahmen, leitcodes } = storeToRefs(localStore);
const { isOnline } = storeToRefs(appStore);
const historyStore = useHistoryStore();
// const { history } = storeToRefs(historyStore);

listen('sendebarcode', (event) => {
  processBarcode(event.payload as string);
});

onMounted(async () => {
  await localStore.strapi2localStorage();
});

// const bringWindowToFront = async () => {
//     const currentWindow = getCurrentWindow();
//     const isminimized = await currentWindow.isMinimized();
//     if (isminimized) {
//         await currentWindow.maximize();
//         await currentWindow.setFocus();
//     }
// };

const processBarcode = async (binp = '') => {
  const barcodeStore = useBarcodeStore();
  const { barcode } = storeToRefs(barcodeStore);
  const hinweisStore = useHinweisStore();
  const { hinweis, hinweisUmgesetzt } = storeToRefs(hinweisStore);

  const hinweisVorlageStore = useHinweisVorlageStore();
  const { selectedVorlage } = storeToRefs(hinweisVorlageStore);

  // Falls es einen Hinweis gibt, muss dieser zuerst Beachtet werden
  if (hinweis.value && !hinweisUmgesetzt.value && userRole.value === 'Lager') {
    const message = `❗Bitte Hinweis zu Barcode ${barcode.value} zuerst beachten.`;
    invoke('show_notification', { message });
    barcodeInput.value = '';
    return;
  }

  selectedVorlage.value = '';
  const barcodeValue = binp || barcodeInput.value;
  const barcodeMatch = await hinweisVorlageStore.checkBarcodeMatchWithVorlageBarcode(barcodeValue);
  if (barcodeMatch) {
    barcodeInput.value = '';
    return;
  }

  barcode.value = barcodeValue;
  if (!barcode.value || barcode.value === '') {
    invoke('show_notification', { message: '❗Bitte zuerst Barcode scannen.' });
    return;
  }
  barcodeInput.value = '';

  const userID = Number(userId.value);
  if (!userID) {
    console.error('Fehler: userId ist nicht definiert.');
    return;
  }

  if (isOnline.value) {
    // Wenn online, dann Barcode an Strapi senden
    const result: unknown = await invoke('process_barcode', {
      barcode: barcode.value,
      uid: userID,
      jwt: userToken.value,
      luids: teamIds.value,
      rolle: userRole.value,
      einstellungen: settings.value,
      ausnahmen: ausnahmen.value,
      leitcodes: leitcodes.value
    });
    // result wird später gebraucht, wenn Sqlite durch LocalStorage ersetzt wird
    console.log('Result from process_barcode:', result);
  } else {
    // Wenn offline, dann Barcode in LocalStorage speichern
    const barcode2strapi: Barcode2Strapi = {
      barcode: barcode.value,
      users_permissions_user: userID,
      lager_mitarbeiter: teamIds.value
    };
    localStore.barcode2strapi.push(barcode2strapi);
  }

  historyStore.loadHistory();
  hinweisStore.ladeHinweis();
};
</script>

<template>
  <Fluid class="flex flex-col md:flex-row gap-4">
    <div class="flex flex-col w-1/4">
      <div class="card flex flex-col gap-4">
        <div tabindex="0" @keyup.enter="processBarcode()">
          <IconField>
            <InputIcon class="pi pi-qrcode" />
            <InputText id="barcodei" v-model="barcodeInput" type="text" placeholder="Barcode" />
          </IconField>
          <Button
            id="sendButton" label="Absenden" class="w-full"
            icon="pi pi-send"
            @click="processBarcode()"
          />
        </div>
      </div>

      <div v-if="userRole === 'Lager'">
        <div class="card flex flex-col gap-4">
          <div class="flex flex-col items-start gap-2">
            <div class="font-semibold text-xl">
              <i class="pi pi-users" /> Team
            </div>
            <div class="flex items-center gap-2">
              <ToggleSwitch
                id="toggleSwitch" v-model="checked"
                @update:model-value="teamStore.onToggleChangeVerpackeAlleine"
              />
              <label for="toggleSwitch" class="text-lg">Ich verpacke alleine</label>
            </div>
            <MultiSelect
              v-show="!checked" v-model="team" :options="lagerUsers"
              option-label="username" placeholder="Mitarbeiter auswählen" :filter="true"
              @change="teamStore.changeTeam"
            />
          </div>
        </div>
      </div>
      <HinweisVorlagenComponent />
    </div>
    <HinweisComponent />
    <HistoryComponent />
  </Fluid>
</template>
