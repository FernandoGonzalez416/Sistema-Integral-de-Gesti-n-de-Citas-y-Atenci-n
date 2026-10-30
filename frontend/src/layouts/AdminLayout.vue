<template>
  <div class="adm" :class="clasesRaiz">
    <!-- ============ Barra superior ============ -->
    <header class="adm-top" :class="{ oculta: !topVisible, elevada: !enTope }">
      <div class="adm-top-in">
        <button
          ref="botonMenu"
          type="button"
          class="adm-burger"
          aria-controls="adm-menu"
          :aria-expanded="menuAbierto"
          :aria-label="menuAbierto ? 'Ocultar menú' : 'Mostrar menú'"
          :title="menuAbierto ? 'Ocultar menú' : 'Mostrar menú'"
          @click="alternarMenu"
        >
          <span class="adm-hamb" :class="{ activa: menuAbierto }" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>

        <RouterLink to="/admin" class="adm-marca" :title="`${sitio.nombre} — Panel`">
          <span class="adm-logo" aria-hidden="true">
            <img v-if="!logoFalla" :src="sitio.logoUrl || '/logo-sigsa.svg'" alt="" @error="logoFalla = true" />
            <span v-else class="adm-logo-reserva">S</span>
          </span>
          <span class="adm-marca-txt">
            <strong>{{ sitio.nombre }}</strong>
            <small>Panel administrativo</small>
          </span>
        </RouterLink>

        <div class="adm-top-acc">
          <!-- Siempre visibles: nunca van dentro del menú desplegable -->
          <button
            type="button"
            class="adm-volver"
            title="Volver al portal"
            aria-label="Volver al portal"
            :disabled="navegando"
            @click="volverAlPortal"
          >
            <Icono name="arrow-left" :size="18" />
            <span>Volver al portal</span>
          </button>
          <button
            type="button"
            class="adm-salir"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            :disabled="navegando"
            @click="cerrarSesion"
          >
            <Icono name="logout" :size="18" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Fondo atenuado cuando el menú flota sobre el contenido -->
    <Transition name="adm-velo">
      <div v-if="menuAbierto && modo !== 'escritorio'" class="adm-velo" aria-hidden="true" @click="cerrarMenu"></div>
    </Transition>

    <!-- ============ Menú lateral (desplegable) ============ -->
    <aside id="adm-menu" ref="menuEl" class="adm-menu" :class="{ abierto: menuAbierto }" aria-label="Menú de administración">
      <RouterLink to="/perfil" class="adm-usuario" title="Ver mi perfil">
        <Avatar :key="(auth.usuario?.foto || '').length" :src="auth.usuario?.foto || ''" :nombre="auth.usuario?.nombre || ''" :size="42" />
        <span class="adm-usuario-txt">
          <strong>{{ auth.usuario?.nombre || 'Mi cuenta' }}</strong>
          <em>{{ etiquetaRol }}</em>
        </span>
      </RouterLink>

      <nav class="adm-nav" aria-label="Secciones">
        <template v-for="grupo in grupos" :key="grupo.titulo">
          <p class="adm-grupo">{{ grupo.titulo }}</p>
          <RouterLink
            v-for="enlace in grupo.items"
            :key="enlace.to"
            :to="enlace.to"
            class="adm-item"
            :class="{ activo: esActivo(enlace) }"
            :aria-current="esActivo(enlace) ? 'page' : undefined"
          >
            <Icono :name="enlace.icono" :size="19" />
            <span class="adm-item-txt">{{ enlace.texto }}</span>
            <span
              v-if="enlace.to === '/admin/mensajes' && mensajes.noLeidos > 0"
              class="adm-contador"
              :aria-label="`${mensajes.noLeidos} mensajes sin leer`"
            >{{ mensajes.noLeidos > 99 ? '99+' : mensajes.noLeidos }}</span>
          </RouterLink>
        </template>
      </nav>
    </aside>

    <!-- ============ Contenido ============ -->
    <main ref="mainEl" class="adm-main">
      <div :key="epoca" class="adm-contenido">
        <div v-if="falloVista" class="adm-fallo" role="alert">
          <Icono name="alert" :size="20" />
          <span>No se pudo mostrar esta sección por completo.</span>
          <button type="button" @click="reintentarVista">Reintentar</button>
        </div>
        <RouterView v-slot="{ Component, route: rutaVista }">
          <!-- El calendario se conserva en memoria: desmontarlo y montarlo rápido era lo que más trababa la pantalla -->
          <KeepAlive include="CalendarioView">
            <component :is="Component" :key="rutaVista.path" />
          </KeepAlive>
        </RouterView>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onErrorCaptured, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useMensajesStore } from '../stores/mensajes.js';
import { cargarSitio, sitio } from '../composables/sitio.js';
import Avatar from '../components/Avatar.vue';
import Icono from '../components/Icono.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const mensajes = useMensajesStore();

const logoFalla = ref(false);
watch(() => sitio.logoUrl, () => { logoFalla.value = false; });

watch(
  () => auth.esAdmin,
  (esAdmin) => {
    if (esAdmin) mensajes.cargar(auth.token);
  },
  { immediate: true }
);

// Si la sesión se pierde mientras se está en el panel (token vencido, 401…), se vuelve al inicio de sesión.
watch(
  () => auth.token,
  (token) => {
    if (!token && route.path.startsWith('/admin')) router.replace('/login').catch(() => {});
  }
);

/* ------------------------------------------------------------------ */
/* Menú: opciones según el rol                                         */
/* ------------------------------------------------------------------ */
const TODOS = ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'];
const GESTION = ['ADMINISTRADOR', 'RECEPCIONISTA'];
const SOLO_ADMIN = ['ADMINISTRADOR'];

// El backend vuelve a autorizar cada petición; esto solo oculta lo que el rol
// no puede usar y evita pantallas que terminarían en 403.
const MENU = [
  {
    titulo: 'Operación',
    items: [
      { to: '/admin', texto: 'Panel', icono: 'dashboard', roles: TODOS, exacto: true },
      { to: '/admin/citas', texto: 'Citas', icono: 'clipboard', roles: TODOS },
      { to: '/admin/solicitudes', texto: 'Solicitudes', icono: 'inbox', roles: GESTION },
      { to: '/admin/calendario', texto: 'Calendario', icono: 'calendar', roles: TODOS }
    ]
  },
  {
    titulo: 'Personas',
    items: [
      { to: '/admin/pacientes', texto: 'Pacientes', icono: 'users', roles: TODOS },
      { to: '/admin/responsables', texto: 'Responsables', icono: 'family', roles: GESTION },
      { to: '/admin/profesionales', texto: 'Profesionales', icono: 'stethoscope', roles: SOLO_ADMIN }
    ]
  },
  {
    titulo: 'Gestión',
    items: [
      { to: '/admin/pagos', texto: 'Pagos', icono: 'card', roles: GESTION },
      { to: '/admin/caja', texto: 'Caja', icono: 'wallet', roles: GESTION },
      { to: '/admin/materiales', texto: 'Materiales', icono: 'book', roles: TODOS },
      { to: '/admin/servicios', texto: 'Servicios', icono: 'briefcase', roles: SOLO_ADMIN }
    ]
  },
  {
    titulo: 'Sitio y sistema',
    items: [
      { to: '/admin/contenidos', texto: 'Contenidos', icono: 'layout', roles: SOLO_ADMIN },
      { to: '/admin/mensajes', texto: 'Mensajes', icono: 'chat', roles: SOLO_ADMIN },
      { to: '/admin/usuarios', texto: 'Usuarios', icono: 'id-card', roles: SOLO_ADMIN }
    ]
  }
];

const grupos = computed(() => {
  const rol = auth.usuario?.rol;
  return MENU
    .map((g) => ({ titulo: g.titulo, items: g.items.filter((i) => i.roles.includes(rol)) }))
    .filter((g) => g.items.length);
});

const ROLES = { ADMINISTRADOR: 'Administrador', RECEPCIONISTA: 'Recepción', PROFESIONAL: 'Profesional' };
const etiquetaRol = computed(() => ROLES[auth.usuario?.rol] || '');

// "Pacientes" también queda activo dentro de /admin/pacientes/:id/historial, etc.
function esActivo(enlace) {
  if (enlace.exacto) return route.path === enlace.to;
  return route.path === enlace.to || route.path.startsWith(`${enlace.to}/`);
}

/* ------------------------------------------------------------------ */
/* Tamaño de pantalla y estado del menú                                */
/* ------------------------------------------------------------------ */
const ANCHO_MENU = 272;
const PREF_MENU = 'sigca_admin_menu';

const ancho = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
// escritorio: menú fijo a la izquierda (se puede ocultar) · medio: menú que flota sobre el contenido
// móvil: barra superior que se oculta al bajar + lista corta desplegable con scroll interno
const modo = computed(() => (ancho.value >= 1100 ? 'escritorio' : ancho.value >= 760 ? 'medio' : 'movil'));

function leerPreferencia() {
  try { return localStorage.getItem(PREF_MENU) !== 'cerrado'; } catch { return true; }
}
function guardarPreferencia(abierto) {
  try { localStorage.setItem(PREF_MENU, abierto ? 'abierto' : 'cerrado'); } catch { /* sin almacenamiento */ }
}

const menuAbierto = ref(modo.value === 'escritorio' ? leerPreferencia() : false);
const botonMenu = ref(null);
const menuEl = ref(null);

function alternarMenu() {
  menuAbierto.value = !menuAbierto.value;
  if (modo.value === 'escritorio') guardarPreferencia(menuAbierto.value);
}
function cerrarMenu() {
  if (!menuAbierto.value) return;
  menuAbierto.value = false;
  if (modo.value === 'escritorio') guardarPreferencia(false);
}

watch(modo, (nuevo) => {
  menuAbierto.value = nuevo === 'escritorio' ? leerPreferencia() : false;
});

// Al elegir una opción en pantallas donde el menú flota, se esconde solo.
watch(() => route.fullPath, () => {
  if (modo.value !== 'escritorio') menuAbierto.value = false;
});

// Espacio realmente disponible para el contenido (según el menú fijo).
const anchoUtil = computed(() => ancho.value - (modo.value === 'escritorio' && menuAbierto.value ? ANCHO_MENU : 0));
const estrecho = computed(() => anchoUtil.value < 820);

const clasesRaiz = computed(() => [
  `adm--${modo.value}`,
  { 'adm--menu-abierto': menuAbierto.value, 'adm--estrecho': estrecho.value }
]);

/* ------------------------------------------------------------------ */
/* Barra superior: se oculta al bajar y reaparece al subir (como el menú del portal) */
/* ------------------------------------------------------------------ */
const UMBRAL_TOPE = 8;
const SENSIBILIDAD = 4;
const enTope = ref(true);
const subiendo = ref(false);
const topVisible = computed(
  () => modo.value === 'escritorio' || enTope.value || subiendo.value || menuAbierto.value
);

let ultimoY = 0;
let scrollPendiente = false;
let resizePendiente = false;

function actualizarScroll() {
  scrollPendiente = false;
  const y = Math.max(0, window.scrollY);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  enTope.value = y <= UMBRAL_TOPE;
  if (y > max) { ultimoY = y; return; } // rebote elástico de iOS/macOS
  if (y > ultimoY + SENSIBILIDAD) {
    subiendo.value = false;
    if (menuAbierto.value && modo.value === 'movil' && y > UMBRAL_TOPE) menuAbierto.value = false;
  } else if (y < ultimoY - SENSIBILIDAD) {
    subiendo.value = true;
  }
  if (Math.abs(y - ultimoY) > SENSIBILIDAD || enTope.value) ultimoY = y;
}
function alScroll() {
  if (scrollPendiente) return;
  scrollPendiente = true;
  requestAnimationFrame(actualizarScroll);
}
function alRedimensionar() {
  if (resizePendiente) return;
  resizePendiente = true;
  requestAnimationFrame(() => {
    resizePendiente = false;
    ancho.value = window.innerWidth;
  });
}
function alTeclaGlobal(e) {
  if (e.key === 'Escape' && menuAbierto.value && modo.value !== 'escritorio') {
    menuAbierto.value = false;
    botonMenu.value?.focus?.({ preventScroll: true });
  }
}

/* ------------------------------------------------------------------ */
/* Volver al portal / Cerrar sesión (con salvaguarda anti-bloqueo)     */
/* ------------------------------------------------------------------ */
const navegando = ref(false);

async function irA(ruta, antes) {
  if (navegando.value) return;
  navegando.value = true;
  menuAbierto.value = false;
  if (antes) antes();
  // Si el router no logra cambiar de pantalla (p. ej. una vista anterior quedó a medias),
  // se recarga directamente en la ruta destino: el usuario nunca se queda atascado.
  const salvaguarda = setTimeout(() => {
    if (window.location.pathname.startsWith('/admin')) window.location.assign(ruta);
  }, 1600);
  try {
    await router.push(ruta);
  } catch {
    /* navegación cancelada o duplicada: la salvaguarda decide */
  } finally {
    navegando.value = false;
    if (!window.location.pathname.startsWith('/admin')) clearTimeout(salvaguarda);
  }
}

function volverAlPortal() {
  irA('/');
}
function cerrarSesion() {
  irA('/login', () => auth.logout());
}

/* ------------------------------------------------------------------ */
/* Protección contra pantallas congeladas al cambiar rápido de opción  */
/* ------------------------------------------------------------------ */
const epoca = ref(0);
const falloVista = ref(false);
const mainEl = ref(null);
let temporizadorVigia = null;

function reintentarVista() {
  falloVista.value = false;
  epoca.value += 1;
}

// El aviso de error solo vale para la pantalla en la que ocurrió.
watch(() => route.path, () => { falloVista.value = false; });

// Un error dentro de una vista no debe dejar el panel sin respuesta.
onErrorCaptured((err) => {
  // eslint-disable-next-line no-console
  console.error('[Panel administrativo]', err);
  falloVista.value = true;
  return false;
});

function recargarSiHaceFalta() {
  const clave = 'sigca_recuperacion';
  let ultimo = 0;
  try { ultimo = Number(sessionStorage.getItem(clave)) || 0; } catch { /* ignorar */ }
  if (Date.now() - ultimo < 10000) return; // evita bucles de recarga
  try { sessionStorage.setItem(clave, String(Date.now())); } catch { /* ignorar */ }
  window.location.assign(route.fullPath);
}

// Vigía: tras cada navegación comprueba que la sección realmente se dibujó.
// Si el contenido quedó vacío (estado inconsistente del DOM), recarga esa misma ruta una vez.
function vigilar() {
  clearTimeout(temporizadorVigia);
  temporizadorVigia = setTimeout(() => {
    const cont = mainEl.value?.querySelector('.adm-contenido');
    if (!cont || !route.path.startsWith('/admin')) return;
    const hayVista = Array.from(cont.children).some((el) => !el.classList.contains('adm-fallo'));
    if (!hayVista) recargarSiHaceFalta();
  }, 1200);
}

const quitarAfterEach = router.afterEach((to, from, fallo) => {
  if (!fallo && to.path.startsWith('/admin')) vigilar();
});
const quitarOnError = router.onError(() => { falloVista.value = true; });

/* ------------------------------------------------------------------ */
/* Tablas: etiquetas de columna para mostrarlas como tarjetas en pantallas angostas */
/* ------------------------------------------------------------------ */
let observador = null;
let etiquetadoPendiente = false;

function etiquetarTablas() {
  etiquetadoPendiente = false;
  const raiz = mainEl.value;
  if (!raiz) return;
  raiz.querySelectorAll('table').forEach((tabla) => {
    if (tabla.closest('.fc')) return; // el calendario tiene su propio diseño
    const cabeceras = Array.from(tabla.querySelectorAll('thead th')).map((th) => th.textContent.trim());
    if (!cabeceras.length) return;
    // Las tablas muy anchas pasan a tarjetas antes que las demás.
    const comoTarjetas = estrecho.value || (cabeceras.length >= 8 && anchoUtil.value < 1180);
    tabla.classList.toggle('adm-tbl-cards', comoTarjetas);
    tabla.querySelectorAll('tbody tr').forEach((fila) => {
      let col = 0;
      Array.from(fila.children).forEach((celda) => {
        if (celda.tagName !== 'TD') return;
        const span = celda.colSpan || 1;
        const etiqueta = span > 1 ? '' : (cabeceras[col] ?? '');
        if (celda.getAttribute('data-label') !== etiqueta) celda.setAttribute('data-label', etiqueta);
        col += span;
      });
    });
  });
}
function programarEtiquetado() {
  if (etiquetadoPendiente) return;
  etiquetadoPendiente = true;
  requestAnimationFrame(etiquetarTablas);
}

watch([estrecho, anchoUtil], () => nextTick(programarEtiquetado));

onMounted(() => {
  cargarSitio();
  ultimoY = window.scrollY;
  actualizarScroll();
  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', alRedimensionar);
  document.addEventListener('keydown', alTeclaGlobal);
  if (mainEl.value && 'MutationObserver' in window) {
    observador = new MutationObserver(programarEtiquetado);
    observador.observe(mainEl.value, { childList: true, subtree: true });
  }
  programarEtiquetado();
  vigilar();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', alScroll);
  window.removeEventListener('resize', alRedimensionar);
  document.removeEventListener('keydown', alTeclaGlobal);
  observador?.disconnect();
  clearTimeout(temporizadorVigia);
  quitarAfterEach();
  quitarOnError();
  // Por si el panel se abandona con una ventanita abierta: la página nunca queda con el scroll bloqueado.
  document.body.style.overflow = '';
});
</script>

<style>
/* =====================================================================
   PANEL ADMINISTRATIVO · diseño clínico moderno, a juego con el portal
   Todo va bajo ".adm" para no afectar al resto del sitio.
   ===================================================================== */
.adm {
  --adm-top: 64px;
  --adm-lat: 272px;
  --c-950: #08243a;
  --c-900: #0b2f49;
  --c-800: #0f3d5e;
  --c-700: #1a5c8a;
  --c-600: #1f7a8f;
  --teal: #2a9d9a;
  --aqua: #35c4bf;
  --glow: #5eeaea;
  --ink: #12354d;
  --muted: #5b7686;
  --line: #dbe8ee;
  --soft: #eef6f9;
  --danger: #c0392b;

  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
  color: var(--ink);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  background:
    radial-gradient(900px 420px at 92% -8%, rgba(53, 196, 191, 0.16), transparent 62%),
    radial-gradient(800px 460px at -8% 6%, rgba(26, 92, 138, 0.12), transparent 60%),
    #f1f7fa;
}
.adm *, .adm *::before, .adm *::after { box-sizing: border-box; }

/* ---------------------------- Barra superior ---------------------------- */
.adm-top {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 80;
  height: var(--adm-top);
  color: #fff;
  background: linear-gradient(100deg, #0f3d5e 0%, #1a5c8a 55%, #1f7a8f 100%);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset;
  transition: transform 0.35s cubic-bezier(0.22, 0.8, 0.3, 1), box-shadow 0.3s ease;
  will-change: transform;
}
.adm-top.elevada { box-shadow: 0 6px 22px rgba(8, 36, 56, 0.35); }
.adm-top.oculta { transform: translateY(-100%); }
.adm-top::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #35c4bf, transparent);
  opacity: 0.7;
}
.adm-top-in {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 clamp(0.6rem, 2.4vw, 1.6rem);
}

.adm-burger {
  appearance: none;
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.adm-burger:hover { background: rgba(255, 255, 255, 0.2); }
.adm-burger:active { transform: scale(0.94); }
.adm-hamb { position: relative; display: block; width: 20px; height: 14px; }
.adm-hamb i {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 2px;
  background: #fff;
  transition: transform 0.3s ease, opacity 0.2s, top 0.3s ease, width 0.3s ease;
}
.adm-hamb i:nth-child(1) { top: 0; }
.adm-hamb i:nth-child(2) { top: 6px; width: 70%; }
.adm-hamb i:nth-child(3) { top: 12px; }
.adm-hamb.activa i:nth-child(1) { top: 6px; transform: rotate(45deg); }
.adm-hamb.activa i:nth-child(2) { opacity: 0; }
.adm-hamb.activa i:nth-child(3) { top: 6px; transform: rotate(-45deg); }

.adm-marca {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #fff;
  text-decoration: none;
}
.adm-logo {
  position: relative;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.35s cubic-bezier(0.3, 1.6, 0.5, 1), box-shadow 0.3s;
}
.adm-logo img { display: block; width: 100%; height: 100%; object-fit: contain; }
.adm-logo-reserva {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-weight: 800;
  background: linear-gradient(135deg, #35c4bf, #1a5c8a);
}
.adm-marca:hover .adm-logo { transform: rotate(-6deg) scale(1.08); box-shadow: 0 6px 18px rgba(53, 196, 191, 0.55); }
.adm-marca-txt { min-width: 0; display: flex; flex-direction: column; line-height: 1.15; }
.adm-marca-txt strong {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  background: linear-gradient(180deg, #fff 30%, #bfeeee 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.adm-marca-txt small {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8fe9e4;
}

.adm-top-acc { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; flex: none; }
.adm-top-acc button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 44px;
  padding: 0 1rem;
  border-radius: 12px;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.22s, color 0.22s, border-color 0.22s, transform 0.22s, box-shadow 0.22s;
}
.adm-top-acc button:disabled { opacity: 0.6; cursor: progress; }
.adm-top-acc button:focus-visible, .adm-burger:focus-visible, .adm-marca:focus-visible {
  outline: 3px solid #5eeaea;
  outline-offset: 2px;
}

/* Volver al portal: cristal con borde claro y flecha que se desliza */
.adm-top-acc .adm-volver {
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}
.adm-top-acc .adm-volver .icono { transition: transform 0.25s ease; }
.adm-top-acc .adm-volver:hover:not(:disabled) {
  background: #fff;
  color: #0f3d5e;
  border-color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(8, 36, 56, 0.28);
}
.adm-top-acc .adm-volver:hover:not(:disabled) .icono { transform: translateX(-4px); }

/* Cerrar sesión: mismo lenguaje que la opción del menú de perfil del portal (rojo suave) */
.adm-top-acc .adm-salir {
  color: #ffd9d9;
  border: 1px solid rgba(255, 150, 150, 0.5);
  background: rgba(224, 75, 81, 0.2);
}
.adm-top-acc .adm-salir:hover:not(:disabled) {
  color: #fff;
  background: #d9444a;
  border-color: #d9444a;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(160, 30, 36, 0.4);
}

/* ---------------------------- Menú lateral ---------------------------- */
.adm-menu {
  position: fixed;
  z-index: 70;
  display: flex;
  flex-direction: column;
  color: #fff;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M22 17v10M17 22h10' stroke='%23ffffff' stroke-opacity='.05' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E"),
    linear-gradient(185deg, #0f3d5e 0%, #0b3150 55%, #082a44 100%);
  box-shadow: 10px 0 34px -14px rgba(8, 36, 56, 0.55);
  transition: transform 0.32s cubic-bezier(0.22, 0.8, 0.3, 1), opacity 0.25s ease, visibility 0s linear 0.32s;
}
.adm-menu.abierto {
  transition: transform 0.32s cubic-bezier(0.22, 0.8, 0.3, 1), opacity 0.25s ease, visibility 0s;
}

/* Escritorio y tamaño medio: panel lateral que se desliza */
.adm--escritorio .adm-menu,
.adm--medio .adm-menu {
  inset: var(--adm-top) auto 0 0;
  width: var(--adm-lat);
  max-width: 86vw;
  transform: translateX(-104%);
  visibility: hidden;
}
.adm--escritorio .adm-menu.abierto,
.adm--medio .adm-menu.abierto { transform: none; visibility: visible; }

/* Móvil: lista corta, con scroll interno, que cuelga de la barra superior */
.adm--movil .adm-menu {
  top: calc(var(--adm-top) + 8px);
  left: 0.6rem;
  right: 0.6rem;
  max-height: min(72vh, 480px);
  max-height: min(72dvh, 480px);
  border-radius: 22px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-10px) scale(0.98);
  transform-origin: top center;
  box-shadow: 0 28px 50px -16px rgba(8, 36, 56, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.adm--movil .adm-menu.abierto { opacity: 1; visibility: visible; pointer-events: auto; transform: none; }

.adm-usuario {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.9rem 0.9rem 0.3rem;
  padding: 0.7rem 0.8rem;
  border-radius: 16px;
  color: #fff;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.2s, border-color 0.2s;
}
.adm-usuario:hover { background: rgba(255, 255, 255, 0.13); border-color: rgba(94, 234, 234, 0.4); }
.adm-usuario .avatar { flex: none; border: 2px solid rgba(255, 255, 255, 0.7); border-radius: 50%; overflow: hidden; }
.adm-usuario-txt { min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
.adm-usuario-txt strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.93rem; }
.adm-usuario-txt em {
  align-self: flex-start;
  padding: 0.05rem 0.55rem;
  border-radius: 999px;
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #0b3150;
  background: linear-gradient(90deg, #5eeaea, #8fe9e4);
}

.adm-nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.3rem 0.7rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.adm--movil .adm-nav {
  padding-bottom: 1.6rem;
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 26px), transparent);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 26px), transparent);
}
.adm-grupo {
  margin: 0.85rem 0.8rem 0.3rem;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}
.adm-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.64rem 0.8rem;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.93rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}
.adm-item .icono { color: #7fd8d4; opacity: 0.95; transition: transform 0.25s, color 0.2s; }
.adm-item-txt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.adm-item:hover { color: #fff; background: rgba(255, 255, 255, 0.09); transform: translateX(3px); }
.adm-item:hover .icono { transform: scale(1.12); color: #a8f3ef; }
.adm-item.activo {
  color: #fff;
  font-weight: 700;
  background: linear-gradient(90deg, rgba(53, 196, 191, 0.3), rgba(53, 196, 191, 0.07));
  box-shadow: inset 3px 0 0 #5eeaea;
}
.adm-item.activo .icono { color: #5eeaea; }
.adm-item:focus-visible, .adm-usuario:focus-visible { outline: 3px solid #5eeaea; outline-offset: -2px; }
.adm-contador {
  display: inline-grid;
  place-items: center;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: #e04b51;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 0 0 3px rgba(224, 75, 81, 0.25);
}

.adm-velo {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(8, 36, 56, 0.42);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.adm-velo-enter-active, .adm-velo-leave-active { transition: opacity 0.25s ease; }
.adm-velo-enter-from, .adm-velo-leave-to { opacity: 0; }

/* ---------------------------- Contenido ---------------------------- */
.adm-main {
  min-height: 100vh;
  min-height: 100dvh;
  padding: calc(var(--adm-top) + clamp(1rem, 2.4vw, 1.8rem)) clamp(0.85rem, 2.6vw, 2rem) 3rem;
  transition: margin-left 0.32s cubic-bezier(0.22, 0.8, 0.3, 1);
  min-width: 0;
}
.adm--escritorio.adm--menu-abierto .adm-main { margin-left: var(--adm-lat); }
.adm-contenido { max-width: 1240px; margin: 0 auto; min-width: 0; }

.adm-fallo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 14px;
  color: #8a5a00;
  background: #fff6e0;
  border: 1px solid #f2d99b;
  font-weight: 600;
}
.adm-fallo span { flex: 1; min-width: 180px; }

/* Animación de entrada de cada pantalla (sin transform residual → no afecta a las ventanitas) */
@keyframes adm-entrada { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.adm-contenido > * { animation: adm-entrada 0.38s ease backwards; }

/* ---------------------------- Encabezado de página ---------------------------- */
.adm .adm-main .adm-contenido .cab-pagina {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.9rem 1.5rem;
  margin-bottom: 1.2rem;
}
.adm .adm-main .adm-contenido .cab-pagina > div { min-width: 0; flex: 1 1 280px; }

.adm .adm-main .adm-contenido h1 {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0 0 0.35rem;
  font-size: clamp(1.45rem, 2.3vw, 1.95rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--c-800);
}
.adm .adm-main .adm-contenido h1::before {
  content: '';
  flex: none;
  width: 6px;
  height: 1.15em;
  border-radius: 6px;
  background: linear-gradient(180deg, var(--aqua), var(--c-700));
}
.adm .adm-main .adm-contenido h3 { margin: 1.3rem 0 0.6rem; font-size: 0.98rem; font-weight: 800; color: var(--c-800); }
.adm .adm-main .adm-contenido p { line-height: 1.55; }
.adm .adm-main .adm-contenido a { color: var(--c-700); }
.adm .adm-main .adm-contenido small { color: var(--muted); }

.adm .adm-main .adm-contenido .ayuda,
.adm .adm-main .adm-contenido .nota,
.adm .adm-main .adm-contenido .motivo {
  margin: 0 0 1rem;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 500;
}

/* Avisos */
.adm .adm-main .adm-contenido .error,
.adm .adm-main .adm-contenido .ok,
.adm .adm-main .adm-contenido .aviso {
  margin: 0.8rem 0;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.45;
  border: 1px solid;
}
.adm .adm-main .adm-contenido .error { color: #9b2c2c; background: #fdecec; border-color: #f4c7c3; }
.adm .adm-main .adm-contenido .ok { color: #1d6b45; background: #e8f7ef; border-color: #bfe6cf; }
.adm .adm-main .adm-contenido .aviso { color: #8a5a00; background: #fff6e0; border-color: #f2d99b; }

/* ---------------------------- Tarjetas ---------------------------- */
.adm .adm-main .adm-contenido .tarjeta {
  margin: 0 0 1.25rem;
  padding: clamp(1rem, 2.2vw, 1.5rem);
  border: 1px solid var(--line);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 61, 94, 0.04), 0 14px 32px -20px rgba(15, 61, 94, 0.28);
  overflow-x: auto;
}
.adm .adm-main .adm-contenido .tarjeta > h2 {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 1rem;
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--c-800);
}
.adm .adm-main .adm-contenido .tarjeta > h2::before {
  content: '';
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: linear-gradient(135deg, var(--aqua), var(--c-700));
  box-shadow: 0 0 0 4px rgba(53, 196, 191, 0.16);
}

/* Contenedor propio de cada vista: ocupa todo el ancho disponible */
.adm .adm-main .adm-contenido .contenedor {
  max-width: none;
  margin: 0;
  font-family: inherit;
}

/* ---------------------------- Formularios ---------------------------- */
.adm .adm-main .adm-contenido .fila,
.adm .adm-main .adm-contenido .filtros-grid,
.adm .adm-main .adm-contenido .filtros-pagos,
.adm .adm-main .adm-contenido .rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 0.15rem 1rem;
  align-items: end;
}
.adm .adm-main .adm-contenido .rejilla.tres { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }

.adm .adm-main .adm-contenido .campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  margin: 0 0 0.85rem;
}
.adm .adm-main .adm-contenido .campo > span,
.adm .adm-main .adm-contenido .campo > label,
.adm .adm-main .adm-contenido .barra label > span {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #35566b;
}

.adm .adm-main .adm-contenido :is(input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='file']), select, textarea) {
  width: 100%;
  min-height: 44px;
  max-width: 100%;
  padding: 0.62rem 0.85rem;
  border: 1.5px solid #c8dbe4;
  border-radius: 12px;
  background-color: #fbfdfe;
  color: var(--ink);
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.35;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.adm .adm-main .adm-contenido :is(input, select, textarea)::placeholder { color: #8aa3b2; }
.adm .adm-main .adm-contenido :is(input:not([type='checkbox']):not([type='radio']), select, textarea):hover { border-color: #9cc3d3; }
.adm .adm-main .adm-contenido :is(input:not([type='checkbox']):not([type='radio']), select, textarea):focus {
  outline: none;
  border-color: var(--teal);
  background-color: #fff;
  box-shadow: 0 0 0 4px rgba(42, 157, 154, 0.18);
}
.adm .adm-main .adm-contenido select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 2.4rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%231a5c8a' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.8rem center;
  cursor: pointer;
  text-overflow: ellipsis;
}
.adm .adm-main .adm-contenido textarea { min-height: 92px; resize: vertical; }
.adm .adm-main .adm-contenido :is(input[type='checkbox'], input[type='radio']) {
  width: 1.15rem;
  height: 1.15rem;
  min-height: 0;
  padding: 0;
  accent-color: var(--teal);
  cursor: pointer;
}
.adm .adm-main .adm-contenido .campo-checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.6rem;
  min-height: 44px;
  margin-bottom: 0.85rem;
  cursor: pointer;
}
.adm .adm-main .adm-contenido .campo-checkbox > span { font-size: 0.9rem; }
.adm .adm-main .adm-contenido input[type='file'] { max-width: 100%; font: inherit; }
.adm .adm-main .adm-contenido .acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}
.adm .adm-main .adm-contenido .resumen,
.adm .adm-main .adm-contenido .dato {
  padding: 0.55rem 0.85rem;
  border-radius: 12px;
  background: var(--soft);
  border: 1px solid #d3e6ee;
  color: #24485e;
  font-size: 0.9rem;
}
.adm .adm-main .adm-contenido .resumen { margin: 0 0 1rem; }
.adm .adm-main .adm-contenido .dato { display: inline-flex; font-weight: 600; }
.adm .adm-main .adm-contenido .totales,
.adm .adm-main .adm-contenido .saldo,
.adm .adm-main .adm-contenido .datos,
.adm .adm-main .adm-contenido .leyenda { display: flex; flex-wrap: wrap; gap: 0.6rem; }

.adm .adm-main .adm-contenido .stat {
  border: 1px solid var(--line);
  border-top: 3px solid var(--aqua);
  border-radius: 14px;
  background: #fff;
}
.adm .adm-main .adm-contenido .stat.alerta { border-top-color: #e6a23c; background: #fffaf0; }
.adm .adm-main .adm-contenido .resumen-pagos .stat { border-color: var(--line); background: #fff; }

/* ---------------------------- Botones ---------------------------- */
.adm .adm-main .adm-contenido button:where(:not(.fc-button, .amd-x, .btn-cerrar)) {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 42px;
  padding: 0.55rem 1.1rem;
  border: 1.5px solid transparent;
  border-radius: 12px;
  background: linear-gradient(135deg, #1a5c8a, #1f7a8f);
  box-shadow: 0 10px 20px -12px rgba(26, 92, 138, 0.75);
  color: #fff;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.01em;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s, color 0.2s, border-color 0.2s, filter 0.2s;
}
.adm .adm-main .adm-contenido button:where(:not(.fc-button, .amd-x, .btn-cerrar)):hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.07);
  box-shadow: 0 14px 24px -12px rgba(26, 92, 138, 0.8);
}
.adm .adm-main .adm-contenido button:where(:not(.fc-button, .amd-x, .btn-cerrar)):active:not(:disabled) { transform: translateY(0); }
.adm .adm-main .adm-contenido button:where(:not(.fc-button, .amd-x, .btn-cerrar)):focus-visible,
.adm .adm-main .adm-contenido .acciones a:focus-visible {
  outline: 3px solid rgba(53, 196, 191, 0.6);
  outline-offset: 2px;
}
.adm .adm-main .adm-contenido button:where(:not(.fc-button, .amd-x, .btn-cerrar)):disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  filter: grayscale(0.2);
}
.adm .adm-main .adm-contenido button.secundario:where(:not(.fc-button, .amd-x)) {
  background: #fff;
  color: var(--c-700);
  border-color: #b9d3df;
  box-shadow: none;
}
.adm .adm-main .adm-contenido button.secundario:where(:not(.fc-button, .amd-x)):hover:not(:disabled) {
  background: var(--soft);
  border-color: var(--c-700);
  box-shadow: none;
  filter: none;
}
.adm .adm-main .adm-contenido button.peligro:where(:not(.fc-button, .amd-x)) {
  background: #fff5f4;
  color: #b23a3a;
  border-color: #f0c4c0;
  box-shadow: none;
}
.adm .adm-main .adm-contenido button.peligro:where(:not(.fc-button, .amd-x)):hover:not(:disabled) {
  background: #c0392b;
  color: #fff;
  border-color: #c0392b;
  box-shadow: 0 12px 22px -12px rgba(192, 57, 43, 0.8);
  filter: none;
}
.adm .adm-main .adm-contenido button.mini:where(:not(.fc-button, .amd-x)) {
  min-height: 34px;
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  border-radius: 10px;
}
.adm .adm-main .adm-contenido .cab-pagina > button { flex: none; }

/* Acciones dentro de tablas: botones y enlaces discretos para no saturar la fila */
.adm .adm-main .adm-contenido td button:where(:not(.fc-button, .amd-x)),
.adm .adm-main .adm-contenido td .acciones a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  margin: 2px 4px 2px 0;
  padding: 0.3rem 0.75rem;
  border: 1.5px solid #d3e6ee;
  border-radius: 10px;
  background: #eaf4f8;
  color: var(--c-700);
  box-shadow: none;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
}
.adm .adm-main .adm-contenido td button:where(:not(.fc-button, .amd-x)):hover:not(:disabled),
.adm .adm-main .adm-contenido td .acciones a:hover {
  background: var(--c-700);
  color: #fff;
  border-color: var(--c-700);
  transform: translateY(-1px);
  filter: none;
  box-shadow: none;
}
.adm .adm-main .adm-contenido td button.secundario:where(:not(.fc-button, .amd-x)) { background: #fff; border-color: #b9d3df; }
.adm .adm-main .adm-contenido td button.peligro:where(:not(.fc-button, .amd-x)) { background: #fff5f4; border-color: #f0c4c0; color: #b23a3a; }
.adm .adm-main .adm-contenido td button.secundario:where(:not(.fc-button, .amd-x)):hover:not(:disabled) { background: var(--c-700); color: #fff; border-color: var(--c-700); }
.adm .adm-main .adm-contenido td button.peligro:where(:not(.fc-button, .amd-x)):hover:not(:disabled) { background: #c0392b; color: #fff; border-color: #c0392b; }
.adm .adm-main .adm-contenido td .acciones,
.adm .adm-main .adm-contenido td.acciones,
.adm .adm-main .adm-contenido td.acciones-celda { min-width: 0; }

/* Paginación */
.adm .adm-main .adm-contenido .paginacion {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem 1rem;
  margin-top: 1.1rem;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 600;
}

/* ---------------------------- Insignias ---------------------------- */
.adm .adm-main .adm-contenido .badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
.adm .adm-main .adm-contenido .chip {
  display: inline-flex;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
}

/* ---------------------------- Tablas ---------------------------- */
.adm .adm-main .adm-contenido .tabla-scroll { overflow-x: auto; }
.adm .adm-main .adm-contenido table:not([class*='fc-']) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
}
.adm .adm-main .adm-contenido table:not([class*='fc-']) th {
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid var(--line);
  background: var(--soft);
  color: #35566b;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}
.adm .adm-main .adm-contenido table:not([class*='fc-']) th:first-child { border-top-left-radius: 12px; }
.adm .adm-main .adm-contenido table:not([class*='fc-']) th:last-child { border-top-right-radius: 12px; }
.adm .adm-main .adm-contenido table:not([class*='fc-']) td {
  display: table-cell;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid #e6eff3;
  color: var(--ink);
  text-align: left;
  vertical-align: middle;
  overflow-wrap: anywhere;
  transition: background 0.15s;
}
.adm .adm-main .adm-contenido table:not([class*='fc-']) tbody tr:hover td { background: #f6fbfd; }
.adm .adm-main .adm-contenido table:not([class*='fc-']) tbody tr:last-child td { border-bottom: 0; }
.adm .adm-main .adm-contenido table:not([class*='fc-']) tr.seleccionada td { background: #e8f4f8; }
.adm .adm-main .adm-contenido table:not([class*='fc-']) td.fecha,
.adm .adm-main .adm-contenido table:not([class*='fc-']) td.ahora { white-space: nowrap; }
.adm .adm-main .adm-contenido table:not([class*='fc-']) td.vacio { padding: 1.4rem; text-align: center; color: var(--muted); }
.adm .adm-main .adm-contenido table:not([class*='fc-']) td input { min-width: 5.5rem; width: auto; }
.adm .adm-main .adm-contenido td.pos { color: #1d8a52; font-weight: 800; }
.adm .adm-main .adm-contenido td.neg { color: #c0392b; font-weight: 800; }
.adm .adm-main .adm-contenido .miniatura { border-radius: 10px; }
.adm .adm-main .adm-contenido .desc { max-width: 280px; }

/* Tablas como tarjetas cuando falta espacio (se activa solo, según el ancho real disponible) */
.adm .adm-main .adm-contenido table.adm-tbl-cards,
.adm .adm-main .adm-contenido table.adm-tbl-cards tbody { display: block; width: 100%; }
.adm .adm-main .adm-contenido table.adm-tbl-cards thead {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.adm .adm-main .adm-contenido table.adm-tbl-cards tr {
  display: block;
  margin: 0 0 0.8rem;
  padding: 0.35rem 1rem;
  border: 1px solid var(--line);
  border-left: 4px solid var(--aqua);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 22px -18px rgba(15, 61, 94, 0.5);
}
.adm .adm-main .adm-contenido table.adm-tbl-cards tbody tr:hover td { background: transparent; }
.adm .adm-main .adm-contenido table.adm-tbl-cards td {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.55rem 0;
  border-bottom: 1px dashed #dbe8ee;
  text-align: right;
}
.adm .adm-main .adm-contenido table.adm-tbl-cards tbody tr:last-child td { border-bottom: 1px dashed #dbe8ee; }
.adm .adm-main .adm-contenido table.adm-tbl-cards td:last-child,
.adm .adm-main .adm-contenido table.adm-tbl-cards tbody tr:last-child td:last-child { border-bottom: 0; }
.adm .adm-main .adm-contenido table.adm-tbl-cards td::before {
  content: attr(data-label);
  flex: 0 0 38%;
  max-width: 38%;
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
}
.adm .adm-main .adm-contenido table.adm-tbl-cards td[data-label='']::before { content: none; }
.adm .adm-main .adm-contenido table.adm-tbl-cards td[data-label=''] { justify-content: flex-start; flex-wrap: wrap; text-align: left; }
.adm .adm-main .adm-contenido table.adm-tbl-cards td[colspan] { justify-content: center; text-align: center; }
.adm .adm-main .adm-contenido table.adm-tbl-cards td > * { min-width: 0; }
.adm .adm-main .adm-contenido table.adm-tbl-cards td .acciones { justify-content: flex-start; }
.adm .adm-main .adm-contenido table.adm-tbl-cards td input { width: 100%; max-width: 12rem; }
.adm .adm-main .adm-contenido table.adm-tbl-cards .desc { max-width: none; white-space: normal; }

/* ---------------------------- Calendario (FullCalendar) ---------------------------- */
.adm .adm-main .adm-contenido .fc {
  --fc-border-color: #dbe8ee;
  --fc-button-bg-color: #1a5c8a;
  --fc-button-border-color: #1a5c8a;
  --fc-button-hover-bg-color: #0f3d5e;
  --fc-button-hover-border-color: #0f3d5e;
  --fc-button-active-bg-color: #0f3d5e;
  --fc-button-active-border-color: #0f3d5e;
  --fc-today-bg-color: rgba(53, 196, 191, 0.13);
  --fc-neutral-bg-color: #eef6f9;
  --fc-page-bg-color: #fff;
  font-size: 0.9rem;
}
.adm .adm-main .adm-contenido .fc .fc-toolbar-title { font-size: 1.15rem; font-weight: 800; color: var(--c-800); text-transform: capitalize; }
.adm .adm-main .adm-contenido .fc .fc-button { border-radius: 10px; font-weight: 700; text-transform: capitalize; box-shadow: none; }
.adm .adm-main .adm-contenido .fc .fc-button:focus { box-shadow: 0 0 0 3px rgba(53, 196, 191, 0.4); }
.adm .adm-main .adm-contenido .fc .fc-col-header-cell-cushion,
.adm .adm-main .adm-contenido .fc .fc-daygrid-day-number { color: var(--c-800); text-decoration: none; }
.adm .adm-main .adm-contenido .fc .fc-event { border-radius: 6px; padding: 1px 3px; cursor: pointer; }
.adm .adm-main .adm-contenido .fc a { color: inherit; }
.adm--estrecho .adm-main .adm-contenido .fc .fc-toolbar { flex-direction: column; gap: 0.6rem; }

/* ---------------------------- Datos de detalle ---------------------------- */
.adm .adm-main .adm-contenido dl { display: grid; grid-template-columns: minmax(96px, 150px) 1fr; gap: 0.6rem 1rem; margin: 0; }
.adm .adm-main .adm-contenido dt { font-size: 0.74rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); padding-top: 0.15rem; }
.adm .adm-main .adm-contenido dd { margin: 0; overflow-wrap: anywhere; }

/* ---------------------------- Ajustes por tamaño ---------------------------- */
@media (max-width: 1099px) {
  .adm-marca-txt strong { max-width: 190px; }
}
/* Del tamaño medio hacia abajo, los dos botones de salida quedan como iconos: siguen siempre a la vista */
@media (max-width: 1000px) {
  .adm-top-acc .adm-volver span, .adm-top-acc .adm-salir span { display: none; }
  .adm-top-acc button { width: 44px; padding: 0; }
}
@media (max-width: 520px) {
  .adm { --adm-top: 60px; }
  .adm-top-in { gap: 0.5rem; }
  .adm-marca-txt small { display: none; }
  .adm-marca-txt strong { max-width: min(150px, 34vw); font-size: 0.92rem; }
  .adm-logo { width: 36px; height: 36px; }
  .adm-top-acc { gap: 0.4rem; }
  .adm-top-acc button, .adm-burger { width: 42px; height: 42px; }
}
@media (max-width: 380px) {
  .adm-marca-txt { display: none; }
}
.adm--estrecho .adm-main .adm-contenido .tarjeta { border-radius: 16px; }
.adm--estrecho .adm-main .adm-contenido .cab-pagina > button { width: 100%; }
.adm--estrecho .adm-main .adm-contenido dl { grid-template-columns: 1fr; gap: 0.15rem; }
.adm--estrecho .adm-main .adm-contenido dd { margin-bottom: 0.6rem; }

@media (prefers-reduced-motion: reduce) {
  .adm-top, .adm-menu, .adm-main, .adm-item, .adm-item .icono, .adm-logo, .adm-hamb i,
  .adm-top-acc button, .adm-top-acc .adm-volver .icono, .adm-velo-enter-active, .adm-velo-leave-active { transition: none; }
  .adm-contenido > * { animation: none; }
}
</style>