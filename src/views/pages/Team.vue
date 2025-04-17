<script setup lang="ts">
import { useMyFetch } from '@/composables/myFetch';
import { ref, onMounted } from 'vue';
import { useTeamStore } from '@/stores/teamStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

const { getUsersLager } = useMyFetch();
const teamStore = useTeamStore();
const router = useRouter();
const usernames = ref([]);
const { team, checked } = storeToRefs(teamStore);

onMounted(async () => {
    usernames.value = await getUsersLager();
});

const nextPage = () => {
    router.push('/');
};

</script>
<template>
    <div
        class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="col-12 mt-2 xl:mt-0 text-center">
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
                            Wer hilft dir beim Verpacken?
                        </div>
                        <br>
                        <div class="flex items-center justify-center">
                            <ToggleSwitch v-model="checked" id="toggleSwitch"></ToggleSwitch>
                            <label for="toggleSwitch" class="ml-2 mb-1 text-lg">Ich verpacke alleine</label>
                        </div>
                        <br>
                        <br>

                        <MultiSelect v-model="team" :options="usernames" placeholder="Mitarbeiter auswählen"
                            :filter="true" v-show="!checked" optionLabel="username">
                        </MultiSelect>
                        <br>
                        <br>
                        <br>
                    </div>

                    <div>
                        <Button label="Weiter" class="w-full" @click="nextPage" />
                    </div>
                </div>
            </div>
        </div>
    </div>
    <br>
</template>
