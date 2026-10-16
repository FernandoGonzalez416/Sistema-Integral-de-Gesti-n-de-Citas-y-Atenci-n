<template>
  <main class="contenedor">
    <h1>SIGCA</h1>
    <p>Sistema Integral de Gestión de Citas y Atención</p>

    <Carousel :imagenes="imagenes" />

    <Card :titulo="mision.titulo">
      <p>{{ mision.cuerpo }}</p>
    </Card>

    <Card :titulo="vision.titulo">
      <p>{{ vision.cuerpo }}</p>
    </Card>

    <Card titulo="Estado del backend">
      <p v-if="salud.estado === 'pendiente'">Verificando conexión…</p>
      <p v-else-if="salud.estado === 'ok'" class="ok">
        Conectado: {{ salud.datos.service }} ({{ salud.datos.timestamp }})
      </p>
      <p v-else class="error">Sin conexión: {{ salud.error }}</p>
      <button @click="salud.verificar()">Reintentar</button>
    </Card>
  </main>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { useHealthStore } from '../stores/health.js';
import { getContenido } from '../api/client.js';
import Card from '../components/Card.vue';
import Carousel from '../components/Carousel.vue';

const salud = useHealthStore();
const imagenes = [
  '/carrusel-1.svg',
  '/carrusel-2.svg',
  '/carrusel-3.svg',
  '/carrusel-4.svg',
  '/carrusel-5.svg'
];
const mision = reactive({ titulo: 'Misión', cuerpo: 'Cargando…' });
const vision = reactive({ titulo: 'Visión', cuerpo: 'Cargando…' });

onMounted(async () => {
  salud.verificar();
  try {
    Object.assign(mision, await getContenido('mision'));
  } catch {
    mision.cuerpo = 'Contenido no disponible.';
  }
  try {
    Object.assign(vision, await getContenido('vision'));
  } catch {
    vision.cuerpo = 'Contenido no disponible.';
  }
});
</script>

<style>
.contenedor { max-width: 640px; margin: 2rem auto; font-family: sans-serif; }
.ok { color: green; }
.error { color: red; }
</style>
