<script setup lang="ts">
import Editor from 'primevue/editor';
import { storeToRefs } from 'pinia';
import { useHinweisVorlageStore } from '@/stores/hinweisVorlageStore';
import { useHinweisStore } from '@/stores/hinweisStore';
import { useBarcodeStore } from '@/stores/barcodeStore';
import { useAuthStore } from '@/stores/authStore';
import { useLocalStore } from '@/stores/localStore';
const hinweisVorlageStore = useHinweisVorlageStore();
const localStore = useLocalStore();
const hinweisStore = useHinweisStore();
const barcodeStore = useBarcodeStore();
const authStore = useAuthStore();
const { userRole } = storeToRefs(authStore);
const { selectedVorlage } = storeToRefs(hinweisVorlageStore);
const { hinweis, hinweisUmgesetzt } = storeToRefs(hinweisStore);
const { hinweisVorlagen } = storeToRefs(localStore);
const { barcode } = storeToRefs(barcodeStore);

const speichereHinweis = async () => {
  const hinweisStore = useHinweisStore();
  await hinweisStore.speichereHinweis();
};
</script>

<template>
  <div class="flex flex-col w-1/2">
    <Message v-if="hinweis && userRole === 'Lager' && !hinweisUmgesetzt" severity="error">
      Bitte Hinweis beachten und
      umsetzen.
    </Message>
    <div class="card flex flex-col">
      <section>
        <div class="font-semibold text-xl mb-6 flex items-center justify-between">
          <div>
            <i class="pi pi-exclamation-triangle" /><span class="text-lg"> Hinweis zu: {{ barcode
            }}</span>
          </div>
          <div v-if="userRole === 'Lager'" class="flex items-center gap-2">
            <ToggleSwitch
              v-model="hinweisUmgesetzt" input-id="hinweis_umgesetzt"
              name="size" value="Small" size="small"
              @update:model-value="speichereHinweis()"
            />
            <label for="hinweis_umgesetzt">Umgesetzt</label>
          </div>
          <div v-if="userRole === 'Produktion'" class="flex items-center gap-2">
            <Select
              v-if="barcode" v-model="selectedVorlage" :options="hinweisVorlagen"
              placeholder="Vorlage auswählen" option-label="titel" option-value="text"
              :filter="true"
              @change="hinweisVorlageStore.setHinweis"
            />
          </div>
        </div>
        <Editor v-model="hinweis" :readonly="!barcode || userRole === 'Lager'" :style="{ height: '450px' }" />
        <br>
        <br>
        <br>
        <br>
      </section>
      <Button
        v-if="userRole === 'Produktion'" :disabled="!barcode" icon="pi pi-send"
        label="Speichern"
        class="w-full" @click="speichereHinweis()"
      />
      <br v-if="userRole === 'Lager'">
    </div>
  </div>
</template>
