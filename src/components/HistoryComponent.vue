<script setup lang="ts">
import { useHistoryStore } from '@/stores/historyStore';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
const historyStore = useHistoryStore();
const { history } = storeToRefs(historyStore);

onMounted(() => {
    historyStore.loadHistory();
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
</script>

<template>
    <div class="flex flex-col w-1/2 mt-1">
        <div class="table-container">
            <DataTable :value="history" :sortField="'timestamp'" :sortOrder="-1" paginator :rows="5">
                <template #header>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="text-xl font-bold">Verlauf</span>
                    </div>
                </template>
                <Column field="status" header="Status" sortable style="width: 20%;font-size: 1.6rem;">
                    <template #body="slotProps">
                        <span :class="statusClass(slotProps.data.status)">{{
                            displayStatus(slotProps.data.status)
                        }}</span>
                    </template>
                </Column>
                <Column field="barcode" header="Barcode" sortable style="width: 50%;font-size: 1.6rem"></Column>
                <Column field="timestamp" header="Datum" sortable style="width: 30%;font-size: 1.6rem"></Column>
            </DataTable>
        </div>
    </div>
</template>
