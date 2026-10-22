<template>
  <div class="admin">
    <aside class="lateral">
      <p class="marca">SIGCA Admin</p>
      <p class="rol">{{ auth.usuario?.rol }}</p>
      <nav>
        <RouterLink v-for="enlace in enlaces" :key="enlace.to" :to="enlace.to">
          <span>{{ enlace.texto }}</span>
          <span
            v-if="enlace.to === '/admin/mensajes' && mensajes.noLeidos > 0"
            class="badge"
            :aria-label="`${mensajes.noLeidos} mensajes sin leer`"
          >{{ mensajes.noLeidos > 99 ? '99+' : mensajes.noLeidos }}</span>
        </RouterLink>
        <RouterLink to="/">Volver al portal</RouterLink>
      </nav>
      <button @click="salir">Salir</button>
    </aside>
    <main class="contenido">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useMensajesStore } from '../stores/mensajes.js';

const auth = useAuthStore();
const router = useRouter();
const mensajes = useMensajesStore();

watch(
  () => auth.esAdmin,
  (esAdmin) => {
    if (esAdmin) mensajes.cargar(auth.token);
  },
  { immediate: true }
);

const TODOS = ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'];
const GESTION = ['ADMINISTRADOR', 'RECEPCIONISTA'];

// El backend vuelve a autorizar cada petición; esto solo oculta lo que el rol
// no puede usar y evita pantallas que terminarían en 403.
const menu = [
  { to: '/admin', texto: 'Panel', roles: TODOS },
  { to: '/admin/citas', texto: 'Citas', roles: TODOS },
  { to: '/admin/solicitudes', texto: 'Solicitudes', roles: GESTION },
  { to: '/admin/calendario', texto: 'Calendario', roles: TODOS },
  { to: '/admin/pacientes', texto: 'Pacientes', roles: TODOS },
  { to: '/admin/responsables', texto: 'Responsables', roles: GESTION },
  { to: '/admin/materiales', texto: 'Materiales', roles: TODOS },
  { to: '/admin/profesionales', texto: 'Profesionales', roles: ['ADMINISTRADOR'] },
  { to: '/admin/pagos', texto: 'Pagos', roles: GESTION },
  { to: '/admin/caja', texto: 'Caja', roles: GESTION },
  { to: '/admin/servicios', texto: 'Servicios', roles: ['ADMINISTRADOR'] },
  { to: '/admin/contenidos', texto: 'Contenidos', roles: ['ADMINISTRADOR'] },
  { to: '/admin/mensajes', texto: 'Mensajes', roles: ['ADMINISTRADOR'] },
  { to: '/admin/usuarios', texto: 'Usuarios', roles: ['ADMINISTRADOR'] }
];

const enlaces = computed(() => {
  const rol = auth.usuario?.rol;
  return menu.filter((enlace) => !enlace.roles || enlace.roles.includes(rol));
});

function salir() {
  auth.logout();
  router.push('/login');
}
</script>

<style>
.admin { display: flex; min-height: 100vh; font-family: sans-serif; }
.lateral { width: 220px; background: #222; color: white; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.marca { font-weight: 700; margin: 0; }
.rol { margin: 0; color: #9fd3e8; font-size: 0.8rem; letter-spacing: 0.04em; }
.lateral nav { display: flex; flex-direction: column; gap: 0.15rem; }
.lateral a { color: white; text-decoration: none; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.35rem 0.4rem; border-radius: 4px; }
.lateral a:hover, .lateral a.router-link-exact-active { background: #1a5c8a; }
.badge {
  display: inline-grid;
  place-items: center;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: #e04b51;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
}
.lateral button { margin-top: auto; padding: 0.5rem; cursor: pointer; }
.contenido { flex: 1; padding: 1rem; min-width: 0; }
@media (max-width: 640px) {
  .admin { flex-direction: column; }
  .lateral { width: auto; }
  .lateral nav { flex-direction: row; flex-wrap: wrap; }
}
</style>
