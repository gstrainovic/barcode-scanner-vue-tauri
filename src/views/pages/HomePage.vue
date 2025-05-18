<script setup lang="ts">
import { ref } from 'vue';
import { useTeamStore } from '@/stores/teamStore';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useMyFetch } from '@/composables/myFetch';
import { invoke } from '@tauri-apps/api/core';
import { marked } from 'marked';
import Editor from 'primevue/editor';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useToast } from "primevue/usetoast";
import { getErrorToastMessage, getSuccessToastMessage, getWarningToastMessage } from '@/composables/helpers';
import { message } from '@tauri-apps/plugin-dialog';
import config from '@/composables/config';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { sendNotification } from '@tauri-apps/plugin-notification';

const teamStore = useTeamStore();
const authStore = useAuthStore();
const appStore = useAppStore();
const { team, checked, teamIds, lagerUsers } = storeToRefs(teamStore);
const { userRole, userId, userToken } = storeToRefs(authStore);
const { teamAndUserIds } = storeToRefs(appStore); 
const hist = ref<{ status: string; barcode: string; timestamp: string }[]>([]);
const barcodeInput = ref('');
const hinweis = ref('');
const barcode = ref('');
const toast = useToast();
const barcodeId = ref('');
const hinweisUmgesetzt = ref(false);
interface HinweisVorlage {
    id: number;
    titel: string;
    text: string;
    strg: string;
    barcode?: string;
}
const hinweisVorlagen = ref<HinweisVorlage[]>([]);
const selectedVorlage = ref('');

listen('sendebarcode', (event) => {
    processBarcode(event.payload as string);
});

onMounted(async () => {
    hist.value = await invoke<[]>('load_history');
    if (userRole.value === 'Produktion') {
        await ladeHinweisVorlagen();
        await registerHinweisVorlagenShortcuts();
    }
});

const registerHinweisVorlagenShortcuts = async () => {
    // Erst abmelden, dann beide Varianten registrieren
    await unregisterAll();
    for (const vorlage of hinweisVorlagen.value) {
        const hotkeyMain = 'CommandOrControl+' + vorlage.strg; // z.B. CommandOrControl+1
        const hotkeyNumpad = 'CommandOrControl+Numpad' + vorlage.strg; // z.B. CommandOrControl+Numpad1


        await register(hotkeyMain, async (event) => {
            if (event.state === "Released") {
                await setHinweis(vorlage);
                await speichereHinweis();
            }
        });
        await register(hotkeyNumpad, async (event) => {
            if (event.state === "Released") {
                await setHinweis(vorlage);
                await speichereHinweis();
            }
        });
    }
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

const ladeHinweis = async () => {
    const { getHinweisFromBarcode } = await useMyFetch();
    const result = await getHinweisFromBarcode(barcode.value);
    const umgesetzt : boolean = result.attributes.hinweis_umgesetzt_von.data.length > 0;
    hinweisUmgesetzt.value= umgesetzt;

    if (!result?.id) {
        hinweis.value = '';
        return;
    }
    barcodeId.value = result.id;
    hinweis.value = await marked.parse(result.attributes.hinweis || '');
    if (result.attributes.hinweis) {
        const Config = await config();
        message('Es gibt einen Hinweis zu Barcode ' + barcode.value, {
            title: Config.dialog.title,
            kind: 'warning',
        });
    }
};

const bringWindowToFront = async () => {
    const currentWindow = getCurrentWindow();
    const isminimized = await currentWindow.isMinimized();
    if (isminimized) {
        await currentWindow.maximize();
        await currentWindow.setFocus();
    }
};


const checkBarcodeMatchWithVorlageBarcode = async (barcodeInput: string) => {
    if (hinweisVorlagen.value.length > 0 && barcodeInput) {
        const barcodeVorlage = hinweisVorlagen.value.find((vorlage) => vorlage.barcode === barcodeInput);
        if (barcodeVorlage) {
            await setHinweis(barcodeVorlage);
            return true;
        }
    }
    return false;
};

const processBarcode = async (binp = '') => {
    // Falls es einen Hinweis gibt, muss dieser zuerst Beachtet werden
    if (hinweis.value && hinweis.value !== '' && hinweisUmgesetzt.value === false) {
        const Config = await config();
        const message = 'Bitte Hinweis zu Barcode ' + barcode.value + ' zuerst beachten.';
        toast.add(getErrorToastMessage(message));
        sendNotification({
            title: Config.dialog.title,
            body: message,
        });
        barcodeInput.value = '';
        return;
    }


    selectedVorlage.value = '';
    const barcodeValue = binp || barcodeInput.value;
    const barcodeMatch = await checkBarcodeMatchWithVorlageBarcode(barcodeValue);
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
    });

    hist.value = await invoke<[]>('load_history');

    const lastHistory = hist.value[0] as { status: string; barcode: string; timestamp: string };
    if (lastHistory.status.startsWith('@C88')) {
        await bringWindowToFront();
        toast.add(getErrorToastMessage(lastHistory.status.replace('@C88', '')));
    } else if (lastHistory.status.startsWith('@C03')) {
        await bringWindowToFront();
        toast.add(getWarningToastMessage(lastHistory.status.replace('@C03', '')));
    } else {
        toast.add(getSuccessToastMessage('Barcode erfolgreich verarbeitet.'));
    }

    ladeHinweis();
};

const ladeHinweisVorlagen = async () => {
    const { getHinweisVorlagen } = await useMyFetch();
    hinweisVorlagen.value = await getHinweisVorlagen();
}

const speichereHinweis = async () => {
    if (!barcode.value || barcode.value === '') {
        const Config = await config();
        const message = 'Bitte Barcode zuerst scannen';
        toast.add(getErrorToastMessage(message));
        sendNotification({
            title: Config.dialog.title,
            body: message,
        });
        return;
    }

    const userID: number = Number(userId.value);
    if (!userID) {
        console.error('Fehler: userId ist nicht definiert.');
        return;
    }

    // const teamUndUserIds = teamIds.value.concat(userID);
    const teamUndUserIds = teamAndUserIds.value;
    const createdBy = userRole.value === 'Produktion' ? userID : null;
    const hinweisUmgesetztVon = hinweisUmgesetzt.value ? teamUndUserIds : [];
    const { postHinweis } = await useMyFetch();
    const result = await postHinweis(barcodeId.value, hinweis.value, createdBy, hinweisUmgesetztVon);

    const Config = await config();

    // wenn der result den barcode und die hinweis enthält, dann ist es erfolgreich
    if (result?.data?.attributes?.barcode && result?.data?.attributes?.hinweis == hinweis.value) {
        toast.add(getSuccessToastMessage('Hinweis gespeichert.'));
        sendNotification({
            title: Config.dialog.title,
            body: 'Hinweis zu Barcode ' + barcode.value + ' gespeichert.',
        });
        hinweisUmgesetzt.value = false; // Reset the toggle after saving
    } else {
        toast.add(getErrorToastMessage('Fehler beim Speichern der Hinweis.'));
        sendNotification({
            title: Config.dialog.title,
            body: 'Fehler beim Speichern der Hinweis.',
        });
    }
};

const setHinweis = async (event: HinweisVorlage | { text?: string; value?: string }) => {
    console.log('setHinweis', event);
    const hinweisInput = (event as HinweisVorlage).text || (event as { value?: string }).value;
    console.log('hinweisInput', hinweisInput);
    if (hinweisInput && hinweisInput.length > 2) {
        hinweis.value = await marked.parse(hinweisInput) || '';
    } else {
        hinweis.value = '';
    }
    selectedVorlage.value = hinweisInput ?? '';
    await speichereHinweis();
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
                        <MultiSelect v-model="team" :options="lagerUsers" optionLabel="username" @change="teamStore.changeTeam"
                            placeholder="Mitarbeiter auswählen" :filter="true" v-show="!checked">
                        </MultiSelect>
                    </div>
                </div>
            </div>

            <div class="flex flex-col" v-if="userRole === 'Produktion'">
                <div class="table-container">
                    <DataTable :value="hinweisVorlagen" :sortField="'strg'" :sortOrder="+1" :paginator="false"
                        :rows="10">
                        <template #header>
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <span class="text-xl font-bold">Vorlagen</span>
                            </div>
                        </template>
                        <Column field="titel" header="Titel" sortable style="width: 60%;font-size: 0.8rem;">
                          <template #body="slotProps">
                            <a 
                              href="javascript:void(0)" 
                              class="text-blue-500 hover:underline cursor-pointer" 
                              @click="setHinweis(slotProps.data)">
                              {{ slotProps.data.titel }}
                            </a>
                          </template>
                        </Column>
                        <Column field="strg" header="STRG +" sortable style="width: 40%;font-size: 0.8rem"></Column>
                    </DataTable>
                </div>
            </div>

        </div>

        <div class="flex flex-col w-1/2 mt-1">
            <div class="card flex flex-col mt-1">
                <section>
                    <div class="font-semibold text-xl mb-6 flex items-center justify-between">
                        <div>
                            <i class="pi pi-exclamation-triangle"></i> Hinweis zu: {{ barcode }}
                        </div>
                        <div class="flex items-center gap-2" v-if="userRole === 'Lager'">
                            <ToggleSwitch v-model="hinweisUmgesetzt" @update:modelValue="speichereHinweis"
                                inputId="hinweis_umgesetzt" name="size" value="Small" size="small" />
                            <label for="hinweis_umgesetzt">Beachtet</label>
                        </div>
                        <div class="flex items-center gap-2" v-if="userRole === 'Produktion'">
                            <Select v-model="selectedVorlage" :options="hinweisVorlagen" placeholder="Vorlage auswählen"
                                optionLabel="titel" option-value="text" :filter="true" @change="setHinweis">
                            </Select>
                        </div>
                    </div>
                    <Editor :readonly="!barcode" v-model="hinweis" :style="{ height: '450px' }" />
                    <br>
                    <Button :disabled="!barcode" icon="pi pi-send" label="Speichern" class="w-full"
                        @click="speichereHinweis()"></Button>
                </section>
            </div>
        </div>

        <div class="flex flex-col w-1/2 mt-1">
            <div class="table-container">
                <DataTable :value="hist" :sortField="'timestamp'" :sortOrder="-1" paginator :rows="5">
                    <template #header>
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="text-xl font-bold">Verlauf</span>
                        </div>
                    </template>
                    <Column field="status" header="Status" sortable style="width: 20%;font-size: 1.7rem;">
                        <template #body="slotProps">
                            <span :class="statusClass(slotProps.data.status)">{{
                                displayStatus(slotProps.data.status)
                                }}</span>
                        </template>
                    </Column>
                    <Column field="barcode" header="Barcode" sortable style="width: 50%;font-size: 1.7rem"></Column>
                    <Column field="timestamp" header="Datum" sortable style="width: 30%;font-size: 1.7rem"></Column>
                </DataTable>
            </div>
        </div>
    </Fluid>
    <br>
</template>
