<template>
  <div class="panel">
    <section class="hero">
      <div class="hero-txt">
        <span class="hero-rol"><Icono name="shield" :size="14" /> {{ etiquetaRol }}</span>
        <h1 class="hero-titulo">Hola, {{ primerNombre }}</h1>
        <p>
          <span v-if="auth.esProfesional">Desde aquí puedes consultar tus citas y los pacientes que atiendes.</span>
          <span v-else>Gestiona la agenda, las solicitudes y la operación diaria del centro.</span>
        </p>
        <small class="hero-fecha">{{ fechaHoy }}</small>
      </div>
      <!-- Línea de pulso: guiño clínico -->
      <svg class="hero-ecg" viewBox="0 0 320 90" fill="none" aria-hidden="true">
        <path d="M0 52h70l12-26 18 58 16-44 12 12h38l10-18 14 36 12-24h118" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </section>

    <h2 class="panel-sub">Accesos rápidos</h2>
    <ul class="accesos">
      <li v-for="enlace in enlaces" :key="enlace.to">
        <RouterLink :to="enlace.to" class="acceso">
          <span class="acceso-ic"><Icono :name="enlace.icono" :size="22" /></span>
          <span class="acceso-tx">
            <strong>{{ enlace.texto }}</strong>
            <small>{{ enlace.detalle }}</small>
          </span>
          <span v-if="enlace.to === '/admin/mensajes' && mensajes.noLeidos > 0" class="acceso-n">{{ mensajes.noLeidos > 99 ? '99+' : mensajes.noLeidos }}</span>
          <Icono class="acceso-flecha" name="arrow" :size="18" />
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useMensajesStore } from '../stores/mensajes.js';
import Icono from '../components/Icono.vue';

const auth = useAuthStore();
const mensajes = useMensajesStore();
const TODOS = ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'];
const GESTION = ['ADMINISTRADOR', 'RECEPCIONISTA'];
const SOLO_ADMIN = ['ADMINISTRADOR'];

const menu = [
  { to: '/admin/citas', texto: 'Citas', detalle: 'Agenda, estados y reprogramación', icono: 'clipboard', roles: TODOS },
  { to: '/admin/solicitudes', texto: 'Solicitudes de cita', detalle: 'Atender o rechazar solicitudes', icono: 'inbox', roles: GESTION },
  { to: '/admin/calendario', texto: 'Calendario', detalle: 'Vista mensual, semanal y diaria', icono: 'calendar', roles: TODOS },
  { to: '/admin/pacientes', texto: 'Pacientes', detalle: 'Fichas, historial y responsables', icono: 'users', roles: TODOS },
  { to: '/admin/materiales', texto: 'Materiales educativos', detalle: 'Catálogo para los pacientes', icono: 'book', roles: TODOS },
  { to: '/admin/pagos', texto: 'Pagos', detalle: 'Cobros, saldos y comprobantes', icono: 'card', roles: GESTION },
  { to: '/admin/caja', texto: 'Caja', detalle: 'Apertura, movimientos y cierre', icono: 'wallet', roles: GESTION },
  { to: '/admin/profesionales', texto: 'Profesionales', detalle: 'Equipo y especialidades', icono: 'stethoscope', roles: SOLO_ADMIN },
  { to: '/admin/servicios', texto: 'Servicios', detalle: 'Precios y duración', icono: 'briefcase', roles: SOLO_ADMIN },
  { to: '/admin/contenidos', texto: 'Contenidos', detalle: 'Portada, horarios y publicaciones', icono: 'layout', roles: SOLO_ADMIN },
  { to: '/admin/mensajes', texto: 'Mensajes', detalle: 'Bandeja de contacto', icono: 'chat', roles: SOLO_ADMIN },
  { to: '/admin/usuarios', texto: 'Usuarios', detalle: 'Cuentas y contraseñas', icono: 'id-card', roles: SOLO_ADMIN }
];

const enlaces = computed(() => {
  const rol = auth.usuario?.rol;
  return menu.filter((e) => e.roles.includes(rol));
});

const ROLES = { ADMINISTRADOR: 'Administrador', RECEPCIONISTA: 'Recepción', PROFESIONAL: 'Profesional' };
const etiquetaRol = computed(() => ROLES[auth.usuario?.rol] || 'Personal');
const primerNombre = computed(() => (auth.usuario?.nombre || '').trim().split(/\s+/)[0] || 'bienvenido/a');
const fechaHoy = computed(() => {
  const f = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return f.charAt(0).toUpperCase() + f.slice(1);
});
</script>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.6rem;
  padding: clamp(1.3rem, 3vw, 2.1rem);
  border-radius: 24px;
  color: #fff;
  background:
    radial-gradient(420px 220px at 90% 0%, rgba(94, 234, 234, 0.35), transparent 65%),
    linear-gradient(120deg, #0f3d5e 0%, #1a5c8a 55%, #1f7a8f 100%);
  box-shadow: 0 24px 44px -26px rgba(15, 61, 94, 0.8);
}
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M22 17v10M17 22h10' stroke='%23ffffff' stroke-opacity='.07' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
}
.hero-txt { position: relative; z-index: 1; min-width: 0; }
.hero-rol {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.7rem;
  padding: 0.22rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0b3150;
  background: linear-gradient(90deg, #5eeaea, #9ff2ee);
}
.panel .hero .hero-titulo { margin: 0 0 0.4rem; color: #fff; font-size: clamp(1.7rem, 3.4vw, 2.5rem); }
.panel .hero .hero-titulo::before { display: none; }
.hero p { margin: 0; max-width: 46ch; color: rgba(255, 255, 255, 0.88); }
.panel .hero .hero-fecha { display: block; margin-top: 0.9rem; color: #a8f3ef; font-weight: 700; letter-spacing: 0.03em; }
.hero-ecg { position: relative; z-index: 1; flex: none; width: min(300px, 34%); color: #5eeaea; opacity: 0.85; filter: drop-shadow(0 0 10px rgba(94, 234, 234, 0.65)); }
.hero-ecg path { stroke-dasharray: 700; stroke-dashoffset: 700; animation: ecg 2.6s ease-out 0.2s forwards; }
@keyframes ecg { to { stroke-dashoffset: 0; } }

.panel .panel-sub { margin: 0 0 0.9rem; font-size: 1.05rem; font-weight: 800; color: #0f3d5e; }

.accesos { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.85rem; }
.panel .accesos a.acceso {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  height: 100%;
  padding: 1rem 1.1rem;
  border: 1px solid #dbe8ee;
  border-radius: 18px;
  background: #fff;
  color: #12354d;
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(15, 61, 94, 0.04), 0 14px 28px -22px rgba(15, 61, 94, 0.45);
  transition: transform 0.25s cubic-bezier(0.3, 1.4, 0.5, 1), box-shadow 0.25s, border-color 0.25s;
}
.panel .accesos a.acceso:hover {
  transform: translateY(-4px);
  border-color: #35c4bf;
  box-shadow: 0 22px 34px -22px rgba(26, 92, 138, 0.6);
}
.panel .accesos a.acceso:focus-visible { outline: 3px solid rgba(53, 196, 191, 0.6); outline-offset: 2px; }
.acceso-ic {
  display: grid;
  place-items: center;
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  color: #1a5c8a;
  background: linear-gradient(135deg, #e3f1f4, #d3efee);
  transition: background 0.25s, color 0.25s, transform 0.25s;
}
.panel .accesos a.acceso:hover .acceso-ic { color: #fff; background: linear-gradient(135deg, #1a5c8a, #2a9d9a); transform: rotate(-6deg); }
.acceso-tx { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 0.15rem; }
.acceso-tx strong { font-size: 0.97rem; }
.panel .accesos .acceso-tx small { color: #5b7686; font-size: 0.8rem; line-height: 1.35; }
.acceso-n {
  display: inline-grid;
  place-items: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: #e04b51;
  color: #fff;
  font-size: 0.74rem;
  font-weight: 800;
}
.acceso-flecha { flex: none; color: #9cc3d3; transition: transform 0.25s, color 0.25s; }
.panel .accesos a.acceso:hover .acceso-flecha { transform: translateX(4px); color: #2a9d9a; }

@media (max-width: 640px) {
  .hero-ecg { display: none; }
  .accesos { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-ecg path { animation: none; stroke-dashoffset: 0; }
  .panel .accesos a.acceso, .acceso-ic, .acceso-flecha { transition: none; }
}
</style>
