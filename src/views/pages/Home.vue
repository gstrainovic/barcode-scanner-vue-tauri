<script setup lang="ts">
import { ref } from 'vue';
import { useTeamStore } from '@/stores/teamStore';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useMyFetch } from '@/composables/myFetch';
import { config } from '@/composables/config';
import { invoke } from '@tauri-apps/api/core';
import { marked } from 'marked';
import Galleria from 'primevue/galleria'; // Importiere die Galleria-Komponente
import Editor from 'primevue/editor';
import { useToast } from "primevue/usetoast";

const toast = useToast();
const { getUsersLager, getHinweiseFromBarcode, postHinweise } = useMyFetch();

const teamStore = useTeamStore();
const authStore = useAuthStore();

const { team, checked } = storeToRefs(teamStore);
const { userRole, userId, userToken } = storeToRefs(authStore);

const usernames = ref<{ username: any; id: any }[]>([]);
const hist = ref([]);
const barcodeInput = ref('');
const hinweiseTitel = ref(' Hinweise zu ');
const medienTitel = ref(' Medien zu ');
const hinweise = ref('');
const mediaItems = ref([]); // Speichert die Medien-URLs für die Galerie
const displayBasic = ref(false);
const lastBarcode = ref('');

onMounted(async () => {
    console.log('rolle', userRole.value);
    usernames.value = await getUsersLager();
    hist.value = await invoke<[]>('load_history');
    console.log('hist', hist.value);
    // window.pywebview.api.sync(userToken.value);
});

const showToast = (erfolg: boolean, message : string) => {

    if (!message || message === '') {
        return;
    }

    toast.add({
        severity: erfolg ? 'success' : 'error',
        summary: erfolg ? 'Erfolg' : 'Fehler',
        detail: message,
        life: 3000,
    });

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
        lastBarcode.value = barcodeInput.value;
        const conf = await config();
        const uploadUrl = conf.api.strapi.replace(/\/api\/$/, '');
        hinweiseTitel.value = 'Hinweise zu ' + barcodeInput.value;
        medienTitel.value = 'Medien zu ' + barcodeInput.value;

        // Abrufen der Hinweise und Medien
        const result = await getHinweiseFromBarcode(barcodeInput.value);
        console.log('result', result);

        // Hinweise verarbeiten
        hinweise.value = marked.parse(result.hinweiseString || '');
        console.log('html hinweise', hinweise.value);

        // Medien verarbeiten
        mediaItems.value = result.medienAttributes.map((media: any) => {
            const formats = media.formats || {};
            return {
                itemImageSrc: uploadUrl + formats.large?.url || uploadUrl + media.url, // Fallback auf die Haupt-URL
                thumbnailImageSrc: uploadUrl + formats.thumbnail?.url || uploadUrl + media.url, // Fallback auf die Haupt-URL
                alt: media.alternativeText || media.name || 'Bild',
                title: media.name || 'Bild',
            };
        });
        console.log('mediaItems', mediaItems.value);
    } catch (error) {
        console.error('Fehler beim Laden der Hinweise:', error);
    }
};

const processBarcode = async () => {
    if (!barcodeInput.value) {
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
        barcode: barcodeInput.value,
        uid: userID,
        jwt: userToken.value,
        luids: lager_user_ids,
        rolle: userRole.value,
    })

    hist.value = await invoke<[]>('load_history');
    barcodeInput.value = '';
};


const speichereHinweise = async () => {
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
    const data = {
        barcode: lastBarcode.value,
        hinweise: hinweise.value,
    }

    const result = await postHinweise({data});
    console.log('result', result);

    // wenn der result den barcode und die hinweise enthält, dann ist es erfolgreich
    if (result.data.attributes.barcode && result.data.attributes.hinweise) {
        showToast(true, 'Hinweise gespeichert.');
    } else {
        showToast(false, 'Fehler beim Speichern der Hinweise.');
    }
};


</script>
<template>
    <div @keyup.enter="processBarcode()" tabindex="0">
        <Fluid class="flex flex-col md:flex-row gap-4">
            <div class="md:w-1/3">
                <div class="card flex flex-col gap-3">
                    <IconField>
                        <InputIcon class="pi pi-qrcode" />
                        <InputText id="barcodei" type="text" placeholder="Barcode" v-model="barcodeInput" />
                    </IconField>
                    <Button label="Absenden" class="w-full" icon="pi pi-send" id="sendButton"
                        @click="processBarcode()"></Button>
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

            <div :class="userRole === 'Lager' ? 'md:w-1/3' : 'md:w-1/3'">
                <div class="card flex flex-col gap-4">
                    <div class="font-semibold text-xl"><i class="pi pi-exclamation-triangle "></i> {{ medienTitel }} </div>
                    <Galleria v-model:visible="displayBasic" :value="mediaItems" :numVisible="9"
                        containerStyle="max-width: 50%" :circular="true" :fullScreen="true" :showItemNavigators="true"
                        :showThumbnails="true">
                        <template #item="slotProps">
                            <img :src="slotProps.item.itemImageSrc" :alt="slotProps.item.alt"
                                style="width: 100%; display: block" />
                        </template>
                        <template #thumbnail="slotProps">
                            <img :src="slotProps.item.thumbnailImageSrc" :alt="slotProps.item.alt"
                                style="display: block" />
                        </template>
                    </Galleria>
                    <Button  label="Anzeigen" icon="pi pi-external-link0" class="mt-2"
                        @click="displayBasic = true" :disabled="mediaItems.length === 0" :class="{'p-button-secondary': mediaItems.length === 0}"></Button>

                </div>
            </div>
        </Fluid>

        <Fluid class="flex flex-col md:flex-row gap-4">
            <div class="card flex flex-col w-1/2 mt-4">
                <div class="font-semibold text-xl mb-6"><i class="pi pi-exclamation-triangle"></i> {{ hinweiseTitel }}</div>
                <Editor v-model="hinweise" :style="{ height: '360px' }" />
                <br>
                <Button icon="pi pi-send" label="Speichern" class="w-full" @click="speichereHinweise()"></Button>
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
    </div>

</template>
