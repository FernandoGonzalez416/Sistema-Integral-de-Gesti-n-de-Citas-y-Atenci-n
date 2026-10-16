<template>
  <main class="contenedor">
    <h1>Servicios</h1>
    <Card v-for="s in servicios" :key="s._id" :titulo="s.nombre">
      <p>{{ s.descripcion }}</p>
      <p><strong>{{ formatoMoneda(s.precioCentavos) }}</strong> · {{ s.duracionMinutos }} min</p>
    </Card>
    <p v-if="vacio">No hay servicios disponibles por el momento.</p>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { getServicios } from '../api/client.js';
import Card from '../components/Card.vue';

const servicios = ref([]);
const vacio = ref(false);

onMounted(async () => {
  try {
    servicios.value = await getServicios();
    vacio.value = servicios.value.length === 0;
  } catch {
    vacio.value = true;
  }
});

function formatoMoneda(centavos) {
  return `$${(centavos / 100).toFixed(2)}`;
}
</script>

<style>
.contenedor { max-width: 640px; margin: 2rem auto; font-family: sans-serif; }
</style>
