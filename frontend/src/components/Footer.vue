<template>
  <footer ref="pie" class="pie" :class="{ visible }" :inert="!visible">
    <div class="pie-interno">
      <!-- Izquierda: logo de la universidad -->
      <div class="pie-logo-caja">
        <img
          v-if="fuenteLogo"
          class="pie-logo"
          :src="fuenteLogo"
          alt="Logo de la Universidad Mariano Gálvez de Guatemala"
          referrerpolicy="no-referrer"
          @error="logoFalla"
        />
        <span v-else class="pie-logo pie-logo-reserva" role="img" aria-label="Logo de la universidad">U</span>
      </div>

      <!-- Centro: identidad del sitio y tabla de estudiantes / "Grupo 2" -->
      <div class="pie-centro">
        <p class="pie-sitio">
          <img :src="sitio.logoUrl || '/logo-sigsa.svg'" alt="" width="22" height="22" loading="lazy" @error="$event.target.style.display = 'none'" />
          <span>{{ sitio.nombre }}</span>
        </p>
        <table class="estudiantes">
          <caption class="solo-lectores">Grupo 2 — integrantes</caption>
          <thead class="solo-lectores">
            <tr><th scope="col">Estudiante</th><th scope="col">Carné</th></tr>
          </thead>
          <tbody>
            <tr v-for="e in ESTUDIANTES" :key="e.carne">
              <td class="nombre">{{ e.nombre }}</td>
              <td class="carne">{{ e.carne }}</td>
            </tr>
          </tbody>
        </table>
        <strong class="grupo">Grupo 2</strong>
      </div>

      <!-- Derecha: conexión con el servidor -->
      <div class="pie-estado" :class="`estado-${salud.estado}`" role="status" :aria-label="textoEstado">
        <button
          type="button"
          class="luces"
          :aria-label="`Servidor: ${textoEstado}. Pulsa para reintentar`"
          :title="`${textoEstado} — pulsa para reintentar`"
          @click="reintentar"
        >
          <span class="luz luz-verde"></span>
          <span class="luz luz-roja"></span>
        </button>
        <div class="estado-texto">
          <span class="etiqueta">{{ textoEstado }}</span>
          <time v-if="fechaTexto" class="fecha" :datetime="fechaIso">{{ fechaTexto }}</time>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useHealthStore } from '../stores/health.js';
import { cargarSitio, sitio } from '../composables/sitio.js';

// Logo oficial (Wikimedia). Si no carga, se intenta /logo-universidad.png
// (colocado en frontend/public/) y, por último, una "U".
const LOGOS = [
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Escudo_de_la_universidad_Mariano_G%C3%A1lvez_Guatemala.svg/960px-Escudo_de_la_universidad_Mariano_G%C3%A1lvez_Guatemala.svg.png',
  '/logo-universidad.png'
];

const ESTUDIANTES = [
  { nombre: 'María Edelmira Méndez Royán', carne: '090-14-13932' },
  { nombre: 'Walter Josué Ruiz Gálvez', carne: '0910-20-10484' },
  { nombre: 'Fernando Javier Gonzalez Ovando', carne: '5190-21-4854' }
];

const INTERVALO_SALUD = 60000; // ms entre verificaciones automáticas
const MARGEN_FINAL = 4; // px para considerar que se llegó al final
const UMBRAL_TOPE = 8; // px para considerar que se está arriba

const salud = useHealthStore();
const pie = ref(null);
const visible = ref(false);
const indiceLogo = ref(0);
const ultimaVerificacion = ref(null);

const fuenteLogo = computed(() => LOGOS[indiceLogo.value] || '');
function logoFalla() {
  indiceLogo.value += 1;
}

const textoEstado = computed(() => {
  if (salud.estado === 'ok') return 'Conectado';
  if (salud.estado === 'error') return 'Desconectado';
  return 'Verificando';
});

const fecha = computed(() => {
  if (salud.estado === 'ok' && salud.datos?.timestamp) {
    const d = new Date(salud.datos.timestamp);
    if (!isNaN(d)) return d;
  }
  return ultimaVerificacion.value;
});
const fechaTexto = computed(() =>
  fecha.value
    ? fecha.value.toLocaleString('es', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    : ''
);
const fechaIso = computed(() => (fecha.value ? fecha.value.toISOString() : ''));

async function reintentar() {
  await salud.verificar();
  ultimaVerificacion.value = new Date();
}

// Visibilidad: al final → fijo; arriba → oculto; bajando → visible; subiendo → oculto.
let ultimoY = 0;
let pendiente = false;
function evaluar() {
  pendiente = false;
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (y >= max - MARGEN_FINAL) visible.value = true;
  else if (y <= UMBRAL_TOPE) visible.value = false;
  else if (y > ultimoY + 2) visible.value = true;
  else if (y < ultimoY - 2) visible.value = false;
  ultimoY = y;
}
function alScroll() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(evaluar);
}

let observaPie = null;
let observaCuerpo = null;
let temporizador = null;

onMounted(() => {
  cargarSitio();
  reintentar();
  temporizador = setInterval(reintentar, INTERVALO_SALUD);

  ultimoY = window.scrollY;
  evaluar();
  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', alScroll);

  // El layout reserva espacio igual a la altura real del pie.
  if (typeof ResizeObserver !== 'undefined') {
    observaPie = new ResizeObserver(() => {
      if (pie.value) {
        document.documentElement.style.setProperty('--pie-h', `${pie.value.offsetHeight}px`);
      }
    });
    observaPie.observe(pie.value);
    observaCuerpo = new ResizeObserver(alScroll);
    observaCuerpo.observe(document.body);
  }
});

onUnmounted(() => {
  clearInterval(temporizador);
  window.removeEventListener('scroll', alScroll);
  window.removeEventListener('resize', alScroll);
  observaPie?.disconnect();
  observaCuerpo?.disconnect();
  document.documentElement.style.removeProperty('--pie-h');
});
</script>

<style>
.pie {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  background: linear-gradient(100deg, #0b2f49 0%, #0f3d5e 60%, #134b69 100%);
  color: #e8f3f8;
  font-family: sans-serif;
  border-top: 2px solid #2a9d9a;
  box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.25);
  padding-bottom: env(safe-area-inset-bottom, 0);
  transform: translateY(100%);
  visibility: hidden;
  transition: transform 0.35s cubic-bezier(0.22, 0.8, 0.3, 1), visibility 0s linear 0.35s;
}
.pie.visible {
  transform: none;
  visibility: visible;
  transition: transform 0.35s cubic-bezier(0.22, 0.8, 0.3, 1), visibility 0s;
}

.pie-interno {
  box-sizing: border-box;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.6rem clamp(0.75rem, 3vw, 2rem);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.5rem 1.5rem;
}

/* ---- Logo (izquierda) ---- */
.pie-logo-caja { display: flex; align-items: center; justify-content: flex-start; }
.pie-logo {
  height: 54px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  background: #fff;
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
.pie-logo-reserva {
  width: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f3d5e;
  font-weight: bold;
  font-size: 1.6rem;
  padding: 0;
}

/* ---- Centro: tabla estudiante / carné ---- */
.pie-centro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  min-width: 0;
}
.pie-sitio {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  max-width: min(420px, 55vw);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pie-sitio img { width: 22px; height: 22px; object-fit: contain; flex: none; }
.pie-sitio span { overflow: hidden; text-overflow: ellipsis; }
.pie .estudiantes {
  border-collapse: collapse;
  font-size: 0.8rem;
  line-height: 1.4;
}
.pie .estudiantes td { padding: 0.08rem 0; border: 0; white-space: nowrap; text-align: left; }
.pie .estudiantes .nombre { padding-right: 1.5rem; font-weight: 500; }
.pie .estudiantes .carne { opacity: 0.8; font-variant-numeric: tabular-nums; }
.pie .grupo {
  display: none;
  font-size: 0.95rem;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  white-space: nowrap;
}
.solo-lectores {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ---- Derecha: luces de conexión ---- */
.pie-estado { display: flex; align-items: center; justify-content: flex-end; gap: 0.7rem; }
.pie .luces {
  appearance: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.pie .luces:hover { background: rgba(0, 0, 0, 0.45); transform: scale(1.05); }
.pie .luces:focus-visible { outline: 3px solid #5eeaea; outline-offset: 2px; }

.pie .luz {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  opacity: 0.22;
  transition: opacity 0.3s, box-shadow 0.3s;
}
.pie .luz-verde { background: #3ddc84; }
.pie .luz-roja { background: #ff4b50; }

/* Solo se enciende la luz que corresponde al estado */
.estado-ok .luz-verde { opacity: 1; box-shadow: 0 0 10px 2px rgba(61, 220, 132, 0.85); }
.estado-error .luz-roja { opacity: 1; box-shadow: 0 0 10px 2px rgba(255, 75, 80, 0.85); }
.estado-pendiente .luz { animation: pie-pulso 1s ease-in-out infinite; }
.estado-pendiente .luz-roja { animation-delay: 0.5s; }

.estado-texto { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.25; }
.pie .etiqueta { font-size: 0.82rem; font-weight: 600; }
.estado-ok .etiqueta { color: #5eeaa0; }
.estado-error .etiqueta { color: #ff8a8d; }
.estado-pendiente .etiqueta { color: #ffd27a; }
.pie .fecha { font-size: 0.68rem; opacity: 0.75; font-variant-numeric: tabular-nums; }

@keyframes pie-pulso { 50% { opacity: 0.6; } }

/* ---- Pantallas medianas: se ahorra espacio ---- */
@media (max-width: 960px) {
  .pie .fecha { display: none; }
  .pie .estudiantes .nombre { padding-right: 1rem; }
}

/* ---- Pantallas angostas: logo, "Grupo 2" y luces simplificadas ---- */
@media (max-width: 700px) {
  .pie-interno { grid-template-columns: auto 1fr auto; gap: 0.5rem 0.75rem; padding: 0.5rem 0.75rem; }
  .pie-logo { height: 44px; max-width: 80px; }
  .pie-logo-reserva { width: 44px; font-size: 1.3rem; }
  .pie .estudiantes { display: none; }
  .pie .grupo { display: inline-block; }
  .estado-texto { display: none; }
  .pie .luces { padding: 0.35rem 0.45rem; gap: 0.3rem; }
  .pie .luz { width: 11px; height: 11px; }
}

@media (prefers-reduced-motion: reduce) {
  .pie, .pie.visible { transition: none; }
  .estado-pendiente .luz { animation: none; }
}
</style>