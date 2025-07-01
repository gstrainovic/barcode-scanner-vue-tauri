<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { listen } from '@tauri-apps/api/event';
import { onMounted } from 'vue';
import HistoryComponent from '@/components/HistoryComponent.vue';
import HinweisComponent from '@/components/HinweisComponent.vue';
import HinweisVorlagenComponent from '@/components/HinweisVorlagenComponent.vue';
import { useAppStore } from '@/stores/appStore';
import { useTeamStore } from '@/stores/teamStore';
import { useAuthStore } from '@/stores/authStore';
import { useBarcodeStore } from '@/stores/barcodeStore';
// import { getCurrentWindow } from '@tauri-apps/api/window';
const teamStore = useTeamStore();
const authStore = useAuthStore();
const { userRole } = storeToRefs(authStore);
const { team, checked, lagerUsers } = storeToRefs(teamStore);
const barcodeStore = useBarcodeStore();
const { barcodeInput } = storeToRefs(barcodeStore);
// const { history } = storeToRefs(historyStore);

listen('sendebarcode', (event) => {
  barcodeStore.processBarcode(event.payload as string);
});

onMounted(async () => {
  const appStore = useAppStore();
  await appStore.onlineCheck(); // einmalig den Online-Status setzen
});

// const bringWindowToFront = async () => {
//     const currentWindow = getCurrentWindow();
//     const isminimized = await currentWindow.isMinimized();
//     if (isminimized) {
//         await currentWindow.maximize();
//         await currentWindow.setFocus();
//     }
// };
</script>

<template>
  <Fluid class="flex flex-col md:flex-row gap-4">
    <div class="flex flex-col w-1/4">
      <div class="card flex flex-col gap-4">
        <div tabindex="0" @keyup.enter="barcodeStore.processBarcode()">
          <IconField>
            <InputIcon class="pi pi-qrcode" />
            <InputText id="barcodei" v-model="barcodeInput" type="text" placeholder="Barcode" />
          </IconField>
        </div>
        <Button
          id="sendButton" label="Absenden" class="w-full"
          icon="pi pi-send"
          @click="barcodeStore.processBarcode()"
        />
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
