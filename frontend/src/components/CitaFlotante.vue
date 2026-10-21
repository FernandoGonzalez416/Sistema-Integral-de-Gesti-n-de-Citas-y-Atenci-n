<template>
  <div
    ref="raiz"
    class="cf"
    :class="{ arrastrando, oculto: citaAbierta, listo }"
    :style="estilo"
  >
    <!-- Aviso breve tras un clic -->
    <Transition name="cf-aviso">
      <div v-if="aviso" class="cf-aviso" :class="ladoEtiqueta" role="status">
        <strong>¿Quieres agendar?</strong>
        <span>Doble clic para abrir · arrastra para mover</span>
      </div>
    </Transition>

    <button
      ref="boton"
      type="button"
      class="cf-boton"
      aria-haspopup="dialog"
      aria-label="Solicitar cita. Doble clic o Enter para abrir; arrastra o usa las flechas para moverlo"
      title="Solicitar cita"
      @pointerdown="alPulsar"
      @pointermove="alMover"
      @pointerup="alSoltar"
      @pointercancel="alCancelar"
      @keydown="alTeclado"
      @contextmenu.prevent
    >
      <span class="cf-anillo cf-anillo-1" aria-hidden="true"></span>
      <span class="cf-anillo cf-anillo-2" aria-hidden="true"></span>

      <span class="cf-nucleo" :style="{ '--giro': `${giro}deg` }">
        <svg class="cf-icono" viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
          <!-- Calendario -->
          <rect x="6" y="9" width="36" height="33" rx="7" fill="rgba(255,255,255,0.18)" stroke="#fff" stroke-width="2.6" />
          <path d="M6 20h36" stroke="#fff" stroke-width="2.6" />
          <path d="M15 5v8M33 5v8" stroke="#fff" stroke-width="2.8" stroke-linecap="round" />
          <!-- Cruz médica -->
          <path class="cf-cruz" d="M22 24h4v4h4v4h-4v4h-4v-4h-4v-4h4z" fill="#fff" />
          <!-- Latido -->
          <path class="cf-pulso" d="M9 33h6l2-4 3.5 8 2.5-4H39" fill="none" stroke="#7ff3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>

      <span class="cf-etiqueta" :class="ladoEtiqueta">
        Solicitar cita
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
    </button>

    <!-- Asa visual: indica que se puede mover -->
    <span class="cf-asa" aria-hidden="true">
      <i></i><i></i><i></i><i></i><i></i><i></i>
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { abrirCita, citaAbierta } from '../composables/citaModal.js';

const TAM = 68; // diámetro del botón (px)
const MARGEN = 8;
const UMBRAL_ARRASTRE = 6; // px que se deben mover para considerarlo arrastre
const VENTANA_DOBLE = 380; // ms entre dos toques para contar como doble clic/toque
const CLAVE = 'sigsa_cita_flotante';

const raiz = ref(null);
const boton = ref(null);
const x = ref(0);
const y = ref(0);
const listo = ref(false);
const arrastrando = ref(false);
const aviso = ref(false);
const giro = ref(0);

const estilo = computed(() => ({ transform: `translate3d(${x.value}px, ${y.value}px, 0)` }));

// La etiqueta se despliega hacia el lado donde hay espacio.
const ladoEtiqueta = computed(() => {
  const ancho = typeof window === 'undefined' ? 1200 : window.innerWidth;
  return x.value + TAM / 2 > ancho / 2 ? 'izq' : 'der';
});

/* ---------- Límites y persistencia ---------- */
function limites() {
  const nav = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
  return {
    minX: MARGEN,
    maxX: Math.max(MARGEN, window.innerWidth - TAM - MARGEN),
    minY: Math.min(nav + MARGEN, window.innerHeight - TAM - MARGEN),
    maxY: Math.max(MARGEN, window.innerHeight - TAM - MARGEN)
  };
}

function ajustar() {
  const l = limites();
  x.value = Math.min(Math.max(x.value, l.minX), l.maxX);
  y.value = Math.min(Math.max(y.value, l.minY), l.maxY);
}

function guardar() {
  const l = limites();
  const rx = l.maxX === l.minX ? 1 : (x.value - l.minX) / (l.maxX - l.minX);
  const ry = l.maxY === l.minY ? 0 : (y.value - l.minY) / (l.maxY - l.minY);
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ rx, ry }));
  } catch {
    /* sin almacenamiento: la posición solo dura la sesión */
  }
}

function restaurar() {
  const l = limites();
  let pos = { rx: 1, ry: 0 }; // esquina superior derecha por defecto
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (g && Number.isFinite(g.rx) && Number.isFinite(g.ry)) pos = g;
  } catch {
    /* se usa la posición por defecto */
  }
  x.value = l.minX + Math.min(Math.max(pos.rx, 0), 1) * (l.maxX - l.minX);
  y.value = l.minY + Math.min(Math.max(pos.ry, 0), 1) * (l.maxY - l.minY);
}

// Al cambiar el tamaño de la ventana se conserva la posición relativa.
function alRedimensionar() {
  restaurar();
}

/* ---------- Arrastrar (ratón, lápiz y dedo) ---------- */
let inicio = null; // { px, py, bx, by, id }
let movido = false;
let ultimoToque = 0;
let ultimoX = 0;
let temporizadorAviso = null;

function alPulsar(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  inicio = { px: e.clientX, py: e.clientY, bx: x.value, by: y.value, id: e.pointerId };
  movido = false;
  ultimoX = e.clientX;
  boton.value?.setPointerCapture?.(e.pointerId);
}

function alMover(e) {
  if (!inicio || e.pointerId !== inicio.id) return;
  const dx = e.clientX - inicio.px;
  const dy = e.clientY - inicio.py;
  if (!movido && Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return;
  if (!movido) {
    movido = true;
    arrastrando.value = true;
    aviso.value = false;
  }
  const l = limites();
  x.value = Math.min(Math.max(inicio.bx + dx, l.minX), l.maxX);
  y.value = Math.min(Math.max(inicio.by + dy, l.minY), l.maxY);
  // El icono se inclina según la velocidad horizontal.
  giro.value = Math.max(-22, Math.min(22, (e.clientX - ultimoX) * 2.2));
  ultimoX = e.clientX;
}

function alSoltar(e) {
  if (!inicio || e.pointerId !== inicio.id) return;
  boton.value?.releasePointerCapture?.(e.pointerId);
  inicio = null;
  giro.value = 0;
  if (movido) {
    arrastrando.value = false;
    guardar();
    ultimoToque = 0;
    return;
  }
  // Fue un toque/clic: uno muestra la ayuda, dos seguidos abren la ventana.
  const ahora = Date.now();
  if (ahora - ultimoToque <= VENTANA_DOBLE) {
    ultimoToque = 0;
    aviso.value = false;
    abrirCita();
  } else {
    ultimoToque = ahora;
    aviso.value = true;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => (aviso.value = false), 2600);
  }
}

function alCancelar() {
  inicio = null;
  movido = false;
  arrastrando.value = false;
  giro.value = 0;
}

/* ---------- Teclado: Enter/Espacio abre, flechas mueven ---------- */
function alTeclado(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    abrirCita();
    return;
  }
  const paso = e.shiftKey ? 80 : 24;
  const mov = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[e.key];
  if (!mov) return;
  e.preventDefault();
  x.value += mov[0];
  y.value += mov[1];
  ajustar();
  guardar();
}

onMounted(() => {
  restaurar();
  requestAnimationFrame(() => (listo.value = true));
  window.addEventListener('resize', alRedimensionar);
});

onUnmounted(() => {
  window.removeEventListener('resize', alRedimensionar);
  clearTimeout(temporizadorAviso);
});
</script>

<style>
.cf {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 95; /* sobre el pie (90) y bajo las ventanas (1000) */
  width: 68px;
  height: 68px;
  opacity: 0;
  will-change: transform;
  transition: opacity 0.4s ease;
  user-select: none;
  -webkit-user-select: none;
}
.cf.listo { opacity: 1; }
.cf.oculto { opacity: 0; pointer-events: none; }

.cf-boton {
  position: relative;
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: grab;
  color: #fff;
  background: radial-gradient(circle at 30% 25%, #4fd8d2 0%, #1f8fa0 45%, #0f3d5e 100%);
  box-shadow: 0 10px 26px rgba(15, 61, 94, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.35), inset 0 -4px 10px rgba(0, 0, 0, 0.2);
  touch-action: none; /* el dedo arrastra el botón, no la página */
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1), box-shadow 0.3s;
  animation: cf-flotar 4s ease-in-out infinite;
}
.cf-boton:hover { transform: scale(1.08); box-shadow: 0 14px 34px rgba(15, 61, 94, 0.55), 0 0 0 5px rgba(79, 216, 210, 0.25), inset 0 2px 0 rgba(255, 255, 255, 0.4); }
.cf-boton:focus-visible { outline: 3px solid #fff; outline-offset: 3px; box-shadow: 0 0 0 6px #1a5c8a; }
.cf.arrastrando .cf-boton { cursor: grabbing; transform: scale(1.18); animation: none; box-shadow: 0 22px 44px rgba(8, 36, 56, 0.55), 0 0 0 7px rgba(79, 216, 210, 0.3); }

/* Anillos que laten */
.cf-anillo {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(79, 216, 210, 0.7);
  pointer-events: none;
  animation: cf-onda 2.8s ease-out infinite;
}
.cf-anillo-2 { animation-delay: 1.4s; }
.cf.arrastrando .cf-anillo { animation: none; opacity: 0; }

.cf-nucleo {
  position: relative;
  display: grid;
  place-items: center;
  transform: rotate(var(--giro, 0deg));
  transition: transform 0.25s ease;
  pointer-events: none;
}
.cf-icono { filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3)); }
.cf-cruz { transform-origin: 24px 30px; animation: cf-latido 1.8s ease-in-out infinite; }
.cf-pulso { stroke-dasharray: 60; stroke-dashoffset: 60; animation: cf-trazo 2.4s ease-in-out infinite; }
.cf-boton:hover .cf-icono { animation: cf-meneo 0.6s ease; }

/* Etiqueta que se despliega al pasar el ratón */
.cf-etiqueta {
  position: absolute;
  top: 50%;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  height: 40px;
  padding: 0 1rem;
  border-radius: 999px;
  white-space: nowrap;
  font: 700 0.9rem/1 sans-serif;
  letter-spacing: 0.02em;
  color: #0f3d5e;
  background: #fff;
  box-shadow: 0 8px 20px rgba(8, 36, 56, 0.28);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-50%) scale(0.85);
  transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1);
}
.cf-etiqueta.izq { right: calc(100% + 12px); transform-origin: right center; }
.cf-etiqueta.der { left: calc(100% + 12px); transform-origin: left center; }
.cf-boton:hover .cf-etiqueta,
.cf-boton:focus-visible .cf-etiqueta { opacity: 1; transform: translateY(-50%) scale(1); }
.cf.arrastrando .cf-etiqueta { opacity: 0; }

/* Asa de puntos (arriba a la derecha del botón) */
.cf-asa {
  position: absolute;
  top: -4px;
  right: -4px;
  display: grid;
  grid-template-columns: repeat(2, 4px);
  gap: 2px;
  padding: 4px;
  border-radius: 9px;
  background: #fff;
  box-shadow: 0 3px 8px rgba(8, 36, 56, 0.3);
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.2s, transform 0.25s cubic-bezier(0.3, 1.6, 0.5, 1);
  pointer-events: none;
}
.cf-asa i { width: 4px; height: 4px; border-radius: 50%; background: #1f8fa0; }
.cf:hover .cf-asa,
.cf.arrastrando .cf-asa { opacity: 1; transform: scale(1); }

/* Aviso tras un clic */
.cf-aviso {
  position: absolute;
  top: 50%;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  width: max-content;
  max-width: min(250px, 62vw);
  padding: 0.6rem 0.85rem;
  border-radius: 14px;
  font-family: sans-serif;
  color: #fff;
  background: #0f3d5e;
  box-shadow: 0 10px 26px rgba(8, 36, 56, 0.4);
  transform: translateY(-50%);
  pointer-events: none;
}
.cf-aviso strong { font-size: 0.92rem; }
.cf-aviso span { font-size: 0.78rem; opacity: 0.85; line-height: 1.3; }
.cf-aviso.izq { right: calc(100% + 12px); }
.cf-aviso.der { left: calc(100% + 12px); }
.cf-aviso::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  background: #0f3d5e;
  transform: translateY(-50%) rotate(45deg);
}
.cf-aviso.izq::after { right: -4px; }
.cf-aviso.der::after { left: -4px; }
.cf-aviso-enter-active, .cf-aviso-leave-active { transition: opacity 0.25s, margin 0.25s; }
.cf-aviso-enter-from, .cf-aviso-leave-to { opacity: 0; }

@keyframes cf-flotar { 0%, 100% { translate: 0 0; } 50% { translate: 0 -4px; } }
@keyframes cf-onda { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.75); opacity: 0; } }
@keyframes cf-latido { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.18); } }
@keyframes cf-trazo { 0% { stroke-dashoffset: 60; } 55%, 100% { stroke-dashoffset: 0; } }
@keyframes cf-meneo { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-12deg); } 75% { transform: rotate(12deg); } }

@media (prefers-reduced-motion: reduce) {
  .cf-boton, .cf-anillo, .cf-cruz, .cf-pulso { animation: none; }
  .cf-pulso { stroke-dashoffset: 0; }
  .cf-boton, .cf-etiqueta, .cf-asa, .cf-nucleo { transition: none; }
}
</style>
