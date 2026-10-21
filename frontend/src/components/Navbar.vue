<template>
  <header class="navbar" :class="{ oculta: !visible, elevada: !enTope }">
    <div class="navbar-interno">
      <RouterLink to="/" class="marca" aria-label="SIGSA — Inicio" @click="abierto = false">
        <span class="marca-logo" aria-hidden="true">
          <svg viewBox="0 0 40 40" width="40" height="40">
            <defs>
              <linearGradient id="sigsa-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#35c4bf" />
                <stop offset="1" stop-color="#1a5c8a" />
              </linearGradient>
            </defs>
            <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="url(#sigsa-grad)" />
            <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" />
            <!-- Cruz médica -->
            <path d="M17 9h6v8h8v6h-8v8h-6v-8H9v-6h8z" fill="#fff" />
            <!-- Línea de pulso -->
            <path d="M7 24h7l2.5-5 4 10 2.5-5H33" fill="none" stroke="#0f3d5e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="marca-brillo"></span>
        </span>
        <span class="marca-texto">SIGSA</span>
      </RouterLink>

      <nav id="menu-principal" :class="{ abierto }" aria-label="Menú principal">
        <template v-for="enlace in enlaces" :key="enlace.texto">
          <!-- "Contacto" no es una pantalla: abre una ventana -->
          <button
            v-if="enlace.accion === 'contacto'"
            type="button"
            class="enlace"
            :class="{ activo: contactoAbierto }"
            aria-haspopup="dialog"
            @click="abrirVentanaContacto"
          >
            <span>{{ enlace.texto }}</span>
          </button>
          <RouterLink v-else :to="enlace.to" class="enlace" @click="abierto = false">
            <span>{{ enlace.texto }}</span>
          </RouterLink>
        </template>
      </nav>

      <div class="acciones">
        <button
          class="menu-btn"
          type="button"
          :aria-expanded="abierto"
          aria-controls="menu-principal"
          :aria-label="abierto ? 'Cerrar menú' : 'Abrir menú'"
          @click="abierto = !abierto; menuPerfil = false"
        >
          <span class="hamburguesa" :class="{ activa: abierto }" aria-hidden="true">
            <i></i><i></i><i></i>
          </span>
        </button>

        <!-- Perfil: con sesión muestra la FOTO del usuario (o sus iniciales); sin sesión, el icono genérico -->
        <div ref="perfilWrap" class="perfil-wrap">
          <RouterLink
            v-if="!auth.autenticado"
            to="/login"
            class="perfil"
            title="Iniciar sesión"
            aria-label="Iniciar sesión o crear cuenta"
            @click="abierto = false"
          >
            <span class="perfil-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </span>
          </RouterLink>

          <template v-else>
            <button
              type="button"
              class="perfil"
              :title="auth.usuario?.nombre || 'Mi cuenta'"
              aria-haspopup="menu"
              :aria-expanded="menuPerfil"
              aria-label="Menú de mi cuenta"
              @click="alternarMenuPerfil"
            >
              <span class="perfil-avatar con-foto" :class="{ abierto: menuPerfil }">
                <Avatar :key="(auth.usuario?.foto || '').length" :src="auth.usuario?.foto || ''" :nombre="auth.usuario?.nombre || ''" :size="38" />
              </span>
              <span class="perfil-punto" :class="{ pendiente: auth.pendiente }" aria-hidden="true"></span>
            </button>

            <Transition name="perfil-menu">
              <div v-if="menuPerfil" class="perfil-menu" role="menu" aria-label="Mi cuenta">
                <div class="perfil-cab">
                  <Avatar :key="(auth.usuario?.foto || '').length" :src="auth.usuario?.foto || ''" :nombre="auth.usuario?.nombre || ''" :size="48" />
                  <div class="perfil-datos">
                    <strong>{{ auth.usuario?.nombre }}</strong>
                    <span>{{ auth.usuario?.email }}</span>
                    <em>{{ etiquetaRol }}</em>
                  </div>
                </div>
                <RouterLink to="/perfil" class="perfil-op" role="menuitem">
                  <Icono name="user" :size="18" /> Mi perfil
                </RouterLink>
                <RouterLink v-if="auth.esPersonal" to="/admin" class="perfil-op" role="menuitem">
                  <Icono name="dashboard" :size="18" /> Panel de administración
                </RouterLink>
                <button type="button" class="perfil-op perfil-salir" role="menuitem" @click="cerrarSesion">
                  <Icono name="logout" :size="18" /> Cerrar sesión
                </button>
              </div>
            </Transition>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { abrirContacto, contactoAbierto } from '../composables/contactoModal.js';
import { useAuthStore } from '../stores/auth.js';
import Avatar from './Avatar.vue';
import Icono from './Icono.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

// Menú desplegable de la cuenta (foto del usuario)
const menuPerfil = ref(false);
const perfilWrap = ref(null);
const ROLES = { ADMINISTRADOR: 'Administrador', RECEPCIONISTA: 'Recepción', PROFESIONAL: 'Profesional', CLIENTE: 'Cliente' };
const etiquetaRol = computed(() => ROLES[auth.usuario?.rol] || '');

function alternarMenuPerfil() {
  menuPerfil.value = !menuPerfil.value;
  if (menuPerfil.value) abierto.value = false;
}
function cerrarSesion() {
  menuPerfil.value = false;
  abierto.value = false;
  auth.logout();
  router.push('/');
}
function alPulsarFuera(e) {
  if (menuPerfil.value && perfilWrap.value && !perfilWrap.value.contains(e.target)) menuPerfil.value = false;
}
function alTeclaGlobal(e) {
  if (e.key === 'Escape') menuPerfil.value = false;
}
watch(() => route.fullPath, () => { menuPerfil.value = false; });

const enlaces = [
  { to: '/', texto: 'Inicio' },
  { to: '/servicios', texto: 'Servicios' },
  { accion: 'contacto', texto: 'Contacto' }
];

function abrirVentanaContacto() {
  abierto.value = false;
  abrirContacto('info');
}

const UMBRAL_TOPE = 8; // px desde arriba que se consideran "parte superior"
const SENSIBILIDAD = 4; // px mínimos de movimiento para cambiar de dirección

const abierto = ref(false);
const enTope = ref(true);
const subiendo = ref(false);

// Visible: arriba del todo (fijo), al subir, o con el menú móvil abierto.
// Al bajar se oculta.
const visible = computed(() => enTope.value || subiendo.value || abierto.value);

let ultimoY = 0;
let pendiente = false;

function actualizar() {
  pendiente = false;
  const y = Math.max(0, window.scrollY);
  const max = document.documentElement.scrollHeight - window.innerHeight;

  enTope.value = y <= UMBRAL_TOPE;

  // Se ignora el "rebote" elástico de iOS/macOS en los extremos.
  if (y > max) {
    ultimoY = y;
    return;
  }

  if (y > ultimoY + SENSIBILIDAD) {
    subiendo.value = false;
    if (abierto.value && y > UMBRAL_TOPE) abierto.value = false;
    if (menuPerfil.value) menuPerfil.value = false;
  } else if (y < ultimoY - SENSIBILIDAD) {
    subiendo.value = true;
  }
  if (Math.abs(y - ultimoY) > SENSIBILIDAD || enTope.value) ultimoY = y;
}

function alScroll() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(actualizar);
}

// En escritorio el menú móvil no aplica.
function alRedimensionar() {
  if (window.innerWidth > 900) abierto.value = false;
}

// Al cambiar el menú móvil, el cuerpo no debe moverse.
watch(abierto, (v) => {
  if (v) subiendo.value = true;
});

onMounted(() => {
  ultimoY = window.scrollY;
  actualizar();
  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', alRedimensionar);
  document.addEventListener('pointerdown', alPulsarFuera);
  document.addEventListener('keydown', alTeclaGlobal);
});

onUnmounted(() => {
  window.removeEventListener('scroll', alScroll);
  window.removeEventListener('resize', alRedimensionar);
  document.removeEventListener('pointerdown', alPulsarFuera);
  document.removeEventListener('keydown', alTeclaGlobal);
});
</script>

<style>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--nav-h, 64px);
  color: #fff;
  background: linear-gradient(100deg, #0f3d5e 0%, #1a5c8a 55%, #1f7a8f 100%);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset;
  transition: transform 0.35s cubic-bezier(0.22, 0.8, 0.3, 1), box-shadow 0.3s ease;
  will-change: transform;
}
.navbar.elevada { box-shadow: 0 6px 22px rgba(8, 36, 56, 0.35); }
.navbar.oculta { transform: translateY(-100%); }

.navbar::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #35c4bf, transparent);
  opacity: 0.7;
}

.navbar-interno {
  box-sizing: border-box;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(0.75rem, 3vw, 2rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* ---------- Marca (izquierda) ---------- */
.navbar .marca {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #fff;
  text-decoration: none;
}
.marca-logo {
  position: relative;
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.35s cubic-bezier(0.3, 1.6, 0.5, 1), box-shadow 0.3s;
}
.marca-logo svg { display: block; }
.marca-brillo {
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.6) 50%, transparent 65%);
  transform: translateX(-120%);
}
.navbar .marca:hover .marca-logo {
  transform: rotate(-6deg) scale(1.08);
  box-shadow: 0 6px 18px rgba(53, 196, 191, 0.55);
}
.navbar .marca:hover .marca-brillo { animation: navbar-brillo 0.9s ease; }

.marca-texto {
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  line-height: 1;
  background: linear-gradient(180deg, #fff 30%, #bfeeee 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition: letter-spacing 0.3s ease, text-shadow 0.3s;
}
.navbar .marca:hover .marca-texto {
  letter-spacing: 0.26em;
  filter: drop-shadow(0 0 8px rgba(120, 240, 235, 0.55));
}

/* ---------- Enlaces (derecha, en línea) ---------- */
.navbar nav { display: flex; align-items: center; gap: 0.35rem; margin-left: auto; }

.navbar nav .enlace {
  appearance: none;
  border: 0;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
  position: relative;
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
  padding: 0.55rem 1rem;
  border-radius: 10px;
  font-size: 0.97rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  transition: color 0.25s, background 0.25s, transform 0.25s, box-shadow 0.25s;
}
.navbar nav .enlace span { position: relative; z-index: 1; }
/* Subrayado animado */
.navbar nav .enlace::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 5px;
  width: calc(100% - 2rem);
  height: 2px;
  border-radius: 2px;
  background: #5eeaea;
  box-shadow: 0 0 8px #5eeaea;
  transform: translateX(-50%) scaleX(0);
  transform-origin: center;
  transition: transform 0.3s ease;
}
.navbar nav .enlace:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
}
.navbar nav .enlace:hover::after,
.navbar nav .enlace.activo::after,
.navbar nav .enlace.router-link-exact-active::after { transform: translateX(-50%) scaleX(1); }
.navbar nav .enlace.activo,
.navbar nav .enlace.router-link-exact-active { color: #fff; font-weight: 700; background: rgba(255, 255, 255, 0.1); }

/* ---------- Perfil (foto del usuario) ---------- */
.acciones { display: flex; align-items: center; gap: 0.6rem; margin-left: 0.5rem; }
.navbar .perfil {
  display: flex;
  align-items: center;
  color: #fff;
  text-decoration: none;
}
.perfil-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.08));
  border: 2px solid rgba(255, 255, 255, 0.75);
  transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1), box-shadow 0.3s, border-color 0.3s, background 0.3s;
}
.navbar .perfil:hover .perfil-avatar {
  transform: scale(1.1) rotate(-4deg);
  border-color: #5eeaea;
  background: rgba(94, 234, 234, 0.25);
  box-shadow: 0 0 0 4px rgba(94, 234, 234, 0.2), 0 0 18px rgba(94, 234, 234, 0.6);
}
.navbar .perfil.router-link-active .perfil-avatar { border-color: #5eeaea; }

.navbar .perfil-wrap { position: relative; }
.navbar button.perfil { appearance: none; background: none; border: 0; padding: 0; cursor: pointer; position: relative; font: inherit; }
.perfil-avatar.con-foto { overflow: hidden; padding: 0; box-sizing: border-box; flex: none; background: rgba(255, 255, 255, 0.2); }
.perfil-avatar.con-foto .avatar { width: 100%; height: 100%; }
.perfil-avatar.con-foto .avatar img { width: 100%; height: 100%; object-fit: cover; }
.perfil-avatar.con-foto.abierto { border-color: #5eeaea; box-shadow: 0 0 0 4px rgba(94, 234, 234, 0.2), 0 0 18px rgba(94, 234, 234, 0.6); }
.perfil-punto {
  position: absolute;
  right: 0;
  bottom: 1px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #3ddc97;
  border: 2px solid #1a5c8a;
  box-shadow: 0 0 8px rgba(61, 220, 151, 0.8);
}
.perfil-punto.pendiente { background: #ffb84d; box-shadow: 0 0 8px rgba(255, 184, 77, 0.8); animation: perfil-parpadeo 1.4s ease-in-out infinite; }

.perfil-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  z-index: 120;
  width: min(300px, calc(100vw - 1.5rem));
  box-sizing: border-box;
  padding: 0.55rem;
  border-radius: 18px;
  background: #fff;
  color: #12354d;
  box-shadow: 0 24px 50px -16px rgba(8, 36, 56, 0.55), 0 0 0 1px rgba(15, 61, 94, 0.08);
  transform-origin: top right;
}
.perfil-menu::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 16px;
  width: 14px;
  height: 14px;
  background: #fff;
  transform: rotate(45deg);
  border-radius: 3px;
}
.perfil-cab { position: relative; display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0.6rem 0.85rem; margin-bottom: 0.3rem; border-bottom: 1px solid #e3edf2; }
.perfil-datos { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.perfil-datos strong { font-size: 0.97rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.perfil-datos span { font-size: 0.8rem; color: #5b7686; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.perfil-datos em { align-self: flex-start; margin-top: 0.25rem; padding: 0.1rem 0.5rem; border-radius: 999px; font-style: normal; font-size: 0.72rem; font-weight: 700; color: #1a5c8a; background: #e3f1f4; }
.navbar .perfil-op {
  appearance: none;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 0.75rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #12354d;
  font: inherit;
  font-size: 0.93rem;
  font-weight: 600;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}
.navbar .perfil-op:hover { background: #eaf4f7; color: #1a5c8a; transform: translateX(3px); }
.navbar .perfil-op:focus-visible { outline: 3px solid #35c4bf; outline-offset: -2px; }
.navbar .perfil-op .icono { color: #2a9d9a; }
.navbar .perfil-salir { color: #b23a3a; }
.navbar .perfil-salir .icono { color: #b23a3a; }
.navbar .perfil-salir:hover { background: #fdecec; color: #a12f2f; }
.perfil-menu-enter-active, .perfil-menu-leave-active { transition: opacity 0.2s, transform 0.25s cubic-bezier(0.3, 1.3, 0.5, 1); }
.perfil-menu-enter-from, .perfil-menu-leave-to { opacity: 0; transform: translateY(-8px) scale(0.95); }
@keyframes perfil-parpadeo { 50% { opacity: 0.4; } }

.navbar a:focus-visible,
.navbar button.perfil:focus-visible,
.menu-btn:focus-visible { outline: 3px solid #5eeaea; outline-offset: 2px; }

/* ---------- Botón hamburguesa (móvil) ---------- */
.menu-btn {
  display: none;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}
.menu-btn:hover { background: rgba(255, 255, 255, 0.2); }
.hamburguesa { position: relative; display: block; width: 20px; height: 14px; }
.hamburguesa i {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 2px;
  background: #fff;
  transition: transform 0.3s ease, opacity 0.2s, top 0.3s ease;
}
.hamburguesa i:nth-child(1) { top: 0; }
.hamburguesa i:nth-child(2) { top: 6px; }
.hamburguesa i:nth-child(3) { top: 12px; }
.hamburguesa.activa i:nth-child(1) { top: 6px; transform: rotate(45deg); }
.hamburguesa.activa i:nth-child(2) { opacity: 0; }
.hamburguesa.activa i:nth-child(3) { top: 6px; transform: rotate(-45deg); }

@keyframes navbar-brillo { to { transform: translateX(120%); } }

@media (max-width: 900px) {
  .menu-btn { display: flex; }
  .navbar nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    margin-left: 0;
    padding: 0.6rem 1rem 1rem;
    background: #0f3d5e;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }
  .navbar nav.abierto { display: flex; animation: navbar-desplegar 0.25s ease; }
  /* Todas las opciones (enlaces y el botón "Contacto") con el mismo orden: alineadas a la izquierda. */
  .navbar nav .enlace {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    box-sizing: border-box;
    text-align: left;
    padding: 0.8rem 0.9rem;
    font-size: 1.02rem;
  }
  .navbar nav .enlace::after { display: none; }
  .acciones { margin-left: auto; }
}

@keyframes navbar-desplegar {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .navbar,
  .marca-logo,
  .marca-texto,
  .navbar nav .enlace,
  .navbar nav .enlace::after,
  .perfil-avatar,
  .perfil-menu-enter-active,
  .perfil-menu-leave-active,
  .perfil-punto,
  .hamburguesa i { transition: none; animation: none; }
  .navbar .marca:hover .marca-brillo,
  .navbar nav.abierto { animation: none; }
}
</style>