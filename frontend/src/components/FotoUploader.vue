<template>
  <div class="fu" :class="{ 'fu-centrado': centrado }">
    <div
      class="fu-marco"
      :class="{ arrastrando, 'fu-off': deshabilitado }"
      :style="{ '--sz': `${size}px` }"
      @dragenter.prevent="arrastrando = !deshabilitado"
      @dragover.prevent
      @dragleave.prevent="arrastrando = false"
      @drop.prevent="soltar"
    >
      <span class="fu-anillo" aria-hidden="true"></span>
      <button
        type="button"
        class="fu-boton"
        :disabled="deshabilitado"
        :aria-label="modelValue ? 'Cambiar foto de perfil' : 'Subir foto de perfil'"
        @click="elegir"
      >
        <Avatar :src="modelValue" :nombre="nombre" :size="size" :alt="`Foto de ${nombre || 'perfil'}`" />
        <span class="fu-velo" aria-hidden="true">
          <Icono name="camera" :size="Math.max(20, size * 0.22)" />
          <small v-if="size >= 100">{{ modelValue ? 'Cambiar' : 'Subir foto' }}</small>
        </span>
      </button>
      <span v-if="procesando" class="fu-cargando" aria-hidden="true"><i></i></span>
    </div>

    <div v-if="acciones && !deshabilitado" class="fu-acciones">
      <button type="button" class="fu-link" @click="elegir">
        <Icono name="camera" :size="16" /> {{ modelValue ? 'Cambiar foto' : 'Subir foto' }}
      </button>
      <button v-if="modelValue" type="button" class="fu-link fu-quitar" @click="quitar">
        <Icono name="x" :size="16" /> Quitar
      </button>
    </div>
    <p v-if="mensaje" class="fu-error" role="alert">{{ mensaje }}</p>

    <input ref="archivo" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="alElegir" />

    <!-- Recortador -->
    <Teleport to="body">
      <Transition name="fu-modal">
        <div v-if="origen" class="fu-fondo" @pointerdown.self="cancelar">
          <div class="fu-dialogo" role="dialog" aria-modal="true" aria-labelledby="fu-titulo">
            <h3 id="fu-titulo">Ajusta tu foto</h3>
            <p class="fu-ayuda">Arrastra para encuadrar y usa el control para acercar.</p>

            <div
              class="fu-visor"
              :style="{ '--v': `${V}px` }"
              tabindex="0"
              role="img"
              aria-label="Vista previa del recorte. Usa las flechas del teclado para mover la imagen."
              @pointerdown="empezar"
              @pointermove="mover"
              @pointerup="terminar"
              @pointercancel="terminar"
              @wheel.prevent="rueda"
              @keydown="teclado"
            >
              <img
                :src="origen.url"
                alt=""
                draggable="false"
                :style="{
                  width: `${origen.w}px`,
                  height: `${origen.h}px`,
                  transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${escala})`
                }"
              />
              <span class="fu-reticula" aria-hidden="true"></span>
            </div>

            <label class="fu-zoom">
              <span>−</span>
              <input v-model.number="zoom" type="range" min="1" max="3" step="0.01" aria-label="Zoom" />
              <span>+</span>
            </label>

            <div class="fu-botones">
              <button type="button" class="fu-btn fu-btn-sec" @click="cancelar">Cancelar</button>
              <button ref="botonAplicar" type="button" class="fu-btn fu-btn-pri" @click="aplicar">
                <Icono name="check" :size="18" /> Usar esta foto
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch, onUnmounted } from 'vue';
import Avatar from './Avatar.vue';
import Icono from './Icono.vue';

// Foto de perfil: elegir/arrastrar → recortar cuadrado → comprimir (JPEG 320×320) → data URL.
// El resultado pesa ~20-60 KB: cabe cómodo en la caché del navegador y en MongoDB.
const props = defineProps({
  modelValue: { type: String, default: '' },
  nombre: { type: String, default: '' },
  size: { type: Number, default: 120 },
  acciones: { type: Boolean, default: true },
  centrado: { type: Boolean, default: true },
  deshabilitado: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue', 'cambio']);

const SALIDA = 320;
const MAX_ARCHIVO = 10 * 1024 * 1024;
const TIPOS = ['image/png', 'image/jpeg', 'image/webp'];

const archivo = ref(null);
const botonAplicar = ref(null);
const arrastrando = ref(false);
const procesando = ref(false);
const mensaje = ref('');

const origen = ref(null); // { url, w, h, img }
const V = ref(280);
const zoom = ref(1);
const pos = reactive({ x: 0, y: 0 });
let inicio = null;

const escala = computed(() => (origen.value ? (V.value / Math.min(origen.value.w, origen.value.h)) * zoom.value : 1));

function limitar() {
  if (!origen.value) return;
  const mx = Math.max(0, (origen.value.w * escala.value - V.value) / 2);
  const my = Math.max(0, (origen.value.h * escala.value - V.value) / 2);
  pos.x = Math.min(mx, Math.max(-mx, pos.x));
  pos.y = Math.min(my, Math.max(-my, pos.y));
}
watch(zoom, limitar);

// Escape cierra el recortador esté donde esté el foco.
const alTeclaGlobal = (e) => { if (e.key === 'Escape') cancelar(); };
watch(origen, (abierto) => {
  if (abierto) window.addEventListener('keydown', alTeclaGlobal);
  else window.removeEventListener('keydown', alTeclaGlobal);
});

function elegir() {
  if (props.deshabilitado) return;
  mensaje.value = '';
  archivo.value?.click();
}

function alElegir(e) {
  const f = e.target.files?.[0];
  e.target.value = ''; // permite volver a elegir el mismo archivo
  if (f) abrir(f);
}

function soltar(e) {
  arrastrando.value = false;
  if (props.deshabilitado) return;
  const f = e.dataTransfer?.files?.[0];
  if (f) abrir(f);
}

function abrir(f) {
  mensaje.value = '';
  if (!TIPOS.includes(f.type)) { mensaje.value = 'Usa una imagen PNG, JPG o WEBP.'; return; }
  if (f.size > MAX_ARCHIVO) { mensaje.value = 'La imagen supera los 10 MB. Elige una más ligera.'; return; }
  procesando.value = true;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = async () => {
    procesando.value = false;
    V.value = Math.max(200, Math.min(280, window.innerWidth - 88));
    zoom.value = 1;
    pos.x = 0;
    pos.y = 0;
    origen.value = { url, w: img.naturalWidth, h: img.naturalHeight, img };
    await nextTick();
    botonAplicar.value?.focus();
  };
  img.onerror = () => {
    procesando.value = false;
    URL.revokeObjectURL(url);
    mensaje.value = 'No se pudo leer esa imagen. Prueba con otra.';
  };
  img.src = url;
}

function cerrar() {
  if (origen.value) URL.revokeObjectURL(origen.value.url);
  origen.value = null;
  inicio = null;
}
function cancelar() { cerrar(); }

function empezar(e) {
  inicio = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  e.currentTarget.setPointerCapture?.(e.pointerId);
}
function mover(e) {
  if (!inicio) return;
  pos.x = e.clientX - inicio.x;
  pos.y = e.clientY - inicio.y;
  limitar();
}
function terminar() { inicio = null; }
function rueda(e) { zoom.value = Math.min(3, Math.max(1, zoom.value - e.deltaY * 0.0015)); }
function teclado(e) {
  const paso = 12;
  const mapa = { ArrowLeft: [paso, 0], ArrowRight: [-paso, 0], ArrowUp: [0, paso], ArrowDown: [0, -paso] };
  if (mapa[e.key]) {
    e.preventDefault();
    pos.x += mapa[e.key][0];
    pos.y += mapa[e.key][1];
    limitar();
  } else if (e.key === 'Escape') cancelar();
}

function aplicar() {
  const o = origen.value;
  if (!o) return;
  const canvas = document.createElement('canvas');
  canvas.width = SALIDA;
  canvas.height = SALIDA;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // PNG con transparencia → fondo blanco
  ctx.fillRect(0, 0, SALIDA, SALIDA);
  ctx.imageSmoothingQuality = 'high';
  const r = SALIDA / V.value;
  const s = escala.value;
  ctx.drawImage(o.img, (V.value / 2 + pos.x - (o.w * s) / 2) * r, (V.value / 2 + pos.y - (o.h * s) / 2) * r, o.w * s * r, o.h * s * r);

  let calidad = 0.86;
  let data = canvas.toDataURL('image/jpeg', calidad);
  while (data.length > 150000 && calidad > 0.45) {
    calidad -= 0.1;
    data = canvas.toDataURL('image/jpeg', calidad);
  }
  cerrar();
  emit('update:modelValue', data);
  emit('cambio', data);
}

function quitar() {
  mensaje.value = '';
  emit('update:modelValue', '');
  emit('cambio', '');
}

onUnmounted(() => {
  window.removeEventListener('keydown', alTeclaGlobal);
  if (origen.value) URL.revokeObjectURL(origen.value.url);
});
</script>

<style>
.fu { display: flex; flex-direction: column; align-items: flex-start; gap: 0.6rem; }
.fu-centrado { align-items: center; }

.fu-marco { position: relative; width: var(--sz); height: var(--sz); border-radius: 50%; }
.fu-anillo {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #35c4bf, #1a5c8a, #5eeaea, #35c4bf);
  opacity: 0.85;
  transition: opacity 0.3s, filter 0.3s;
  animation: fu-girar 7s linear infinite;
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
}
.fu-marco:hover .fu-anillo,
.fu-marco.arrastrando .fu-anillo { opacity: 1; filter: drop-shadow(0 0 8px rgba(53, 196, 191, 0.8)); }
.fu-marco.arrastrando { transform: scale(1.05); }
.fu-marco { transition: transform 0.25s; }

.fu-boton {
  all: unset;
  position: relative;
  display: block;
  width: var(--sz);
  height: var(--sz);
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 0 0 4px #fff, 0 12px 28px -10px rgba(15, 61, 94, 0.55);
}
.fu-boton:focus-visible { outline: 3px solid #35c4bf; outline-offset: 5px; }
.fu-off .fu-boton { cursor: default; }
.fu-velo {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  color: #fff;
  background: linear-gradient(180deg, rgba(15, 61, 94, 0.15), rgba(15, 61, 94, 0.75));
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.25s, transform 0.25s;
  font-size: 0.78rem;
  font-weight: 600;
}
.fu-boton:hover .fu-velo,
.fu-boton:focus-visible .fu-velo,
.fu-marco.arrastrando .fu-velo { opacity: 1; transform: none; }
.fu-off .fu-velo { display: none; }

.fu-cargando { position: absolute; inset: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.7); display: grid; place-items: center; }
.fu-cargando i { width: 28px; height: 28px; border-radius: 50%; border: 3px solid #cfe3ea; border-top-color: #1a5c8a; animation: fu-girar 0.8s linear infinite; }

.fu-acciones { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: center; }
.fu-link {
  appearance: none;
  border: 0;
  background: rgba(26, 92, 138, 0.08);
  color: #1a5c8a;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.fu-link:hover { background: rgba(26, 92, 138, 0.16); transform: translateY(-1px); }
.fu-link:focus-visible { outline: 3px solid #35c4bf; outline-offset: 2px; }
.fu-quitar { color: #b23a3a; background: rgba(178, 58, 58, 0.08); }
.fu-quitar:hover { background: rgba(178, 58, 58, 0.16); }
.fu-error { margin: 0; color: #c23b3b; font-size: 0.82rem; text-align: center; }

/* ---- Modal de recorte ---- */
.fu-fondo {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(8, 36, 56, 0.62);
  backdrop-filter: blur(6px);
}
.fu-dialogo {
  width: min(380px, 100%);
  box-sizing: border-box;
  padding: 1.4rem 1.3rem 1.2rem;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.5);
  text-align: center;
  font-family: inherit;
}
.fu-dialogo h3 { margin: 0 0 0.2rem; color: #0f3d5e; font-size: 1.2rem; }
.fu-ayuda { margin: 0 0 1rem; color: #5b7686; font-size: 0.88rem; }
.fu-visor {
  position: relative;
  width: var(--v);
  height: var(--v);
  margin: 0 auto 1rem;
  border-radius: 50%;
  overflow: hidden;
  background: #0f3d5e;
  cursor: grab;
  touch-action: none;
  box-shadow: 0 0 0 4px #e3f1f4, 0 0 0 6px #35c4bf;
}
.fu-visor:active { cursor: grabbing; }
.fu-visor:focus-visible { outline: 3px solid #1a5c8a; outline-offset: 8px; }
.fu-visor img {
  position: absolute;
  left: 50%;
  top: 50%;
  max-width: none;
  user-select: none;
  pointer-events: none;
  transform-origin: center;
}
.fu-reticula {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  background:
    linear-gradient(rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.28)) center / 1px 100% no-repeat,
    linear-gradient(rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.28)) center / 100% 1px no-repeat;
}
.fu-zoom { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 1.1rem; color: #1a5c8a; font-weight: 700; font-size: 1.2rem; }
.fu-zoom input { flex: 1; accent-color: #2a9d9a; height: 28px; cursor: pointer; }
.fu-botones { display: flex; gap: 0.6rem; }
.fu-btn {
  flex: 1;
  appearance: none;
  border: 0;
  font: inherit;
  font-weight: 700;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}
.fu-btn:focus-visible { outline: 3px solid #35c4bf; outline-offset: 2px; }
.fu-btn-sec { background: #eaf2f6; color: #1a5c8a; }
.fu-btn-sec:hover { background: #dbe9f0; }
.fu-btn-pri { background: linear-gradient(135deg, #1a5c8a, #2a9d9a); color: #fff; box-shadow: 0 10px 20px -10px rgba(26, 92, 138, 0.8); }
.fu-btn-pri:hover { transform: translateY(-2px); box-shadow: 0 14px 24px -10px rgba(26, 92, 138, 0.9); }

.fu-modal-enter-active, .fu-modal-leave-active { transition: opacity 0.25s; }
.fu-modal-enter-active .fu-dialogo, .fu-modal-leave-active .fu-dialogo { transition: transform 0.3s cubic-bezier(0.3, 1.4, 0.5, 1); }
.fu-modal-enter-from, .fu-modal-leave-to { opacity: 0; }
.fu-modal-enter-from .fu-dialogo, .fu-modal-leave-to .fu-dialogo { transform: translateY(18px) scale(0.96); }

@keyframes fu-girar { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .fu-anillo, .fu-cargando i { animation: none; }
  .fu-marco, .fu-velo, .fu-link { transition: none; }
}
</style>
