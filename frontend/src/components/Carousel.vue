<template>
  <div class="carrusel">
    <img :src="imagenes[indice]" alt="Imagen del carrusel" />
    <button class="ant" @click="anterior" aria-label="Anterior">‹</button>
    <button class="sig" @click="siguiente" aria-label="Siguiente">›</button>
    <div class="puntos">
      <button
        v-for="(img, i) in imagenes"
        :key="i"
        :class="{ activo: i === indice }"
        @click="indice = i"
        :aria-label="`Ir a imagen ${i + 1}`"
      >●</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({
  imagenes: { type: Array, required: true },
  intervalo: { type: Number, default: 5000 }
});

const indice = ref(0);
let temporizador = null;

function siguiente() {
  indice.value = (indice.value + 1) % props.imagenes.length;
}

function anterior() {
  indice.value = (indice.value - 1 + props.imagenes.length) % props.imagenes.length;
}

onMounted(() => {
  temporizador = setInterval(siguiente, props.intervalo);
});

onUnmounted(() => {
  clearInterval(temporizador);
});
</script>

<style>
.carrusel { position: relative; max-width: 800px; margin: 0 auto 1rem; }
.carrusel img { width: 100%; border-radius: 8px; display: block; }
.carrusel .ant, .carrusel .sig {
  position: absolute; top: 45%; font-size: 2rem;
  background: rgba(0,0,0,0.4); color: white; border: none; cursor: pointer;
}
.carrusel .ant { left: 0.5rem; }
.carrusel .sig { right: 0.5rem; }
.puntos { text-align: center; }
.puntos button { background: none; border: none; cursor: pointer; color: #999; }
.puntos button.activo { color: #1a5c8a; }
</style>
