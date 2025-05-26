<script setup lang="ts">
import Editor from 'primevue/editor';
import { useHinweisVorlageStore } from '@/stores/hinweisVorlageStore';
import { useHinweisStore } from '@/stores/hinweisStore';
import { useBarcodeStore } from '@/stores/barcodeStore';
import { useAuthStore } from '@/stores/authStore';
import { useLocalStore } from '@/stores/localStore';
import { useToast } from 'primevue/usetoast';
import { storeToRefs } from 'pinia';
const hinweisVorlageStore = useHinweisVorlageStore();
const localStore = useLocalStore();
const hinweisStore = useHinweisStore();
const barcodeStore = useBarcodeStore();
const authStore = useAuthStore();
const { userRole } = storeToRefs(authStore);
const { selectedVorlage } = storeToRefs(hinweisVorlageStore);
const { hinweis, hinweisUmgesetzt, } = storeToRefs(hinweisStore);
const { hinweisVorlagen } = storeToRefs(localStore);
const { barcode } = storeToRefs(barcodeStore);
const toast = useToast();

const speichereHinweis = async () => {
    const hinweisStore = useHinweisStore();
    const toastMessage = await hinweisStore.speichereHinweis();
    if (toastMessage) {
        toast.add(toastMessage);
    }
};
</script>

<template>
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
                        <Select v-if="barcode" v-model="selectedVorlage" :options="hinweisVorlagen" placeholder="Vorlage auswählen"
                            optionLabel="titel" option-value="text" :filter="true"
                            @change="hinweisVorlageStore.setHinweis">
                        </Select>
                    </div>
                </div>
                <Editor v-if="userRole === 'Produktion'" :readonly="!barcode" v-model="hinweis"
                    :style="{ height: '450px' }" />
                <ScrollPanel v-if="userRole === 'Lager'" style="height: 495px">
                    <div v-html="hinweis"></div>
                </ScrollPanel>
                <br>
                <Button v-if="userRole === 'Produktion'" :disabled="!barcode" icon="pi pi-send" label="Speichern"
                    class="w-full" @click="speichereHinweis()"></Button>
            </section>
        </div>
    </div>
</template>
