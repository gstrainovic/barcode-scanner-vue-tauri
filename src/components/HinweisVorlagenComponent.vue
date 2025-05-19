<script setup lang="ts">
import { useHinweisVorlageStore } from '@/stores/hinweisVorlageStore';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

const hinweisVorlageStore = useHinweisVorlageStore();
const authStore = useAuthStore();
const { userRole } = storeToRefs(authStore);
const { hinweisVorlagen } = storeToRefs(hinweisVorlageStore);

onMounted(async () => {
    if (userRole.value === 'Produktion') {
        await hinweisVorlageStore.ladeHinweisVorlagen();
        await hinweisVorlageStore.registerHinweisVorlagenShortcuts();
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
