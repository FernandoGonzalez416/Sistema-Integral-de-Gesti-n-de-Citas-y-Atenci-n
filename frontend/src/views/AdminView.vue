<template>
  <h1>Panel de gestión</h1>
  <p>
    Bienvenido/a, <strong>{{ auth.usuario?.nombre }}</strong>.
    <span v-if="auth.esProfesional">Desde aquí puedes consultar tus citas y los pacientes que atiendes.</span>
    <span v-else>Gestiona la agenda, las solicitudes y la operación diaria del centro.</span>
  </p>

  <Card titulo="Accesos rápidos">
    <ul class="accesos">
      <li v-for="enlace in enlaces" :key="enlace.to">
        <RouterLink :to="enlace.to">{{ enlace.texto }}</RouterLink>
      </li>
    </ul>
  </Card>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import Card from '../components/Card.vue';

const auth = useAuthStore();
const TODOS = ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'];
const GESTION = ['ADMINISTRADOR', 'RECEPCIONISTA'];

const menu = [
  { to: '/admin/citas', texto: 'Citas', roles: TODOS },
  { to: '/admin/solicitudes', texto: 'Solicitudes de cita', roles: GESTION },
  { to: '/admin/calendario', texto: 'Calendario', roles: TODOS },
  { to: '/admin/pacientes', texto: 'Pacientes', roles: TODOS },
  { to: '/admin/materiales', texto: 'Materiales educativos', roles: TODOS },
  { to: '/admin/pagos', texto: 'Pagos', roles: GESTION },
  { to: '/admin/caja', texto: 'Caja', roles: GESTION },
  { to: '/admin/profesionales', texto: 'Profesionales', roles: ['ADMINISTRADOR'] },
  { to: '/admin/usuarios', texto: 'Usuarios', roles: ['ADMINISTRADOR'] }
];

const enlaces = computed(() => {
  const rol = auth.usuario?.rol;
  return menu.filter((e) => e.roles.includes(rol));
});
</script>

<style scoped>
.accesos { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; }
.accesos a { display: block; padding: 0.75rem; background: #f4f7fa; border-radius: 6px; text-decoration: none; color: #1a5c8a; }
.accesos a:hover { background: #e3edf5; }
</style>
