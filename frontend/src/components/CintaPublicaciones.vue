<template>
  <div class="cinta" :class="{ pausada }" @mouseenter="pausada = true" @mouseleave="pausada = false" @focusin="pausada = true" @focusout="pausada = false">
    <div class="cinta-pista" :style="{ '--duracion': `${duracion}s` }">
      <!-- Grupo real -->
      <div class="cinta-grupo">
        <div v-for="(item, i) in relleno" :key="`a${i}`" class="cinta-item">
          <PublicacionCard :publicacion="item.datos" :tipo="tipo" :vacia="item.vacia" />
        </div>
      </div>
      <!-- Copia idéntica para que el movimiento no tenga saltos -->
      <div class="cinta-grupo" aria-hidden="true" inert>
        <div v-for="(item, i) in relleno" :key="`b${i}`" class="cinta-item">
          <PublicacionCard :publicacion="item.datos" :tipo="tipo" :vacia="item.vacia" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import PublicacionCard from './PublicacionCard.vue';

const props = defineProps({
  publicaciones: { type: Array, default: () => [] },
  tipo: { type: String, default: 'EDUCATIVO' }
});

const MIN_TARJETAS = 6; // para que el grupo siempre llene el ancho de la pantalla
const SEGUNDOS_POR_TARJETA = 5;
const pausada = ref(false);

// Si no hay contenido se muestran tarjetas "Próximamente"; si hay pocas, se repiten.
const relleno = computed(() => {
  const base = props.publicaciones.length
    ? props.publicaciones.map((datos) => ({ datos, vacia: false }))
    : [{ datos: null, vacia: true }];
  const lista = [];
  while (lista.length < MIN_TARJETAS || lista.length % base.length !== 0) {
    lista.push(base[lista.length % base.length]);
  }
  return lista;
});

const duracion = computed(() => relleno.value.length * SEGUNDOS_POR_TARJETA);
</script>

<style>
.cinta {
  position: relative;
  overflow: hidden;
  padding: 0.75rem 0 1.25rem;
  /* Desvanecido suave en los bordes */
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
}
.cinta-pista {
  display: flex;
  width: max-content;
  animation: cinta-mover var(--duracion, 30s) linear infinite;
  will-change: transform;
}
.cinta.pausada .cinta-pista { animation-play-state: paused; }

.cinta-grupo { display: flex; flex: none; }
.cinta-item {
  flex: none;
  width: clamp(240px, 26vw, 300px);
  margin-right: 1.25rem;
}

@keyframes cinta-mover {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* Movimiento reducido: sin animación, se desplaza a mano (sin barra visible). */
@media (prefers-reduced-motion: reduce) {
  .cinta { overflow-x: auto; -webkit-mask-image: none; mask-image: none; }
  .cinta-pista { animation: none; }
}
</style>
