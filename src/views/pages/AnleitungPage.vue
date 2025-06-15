<script setup lang="ts">
import PdfEmbed from 'vue-pdf-embed';
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full h-full">
    <div style="width: 90vw; height: 90vh;">
      <PdfEmbed source="/BarcodeScannerAnleitung.pdf" />
    </div>
  </div>
</template>
