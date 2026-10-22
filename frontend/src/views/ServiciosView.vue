<template>
  <main class="srv">
    <!-- ================= Portada ================= -->
    <section class="srv-portada" aria-labelledby="srv-h1">
      <svg class="srv-ecg" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 70h380l24-44 34 88 30-62 20 18h712" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div class="srv-ancho srv-portada-interno">
        <p class="srv-sobretitulo">Atención médica integral</p>
        <h1 id="srv-h1">Servicios de salud para toda tu familia</h1>
        <p class="srv-lema">Desde una consulta general hasta estudios de diagnóstico y especialidades. Encuentra lo que necesitas y solicita tu cita en minutos.</p>

        <div class="srv-portada-acciones">
          <button type="button" class="srv-boton" @click="abrirCita()">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="iconoDe('calendario')"></svg>
            Solicitar cita
          </button>
          <a href="#catalogo" class="srv-boton srv-boton-claro" @click.prevent="irACatalogo">Ver servicios</a>
        </div>

        <dl class="srv-datos">
          <div><dt>Servicios</dt><dd>{{ servicios.length || '—' }}</dd></div>
          <div><dt>Áreas</dt><dd>{{ categorias.length || '—' }}</dd></div>
          <div class="srv-dato-ancho"><dt>Horario</dt><dd>{{ resumenHorario }}</dd></div>
        </dl>
      </div>
    </section>

    <!-- ================= Catálogo ================= -->
    <section id="catalogo" class="srv-catalogo srv-ancho" aria-labelledby="srv-cat-t">
      <header class="srv-cab">
        <div>
          <h2 id="srv-cat-t">Catálogo de servicios</h2>
          <p>Toca un servicio para ver qué incluye y cómo prepararte.</p>
        </div>
        <div class="srv-buscar">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input v-model="busqueda" type="search" placeholder="Buscar: pediatría, laboratorio…" aria-label="Buscar servicio" autocomplete="off" />
          <button v-if="busqueda" type="button" class="srv-limpiar" aria-label="Borrar búsqueda" @click="busqueda = ''">×</button>
        </div>
      </header>

      <div class="srv-cuerpo">
        <!-- Índice de categorías -->
        <nav class="srv-indice" aria-label="Áreas de atención">
          <button type="button" class="srv-area" :class="{ on: !area }" :aria-pressed="!area" @click="area = ''">
            <span class="srv-area-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" v-html="iconoDe('cruz')"></svg></span>
            <span class="srv-area-nombre">Todos</span>
            <span class="srv-area-n">{{ servicios.length }}</span>
          </button>
          <button v-for="c in categorias" :key="c" type="button" class="srv-area" :class="{ on: area === c }" :aria-pressed="area === c" @click="area = c">
            <span class="srv-area-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" v-html="iconoDe(ICONO_CATEGORIA[c])"></svg></span>
            <span class="srv-area-nombre">{{ c }}</span>
            <span class="srv-area-n">{{ cuenta(c) }}</span>
          </button>
        </nav>

        <!-- Lista -->
        <div class="srv-lista-caja" aria-live="polite">
          <div v-if="estado === 'cargando' || estado === 'inicial'" class="srv-esqueleto" aria-label="Cargando servicios">
            <span v-for="n in 5" :key="n"></span>
          </div>

          <div v-else-if="estado === 'error'" class="srv-vacio" role="alert">
            <strong>No pudimos cargar los servicios</strong>
            <p>Revisa tu conexión e inténtalo nuevamente.</p>
            <button type="button" class="srv-boton srv-boton-chico" @click="cargarCatalogo(true)">Reintentar</button>
          </div>

          <div v-else-if="!servicios.length" class="srv-vacio">
            <strong>Aún no hay servicios publicados</strong>
            <p>Estamos actualizando nuestro catálogo. Mientras tanto puedes escribirnos desde la opción Contacto del menú.</p>
          </div>

          <div v-else-if="!grupos.length" class="srv-vacio">
            <strong>Sin resultados para “{{ busqueda }}”</strong>
            <p>Prueba con otra palabra o revisa todas las áreas.</p>
            <button type="button" class="srv-boton srv-boton-chico" @click="limpiarFiltros">Ver todos los servicios</button>
          </div>

          <template v-else>
            <section v-for="g in grupos" :key="g.categoria" class="srv-grupo" :aria-label="g.categoria">
              <h3 class="srv-grupo-t">{{ g.categoria }} <span>{{ g.items.length }}</span></h3>
              <ul class="srv-filas">
                <li v-for="s in g.items" :key="s._id" class="srv-fila" :class="{ abierta: abierto === s._id }">
                  <h4 class="srv-fila-cab">
                    <button type="button" class="srv-fila-btn" :aria-expanded="abierto === s._id" :aria-controls="`srv-det-${s._id}`" @click="alternar(s._id)">
                      <span class="srv-ico" :class="{ 'srv-ico-foto': tieneImagen(s) }" aria-hidden="true">
                        <img v-if="tieneImagen(s)" :src="s.imagenUrl" alt="" loading="lazy" @error="fallarImagen(s._id)" />
                        <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="iconoDe(s.icono)"></svg>
                      </span>
                      <span class="srv-fila-titulo">
                        <strong>{{ s.nombre }}</strong>
                        <small>{{ resumenCorto(s.descripcion) }}</small>
                      </span>
                      <span class="srv-meta">
                        <span class="srv-pildora"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{{ formatoDuracion(s.duracionMinutos) }}</span>
                        <span class="srv-precio">{{ formatoMoneda(s.precioCentavos) }}</span>
                      </span>
                      <svg class="srv-flecha" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                  </h4>

                  <div :id="`srv-det-${s._id}`" class="srv-det" role="region" :aria-label="`Detalle de ${s.nombre}`">
                    <div class="srv-det-interno">
                      <div class="srv-det-grid">
                        <div>
                          <p class="srv-det-desc">{{ s.descripcion }}</p>
                          <h5>Qué incluye</h5>
                          <ul class="srv-incluye">
                            <li v-for="(i, n) in s.incluye" :key="n">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{{ i }}
                            </li>
                          </ul>
                          <p v-if="!s.incluye || !s.incluye.length" class="srv-det-vacio">El equipo médico te explicará el detalle durante la atención.</p>
                        </div>
                        <aside class="srv-lateral">
                          <figure v-if="tieneImagen(s)" class="srv-foto">
                            <img :src="s.imagenUrl" :alt="`Imagen de ${s.nombre}`" loading="lazy" @error="fallarImagen(s._id)" />
                          </figure>
                          <div v-if="s.preparacion" class="srv-prepara">
                            <h5>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
                              Cómo prepararte
                            </h5>
                            <p>{{ s.preparacion }}</p>
                          </div>
                          <dl class="srv-ficha">
                            <div><dt>Duración</dt><dd>{{ formatoDuracion(s.duracionMinutos) }}</dd></div>
                            <div><dt>Precio referencial</dt><dd>{{ formatoMoneda(s.precioCentavos) }}</dd></div>
                          </dl>
                          <RouterLink :to="{ name: 'solicitar-cita', query: { servicio: s._id } }" class="srv-boton srv-boton-bloque">
                            Solicitar cita para este servicio
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                          </RouterLink>
                        </aside>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </section>
          </template>
        </div>
      </div>
    </section>

    <!-- ================= Cómo funciona ================= -->
    <section class="srv-proceso" aria-labelledby="srv-pro-t">
      <div class="srv-ancho">
        <header class="srv-proceso-cab">
          <span class="srv-proceso-etq">Cómo funciona</span>
          <h2 id="srv-pro-t">Así de sencillo es agendar</h2>
          <p>Cuatro pasos y tu cita queda en marcha. Nosotros nos encargamos del resto.</p>
        </header>
        <ol class="srv-etapas">
          <li v-for="(p, i) in PROCESO" :key="p.titulo" class="srv-etapa">
            <div class="srv-etapa-cab">
              <span class="srv-etapa-n" aria-hidden="true">{{ i + 1 }}</span>
              <span class="srv-etapa-linea" aria-hidden="true"></span>
            </div>
            <div class="srv-etapa-cuerpo">
              <span class="srv-etapa-paso">Paso {{ i + 1 }}</span>
              <h3>{{ p.titulo }}</h3>
              <p>{{ p.texto }}</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- ================= Preguntas frecuentes ================= -->
    <section class="srv-faq srv-ancho" aria-labelledby="srv-faq-t">
      <h2 id="srv-faq-t">Preguntas frecuentes</h2>
      <div class="srv-faq-lista">
        <details v-for="(f, i) in FAQ" :key="f.p" class="srv-pregunta" :name="'srv-faq'" :open="i === 0">
          <summary>{{ f.p }}</summary>
          <p>{{ f.r }}</p>
        </details>
      </div>
    </section>

    <!-- ================= Llamado final ================= -->
    <section id="solicitar-cita" class="srv-final">
      <div class="srv-ancho srv-final-interno">
        <div>
          <h2>Tu salud no puede esperar</h2>
          <p>Cuéntanos qué necesitas y te llamamos para confirmar tu cita. Es gratis y toma menos de 3 minutos.</p>
        </div>
        <button type="button" class="srv-boton srv-boton-claro srv-boton-grande" @click="abrirCita()">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="iconoDe('calendario')"></svg>
          Solicitar cita ahora
        </button>
      </div>
    </section>

    <!-- Botón flotante y arrastrable para pedir cita desde cualquier punto -->
    <CitaFlotante />
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import CitaFlotante from '../components/CitaFlotante.vue';
import { ICONO_CATEGORIA, iconoDe } from '../components/iconosServicios.js';
import { abrirCita } from '../composables/citaModal.js';
import {
  cargarCatalogo,
  catalogoEstado as estado,
  categorias,
  formatoDuracion,
  formatoMoneda,
  resumenHorario,
  servicios
} from '../composables/catalogo.js';

const route = useRoute();
const busqueda = ref('');
const area = ref('');
const abierto = ref('');
const imagenesFallidas = ref(new Set());

function fallarImagen(id) {
  const siguientes = new Set(imagenesFallidas.value);
  siguientes.add(id);
  imagenesFallidas.value = siguientes;
}
const tieneImagen = (servicio) => Boolean(servicio.imagenUrl) && !imagenesFallidas.value.has(servicio._id);

const PROCESO = [
  { titulo: 'Elige tu servicio', texto: 'Explora el catálogo y selecciona la atención que necesitas.' },
  { titulo: 'Completa tus datos', texto: 'Indica quién asistirá y cómo podemos contactarte.' },
  { titulo: 'Propón una fecha', texto: 'Escoge el día y la jornada que mejor te acomoden.' },
  { titulo: 'Te confirmamos', texto: 'Nuestro equipo te llama para fijar la hora exacta de tu cita.' }
];

const FAQ = [
  { p: '¿Solicitar una cita tiene algún costo?', r: 'No. Enviar la solicitud es gratuito. Solo pagas el servicio cuando recibes la atención, según el precio referencial del catálogo.' },
  { p: '¿Mi cita queda confirmada al enviar la solicitud?', r: 'Todavía no. La solicitud queda registrada y nuestro equipo te llama para confirmar el día y la hora definitivos según la disponibilidad.' },
  { p: '¿Con cuánta anticipación puedo pedir mi cita?', r: 'Desde el día siguiente y hasta con 60 días de anticipación, siempre dentro de nuestros días y horarios de atención.' },
  { p: '¿Puedo pedir cita para otra persona?', r: 'Sí. Escribe el nombre del paciente y un teléfono donde podamos localizarte. Si es un menor de edad, debe asistir con su responsable.' },
  { p: '¿Qué hago si necesito cambiar o cancelar mi cita?', r: 'Escríbenos o llámanos desde la opción Contacto del menú, indicando tu número de referencia, y la reprogramamos contigo.' },
  { p: '¿Esto sirve para una emergencia?', r: 'No. Si tienes dificultad para respirar, dolor intenso en el pecho, sangrado abundante o pérdida del conocimiento, acude de inmediato a urgencias o llama a los servicios de emergencia.' }
];

const normalizar = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const grupos = computed(() => {
  const q = normalizar(busqueda.value.trim());
  const mapa = new Map();
  for (const s of servicios.value) {
    const c = s.categoria || 'General';
    if (area.value && c !== area.value) continue;
    if (q && !normalizar(`${s.nombre} ${s.descripcion} ${c} ${(s.incluye || []).join(' ')}`).includes(q)) continue;
    if (!mapa.has(c)) mapa.set(c, []);
    mapa.get(c).push(s);
  }
  return [...mapa].map(([categoria, items]) => ({ categoria, items }));
});

const cuenta = (c) => servicios.value.filter((s) => (s.categoria || 'General') === c).length;

function alternar(id) {
  abierto.value = abierto.value === id ? '' : id;
}

function limpiarFiltros() {
  busqueda.value = '';
  area.value = '';
}

// Una línea de resumen para la fila cerrada.
function resumenCorto(texto = '') {
  const t = String(texto).trim();
  const punto = t.indexOf('. ');
  const primera = punto > 0 ? t.slice(0, punto + 1) : t;
  return primera.length > 110 ? `${primera.slice(0, 107).trimEnd()}…` : primera;
}

function irACatalogo() {
  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Si se busca algo, se abre el único resultado para ahorrar un toque.
watch(
  () => grupos.value.flatMap((g) => g.items),
  (items) => {
    if (busqueda.value.trim() && items.length === 1) abierto.value = items[0]._id;
  }
);

// Al navegar dentro de la misma vista (de /servicios a /solicitar-cita) el
// componente se reutiliza; el watch mantiene el modal sincronizado con la URL.
watch(
  () => [route.name, route.query.servicio],
  ([nombre, servicio]) => {
    if (nombre !== 'solicitar-cita') return;
    abrirCita(typeof servicio === 'string' ? servicio : undefined);
  },
  { immediate: true }
);

onMounted(() => {
  cargarCatalogo();
  // Enlace antiguo /servicios#solicitar-cita → abre la ventana directamente.
  if (route.hash === '#solicitar-cita') abrirCita();
});
</script>

<style>
.srv {
  --srv-azul: #1a5c8a;
  --srv-oscuro: #0f3d5e;
  --srv-turq: #2a9d9a;
  --srv-fondo: #f4fafb;
  --srv-borde: #d6e6ed;
  --srv-texto: #17384e;
  --srv-suave: #5a7a8c;
  font-family: sans-serif;
  color: var(--srv-texto);
  background: var(--srv-fondo);
  overflow-x: clip;
}
.srv h1, .srv h2, .srv h3, .srv h4, .srv h5 { margin: 0; }
.srv-ancho { box-sizing: border-box; width: min(1180px, 100%); margin: 0 auto; padding-left: clamp(1rem, 4vw, 2rem); padding-right: clamp(1rem, 4vw, 2rem); }

/* ===== Botones ===== */
.srv-boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.8rem 1.5rem;
  font: inherit;
  font-size: 0.97rem;
  font-weight: 700;
  color: #fff;
  text-decoration: none;
  background: linear-gradient(135deg, #2a9d9a, #1a5c8a);
  border: 0;
  border-radius: 13px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(26, 92, 138, 0.35);
  transition: transform 0.25s cubic-bezier(0.3, 1.5, 0.5, 1), box-shadow 0.25s;
}
.srv-boton:hover { transform: translateY(-3px); box-shadow: 0 14px 26px rgba(26, 92, 138, 0.45); }
.srv-boton:focus-visible { outline: 3px solid #fff; outline-offset: 3px; box-shadow: 0 0 0 6px var(--srv-azul); }
.srv-boton-claro { color: var(--srv-oscuro); background: #fff; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18); }
.srv-boton-claro:hover { box-shadow: 0 14px 26px rgba(0, 0, 0, 0.25); }
.srv-boton-grande { padding: 1rem 2rem; font-size: 1.05rem; }
.srv-boton-chico { padding: 0.55rem 1.1rem; font-size: 0.9rem; }
.srv-boton-bloque { width: 100%; }

/* ===== Portada ===== */
.srv-portada {
  position: relative;
  overflow: hidden;
  color: #fff;
  background: radial-gradient(circle at 85% 10%, rgba(53, 196, 191, 0.4), transparent 45%), linear-gradient(135deg, #0f3d5e 0%, #1a5c8a 55%, #1f7a8f 100%);
}
.srv-portada::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.14) 1.5px, transparent 1.5px);
  background-size: 26px 26px;
  mask-image: linear-gradient(100deg, transparent 20%, #000 100%);
  -webkit-mask-image: linear-gradient(100deg, transparent 20%, #000 100%);
}
.srv-ecg { position: absolute; left: 0; bottom: 0; width: 100%; height: 90px; color: rgba(94, 234, 234, 0.4); }
.srv-ecg path { stroke-dasharray: 1600; animation: srv-ecg 6s linear infinite; }
.srv-portada-interno { position: relative; padding-top: clamp(2.2rem, 6vw, 4.2rem); padding-bottom: clamp(4.5rem, 9vw, 6.5rem); }
.srv-sobretitulo { margin: 0 0 0.8rem; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #8cf3ee; }
.srv-portada h1 { max-width: 760px; font-size: clamp(1.9rem, 5vw, 3.2rem); line-height: 1.1; letter-spacing: -0.01em; }
.srv-lema { max-width: 620px; margin: 1rem 0 1.6rem; font-size: clamp(1rem, 2vw, 1.15rem); line-height: 1.55; color: rgba(255, 255, 255, 0.88); }
.srv-portada-acciones { display: flex; flex-wrap: wrap; gap: 0.8rem; }
.srv-datos { display: flex; flex-wrap: wrap; gap: 0.8rem 2.2rem; margin: 2rem 0 0; }
.srv-datos dt { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255, 255, 255, 0.7); }
.srv-datos dd { margin: 0.2rem 0 0; font-size: 1.5rem; font-weight: 800; }
.srv-datos .srv-dato-ancho dd { font-size: 1.05rem; font-weight: 700; padding-top: 0.25rem; }

/* ===== Catálogo ===== */
.srv-catalogo { padding-top: clamp(2rem, 5vw, 3.2rem); padding-bottom: clamp(2rem, 5vw, 3.5rem); scroll-margin-top: 80px; }
.srv-cab { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.srv-cab h2 { font-size: clamp(1.5rem, 3vw, 2rem); color: var(--srv-oscuro); }
.srv-cab p { margin: 0.3rem 0 0; color: var(--srv-suave); }
.srv-buscar { position: relative; width: min(100%, 340px); }
.srv-buscar svg { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: var(--srv-suave); pointer-events: none; }
.srv-buscar input { box-sizing: border-box; width: 100%; padding: 0.8rem 2.3rem 0.8rem 2.6rem; font: inherit; font-size: 0.95rem; color: var(--srv-texto); background: #fff; border: 1.5px solid #c5dbe4; border-radius: 999px; transition: border-color 0.2s, box-shadow 0.2s; }
.srv-buscar input:focus { outline: none; border-color: var(--srv-turq); box-shadow: 0 0 0 4px rgba(42, 157, 154, 0.18); }
.srv-limpiar { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; font-size: 1.2rem; line-height: 1; color: var(--srv-suave); background: #e3f0f4; border: 0; border-radius: 50%; cursor: pointer; }
.srv-limpiar:hover { background: #cde4ec; }

.srv-cuerpo { display: grid; grid-template-columns: 230px minmax(0, 1fr); gap: clamp(1.2rem, 3vw, 2.4rem); align-items: start; }

/* Índice de áreas */
.srv-indice { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 0.3rem; padding-right: 1rem; border-right: 2px solid var(--srv-borde); }
.srv-area { display: flex; align-items: center; gap: 0.7rem; width: 100%; padding: 0.6rem 0.7rem; font: inherit; text-align: left; color: #35586d; background: transparent; border: 0; border-radius: 12px; cursor: pointer; position: relative; transition: background 0.2s, color 0.2s, transform 0.2s; }
.srv-area:hover { background: #e3f0f4; transform: translateX(3px); }
.srv-area.on { color: #fff; background: linear-gradient(135deg, #1f8fa0, #1a5c8a); box-shadow: 0 6px 16px rgba(26, 92, 138, 0.3); }
.srv-area:focus-visible { outline: 3px solid var(--srv-turq); outline-offset: 2px; }
.srv-area-ico { flex: none; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: #e3f0f4; color: var(--srv-azul); transition: all 0.2s; }
.srv-area.on .srv-area-ico { background: rgba(255, 255, 255, 0.2); color: #fff; }
.srv-area-nombre { flex: 1; font-weight: 600; font-size: 0.93rem; line-height: 1.2; }
.srv-area-n { font-size: 0.75rem; font-weight: 700; min-width: 22px; padding: 0.1rem 0.4rem; text-align: center; border-radius: 999px; background: #e3f0f4; color: var(--srv-azul); }
.srv-area.on .srv-area-n { background: rgba(255, 255, 255, 0.25); color: #fff; }

/* Lista */
.srv-lista-caja { min-width: 0; min-height: 260px; }
.srv-grupo + .srv-grupo { margin-top: 2rem; }
.srv-grupo-t { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.6rem; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--srv-turq); }
.srv-grupo-t::after { content: ''; flex: 1; height: 1px; background: var(--srv-borde); }
.srv-grupo-t span { order: 2; padding: 0.1rem 0.5rem; font-size: 0.72rem; letter-spacing: 0; color: var(--srv-azul); background: #e3f0f4; border-radius: 999px; }
.srv-filas { list-style: none; margin: 0; padding: 0; background: #fff; border: 1.5px solid var(--srv-borde); border-radius: 18px; overflow: hidden; box-shadow: 0 4px 18px rgba(15, 61, 94, 0.06); }
.srv-fila + .srv-fila { border-top: 1px solid #e3eef3; }
.srv-fila-cab { font-size: inherit; }
.srv-fila-btn { display: flex; align-items: center; gap: 1rem; width: 100%; padding: 1rem 1.2rem; font: inherit; text-align: left; color: inherit; background: transparent; border: 0; cursor: pointer; position: relative; transition: background 0.2s; }
.srv-fila-btn::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--srv-turq); transform: scaleY(0); transition: transform 0.25s; }
.srv-fila-btn:hover { background: #f1f9fa; }
.srv-fila.abierta .srv-fila-btn { background: #eaf6f7; }
.srv-fila.abierta .srv-fila-btn::before { transform: scaleY(1); }
.srv-fila-btn:focus-visible { outline: 3px solid var(--srv-turq); outline-offset: -3px; }
.srv-ico { flex: none; display: grid; place-items: center; width: 50px; height: 50px; border-radius: 15px; color: var(--srv-azul); background: #e3f0f4; overflow: hidden; transition: all 0.3s cubic-bezier(0.3, 1.5, 0.5, 1); }
.srv-ico img { width: 100%; height: 100%; object-fit: cover; display: block; }
.srv-ico-foto { background: #d9edf1; }
.srv-fila-btn:hover .srv-ico { transform: rotate(-6deg) scale(1.06); }
.srv-fila.abierta .srv-ico { color: #fff; background: linear-gradient(135deg, #35c4bf, #1a5c8a); }
.srv-fila-titulo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
.srv-fila-titulo strong { font-size: 1.04rem; color: var(--srv-oscuro); }
.srv-fila-titulo small { font-size: 0.85rem; line-height: 1.35; color: var(--srv-suave); }
.srv-meta { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; }
.srv-pildora { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.15rem 0.55rem; font-size: 0.76rem; font-weight: 600; color: var(--srv-azul); background: #e3f0f4; border-radius: 999px; }
.srv-precio { font-size: 1.05rem; font-weight: 800; color: var(--srv-oscuro); }
.srv-flecha { flex: none; color: var(--srv-suave); transition: transform 0.3s; }
.srv-fila.abierta .srv-flecha { transform: rotate(180deg); color: var(--srv-turq); }

/* Detalle desplegable (animación por grid-template-rows) */
.srv-det { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s ease; background: #fbfeff; }
.srv-fila.abierta .srv-det { grid-template-rows: 1fr; }
.srv-det-interno { min-height: 0; overflow: hidden; visibility: hidden; transition: visibility 0s 0.35s; }
.srv-fila.abierta .srv-det-interno { visibility: visible; transition-delay: 0s; }
.srv-det-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 1.5rem; padding: 0.4rem 1.4rem 1.4rem calc(1.2rem + 50px + 1rem); }
.srv-det-desc { margin: 0 0 1rem; line-height: 1.6; color: #35586d; }
.srv-det h5 { margin-bottom: 0.55rem; font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--srv-suave); }
.srv-incluye { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.45rem; }
.srv-incluye li { display: flex; gap: 0.55rem; align-items: flex-start; font-size: 0.93rem; line-height: 1.4; }
.srv-incluye svg { flex: none; margin-top: 2px; padding: 3px; box-sizing: content-box; width: 14px; height: 14px; color: #fff; background: var(--srv-turq); border-radius: 50%; }
.srv-det-vacio { margin: 0; font-size: 0.9rem; color: var(--srv-suave); }
.srv-lateral { display: flex; flex-direction: column; gap: 0.9rem; }
.srv-foto { margin: 0; overflow: hidden; border-radius: 14px; border: 1px solid var(--srv-borde); background: #e3f0f4; }
.srv-foto img { display: block; width: 100%; height: 150px; object-fit: cover; }
.srv-prepara { padding: 0.85rem 1rem; background: #fff8e6; border: 1px solid #f3dfa2; border-radius: 13px; }
.srv-prepara h5 { display: flex; align-items: center; gap: 0.4rem; color: #8a6200; }
.srv-prepara p { margin: 0; font-size: 0.9rem; line-height: 1.45; color: #5c4400; }
.srv-ficha { display: flex; gap: 1.6rem; margin: 0; }
.srv-ficha dt { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--srv-suave); }
.srv-ficha dd { margin: 0.15rem 0 0; font-size: 1.1rem; font-weight: 800; color: var(--srv-oscuro); }

/* Estados */
.srv-esqueleto { display: grid; gap: 0.7rem; }
.srv-esqueleto span { height: 82px; border-radius: 16px; background: linear-gradient(100deg, #e6f1f4 30%, #f5fafb 50%, #e6f1f4 70%); background-size: 220% 100%; animation: srv-brillo 1.4s linear infinite; }
.srv-vacio { padding: 2.2rem 1.2rem; text-align: center; background: #fff; border: 2px dashed #bcd6e0; border-radius: 18px; }
.srv-vacio strong { font-size: 1.1rem; color: var(--srv-oscuro); }
.srv-vacio p { max-width: 420px; margin: 0.5rem auto 1rem; line-height: 1.5; color: var(--srv-suave); }

/* ===== Proceso ===== */
.srv-faq h2 { font-size: clamp(1.4rem, 3vw, 1.9rem); color: var(--srv-oscuro); }

/* ===== FAQ ===== */
/* ===== Así de sencillo es agendar ===== */
.srv-proceso { padding: clamp(2.8rem, 6vw, 4.5rem) 0; background: linear-gradient(180deg, #e8f4f6, #f4fafb); }
.srv-proceso-cab { max-width: 640px; margin: 0 auto clamp(2rem, 4vw, 3rem); text-align: center; }
.srv-proceso-etq { display: inline-block; margin-bottom: 0.7rem; padding: 0.3rem 0.9rem; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--srv-azul); background: #d3ecef; border-radius: 999px; }
.srv-proceso-cab h2 { font-size: clamp(1.6rem, 3.4vw, 2.2rem); color: var(--srv-oscuro); }
.srv-proceso-cab p { margin: 0.7rem 0 0; font-size: 1.02rem; line-height: 1.55; color: var(--srv-suave); }

.srv-etapas { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.25rem; }
.srv-etapa { display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; gap: 1rem; min-width: 0; margin: 0; padding: 0; text-align: left; }
.srv-etapa::before, .srv-etapa::after { content: none; }

/* Fila del número + conector: el conector vive DENTRO de su fila, nunca encima del texto */
.srv-etapa-cab { display: flex; align-items: center; justify-content: flex-start; width: 100%; gap: 0.6rem; }
.srv-etapa-n {
  flex: none;
  box-sizing: border-box;
  display: flex; align-items: center; justify-content: center;
  width: 52px; height: 52px; min-width: 52px; min-height: 52px;
  aspect-ratio: 1 / 1;
  font-size: 1.35rem; font-weight: 800; line-height: 1; color: #fff;
  background: linear-gradient(135deg, #35c4bf, #1a5c8a);
  border: 4px solid #fff;
  border-radius: 50%;
  box-shadow: 0 8px 18px rgba(26, 92, 138, 0.28);
}
.srv-etapa-linea { flex: 1 1 auto; min-width: 0; height: 0; border-top: 2px dashed #8fc4c8; }
.srv-etapa:last-child .srv-etapa-linea { display: none; }

.srv-etapa-cuerpo { flex: 1; box-sizing: border-box; padding: 1.2rem 1.2rem 1.4rem; background: #fff; border: 1px solid var(--srv-borde); border-radius: 18px; box-shadow: 0 10px 26px rgba(15, 61, 94, 0.07); transition: transform 0.25s ease, box-shadow 0.25s ease; }
.srv-etapa:hover .srv-etapa-cuerpo { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(15, 61, 94, 0.13); }
.srv-etapa-paso { display: block; margin-bottom: 0.35rem; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--srv-turq); }
.srv-etapa-cuerpo h3 { margin: 0 0 0.45rem; font-size: 1.1rem; line-height: 1.3; color: var(--srv-oscuro); overflow-wrap: break-word; }
.srv-etapa-cuerpo p { margin: 0; font-size: 0.93rem; line-height: 1.55; color: #4a6a7d; overflow-wrap: break-word; }

.srv-faq { padding-top: clamp(2.2rem, 5vw, 3.5rem); padding-bottom: clamp(2.2rem, 5vw, 3.5rem); }
.srv-faq-lista { max-width: 820px; margin-top: 1.3rem; display: grid; gap: 0.6rem; }
.srv-pregunta { background: #fff; border: 1.5px solid var(--srv-borde); border-radius: 14px; transition: border-color 0.2s, box-shadow 0.2s; }
.srv-pregunta[open] { border-color: var(--srv-turq); box-shadow: 0 6px 18px rgba(42, 157, 154, 0.12); }
.srv-pregunta summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.2rem; font-weight: 700; color: var(--srv-oscuro); cursor: pointer; list-style: none; }
.srv-pregunta summary::-webkit-details-marker { display: none; }
.srv-pregunta summary::after { content: '+'; flex: none; display: grid; place-items: center; width: 26px; height: 26px; font-size: 1.2rem; font-weight: 600; line-height: 1; color: var(--srv-azul); background: #e3f0f4; border-radius: 50%; transition: transform 0.3s, background 0.2s, color 0.2s; }
.srv-pregunta[open] summary::after { transform: rotate(45deg); color: #fff; background: var(--srv-turq); }
.srv-pregunta summary:focus-visible { outline: 3px solid var(--srv-turq); outline-offset: 2px; border-radius: 14px; }
.srv-pregunta p { margin: 0; padding: 0 1.2rem 1.1rem; line-height: 1.6; color: #4a6a7d; }

/* ===== Llamado final ===== */
.srv-final { padding: clamp(2rem, 5vw, 3rem) 0; color: #fff; background: linear-gradient(110deg, #0f3d5e, #1a5c8a 60%, #1f7a8f); scroll-margin-top: 80px; }
.srv-final-interno { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1.4rem; }
.srv-final h2 { font-size: clamp(1.4rem, 3vw, 2rem); }
.srv-final p { max-width: 520px; margin: 0.5rem 0 0; line-height: 1.5; color: rgba(255, 255, 255, 0.88); }

@keyframes srv-ecg { from { stroke-dashoffset: 1600; } to { stroke-dashoffset: 0; } }
@keyframes srv-brillo { to { background-position: -220% 0; } }

/* ===== Responsivo ===== */
@media (max-width: 900px) {
  .srv-cuerpo { grid-template-columns: 1fr; }
  /* El índice pasa a ser una tira horizontal */
  .srv-indice { position: static; flex-direction: row; overflow-x: auto; padding: 0 0 0.5rem; border-right: 0; gap: 0.5rem; scroll-snap-type: x proximity; }
  .srv-area { flex: none; width: auto; gap: 0.5rem; padding: 0.5rem 0.8rem 0.5rem 0.5rem; background: #fff; border: 1.5px solid var(--srv-borde); border-radius: 999px; scroll-snap-align: start; }
  .srv-area:hover { transform: none; }
  .srv-area.on { border-color: transparent; }
  .srv-area-ico { width: 28px; height: 28px; border-radius: 50%; }
  .srv-area-nombre { white-space: nowrap; font-size: 0.86rem; }
  .srv-etapas { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem 1.25rem; }
  .srv-etapa:nth-child(2n) .srv-etapa-linea { display: none; }
  .srv-det-grid { grid-template-columns: 1fr; padding-left: 1.2rem; }
}
@media (max-width: 600px) {
  .srv-fila-btn { flex-wrap: wrap; gap: 0.7rem; padding: 0.9rem; }
  .srv-ico { width: 44px; height: 44px; border-radius: 13px; }
  .srv-fila-titulo { flex-basis: calc(100% - 44px - 0.7rem - 20px - 0.7rem); }
  .srv-flecha { order: 2; }
  .srv-meta { order: 3; flex-direction: row; align-items: center; flex-basis: 100%; justify-content: space-between; padding-left: calc(44px + 0.7rem); }
  /* Móvil: línea de tiempo vertical, número a la izquierda y tarjeta a la derecha */
  .srv-etapas { grid-template-columns: 1fr; gap: 0; }
  .srv-etapa { flex-direction: row; align-items: stretch; gap: 0.9rem; padding-bottom: 1.1rem; }
  .srv-etapa:last-child { padding-bottom: 0; }
  .srv-etapa-cab { flex: none; flex-direction: column; align-items: center; width: 52px; gap: 0.4rem; }
  .srv-etapa-linea { display: block; flex: 1 1 auto; width: 0; height: auto; border-top: 0; border-left: 2px dashed #8fc4c8; }
  .srv-etapa:nth-child(2n) .srv-etapa-linea { display: block; }
  .srv-etapa:last-child .srv-etapa-linea { display: none; }
  .srv-ficha { gap: 1.2rem; }
  .srv-final-interno .srv-boton { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .srv *, .srv *::before, .srv *::after { animation: none !important; transition: none !important; }
}
</style>