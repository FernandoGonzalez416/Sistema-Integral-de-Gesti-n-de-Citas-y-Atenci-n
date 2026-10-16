<template>
  <section class="tarjeta">
    <h2 v-if="titulo">{{ titulo }}</h2>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  titulo: { type: String, default: '' }
});
</script>

<style>
.tarjeta { border: 1px solid #ccc; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
</style>
