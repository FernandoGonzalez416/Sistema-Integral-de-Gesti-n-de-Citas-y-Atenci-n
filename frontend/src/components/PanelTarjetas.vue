<template>
  <section class="panel-t" :class="`panel-${tipoClase}`" :aria-labelledby="idTitulo">
    <header class="panel-t-cabecera">
      <h2 :id="idTitulo">{{ titulo }}</h2>
      <span class="panel-t-contador">{{ items.length }} {{ items.length === 1 ? 'publicación' : 'publicaciones' }}</span>
    </header>

    <div v-if="items.length" class="panel-t-marco">
      <!-- Zona con scroll propio: su altura es fija (≈ fila y media) y no empuja a la otra sección. -->
      <div
        ref="zona"
        class="panel-t-zona"
        tabindex="0"
        role="region"
        :aria-label="`Tarjetas de ${titulo.toLowerCase()}`"
        @scroll.passive="medir"
      >
        <div class="panel-t-rejilla">
          <PublicacionCard v-for="p in items" :key="p._id" :publicacion="p" :tipo="tipo" />
        </div>
      </div>
      <div class="panel-t-fade" :class="{ visible: hayMas }" aria-hidden="true">
        <span>Desliza para ver más</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </div>
    </div>

    <p v-else class="panel-t-vacio">{{ mensajeVacio }}</p>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import PublicacionCard from './PublicacionCard.vue';

const props = defineProps({
  titulo: { type: String, required: true },
  tipo: { type: String, default: 'EDUCATIVO' },
  items: { type: Array, default: () => [] },
  mensajeVacio: { type: String, default: '' }
});

const tipoClase = computed(() => (props.tipo === 'CORPORATIVO' ? 'corporativo' : 'educativo'));
const idTitulo = computed(() => `panel-${tipoClase.value}-titulo`);

const zona = ref(null);
const hayMas = ref(false);

function medir() {
  const z = zona.value;
  hayMas.value = !!z && z.scrollTop + z.clientHeight < z.scrollHeight - 6;
}

let observador = null;
function observar() {
  observador?.disconnect();
  if (zona.value && typeof ResizeObserver !== 'undefined') {
    observador = new ResizeObserver(medir);
    observador.observe(zona.value);
    const rejilla = zona.value.firstElementChild;
    if (rejilla) observador.observe(rejilla);
  }
  medir();
}

// Al cambiar las tarjetas (búsqueda), se vuelve arriba y se recalcula.
watch(
  () => props.items,
  async () => {
    await nextTick();
    if (zona.value) zona.value.scrollTop = 0;
    observar();
  }
);
onMounted(() => nextTick(observar));
onUnmounted(() => observador?.disconnect());
</script>

<style>
.panel-t {
  --alto-tarjeta: 330px;
  --espacio: 1.25rem;
  font-family: sans-serif;
}
.panel-t-cabecera { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.9rem; }
.panel-t-cabecera h2 { margin: 0; font-size: clamp(1.3rem, 2.4vw, 1.7rem); color: var(--azul, #1a5c8a); }
.panel-corporativo .panel-t-cabecera h2 { color: var(--azul-oscuro, #0f3d5e); }
.panel-t-cabecera h2::after {
  content: '';
  display: block;
  width: 48px;
  height: 4px;
  margin-top: 0.45rem;
  border-radius: 2px;
  background: var(--turquesa, #2a9d9a);
}
.panel-t-contador {
  padding: 0.25rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  color: var(--azul, #1a5c8a);
  background: rgba(26, 92, 138, 0.1);
  border-radius: 999px;
}

.panel-t-marco {
  position: relative;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(26, 92, 138, 0.12);
  border-radius: 22px;
  box-shadow: inset 0 2px 10px rgba(15, 61, 94, 0.05);
  overflow: hidden;
}

/* Altura máxima: una fila y media de tarjetas. Si hay menos, se ajusta al contenido. */
.panel-t-zona {
  box-sizing: border-box;
  max-height: calc(var(--alto-tarjeta) * 1.5 + var(--espacio) + 1.1rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.75rem;
  scroll-behavior: smooth;
}
.panel-t-zona:focus-visible { outline: 3px solid var(--turquesa, #2a9d9a); outline-offset: -3px; border-radius: 22px; }

.panel-t-rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-auto-rows: var(--alto-tarjeta);
  gap: var(--espacio);
}

/* Aviso de que hay más tarjetas debajo */
.panel-t-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.35rem;
  padding-bottom: 0.45rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--azul, #1a5c8a);
  background: linear-gradient(to top, rgba(229, 241, 245, 0.97), rgba(229, 241, 245, 0));
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.panel-t-fade.visible { opacity: 1; }
.panel-t-fade svg { animation: panel-rebote 1.4s ease-in-out infinite; }
@keyframes panel-rebote { 50% { transform: translateY(3px); } }

.panel-t-vacio {
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  color: #4b6475;
  background: rgba(255, 255, 255, 0.55);
  border: 1px dashed rgba(26, 92, 138, 0.3);
  border-radius: 22px;
}

@media (prefers-reduced-motion: reduce) {
  .panel-t-zona { scroll-behavior: auto; }
  .panel-t-fade svg { animation: none; }
}
</style>
