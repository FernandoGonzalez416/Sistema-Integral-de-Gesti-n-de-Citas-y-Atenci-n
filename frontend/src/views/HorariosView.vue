<template>
  <main class="contenedor">
    <h1>Horarios de atención</h1>
    <Card titulo="Días y horas">
      <table>
        <thead>
          <tr><th>Día</th><th>Inicio</th><th>Fin</th></tr>
        </thead>
        <tbody>
          <tr v-for="h in horarios" :key="h._id">
            <td>{{ DIAS[h.dia] }}</td>
            <td>{{ h.horaInicio }}</td>
            <td>{{ h.horaFin }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="vacio">Horarios no disponibles por el momento.</p>
    </Card>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { getHorarios } from '../api/client.js';
import Card from '../components/Card.vue';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const horarios = ref([]);
const vacio = ref(false);

onMounted(async () => {
  try {
    horarios.value = await getHorarios();
    vacio.value = horarios.value.length === 0;
  } catch {
    vacio.value = true;
  }
});
</script>

<style>
.contenedor { max-width: 640px; margin: 2rem auto; font-family: sans-serif; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; }
</style>
