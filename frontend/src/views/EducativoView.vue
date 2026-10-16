<template>
  <main class="contenedor">
    <h1>Contenido educativo y corporativo</h1>

    <h2>Educativo</h2>
    <Card v-for="p in educativas" :key="p._id" :titulo="p.titulo">
      <img v-if="p.imagenUrl" :src="p.imagenUrl" alt="Imagen de la publicación" />
      <p>{{ p.descripcion }}</p>
      <p><a v-if="p.enlace" :href="p.enlace" target="_blank" rel="noopener">Más información</a></p>
    </Card>
    <p v-if="educativas.length === 0">No hay contenido educativo por el momento.</p>

    <h2>Corporativo</h2>
    <Card v-for="p in corporativas" :key="p._id" :titulo="p.titulo">
      <img v-if="p.imagenUrl" :src="p.imagenUrl" alt="Imagen de la publicación" />
      <p>{{ p.descripcion }}</p>
      <p><a v-if="p.enlace" :href="p.enlace" target="_blank" rel="noopener">Más información</a></p>
    </Card>
    <p v-if="corporativas.length === 0">No hay contenido corporativo por el momento.</p>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { getPublicaciones } from '../api/client.js';
import Card from '../components/Card.vue';

const educativas = ref([]);
const corporativas = ref([]);

onMounted(async () => {
  try {
    educativas.value = await getPublicaciones('EDUCATIVO');
  } catch {
    educativas.value = [];
  }
  try {
    corporativas.value = await getPublicaciones('CORPORATIVO');
  } catch {
    corporativas.value = [];
  }
});
</script>

<style>
.contenedor { max-width: 640px; margin: 2rem auto; font-family: sans-serif; }
img { max-width: 100%; border-radius: 8px; }
</style>
