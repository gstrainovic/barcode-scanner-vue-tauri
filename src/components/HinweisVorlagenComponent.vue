<script setup lang="ts">
import { useHinweisStore } from '@/stores/hinweisStore';
import { useHinweisVorlageStore } from '@/stores/hinweisVorlageStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'primevue';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
const hinweisVorlageStore = useHinweisVorlageStore();
const hinweisStore = useHinweisStore();
const authStore = useAuthStore();
const { userRole } = storeToRefs(authStore);
const { hinweisVorlagen } = storeToRefs(hinweisVorlageStore);
const toast = useToast();

const registerHinweisVorlagenShortcuts = async () => {
    await unregisterAll();
    for (const vorlage of hinweisVorlagen.value) {
        const hotkeyMain = 'CommandOrControl+' + vorlage.strg; // z.B. CommandOrControl+1
        const hotkeyNumpad = 'CommandOrControl+Numpad' + vorlage.strg; // z.B. CommandOrControl+Numpad1

        await register(hotkeyMain, async (event) => {
            if (event.state === "Released") {
                await hinweisVorlageStore.setHinweis(vorlage);
                const toastMessage = await hinweisStore.speichereHinweis();
                if (toastMessage) {
                    toast.add(toastMessage);
                }
            }
        });

        await register(hotkeyNumpad, async (event) => {
            if (event.state === "Released") {
                await hinweisVorlageStore.setHinweis(vorlage);
                const toastMessage = await hinweisStore.speichereHinweis();
                if (toastMessage) {
                    toast.add(toastMessage);
                }
            }
        });
    }
}

onMounted(async () => {
    if (userRole.value === 'Produktion') {
        await hinweisVorlageStore.ladeHinweisVorlagen();
        await registerHinweisVorlagenShortcuts();
    }
});
</script>

<template>
    <div class="flex flex-col" v-if="userRole === 'Produktion'">
        <div class="table-container">
            <DataTable :value="hinweisVorlagen" :sortField="'strg'" :sortOrder="+1" :paginator="false" :rows="10">
                <template #header>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="text-xl font-bold">Vorlagen</span>
                    </div>
                </template>
                <Column field="titel" header="Titel" sortable style="width: 60%;font-size: 0.8rem;">
                    <template #body="slotProps">
                        <a href="javascript:void(0)" class="text-blue-500 hover:underline cursor-pointer"
                            @click="hinweisVorlageStore.setHinweis(slotProps.data)">
                            {{ slotProps.data.titel }}
                        </a>
                    </template>
                </Column>
                <Column field="strg" header="STRG +" sortable style="width: 40%;font-size: 0.8rem"></Column>
            </DataTable>
        </div>
    </div>
</template>
