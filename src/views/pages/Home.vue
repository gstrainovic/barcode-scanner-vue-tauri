<script setup lang="ts">
import { ref } from 'vue';
import { useTeamStore } from '@/stores/teamStore';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useMyFetch } from '@/composables/myFetch';
import { invoke } from '@tauri-apps/api/core';
import { marked } from 'marked';
import Editor from 'primevue/editor';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useToast } from "primevue/usetoast";
import { getToastMessage } from '@/composables/helpers';

const teamStore = useTeamStore();
const authStore = useAuthStore();
const { team, checked } = storeToRefs(teamStore);
const { userRole, userId, userToken } = storeToRefs(authStore);
const usernames = ref<{ username: any; id: any }[]>([]);
const hist = ref<{ status: string; barcode: string; timestamp: string }[]>([]);
const barcodeInput = ref('');
const hinweise = ref('');
const lastBarcode = ref('');
const barcode = ref('');
const toast = useToast();

listen('sendebarcode', (event) => {
  processBarcode(event.payload as string);
});

onMounted(async () => {
    const { getUsersLager } = await useMyFetch();
    usernames.value = await getUsersLager();
    hist.value = await invoke<[]>('load_history');
});

const showToast = (success: boolean, message: string) => {
    toast.add(getToastMessage(success, message));
};

const statusClass = (status: string) => {
    if (status.startsWith('@C03')) {
        return 'text-orange-500';
    } else if (status.startsWith('@C88')) {
        return 'text-red-500';
    } else {
        return 'text-green-500';
    }

};

const displayStatus = (status: string) => {
    if (status.startsWith('@C03')) {
        return status.replace('@C03', '');
    } else if (status.startsWith('@C88')) {
        return status.replace('@C88', '');
    } else {
        return status;
    }
};

const ladeHinweise = async () => {
    try {
        const { getHinweiseFromBarcode } = await useMyFetch();
        lastBarcode.value = barcodeInput.value;
        const result = await getHinweiseFromBarcode(barcodeInput.value);
        hinweise.value = await marked.parse(result.hinweiseString || '');
    } catch (error) {
        console.error('Fehler beim Laden der Hinweise:', error);
    }
};

const processBarcode = async (binp = '') => {
    barcode.value = binp || barcodeInput.value;
    if (!barcode.value || barcode.value === '') {
        console.error('Fehler: Barcode ist nicht definiert.', barcode.value);
        showToast(false, 'Bitte Barcode scannen.');
        return;
    }

    ladeHinweise();

    const userID: Number = Number(userId.value);
    if (!userID) {
        console.error('Fehler: userId ist nicht definiert.');
        return;
    }

    const lager_user_ids = team.value.map((user) => user.id);

    await invoke('process_barcode', {
        barcode: barcode.value,
        uid: userID,
        jwt: userToken.value,
        luids: lager_user_ids,
        rolle: userRole.value,
    })

    hist.value = await invoke<[]>('load_history');

    const lastHistory = hist.value[0] as { status: string; barcode: string; timestamp: string };
    if (lastHistory.status.startsWith('@C88')) {
        await getCurrentWindow().maximize();
        showToast(false, lastHistory.status.replace('@C88', ''));
    } else if (lastHistory.status.startsWith('@C03')) {
        await getCurrentWindow().maximize();
        showToast(false, lastHistory.status.replace('@C03', ''));
    } else {
        showToast(true, 'Barcode erfolgreich verarbeitet.');
    }

    barcodeInput.value = '';
};


const speichereHinweise = async () => {
    console.log('starte speichereHinweisex');

    if (!hinweise.value || hinweise.value === '') {
        showToast(false, 'Bitte Hinweise eingeben.');
        return;
    }

    if (!lastBarcode.value || lastBarcode.value === '') {
        showToast(false, 'Bitte Barcode scannen.');
        return;
    }

    const userID: Number = Number(userId.value);
    if (!userID) {
        console.error('Fehler: userId ist nicht definiert.');
        return;
    }

    console.log('speichere hinweise', hinweise.value, lastBarcode.value);
    const { postHinweise } = await useMyFetch();
    const result = await postHinweise(hinweise.value, lastBarcode.value);
    console.log('result', result);

    // wenn der result den barcode und die hinweise enthält, dann ist es erfolgreich
    if (result?.data?.attributes?.barcode && result?.data?.attributes?.hinweise) {
        showToast(true, 'Hinweise gespeichert.');
    } else {
        showToast(false, 'Fehler beim Speichern der Hinweise.');
    }
};

</script>

<template>
        <Fluid class="flex flex-col md:flex-row gap-4">
            <div class="md:w-1/3">
                <div class="card flex flex-col gap-3">
                    <div @keyup.enter="processBarcode()" tabindex="0">
                        <IconField>
                            <InputIcon class="pi pi-qrcode" />
                            <InputText id="barcodei" type="text" placeholder="Barcode" v-model="barcodeInput" />
                        </IconField>
                        <Button label="Absenden" class="w-full" icon="pi pi-send" id="sendButton"
                            @click="processBarcode()"></Button>
                    </div>
                </div>
            </div>

            <div class="md:w-1/3 " v-if="userRole === 'Lager'">
                <div class="card flex flex-col gap-4">
                    <div class="flex mb-1">
                        <div class="font-semibold text-xl"><i class="pi pi-users"></i> Team</div>
                        <ToggleSwitch class="ml-14" v-model="checked" id="toggleSwitch"></ToggleSwitch>
                        <label for="toggleSwitch" class="ml-2 mb-1 text-lg">Ich verpacke alleine</label>
                    </div>
                    <MultiSelect v-model="team" :options="usernames" optionLabel="username"
                        placeholder="Mitarbeiter auswählen" :filter="true" v-show="!checked">
                    </MultiSelect>
                </div>
            </div>
        </Fluid>

        <Fluid class="flex flex-col md:flex-row gap-4">
            <div class="card flex flex-col w-1/2 mt-4">
                <div class="font-semibold text-xl mb-6"><i class="pi pi-exclamation-triangle"></i> Hinweise zu {{ barcode }}</div>
                <Editor :readonly="!barcode" v-model="hinweise" :style="{ height: '360px' }" />
                <br>
                <Button v-if="barcode" icon="pi pi-send" label="Speichern" class="w-full" @click="speichereHinweise()"></Button>
            </div>

            <div class="flex flex-col w-1/2 mt-4">
                <div class="table-container">
                    <DataTable :value="hist" tableStyle="min-width: 50rem" :sortField="'timestamp'" :sortOrder="-1"
                        paginator :rows="4">
                        <Column field="status" header="Status" sortable style="width: 20%;font-size: 1.9rem;">
                            <template #body="slotProps">
                                <span :class="statusClass(slotProps.data.status)">{{
                                    displayStatus(slotProps.data.status)
                                    }}</span>
                            </template>
                        </Column>
                        <Column field="barcode" header="Barcode" sortable style="width: 50%;font-size: 1.9rem"></Column>
                        <Column field="timestamp" header="Datum" sortable style="width: 30%;font-size: 1.9rem"></Column>
                    </DataTable>
                </div>
            </div>
        </Fluid>
        <br>

</template>
