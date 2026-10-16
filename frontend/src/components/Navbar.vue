<template>
  <header class="navbar">
    <RouterLink to="/" class="marca">SIGCA</RouterLink>
    <button class="menu-btn" @click="abierto = !abierto" aria-label="Abrir menú">☰</button>
    <nav :class="{ abierto }">
      <RouterLink to="/" @click="abierto = false">Inicio</RouterLink>
      <RouterLink to="/servicios" @click="abierto = false">Servicios</RouterLink>
      <RouterLink to="/horarios" @click="abierto = false">Horarios</RouterLink>
      <RouterLink to="/contacto" @click="abierto = false">Contacto</RouterLink>
      <RouterLink to="/solicitar-cita" @click="abierto = false">Solicitar cita</RouterLink>
      <RouterLink to="/educativo" @click="abierto = false">Educativo</RouterLink>
      <RouterLink to="/admin" @click="abierto = false">Administración</RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue';

const abierto = ref(false);
</script>

<style>
.navbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem; background: #1a5c8a; color: white;
}
.navbar a { color: white; text-decoration: none; margin-right: 1rem; }
.marca { font-weight: bold; font-size: 1.2rem; }
.menu-btn { display: none; background: none; border: none; color: white; font-size: 1.5rem; }
@media (max-width: 640px) {
  .menu-btn { display: block; }
  .navbar nav { display: none; flex-direction: column; gap: 0.5rem; }
  .navbar nav.abierto { display: flex; }
}
</style>
