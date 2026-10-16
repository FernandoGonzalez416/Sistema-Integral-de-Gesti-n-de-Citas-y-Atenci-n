<template>
  <div class="admin">
    <aside class="lateral">
      <p class="marca">SIGCA Admin</p>
      <nav>
        <RouterLink to="/admin">Panel</RouterLink>
        <RouterLink to="/admin/usuarios">Usuarios</RouterLink>
        <RouterLink to="/admin/servicios">Servicios</RouterLink>
        <RouterLink to="/admin/contenidos">Contenidos</RouterLink>
        <RouterLink to="/admin/pacientes">Pacientes</RouterLink>
        <RouterLink to="/admin/responsables">Responsables</RouterLink>
        <RouterLink to="/admin/materiales">Materiales</RouterLink>
        <RouterLink to="/admin/pagos">Pagos</RouterLink>
        <RouterLink to="/admin/caja">Caja</RouterLink>
        <RouterLink to="/admin/calendario">Calendario</RouterLink>
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
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();

function salir() {
  auth.logout();
  router.push('/login');
}
</script>

<style>
.admin { display: flex; min-height: 100vh; font-family: sans-serif; }
.lateral { width: 200px; background: #222; color: white; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.lateral a { color: white; text-decoration: none; display: block; margin-bottom: 0.5rem; }
.contenido { flex: 1; padding: 1rem; }
@media (max-width: 640px) {
  .admin { flex-direction: column; }
  .lateral { width: auto; }
}
</style>
