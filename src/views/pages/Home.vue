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
import { getErrorToastMessage, getSuccessToastMessage, getWarningToastMessage } from '@/composables/helpers';
import { message } from '@tauri-apps/plugin-dialog';
import config from '@/composables/config';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';

const teamStore = useTeamStore();
const authStore = useAuthStore();
const { team, checked } = storeToRefs(teamStore);
const { userRole, userId, userToken } = storeToRefs(authStore);
const usernames = ref<{ username: any; id: any }[]>([]);
const hist = ref<{ status: string; barcode: string; timestamp: string }[]>([]);
const barcodeInput = ref('');
const hinweis = ref('');
const barcode = ref('');
const toast = useToast();
const barcodeId = ref('');
const hinweisUmgesetzt = ref(false);
const hinweisVorlagen = ref<any[]>([]);
const selectedVorlage = ref('');

listen('sendebarcode', (event) => {
    processBarcode(event.payload as string);
});

onMounted(async () => {
    const { getUsersLager } = await useMyFetch();
    usernames.value = await getUsersLager();
    hist.value = await invoke<[]>('load_history');
});

const registerHinweisVorlagenShortcuts = async () => {
    for (const vorlage of hinweisVorlagen.value) {
        const hotkey = 'CommandOrControl+' + vorlage.strg;
        // Deregistriere den Hotkey, falls er bereits registriert ist
        await unregister(hotkey);

        // Registriere den Hotkey
        await register(hotkey, async (event) => {
            if (event.state === "Released") {
                if (vorlage.text < 2) {
                    hinweis.value = '';
                } else {
                    hinweis.value = await marked.parse(vorlage.text) || '';
                }
                speichereHinweis();
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

const onToggleChangeVerpackeAlleine = (newValue: boolean) => {
    if (newValue) {
        team.value = [];
    }
};

const onSelectVorlageChange = async (event: any) => {
    if (event.value.length < 2) {
        hinweis.value = '';
    } else {
        hinweis.value = await marked.parse(event.value) || '';
    }
    speichereHinweis();
};

const onToggleChangeHinweisUmgesetzt = (newValue: boolean) => {
    //   const teamUserNames = team.value.map((user) => user.username).join(', ');
    //   const userNameUndTeamUsernames = userName.value + (teamUserNames ? ' (' + teamUserNames + ')' : '');
    //   const nochNichtUmgesetzt = '<br>' + 'Hinweis noch nicht umgesetzt';
    //   const hinweisUmgesetzt = '<br>' + 'Hinweis umgesetzt am ' + new Date().toLocaleDateString('de-DE') + ' von ' + userNameUndTeamUsernames;

    speichereHinweis();

    if (newValue) {
        // Wenn der "Hinweis noch nicht umgesetzt" Text vorhanden ist, dann wird er entfernt
        // if (hinweis.value.includes(nochNichtUmgesetzt)) {
        //     hinweis.value = hinweis.value.replace(nochNichtUmgesetzt, '');
        // }

        // // Wenn es noch kein "Hinweis umgesetzt" gibt, dann wird der Text hinzugefügt
        // if (!hinweis.value.includes(hinweisUmgesetzt)) {
        //     hinweis.value = hinweis.value + hinweisUmgesetzt;
        // }
    } else {
        // Wenn der "Hinweis umgesetzt" Text vorhanden ist, dann wird er entfernt
        // if (hinweis.value.includes(hinweisUmgesetzt)) {
        //     hinweis.value = hinweis.value.replace(hinweisUmgesetzt, '');
        // }

        // // Wenn es noch kein "Hinweis noch nicht umgesetzt" gibt, dann wird der Text hinzugefügt
        // if (!hinweis.value.includes(nochNichtUmgesetzt)) {
        //     hinweis.value = hinweis.value  + nochNichtUmgesetzt;
        // }
    }
};

const processBarcode = async (binp = '') => {
    barcode.value = binp || barcodeInput.value;
    if (!barcode.value || barcode.value === '') {
        console.error('Fehler: Barcode ist nicht definiert.', barcode.value);
        toast.add(getErrorToastMessage('Bitte Barcode scannen.'));
        return;
    }


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
    
    if (userRole.value === 'Produktion') {
        await ladeHinweisVorlagen();
        registerHinweisVorlagenShortcuts();
    }

    barcodeInput.value = '';
};

const ladeHinweisVorlagen = async () => {
    const { getHinweisVorlagen } = await useMyFetch();
    hinweisVorlagen.value = await getHinweisVorlagen();
}

const speichereHinweis = async () => {
    if (!barcode.value || barcode.value === '') {
        toast.add(getErrorToastMessage('Bitte Barcode scannen.'));
        return;
    }

    const userID: Number = Number(userId.value);
    if (!userID) {
        console.error('Fehler: userId ist nicht definiert.');
        return;
    }

    const teamIds = team.value.map((user) => user.id);
    const teamUndUserIds = teamIds.concat(userID);
    const createdBy = userRole.value === 'Produktion' ? userID : null;
    const hinweisUmgesetztVon = hinweisUmgesetzt.value ? teamUndUserIds : [];
    const { postHinweis } = await useMyFetch();
    const result = await postHinweis(barcodeId.value, hinweis.value, createdBy, hinweisUmgesetztVon);

    // wenn der result den barcode und die hinweis enthält, dann ist es erfolgreich
    if (result?.data?.attributes?.barcode && result?.data?.attributes?.hinweis == hinweis.value) {
        toast.add(getSuccessToastMessage('Hinweis gespeichert.'));
    } else {
        toast.add(getErrorToastMessage('Fehler beim Speichern der Hinweis.'));
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
                    <ToggleSwitch class="ml-14" v-model="checked" id="toggleSwitch"
                        @update:modelValue="onToggleChangeVerpackeAlleine"></ToggleSwitch>
                    <label for="toggleSwitch" class="ml-2 mb-1 text-lg">Ich verpacke alleine</label>
                </div>
                <MultiSelect v-model="team" :options="usernames" optionLabel="username"
                    placeholder="Mitarbeiter auswählen" :filter="true" v-show="!checked">
                </MultiSelect>
            </div>
        </div>
    </Fluid>

    <Fluid class="flex flex-col md:flex-row gap-4">
        <div class="card flex flex-col w-2/6 mt-1 " v-if="barcode">
            <section>
                <div class="font-semibold text-xl mb-6 flex items-center justify-between">
                    <div>
                        <i class="pi pi-exclamation-triangle"></i> Hinweis zu {{ barcode }}
                    </div>
                    <div class="flex items-center gap-2" v-if="userRole === 'Lager' && hinweis">
                        <ToggleSwitch v-model="hinweisUmgesetzt" @update:modelValue="onToggleChangeHinweisUmgesetzt"
                            inputId="hinweis_umgesetzt" name="size" value="Small" size="large" />
                        <label for="hinweis_umgesetzt">Hinweis umgesetzt</label>
                    </div>
                    <div class="flex items-center gap-2" v-if="userRole === 'Produktion' && barcode">
                        <Select v-model="selectedVorlage" :options="hinweisVorlagen" placeholder="Vorlage auswählen"
                            optionLabel="titel" option-value="text" :filter="true" @change="onSelectVorlageChange">
                        </Select>
                    </div>
                </div>
                <Editor :readonly="!barcode" v-model="hinweis" :style="{ height: '260px' }" />
                <br>
                <Button v-if="barcode" icon="pi pi-send" label="Speichern" class="w-full"
                    @click="speichereHinweis()"></Button>
            </section>
        </div>

        <div class="flex flex-col w-1/6 mt-1" v-if="userRole === 'Produktion' && barcode">
            <div class="table-container">
                <DataTable :value="hinweisVorlagen"  :sortField="'nummer'"
                    :sortOrder="+1" :paginator="false" :rows="10">
                    <template #header>
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="text-xl font-bold">Vorlagen</span>
                        </div>
                    </template>
                    <Column field="titel" header="Titel" sortable style="width: 70%;font-size: 0.9rem;">
                    </Column>
                    <Column field="strg" header="STRG +" sortable style="width: 30%;font-size: 0.9rem"></Column>
                </DataTable>
            </div>
        </div>

        <div class="flex flex-col w-3/6 mt-1">
            <div class="table-container">
                <DataTable :value="hist"  :sortField="'timestamp'" :sortOrder="-1"
                    paginator :rows="4">
                    <template #header>
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="text-xl font-bold">Verlauf</span>
                        </div>
                    </template>
                    <Column field="status" header="Status" sortable style="width: 20%;font-size: 1rem;">
                        <template #body="slotProps">
                            <span :class="statusClass(slotProps.data.status)">{{
                                displayStatus(slotProps.data.status)
                            }}</span>
                        </template>
                    </Column>
                    <Column field="barcode" header="Barcode" sortable style="width: 50%;font-size: 1rem"></Column>
                    <Column field="timestamp" header="Datum" sortable style="width: 30%;font-size: 1rem"></Column>
                </DataTable>
            </div>
        </div>
    </Fluid>
    <br>

</template>
