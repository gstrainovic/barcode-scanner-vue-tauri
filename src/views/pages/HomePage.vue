<script setup lang="ts">
import HistoryComponent from '@/components/HistoryComponent.vue';
import HinweisComponent from '@/components/HinweisComponent.vue';
import HinweisVorlagenComponent from '@/components/HinweisVorlagenComponent.vue';
import { config } from '@/utils/config';
import { useToast } from "primevue/usetoast";
import { useTeamStore } from '@/stores/teamStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useHinweisVorlageStore } from '@/stores/hinweisVorlageStore';
import { useHinweisStore } from '@/stores/hinweisStore';
import { useBarcodeStore } from '@/stores/barcodeStore';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { storeToRefs } from 'pinia';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { ref } from 'vue';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { getErrorToastMessage, getSuccessToastMessage, getWarningToastMessage } from '@/utils/toastUtils';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted } from 'vue';
const toast = useToast();
const teamStore = useTeamStore();
const syncStore = useSyncStore();
const barcodeInput = ref('');
const authStore = useAuthStore();
const { userRole, userId, userToken } = storeToRefs(authStore);
const { team, checked, teamIds, lagerUsers } = storeToRefs(teamStore);
const { settings, ausnahmen, leitcodes } = storeToRefs(syncStore);

listen('sendebarcode', (event) => {
    processBarcode(event.payload as string);
});

onMounted(async () => {
    console.log('HomePage mounted');
    const syncStore = useSyncStore();
    await syncStore.strapi2localStorage();
});

const bringWindowToFront = async () => {
    const currentWindow = getCurrentWindow();
    const isminimized = await currentWindow.isMinimized();
    if (isminimized) {
        await currentWindow.maximize();
        await currentWindow.setFocus();
    }
};

const processBarcode = async (binp = '') => {
    const barcodeStore = useBarcodeStore();
    const { barcode } = storeToRefs(barcodeStore);
    const hinweisStore = useHinweisStore();
    const { hinweis, hinweisUmgesetzt } = storeToRefs(hinweisStore);
    const historyStore = useHistoryStore();
    const { history } = storeToRefs(historyStore);
    const hinweisVorlageStore = useHinweisVorlageStore();
    const { selectedVorlage } = storeToRefs(hinweisVorlageStore);

    // Falls es einen Hinweis gibt, muss dieser zuerst Beachtet werden
    if (hinweis.value && !hinweisUmgesetzt.value && userRole.value === 'Lager') {
        const message = 'Bitte Hinweis zu Barcode ' + barcode.value + ' zuerst beachten.';
        toast.add(getErrorToastMessage(message));
        sendNotification({
            title: config.dialog.title,
            body: message,
        });
        barcodeInput.value = '';
        return;
    }

    selectedVorlage.value = '';
    const barcodeValue = binp || barcodeInput.value;
    const barcodeMatch = await hinweisVorlageStore.checkBarcodeMatchWithVorlageBarcode(barcodeValue);
    if (barcodeMatch) {
        console.log('Barcode match found with Vorlage Barcode.');
        barcodeInput.value = '';
        return;
    }

    barcode.value = barcodeValue;
    if (!barcode.value || barcode.value === '') {
        toast.add(getErrorToastMessage('Bitte Barcode scannen'));
        return;
    }
    barcodeInput.value = '';

    const userID: number = Number(userId.value);
    if (!userID) {
        console.error('Fehler: userId ist nicht definiert.');
        return;
    }

    await invoke('process_barcode', {
        barcode: barcode.value,
        uid: userID,
        jwt: userToken.value,
        luids: teamIds.value,
        rolle: userRole.value,
        einstellungen: settings.value,
        ausnahmen: ausnahmen.value,
        leitcodes: leitcodes.value,
    });

    historyStore.loadHistory();
    const lastHistory = history.value[0] as { status: string; barcode: string; timestamp: string };
    if (lastHistory.status.startsWith('@C88')) {
        await bringWindowToFront();
        toast.add(getErrorToastMessage(lastHistory.status.replace('@C88', '')));
    } else if (lastHistory.status.startsWith('@C03')) {
        await bringWindowToFront();
        toast.add(getWarningToastMessage(lastHistory.status.replace('@C03', '')));
    } else {
        toast.add(getSuccessToastMessage('Barcode erfolgreich verarbeitet.'));
    }

    hinweisStore.ladeHinweis();
};
</script>

<template>
    <Fluid class="flex flex-col md:flex-row gap-4">
        <div class="flex flex-col w-1/4">
            <div class="card flex flex-col gap-4">
                <div @keyup.enter="processBarcode()" tabindex="0">
                    <IconField>
                        <InputIcon class="pi pi-qrcode" />
                        <InputText id="barcodei" type="text" placeholder="Barcode" v-model="barcodeInput" />
                    </IconField>
                    <Button label="Absenden" class="w-full" icon="pi pi-send" id="sendButton"
                        @click="processBarcode()"></Button>
                </div>
            </div>

            <div v-if="userRole === 'Lager'">
                <div class="card flex flex-col gap-4">
                    <div class="flex flex-col items-start gap-2">
                        <div class="font-semibold text-xl"><i class="pi pi-users"></i> Team</div>
                        <div class="flex items-center gap-2">
                            <ToggleSwitch v-model="checked" id="toggleSwitch"
                                @update:modelValue="teamStore.onToggleChangeVerpackeAlleine"></ToggleSwitch>
                            <label for="toggleSwitch" class="text-lg">Ich verpacke alleine</label>
                        </div>
                        <MultiSelect v-model="team" :options="lagerUsers" optionLabel="username"
                            @change="teamStore.changeTeam" placeholder="Mitarbeiter auswählen" :filter="true"
                            v-show="!checked">
                        </MultiSelect>
                    </div>
                </div>
            </div>
            <HinweisVorlagenComponent />
        </div>
        <HinweisComponent />
        <HistoryComponent />
    </Fluid>
    <br>
</template>
