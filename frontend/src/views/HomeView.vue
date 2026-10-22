<template>
  <main class="inicio">
    <section class="portada">
      <header class="cabecera">
        <div class="identidad">
          <h1>{{ sitio.nombre }}</h1>
          <p class="sistema">Sistema Integral de Gestión de Citas y Atención</p>
        </div>

        <ul class="redes" aria-label="Redes sociales">
          <li v-for="red in REDES" :key="red.id">
            <a :href="red.url" target="_blank" rel="noopener noreferrer" :aria-label="red.nombre" :title="red.nombre">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <template v-if="red.id === 'whatsapp'">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  <path d="M9 9.5c.5 2 2.5 4 4.5 4.5l1-1.2-1.6-1-.8.6c-.9-.4-1.7-1.2-2.1-2.1l.6-.8-1-1.6z" fill="currentColor" stroke="none" />
                </template>
                <template v-else-if="red.id === 'instagram'">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </template>
                <template v-else>
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </template>
              </svg>
            </a>
          </li>
        </ul>
      </header>

      <div class="portada-carrusel">
        <Carousel :diapositivas="diapositivas" />
      </div>
    </section>

    <section class="valores">
      <div class="valores-grid">
        <article class="valor">
          <div class="valor-icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <h2>{{ mision.titulo }}</h2>
          <p v-if="mision.listo">{{ mision.cuerpo }}</p>
          <div v-else class="esqueleto" aria-hidden="true"><span></span><span></span><span></span></div>
        </article>

        <article class="valor">
          <div class="valor-icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h2>{{ vision.titulo }}</h2>
          <p v-if="vision.listo">{{ vision.cuerpo }}</p>
          <div v-else class="esqueleto" aria-hidden="true"><span></span><span></span><span></span></div>
        </article>
      </div>
    </section>

    <!-- Información principal editable desde el panel -->
    <section v-if="infoPrincipal" id="nosotros" class="bloque bloque-info" aria-labelledby="t-info">
      <div class="bloque-interno">
        <h2 id="t-info" class="bloque-titulo">Información principal</h2>
        <div class="panel">
          <p class="info-texto">{{ infoPrincipal }}</p>
        </div>
      </div>
    </section>

    <!-- Horarios de atención -->
    <section id="horarios" class="bloque bloque-horarios" aria-labelledby="t-horarios">
      <div class="bloque-interno">
        <h2 id="t-horarios" class="bloque-titulo">Horario de atención</h2>
        <div class="panel">
          <h3>Días y horas</h3>
          <div class="tabla-scroll">
            <table class="tabla-horarios">
              <thead>
                <tr><th>Día</th><th>Inicio</th><th>Fin</th></tr>
              </thead>
              <tbody>
                <tr v-for="h in horarios" :key="h._id">
                  <td>{{ DIAS[h.dia] }}</td>
                  <td>{{ h.horaInicio }}</td>
                  <td>{{ h.horaFin }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="horariosVacio" class="vacio">Horarios no disponibles por el momento.</p>
        </div>
      </div>
    </section>

    <!-- Contenido educativo y corporativo -->
    <section id="educativo" class="bloque bloque-educativo" aria-labelledby="t-educativo">
      <div class="bloque-interno">
        <h2 id="t-educativo" class="bloque-titulo">Contenido educativo y corporativo</h2>
      </div>

      <div class="carrusel-seccion">
        <div class="bloque-interno">
          <h3 class="subtitulo">Educativo</h3>
          <p v-if="educativas.length === 0" class="vacio">No hay contenido educativo por el momento.</p>
        </div>
        <CintaPublicaciones :publicaciones="educativas" tipo="EDUCATIVO" />
      </div>

      <div class="carrusel-seccion">
        <div class="bloque-interno">
          <h3 class="subtitulo">Corporativo</h3>
          <p v-if="corporativas.length === 0" class="vacio">No hay contenido corporativo por el momento.</p>
        </div>
        <CintaPublicaciones :publicaciones="corporativas" tipo="CORPORATIVO" />
      </div>

      <div class="ver-mas-caja">
        <RouterLink to="/contenido" class="ver-mas">
          <span>Ver más</span>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { getCarrusel, getHorarios, getPublicaciones } from '../api/client.js';
import Carousel from '../components/Carousel.vue';
import CintaPublicaciones from '../components/CintaPublicaciones.vue';
import { cargarSitio, sitio } from '../composables/sitio.js';

// ⚠️ REEMPLAZAR con los enlaces reales de SIGCA.
const REDES = [
  { id: 'whatsapp', nombre: 'WhatsApp', url: 'https://wa.me/00000000000' },
  { id: 'instagram', nombre: 'Instagram', url: 'https://www.instagram.com/' },
  { id: 'facebook', nombre: 'Facebook', url: 'https://www.facebook.com/' }
];

const DIAPOSITIVAS_BASE = [
  { imagen: '/carrusel-1.svg', titulo: 'Atención integral' },
  { imagen: '/carrusel-2.svg', titulo: 'Profesionales calificados' },
  { imagen: '/carrusel-3.svg', titulo: 'Servicios para tu familia' },
  { imagen: '/carrusel-4.svg', titulo: 'Educación en salud' },
  {
    imagen: '/carrusel-5.svg',
    titulo: 'Reserva tu cita hoy',
    enlace: { to: '/servicios#solicitar-cita', texto: 'Solicitar cita' }
  }
];
const diapositivas = ref(DIAPOSITIVAS_BASE.map((d) => ({ ...d })));

// Solo si la API devuelve elementos se reemplazan los SVG locales.
async function cargarCarrusel() {
  try {
    const lista = await getCarrusel();
    if (Array.isArray(lista) && lista.length) {
      diapositivas.value = lista.map((d, i) => ({
        imagen: d.imagenUrl,
        titulo: d.titulo,
        ...(i === lista.length - 1
          ? { enlace: { to: '/servicios#solicitar-cita', texto: 'Solicitar cita' } }
          : {})
      }));
    }
  } catch {
    // Se conservan los SVG locales.
  }
}

// Textos por defecto: se usan mientras la base de datos tenga el marcador
// "Contenido pendiente de edición." o si el contenido no está disponible.
const MISION_BASE =
  'Brindar atención integral en salud a cada persona y a su familia, con profesionales calificados, trato humano y servicios accesibles. Respaldamos nuestro trabajo con una gestión de citas ordenada y confiable que respeta el tiempo de quienes nos visitan, y promovemos la educación en salud como base del bienestar.';
const VISION_BASE =
  'Ser el centro de referencia en atención integral y educación en salud de nuestra comunidad, reconocido por la calidad humana y profesional de nuestro equipo, la innovación en nuestros servicios y el compromiso permanente con el bienestar de las familias.';

const PENDIENTE = /pendiente de edici[oó]n/i;
const texto = (valor, base) => (!valor || PENDIENTE.test(valor) ? base : valor);

const mision = computed(() => ({
  titulo: 'Misión',
  cuerpo: texto(sitio.mision, MISION_BASE),
  listo: sitio.listo
}));
const vision = computed(() => ({
  titulo: 'Visión',
  cuerpo: texto(sitio.vision, VISION_BASE),
  listo: sitio.listo
}));
const infoPrincipal = computed(() => {
  const valor = sitio.informacionPrincipal || '';
  return PENDIENTE.test(valor) ? '' : valor;
});

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const horarios = ref([]);
const horariosVacio = ref(false);
const educativas = ref([]);
const corporativas = ref([]);

async function cargarHorarios() {
  try {
    horarios.value = await getHorarios();
    horariosVacio.value = horarios.value.length === 0;
  } catch {
    horariosVacio.value = true;
  }
}

async function cargarPublicaciones(tipo, destino) {
  try {
    destino.value = await getPublicaciones(tipo);
  } catch {
    destino.value = [];
  }
}

onMounted(() => {
  cargarSitio();
  cargarCarrusel();
  cargarHorarios();
  cargarPublicaciones('EDUCATIVO', educativas);
  cargarPublicaciones('CORPORATIVO', corporativas);
});
</script>

<style scoped>
.inicio { font-family: sans-serif; color: #24323b; }

/* ---- Portada: ocupa toda la pantalla bajo el menú ---- */
.portada {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--nav-h, 64px));
  height: calc(100dvh - var(--nav-h, 64px));
  min-height: 440px;
}

.cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  padding: 0.9rem clamp(1rem, 4vw, 3rem);
  background: #fff;
  border-bottom: 3px solid var(--turquesa, #2a9d9a);
}
.identidad { flex: 1 1 260px; min-width: 0; }
.identidad h1 {
  margin: 0;
  font-size: clamp(1.1rem, 2.4vw, 1.8rem);
  font-weight: 700;
  line-height: 1.25;
  color: var(--azul-oscuro, #0f3d5e);
}
.identidad .sistema {
  margin: 0.2rem 0 0;
  font-size: clamp(0.72rem, 1.2vw, 0.9rem);
  color: #5a7a8c;
}

.redes { display: flex; gap: 0.6rem; list-style: none; margin: 0; padding: 0; }
.redes a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--azul, #1a5c8a);
  color: var(--azul, #1a5c8a);
  transition: background 0.2s, color 0.2s, transform 0.2s;
}
.redes a:hover { background: var(--azul, #1a5c8a); color: #fff; transform: translateY(-2px); }
.redes a:focus-visible { outline: 3px solid var(--turquesa, #2a9d9a); outline-offset: 2px; }

.portada-carrusel { flex: 1; min-height: 0; }

/* ---- Misión y visión ---- */
.valores {
  padding: clamp(2.5rem, 7vw, 5rem) clamp(1rem, 5vw, 3rem);
  background: linear-gradient(180deg, #f2f8fb 0%, #e5f1f5 100%);
}
.valores-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(1rem, 3vw, 2rem);
}

.valor {
  position: relative;
  overflow: hidden;
  padding: clamp(1.5rem, 4vw, 2.75rem);
  background: #fff;
  border: 1px solid rgba(26, 92, 138, 0.08);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(15, 61, 94, 0.08);
}
.valor::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, var(--azul, #1a5c8a), var(--turquesa, #2a9d9a));
}
/* Cruz médica como marca de agua */
.valor::after {
  content: '';
  position: absolute;
  right: -30px;
  bottom: -30px;
  width: 180px;
  height: 180px;
  background:
    linear-gradient(#1a5c8a, #1a5c8a) center / 56px 180px no-repeat,
    linear-gradient(#1a5c8a, #1a5c8a) center / 180px 56px no-repeat;
  opacity: 0.05;
  pointer-events: none;
}

.valor-icono {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 1.1rem;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, var(--azul, #1a5c8a), var(--turquesa, #2a9d9a));
  box-shadow: 0 8px 18px rgba(26, 92, 138, 0.25);
}
.valor h2 {
  margin: 0 0 1rem;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  color: var(--azul-oscuro, #0f3d5e);
}
.valor h2::after {
  content: '';
  display: block;
  width: 48px;
  height: 4px;
  margin-top: 0.6rem;
  border-radius: 2px;
  background: var(--turquesa, #2a9d9a);
}
.valor p { margin: 0; font-size: clamp(1rem, 1.5vw, 1.1rem); line-height: 1.75; color: #3b4d58; }

.esqueleto span {
  display: block;
  height: 1rem;
  margin-bottom: 0.65rem;
  border-radius: 6px;
  background: linear-gradient(90deg, #e6eef2, #f4f9fb, #e6eef2);
  background-size: 200% 100%;
  animation: brillo 1.2s linear infinite;
}
.esqueleto span:last-child { width: 60%; }

@keyframes brillo { to { background-position: -200% 0; } }

/* ---- Horarios y contenido educativo/corporativo ---- */
.bloque { padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1rem, 5vw, 3rem); scroll-margin-top: 1rem; }
.bloque-info { background: #fff; }
.bloque-horarios { background: #fff; }
.bloque-educativo { background: linear-gradient(180deg, #e5f1f5 0%, #f2f8fb 100%); }
.info-texto { margin: 0; line-height: 1.7; color: #34576b; }
.bloque-interno { max-width: 1000px; margin: 0 auto; }
.bloque-titulo {
  margin: 0 0 1.5rem;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  color: var(--azul-oscuro, #0f3d5e);
}
.bloque-titulo::after {
  content: '';
  display: block;
  width: 48px;
  height: 4px;
  margin-top: 0.6rem;
  border-radius: 2px;
  background: var(--turquesa, #2a9d9a);
}

.panel {
  padding: clamp(1.25rem, 3vw, 2rem);
  background: #fff;
  border: 1px solid rgba(26, 92, 138, 0.1);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 61, 94, 0.08);
}
.panel h3 { margin: 0 0 1rem; color: var(--azul, #1a5c8a); }

.tabla-scroll { overflow-x: auto; }
.tabla-horarios { width: 100%; border-collapse: collapse; }
.tabla-horarios th,
.tabla-horarios td { padding: 0.7rem 0.9rem; text-align: left; border-bottom: 1px solid #e3edf2; }
.tabla-horarios th {
  background: var(--azul, #1a5c8a);
  color: #fff;
  font-weight: 600;
}
.tabla-horarios th:first-child { border-radius: 10px 0 0 0; }
.tabla-horarios th:last-child { border-radius: 0 10px 0 0; }
.tabla-horarios tbody tr:nth-child(even) { background: #f4f9fb; }
.tabla-horarios tbody tr:hover { background: #e5f1f5; }

.subtitulo { margin: 1.75rem 0 0.9rem; font-size: 1.3rem; color: var(--azul, #1a5c8a); }
.carrusel-seccion { margin-top: 0.5rem; }
.carrusel-seccion .subtitulo { margin-bottom: 0.4rem; }
.carrusel-seccion .vacio { margin: 0 0 0.25rem; }

.ver-mas-caja { display: flex; justify-content: center; margin-top: 1rem; }
.ver-mas {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.25rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--azul, #1a5c8a);
  text-decoration: none;
  background: linear-gradient(var(--turquesa, #2a9d9a), var(--turquesa, #2a9d9a)) left bottom / 0 3px no-repeat;
  transition: background-size 0.3s ease, color 0.2s;
}
.ver-mas svg { transition: transform 0.3s ease; }
.ver-mas:hover { color: var(--azul-oscuro, #0f3d5e); background-size: 100% 3px; }
.ver-mas:hover svg { transform: translateX(6px); }
.ver-mas:focus-visible { outline: 3px solid var(--turquesa, #2a9d9a); outline-offset: 4px; border-radius: 4px; }
.vacio { margin: 0.5rem 0; color: #4b6475; }

/* Medianas y angostas: misión arriba, visión abajo */
@media (max-width: 900px) {
  .valores-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .esqueleto span { animation: none; }
  .redes a { transition: none; }
}
</style>