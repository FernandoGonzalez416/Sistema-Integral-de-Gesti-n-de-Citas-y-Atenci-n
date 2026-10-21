<template>
  <div class="publico">
    <Navbar />
    <div class="publico-contenido">
      <RouterView />
    </div>
    <Footer />
    <ContactoModal />
    <CitaModal />
  </div>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import ContactoModal from '../components/ContactoModal.vue';
import CitaModal from '../components/CitaModal.vue';
</script>

<style>
:root {
  --nav-h: 64px;
  --pie-h: 64px;
  --azul: #1a5c8a;
  --azul-oscuro: #0f3d5e;
  --turquesa: #2a9d9a;
}

/* Menú y pie son fijos: se reserva su espacio para no tapar contenido. */
.publico {
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  padding-top: var(--nav-h);
  padding-bottom: var(--pie-h);
}

/* Estilos globales usados por varias vistas públicas (Contacto, Solicitar cita…). */
.ok { color: green; }
.error { color: red; }
</style>