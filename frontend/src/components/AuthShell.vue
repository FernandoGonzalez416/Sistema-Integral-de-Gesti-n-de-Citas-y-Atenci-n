<template>
  <section class="as" @pointermove="paralaje" @pointerleave="centrar">
    <!-- Panel de marca -->
    <aside class="as-marca" aria-hidden="false">
      <span class="as-blob as-blob-1"></span>
      <span class="as-blob as-blob-2"></span>
      <span class="as-blob as-blob-3"></span>

      <span v-for="c in cruces" :key="c.id" class="as-cruz" :style="c.estilo">
        <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" fill="currentColor" /></svg>
      </span>

      <div class="as-marca-contenido">
        <span class="as-chip"><Icono name="shield" :size="16" /> Portal seguro de pacientes</span>
        <h2>Tu salud,<br /><em>siempre a la mano.</em></h2>
        <p class="as-lema">Solicita citas, mantén tus datos clínicos al día y accede desde cualquier dispositivo.</p>

        <ul class="as-lista">
          <li v-for="(b, i) in beneficios" :key="b.titulo" :style="{ '--i': i }">
            <span class="as-ico"><Icono :name="b.icono" :size="20" /></span>
            <span><strong>{{ b.titulo }}</strong><small>{{ b.texto }}</small></span>
          </li>
        </ul>
      </div>

      <!-- Electrocardiograma animado -->
      <svg class="as-ecg" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
        <path class="as-ecg-fondo" d="M0 70h120l18-34 24 80 22-62 14 16h80l18-30 24 70 20-50 12 8h248" />
        <path class="as-ecg-linea" d="M0 70h120l18-34 24 80 22-62 14 16h80l18-30 24 70 20-50 12 8h248" />
      </svg>
    </aside>

    <!-- Formulario -->
    <div class="as-panel">
      <div class="as-tarjeta" v-brillo>
        <header class="as-cabecera">
          <span class="as-logo" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="46" height="46">
              <defs>
                <linearGradient id="as-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#35c4bf" />
                  <stop offset="1" stop-color="#1a5c8a" />
                </linearGradient>
              </defs>
              <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="url(#as-grad)" />
              <path d="M17 9h6v8h8v6h-8v8h-6v-8H9v-6h8z" fill="#fff" />
              <path d="M7 24h7l2.5-5 4 10 2.5-5H33" fill="none" stroke="#0f3d5e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <h1>{{ titulo }}</h1>
          <p v-if="subtitulo">{{ subtitulo }}</p>
        </header>

        <slot />

        <footer v-if="$slots.pie" class="as-pie"><slot name="pie" /></footer>
      </div>
    </div>
  </section>
</template>

<script setup>
import Icono from './Icono.vue';
import { vBrillo } from '../composables/efectos.js';

defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' }
});

const beneficios = [
  { icono: 'calendar', titulo: 'Citas sin filas', texto: 'Solicita y consulta tus citas en línea.' },
  { icono: 'heart', titulo: 'Tu perfil clínico', texto: 'Peso, alergias y tipo de sangre listos para tu médico.' },
  { icono: 'cloud', titulo: 'En todos tus equipos', texto: 'Tus datos te siguen a cualquier navegador.' }
];

// Cruces médicas flotantes (posiciones fijas para un resultado estable).
const cruces = [
  { x: 8, y: 14, s: 22, d: 0, t: 9 },
  { x: 82, y: 10, s: 14, d: 1.5, t: 11 },
  { x: 70, y: 44, s: 28, d: 3, t: 13 },
  { x: 16, y: 58, s: 16, d: 2, t: 10 },
  { x: 90, y: 72, s: 20, d: 4, t: 12 },
  { x: 44, y: 8, s: 12, d: 5, t: 8 }
].map((c, id) => ({
  id,
  estilo: { left: `${c.x}%`, top: `${c.y}%`, width: `${c.s}px`, height: `${c.s}px`, animationDelay: `${c.d}s`, animationDuration: `${c.t}s` }
}));

// Paralaje suave: los elementos de fondo se desplazan con el cursor.
function paralaje(e) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
  e.currentTarget.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
}
function centrar(e) {
  e.currentTarget.style.setProperty('--px', 0);
  e.currentTarget.style.setProperty('--py', 0);
}
</script>

<style>
.as {
  --px: 0;
  --py: 0;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  min-height: calc(100vh - var(--nav-h, 64px) - var(--pie-h, 64px));
  min-height: calc(100dvh - var(--nav-h, 64px) - var(--pie-h, 64px));
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  background: #eef5f8;
}

/* ---------- Panel de marca ---------- */
.as-marca {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: clamp(1.5rem, 4vw, 4rem);
  color: #fff;
  background: linear-gradient(150deg, #0a2d47 0%, #124a73 48%, #1b7f8e 100%);
}
.as-blob { position: absolute; border-radius: 50%; filter: blur(50px); opacity: 0.55; transition: transform 0.4s ease-out; }
.as-blob-1 { width: 380px; height: 380px; left: -90px; top: -80px; background: #35c4bf; transform: translate(calc(var(--px) * 40px), calc(var(--py) * 40px)); }
.as-blob-2 { width: 320px; height: 320px; right: -60px; bottom: 6%; background: #3c7fd0; transform: translate(calc(var(--px) * -50px), calc(var(--py) * -30px)); }
.as-blob-3 { width: 220px; height: 220px; left: 40%; top: 46%; background: #5eeaea; opacity: 0.25; transform: translate(calc(var(--px) * 70px), calc(var(--py) * 60px)); }

.as-cruz { position: absolute; color: rgba(255, 255, 255, 0.16); animation: as-flotar ease-in-out infinite; }
.as-marca-contenido { position: relative; z-index: 1; max-width: 520px; }
.as-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(6px);
}
.as-marca h2 { margin: 1.1rem 0 0.8rem; font-size: clamp(2rem, 3.6vw, 3.1rem); line-height: 1.1; font-weight: 800; letter-spacing: -0.02em; }
.as-marca h2 em {
  font-style: normal;
  background: linear-gradient(90deg, #8ff3ee, #fff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.as-lema { margin: 0 0 1.6rem; font-size: 1.05rem; line-height: 1.55; color: rgba(255, 255, 255, 0.82); }
.as-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.8rem; }
.as-lista li {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.8rem 1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
  transition: transform 0.3s, background 0.3s, border-color 0.3s;
  animation: as-entrar 0.7s both;
  animation-delay: calc(0.15s * var(--i) + 0.2s);
}
.as-lista li:hover { transform: translateX(6px); background: rgba(255, 255, 255, 0.15); border-color: rgba(143, 243, 238, 0.6); }
.as-ico { display: grid; place-items: center; width: 42px; height: 42px; flex: none; border-radius: 12px; background: linear-gradient(135deg, #35c4bf, #1a5c8a); box-shadow: 0 6px 16px -6px rgba(0, 0, 0, 0.5); }
.as-lista li > span:last-child { flex: 1; min-width: 0; text-align: left; }
.as-lista strong { display: block; font-size: 0.98rem; }
.as-lista small { display: block; margin-top: 0.1rem; font-size: 0.84rem; color: rgba(255, 255, 255, 0.72); line-height: 1.35; }

.as-ecg { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 110px; opacity: 0.9; pointer-events: none; }
.as-ecg path { fill: none; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.as-ecg-fondo { stroke: rgba(255, 255, 255, 0.12); stroke-width: 2; }
.as-ecg-linea { stroke: #7ff5ee; stroke-width: 2.5; stroke-dasharray: 140 1200; filter: drop-shadow(0 0 6px #5eeaea); animation: as-pulso 3.4s linear infinite; }

/* ---------- Panel del formulario ---------- */
.as-panel {
  position: relative;
  display: grid;
  place-items: center;
  padding: clamp(1rem, 3vw, 2.5rem);
  background:
    radial-gradient(600px circle at 90% 0%, rgba(53, 196, 191, 0.16), transparent 60%),
    radial-gradient(500px circle at 0% 100%, rgba(26, 92, 138, 0.13), transparent 60%),
    #eef5f8;
}
.as-tarjeta {
  --mx: 50%;
  --my: 0%;
  position: relative;
  width: min(460px, 100%);
  box-sizing: border-box;
  padding: clamp(1.4rem, 3vw, 2.2rem);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 30px 60px -28px rgba(15, 61, 94, 0.45), 0 2px 0 rgba(255, 255, 255, 0.8) inset;
  backdrop-filter: blur(12px);
  animation: as-entrar 0.6s both;
}
.as-tarjeta::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(380px circle at var(--mx) var(--my), rgba(42, 157, 154, 0.12), transparent 65%);
  pointer-events: none;
}
.as-cabecera { text-align: center; margin-bottom: 1.3rem; }
.as-logo { display: inline-block; filter: drop-shadow(0 8px 14px rgba(26, 92, 138, 0.4)); animation: as-latir 2.6s ease-in-out infinite; }
.as-cabecera h1 { margin: 0.6rem 0 0.25rem; font-size: 1.65rem; font-weight: 800; letter-spacing: -0.01em; color: #0f3d5e; }
.as-cabecera p { margin: 0; color: #5b7686; font-size: 0.95rem; }
.as-pie { margin-top: 1.3rem; text-align: center; color: #5b7686; font-size: 0.94rem; }
.as-pie a { color: #1a5c8a; font-weight: 700; text-decoration: none; background: linear-gradient(#2a9d9a, #2a9d9a) left bottom / 0 2px no-repeat; transition: background-size 0.3s; }
.as-pie a:hover { background-size: 100% 2px; }
.as-pie a:focus-visible { outline: 3px solid #35c4bf; outline-offset: 3px; border-radius: 4px; }

@keyframes as-flotar { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-22px) rotate(14deg); } }
@keyframes as-entrar { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes as-pulso { from { stroke-dashoffset: 140; } to { stroke-dashoffset: -1060; } }
@keyframes as-latir { 0%, 100% { transform: scale(1); } 12% { transform: scale(1.07); } 24% { transform: scale(1); } }

/* ---------- Botón de envío y aviso de error (compartidos por Login y Registro) ---------- */
.lg-aviso {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: #fdecec;
  border: 1px solid #f3c2c2;
  color: #a12f2f;
  font-size: 0.9rem;
  font-weight: 500;
  animation: lg-sacudir 0.4s;
}
.lg-aviso-enter-active, .lg-aviso-leave-active { transition: opacity 0.25s, transform 0.25s; }
.lg-aviso-enter-from, .lg-aviso-leave-to { opacity: 0; transform: translateY(-6px); }

.lg-enviar {
  position: relative;
  overflow: hidden;
  width: 100%;
  appearance: none;
  border: 0;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  font: inherit;
  font-size: 1.02rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(120deg, #1a5c8a, #2a9d9a 70%, #35c4bf);
  background-size: 160% 100%;
  box-shadow: 0 14px 26px -14px rgba(26, 92, 138, 0.9);
  transition: transform 0.25s, box-shadow 0.25s, background-position 0.5s;
}
.lg-enviar:hover:not(:disabled) { transform: translateY(-2px); background-position: 100% 0; box-shadow: 0 18px 30px -14px rgba(26, 92, 138, 0.95); }
.lg-enviar:active:not(:disabled) { transform: translateY(0) scale(0.99); }
.lg-enviar:disabled { cursor: progress; opacity: 0.88; }
.lg-enviar:focus-visible { outline: 3px solid #5eeaea; outline-offset: 3px; }
.lg-texto { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
.lg-enviar:hover:not(:disabled) .lg-texto .icono { transform: translateX(4px); }
.lg-texto .icono { transition: transform 0.25s; }
.lg-brillo {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.45) 50%, transparent 65%);
  transform: translateX(-120%);
}
.lg-enviar:hover:not(:disabled) .lg-brillo { animation: lg-barrer 0.9s ease; }
.lg-spin { width: 18px; height: 18px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.4); border-top-color: #fff; animation: lg-girar 0.7s linear infinite; }

@keyframes lg-barrer { to { transform: translateX(120%); } }
@keyframes lg-girar { to { transform: rotate(360deg); } }
@keyframes lg-sacudir { 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
@media (prefers-reduced-motion: reduce) {
  .lg-aviso, .lg-spin { animation: none; }
  .lg-enviar, .lg-texto .icono { transition: none; }
  .lg-enviar:hover:not(:disabled) .lg-brillo { animation: none; }
}

/* ---------- Responsivo ---------- */
@media (max-width: 900px) {
  .as { grid-template-columns: 1fr; align-content: start; }
  .as-marca { padding: 1.4rem 1.2rem 4.2rem; }
  .as-marca-contenido { max-width: none; }
  .as-marca h2 { font-size: 1.7rem; margin: 0.8rem 0 0.4rem; }
  .as-lema, .as-lista { display: none; }
  .as-ecg { height: 70px; }
  .as-panel { margin-top: -3rem; background: transparent; padding-top: 0; }
  .as-tarjeta { background: #fff; }
}
@media (max-width: 420px) {
  .as-chip { font-size: 0.76rem; }
  .as-tarjeta { border-radius: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .as-cruz, .as-ecg-linea, .as-logo, .as-lista li, .as-tarjeta { animation: none; }
  .as-ecg-linea { stroke-dasharray: none; }
  .as-blob { transition: none; }
}
</style>
