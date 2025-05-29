<script setup lang="ts">
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useTeamStore } from '@/stores/teamStore';
const teamStore = useTeamStore();
const router = useRouter();
const { team, checked, lagerUsers } = storeToRefs(teamStore);

const navigateToNextPage = () => {
  router.push('/');
};
</script>

<template>
  <div
    class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center pt-[120px] w-full overflow-hidden"
  >
    <div class="flex flex-col items-center justify-center">
      <div
        style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)"
      >
        <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
          <div class="col-12 mt-2 xl:mt-0 text-center">
            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
              Wer hilft dir beim Verpacken?
            </div>
            <br>
            <div class="flex items-center justify-center">
              <ToggleSwitch
                id="toggleSwitch" v-model="checked"
                @update:model-value="teamStore.onToggleChangeVerpackeAlleine"
              />
              <label for="toggleSwitch" class="ml-2 mb-1 text-lg">Ich verpacke alleine</label>
            </div>
            <br>
            <br>

            <MultiSelect
              v-show="!checked" v-model="team" :options="lagerUsers"
              placeholder="Mitarbeiter auswählen"
              :filter="true" option-label="username" @change="teamStore.changeTeam"
            />
            <br>
            <br>
            <br>
          </div>

          <div>
            <Button label="Weiter" class="w-full" @click="navigateToNextPage" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
html, body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
}
</style>
