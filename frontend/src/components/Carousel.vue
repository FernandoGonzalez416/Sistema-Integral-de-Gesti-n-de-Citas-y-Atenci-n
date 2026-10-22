<template>
  <div
    class="carrusel"
    role="region"
    aria-roledescription="carrusel"
    aria-label="Portada"
    @mouseenter="pausar"
    @mouseleave="reanudar"
    @focusin="pausar"
    @focusout="reanudar"
    @touchstart.passive="tocarInicio"
    @touchend.passive="tocarFin"
  >
    <div
      v-for="(d, i) in diapositivas"
      :key="i"
      class="diapositiva"
      :class="{ activa: i === indice }"
      role="group"
      :aria-label="`${i + 1} de ${diapositivas.length}`"
      :inert="i !== indice"
    >
      <img :src="d.imagen" alt="" draggable="false" @error="$event.target.onerror = null; $event.target.src = '/carrusel-1.svg'" />
      <div class="velo"></div>
      <div class="texto">
        <h2>{{ d.titulo }}</h2>
        <p v-if="d.subtitulo">{{ d.subtitulo }}</p>
        <RouterLink v-if="d.enlace" :to="d.enlace.to" class="boton">{{ d.enlace.texto }}</RouterLink>
      </div>
    </div>

    <button class="flecha ant" type="button" @click="anterior" aria-label="Diapositiva anterior">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 5 8 12 15 19" /></svg>
    </button>
    <button class="flecha sig" type="button" @click="siguiente" aria-label="Diapositiva siguiente">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 5 16 12 9 19" /></svg>
    </button>

    <div class="puntos">
      <button
        v-for="(d, i) in diapositivas"
        :key="i"
        type="button"
        :class="{ activo: i === indice }"
        :aria-label="`Ir a la diapositiva ${i + 1}`"
        :aria-current="i === indice"
        @click="ir(i)"
      ></button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  // [{ imagen, titulo, subtitulo?, enlace?: { to, texto } }]
  diapositivas: { type: Array, required: true },
  intervalo: { type: Number, default: 5000 }
});

const indice = ref(0);
let temporizador = null;
let enPausa = false;

function siguiente() {
  if (!props.diapositivas.length) return;
  indice.value = (indice.value + 1) % props.diapositivas.length;
}
function anterior() {
  if (!props.diapositivas.length) return;
  indice.value = (indice.value - 1 + props.diapositivas.length) % props.diapositivas.length;
}
function ir(i) {
  indice.value = i;
  reiniciar();
}

function iniciar() {
  detener();
  temporizador = setInterval(() => {
    if (!enPausa) siguiente();
  }, props.intervalo);
}
function detener() {
  if (temporizador) clearInterval(temporizador);
  temporizador = null;
}
function reiniciar() {
  iniciar();
}
function pausar() { enPausa = true; }
function reanudar() { enPausa = false; }

// Deslizar con el dedo en pantallas táctiles.
let x0 = 0;
let y0 = 0;
function tocarInicio(e) {
  x0 = e.changedTouches[0].clientX;
  y0 = e.changedTouches[0].clientY;
}
function tocarFin(e) {
  const dx = e.changedTouches[0].clientX - x0;
  const dy = e.changedTouches[0].clientY - y0;
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
  if (dx < 0) siguiente(); else anterior();
  reiniciar();
}

watch(
  () => props.diapositivas.length,
  (total) => {
    if (!total) {
      indice.value = 0;
      detener();
      return;
    }
    if (indice.value >= total) indice.value = 0;
    if (temporizador) iniciar();
  }
);

onMounted(() => {
  if (props.diapositivas.length) iniciar();
});
onUnmounted(detener);
</script>

<style scoped>
.carrusel {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 220px;
  overflow: hidden;
  background: #0f3d5e;
}

.diapositiva {
  position: absolute;
  inset: 0;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.8s ease, visibility 0s linear 0.8s;
}
.diapositiva.activa {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.8s ease, visibility 0s;
}

.diapositiva img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 65% center;
  display: block;
  transform: scale(1.05);
  transition: transform 7s ease-out;
  user-select: none;
}
.diapositiva.activa img { transform: scale(1); }

.velo {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(8, 32, 50, 0.7) 0%, rgba(8, 32, 50, 0.2) 60%, transparent 100%),
    linear-gradient(0deg, rgba(8, 32, 50, 0.55) 0%, transparent 45%);
}

.texto {
  position: absolute;
  left: clamp(1rem, 7vw, 6rem);
  right: clamp(1rem, 7vw, 6rem);
  bottom: clamp(3.5rem, 14%, 6.5rem);
  max-width: 44rem;
  color: #fff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.35);
}
.diapositiva.activa .texto { animation: entrar 0.8s ease both; }

.texto h2 {
  margin: 0;
  font-size: clamp(1.9rem, 5.2vw, 4.2rem);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.texto h2::before {
  content: '';
  display: block;
  width: 56px;
  height: 5px;
  margin-bottom: 0.8rem;
  border-radius: 3px;
  background: #5eead4;
}
.texto p { margin: 0.75rem 0 0; font-size: clamp(1rem, 1.8vw, 1.3rem); }

.boton {
  display: inline-block;
  margin-top: 1.1rem;
  padding: 0.7rem 1.5rem;
  border-radius: 999px;
  background: #fff;
  color: #7a1a45;
  font-weight: 700;
  text-decoration: none;
  text-shadow: none;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s;
}
.boton:hover { transform: translateY(-2px); }

.flecha {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
}
.flecha:hover { background: rgba(255, 255, 255, 0.32); }
.ant { left: clamp(0.5rem, 2vw, 1.5rem); }
.sig { right: clamp(0.5rem, 2vw, 1.5rem); }

.puntos {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1rem;
  z-index: 2;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}
.puntos button {
  width: 10px;
  height: 10px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: width 0.3s, background 0.3s;
}
.puntos button.activo { width: 30px; background: #fff; }

@keyframes entrar {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}

@media (max-width: 560px) {
  .flecha { width: 34px; height: 34px; }
  .flecha svg { width: 18px; height: 18px; }
}

@media (prefers-reduced-motion: reduce) {
  .diapositiva, .diapositiva.activa { transition: none; }
  .diapositiva img, .diapositiva.activa img { transition: none; transform: none; }
  .diapositiva.activa .texto { animation: none; }
}
</style>
