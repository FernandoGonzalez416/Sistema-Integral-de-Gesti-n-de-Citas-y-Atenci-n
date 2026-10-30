<template>
  <Transition name="amd">
    <div
      v-if="abierto"
      class="amd-fondo"
      role="presentation"
      @mousedown.self="alPresionarFondo"
      @mouseup.self="alSoltarFondo"
    >
      <div
        ref="ventana"
        class="amd-ventana"
        :class="`amd-${ancho}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="idTitulo"
        tabindex="-1"
        @keydown="alTecla"
      >
        <header class="amd-cab">
          <span v-if="icono" class="amd-icono" aria-hidden="true"><Icono :name="icono" :size="22" /></span>
          <div class="amd-titulos">
            <h2 :id="idTitulo">{{ titulo }}</h2>
            <p v-if="subtitulo">{{ subtitulo }}</p>
          </div>
          <button
            type="button"
            class="amd-x"
            aria-label="Cerrar ventana"
            title="Cerrar"
            :disabled="bloquear"
            @click="cerrar"
          >
            <Icono name="x" :size="18" />
          </button>
        </header>

        <div class="amd-cuerpo">
          <slot />
        </div>

        <footer v-if="$slots.pie" class="amd-pie">
          <slot name="pie" />
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import Icono from './Icono.vue';

// Ventanita (modal) reutilizable del panel administrativo.
//  · Se cierra con la X, con Esc o pulsando fuera (salvo que "bloquear" esté activo, p. ej. al guardar).
//  · Bloquea el scroll de la página mientras está abierta y SIEMPRE lo libera al cerrarse o
//    desmontarse, para que cambiar rápido de pantalla nunca deje la página trabada.
//  · No usa Teleport: se dibuja en su sitio con position: fixed, así se desmonta junto con la vista.
const props = defineProps({
  abierto: { type: Boolean, default: false },
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
  icono: { type: String, default: '' },
  ancho: { type: String, default: 'md' }, // sm | md | lg
  bloquear: { type: Boolean, default: false }
});
const emit = defineEmits(['cerrar']);

const ventana = ref(null);
const idTitulo = `amd-t-${Math.random().toString(36).slice(2, 9)}`;
let desdeFondo = false;
let previo = null;
let bloqueando = false;

// Contador compartido: si hubiera dos ventanas a la vez, el scroll solo se libera al cerrar la última.
const estado = (globalThis.__amdBloqueos ||= { n: 0, overflow: '' });

function bloquearScroll() {
  if (bloqueando) return;
  bloqueando = true;
  if (estado.n === 0) estado.overflow = document.body.style.overflow;
  estado.n += 1;
  document.body.style.overflow = 'hidden';
}

function liberarScroll() {
  if (!bloqueando) return;
  bloqueando = false;
  estado.n = Math.max(0, estado.n - 1);
  if (estado.n === 0) document.body.style.overflow = estado.overflow || '';
}

function cerrar() {
  if (props.bloquear) return;
  emit('cerrar');
}

function alPresionarFondo() { desdeFondo = true; }
function alSoltarFondo() {
  // Solo cierra si el clic empezó Y terminó en el fondo (no al arrastrar para seleccionar texto).
  if (desdeFondo) cerrar();
  desdeFondo = false;
}

function enfocables() {
  if (!ventana.value) return [];
  return Array.from(
    ventana.value.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
  ).filter((el) => el.offsetParent !== null);
}

function alTecla(e) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    cerrar();
    return;
  }
  if (e.key !== 'Tab') return;
  const lista = enfocables();
  if (!lista.length) { e.preventDefault(); return; }
  const primero = lista[0];
  const ultimo = lista[lista.length - 1];
  if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
}

watch(
  () => props.abierto,
  async (valor) => {
    if (valor) {
      previo = document.activeElement;
      bloquearScroll();
      await nextTick();
      const campo = ventana.value?.querySelector('.amd-cuerpo input:not([type=hidden]):not([type=checkbox]), .amd-cuerpo select, .amd-cuerpo textarea');
      (campo || ventana.value)?.focus?.({ preventScroll: true });
    } else {
      liberarScroll();
      if (previo && typeof previo.focus === 'function' && document.contains(previo)) {
        previo.focus({ preventScroll: true });
      }
      previo = null;
    }
  },
  { immediate: true }
);

onBeforeUnmount(liberarScroll);
</script>

<style>
.amd-fondo {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 1rem;
  box-sizing: border-box;
  background: rgba(8, 36, 56, 0.58);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  overscroll-behavior: contain;
}

.amd-ventana {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: min(92vh, 880px);
  max-height: min(92dvh, 880px);
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 24px;
  background: #fff;
  color: #12354d;
  box-shadow: 0 40px 80px -24px rgba(8, 36, 56, 0.65), 0 0 0 1px rgba(15, 61, 94, 0.08);
  outline: none;
}
.amd-sm { max-width: 460px; }
.amd-md { max-width: 680px; }
.amd-lg { max-width: 860px; }

/* Franja superior con los colores del sitio */
.amd-ventana::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, #0f3d5e, #1a5c8a 45%, #35c4bf);
}

.amd-cab {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.35rem 1.4rem 1rem;
  border-bottom: 1px solid #e3edf2;
}
.amd-icono {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, #1a5c8a, #2a9d9a);
  box-shadow: 0 10px 20px -10px rgba(26, 92, 138, 0.8);
}
.amd-titulos { min-width: 0; flex: 1; }
.amd-titulos h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.25;
  color: #0f3d5e;
}
.amd-titulos p { margin: 0.2rem 0 0; font-size: 0.84rem; color: #5b7686; }

.amd-ventana .amd-x {
  appearance: none;
  display: grid;
  place-items: center;
  flex: none;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: #eef5f8;
  color: #35566b;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}
.amd-ventana .amd-x:hover { background: #fdecec; color: #b23a3a; transform: rotate(90deg); }
.amd-ventana .amd-x:focus-visible { outline: 3px solid rgba(53, 196, 191, 0.6); outline-offset: 2px; }
.amd-ventana .amd-x:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

.amd-cuerpo {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.2rem 1.4rem 1.4rem;
}
.amd-pie {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0.9rem 1.4rem 1.1rem;
  border-top: 1px solid #e3edf2;
  background: #f7fbfc;
}

/* Botones de acción al final del formulario dentro de la ventana */
.amd-cuerpo .acciones,
.amd-cuerpo .amd-acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.1rem;
  padding-top: 1rem;
  border-top: 1px solid #e3edf2;
}

/* Animación de entrada/salida (solo opacidad y escala: no deja transform residual) */
.amd-enter-active, .amd-leave-active { transition: opacity 0.22s ease; }
.amd-enter-active .amd-ventana, .amd-leave-active .amd-ventana { transition: transform 0.28s cubic-bezier(0.22, 0.9, 0.3, 1), opacity 0.22s ease; }
.amd-enter-from, .amd-leave-to { opacity: 0; }
.amd-enter-from .amd-ventana, .amd-leave-to .amd-ventana { transform: translateY(18px) scale(0.97); opacity: 0; }

/* Pantallas angostas: la ventana sube desde abajo, a todo lo ancho */
@media (max-width: 560px) {
  .amd-fondo { place-items: end center; padding: 0; }
  .amd-ventana {
    max-width: none;
    max-height: 94vh;
    max-height: 94dvh;
    border-radius: 24px 24px 0 0;
  }
  .amd-cab { padding: 1.2rem 1rem 0.9rem; }
  .amd-cuerpo { padding: 1rem 1rem 1.2rem; }
  .amd-pie { padding: 0.8rem 1rem 1rem; }
  .amd-enter-from .amd-ventana, .amd-leave-to .amd-ventana { transform: translateY(40px); }
}

@media (prefers-reduced-motion: reduce) {
  .amd-enter-active, .amd-leave-active,
  .amd-enter-active .amd-ventana, .amd-leave-active .amd-ventana,
  .amd-ventana .amd-x { transition: none; }
}
</style>