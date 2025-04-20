<script setup lang="ts">
import { ref } from 'vue';
import { useTeamStore } from '@/stores/teamStore';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useMyFetch } from '@/composables/myFetch';
import { onlineCheck } from '@/composables/helpers';
import { invoke } from '@tauri-apps/api/core';

const { getUsersLager } = useMyFetch();

const teamStore = useTeamStore();
const authStore = useAuthStore();

const { team, checked } = storeToRefs(teamStore);
const { userRole, userId, userToken } = storeToRefs(authStore);

const usernames = ref<{ username: any; id: any }[]>([]);
const hist = ref([]);
const barcodeInput = ref('');

onMounted(async () => {
    console.log('rolle', userRole.value);
    usernames.value = await getUsersLager();
    hist.value = await invoke<[]>( 'load_history');
    console.log('hist', hist.value);
    // window.pywebview.api.sync(userToken.value);
});

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

const processBarcode = async () => {
    if (!barcodeInput.value) {
        return;
    }

    const userID : Number = Number(userId.value);
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

    hist.value = await invoke<[]>( 'load_history');
    barcodeInput.value = '';
};

const hinweise = ref('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec pur');

</script>
<template>
    <div @keyup.enter="processBarcode()" tabindex="0">
        <Fluid class="flex flex-col md:flex-row gap-8">
            <div class="md:w-1/4">
                <div class="card flex flex-col gap-3">
                    <div class="font-semibold text-xl"><i class="pi pi-qrcode"></i> Barcode</div>
                    <IconField>
                        <InputIcon class="pi pi-qrcode" />
                        <InputText id="barcodei"  type="text" placeholder="Barcode" v-model="barcodeInput" />
                    </IconField>
                    <Button label="Absenden" class="w-full" icon="pi pi-send" id="sendButton"
                        @click="processBarcode()"></Button>
                </div>
            </div>
            <div :class="userRole === 'Lager' ? 'md:w-2/4' : 'md:w-3/4'">
                <div class="card flex flex-col gap-4">
                    <div class="font-semibold text-xl"><i class="pi pi-exclamation-triangle"></i> Hinweise</div>
                    <Textarea v-model="hinweise" rows="3" cols="30" />
                </div>
            </div>
            <div class="md:w-1/4" v-if="userRole === 'Lager'">
                <div class="card flex flex-col gap-4">
                    <div class="font-semibold text-xl"><i class="pi pi-users"></i> Team</div>
                    <div class="flex">
                        <ToggleSwitch v-model="checked" id="toggleSwitch"></ToggleSwitch>
                        <label for="toggleSwitch" class="ml-2 mb-1 text-lg">Ich verpacke alleine</label>
                    </div>
                    <MultiSelect v-model="team" :options="usernames" optionLabel="username" placeholder="Mitarbeiter auswählen" :filter="true"
                        v-show="!checked">
                    </MultiSelect>
                </div>
            </div>
        </Fluid>

        <Fluid class="flex">
            <div class="card flex flex-col gap-4 w-full mt-4">
                <div class="font-semibold text-xl"><i class="pi pi-history"></i> Verlauf</div>
                <DataTable :value="hist" tableStyle="min-width: 50rem" :sortField="'timestamp'" :sortOrder="-1">
                    <Column field="status" header="Status" sortable style="width: 33%">
                        <template #body="slotProps">
                            <span :class="statusClass(slotProps.data.status)">{{ displayStatus(slotProps.data.status)
                                }}</span>
                        </template>
                    </Column>
                    <Column field="barcode" header="Barcode" sortable style="width: 33%"></Column>
                    <Column field="timestamp" header="Datum" sortable style="width: 33%"></Column>
                </DataTable>
            </div>
        </Fluid>

        <br>
    </div>

</template>
