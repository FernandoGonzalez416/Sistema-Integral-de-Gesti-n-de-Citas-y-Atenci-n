<template>
  <article class="pub-card" :class="[`pub-${tipoClase}`, { 'pub-vacia': vacia }]">
    <div class="pub-cabecera">
      <img
        v-if="publicacion?.imagenUrl"
        class="pub-imagen"
        :src="publicacion.imagenUrl"
        alt=""
        loading="lazy"
        draggable="false"
      />
      <div v-else class="pub-ilustracion" aria-hidden="true">
        <!-- Educativo: libro con cruz. Corporativo: edificio clínico con cruz. -->
        <svg v-if="tipoClase === 'educativo'" viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 14c8-3 16-3 24 2v34c-8-5-16-5-24-2z" />
          <path d="M56 14c-8-3-16-3-24 2v34c8-5 16-5 24-2z" />
          <path d="M20 26h6M23 23v6" />
        </svg>
        <svg v-else viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <rect x="12" y="14" width="40" height="40" rx="4" />
          <path d="M32 22v14M25 29h14" />
          <path d="M26 54V44h12v10" />
        </svg>
        <span class="pub-latido"></span>
      </div>
      <span class="pub-etiqueta">{{ tipoClase === 'educativo' ? 'Educativo' : 'Corporativo' }}</span>
    </div>

    <div class="pub-cuerpo">
      <h4>{{ vacia ? 'Próximamente' : publicacion.titulo }}</h4>
      <p>{{ vacia ? textoVacio : publicacion.descripcion }}</p>
      <a
        v-if="!vacia && publicacion.enlace"
        class="pub-enlace"
        :href="publicacion.enlace"
        target="_blank"
        rel="noopener noreferrer"
      >Más información <span aria-hidden="true">→</span></a>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  publicacion: { type: Object, default: null },
  tipo: { type: String, default: 'EDUCATIVO' }, // EDUCATIVO | CORPORATIVO
  vacia: { type: Boolean, default: false } // tarjeta de relleno cuando no hay contenido
});

const tipoClase = computed(() => (props.tipo === 'CORPORATIVO' ? 'corporativo' : 'educativo'));
const textoVacio = computed(() =>
  tipoClase.value === 'educativo'
    ? 'Muy pronto compartiremos contenido educativo en salud.'
    : 'Muy pronto compartiremos noticias y novedades institucionales.'
);
</script>

<style>
.pub-card {
  --acento: #1a5c8a;
  --acento-2: #2a9d9a;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(26, 92, 138, 0.1);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(15, 61, 94, 0.1);
  font-family: sans-serif;
  color: #24323b;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.pub-corporativo { --acento: #0f3d5e; --acento-2: #3b7fc4; }
.pub-card:hover { transform: translateY(-6px); box-shadow: 0 16px 34px rgba(15, 61, 94, 0.18); }

.pub-cabecera {
  position: relative;
  height: 130px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, var(--acento), var(--acento-2));
  overflow: hidden;
}
/* Cruces médicas decorativas */
.pub-cabecera::before,
.pub-cabecera::after {
  content: '';
  position: absolute;
  width: 90px;
  height: 90px;
  opacity: 0.12;
  background:
    linear-gradient(#fff, #fff) center / 28px 90px no-repeat,
    linear-gradient(#fff, #fff) center / 90px 28px no-repeat;
}
.pub-cabecera::before { top: -26px; right: -18px; }
.pub-cabecera::after { bottom: -34px; left: -22px; }

.pub-imagen { width: 100%; height: 100%; object-fit: cover; }
.pub-ilustracion { position: relative; display: flex; align-items: center; justify-content: center; }
.pub-latido {
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  animation: pub-latido 2.4s ease-out infinite;
}

.pub-etiqueta {
  position: absolute;
  top: 10px;
  left: 12px;
  padding: 0.15rem 0.65rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(4px);
}

.pub-cuerpo { display: flex; flex-direction: column; gap: 0.5rem; padding: 1.1rem 1.2rem 1.3rem; flex: 1; }
.pub-cuerpo h4 { margin: 0; font-size: 1.1rem; line-height: 1.3; color: var(--acento); }
.pub-cuerpo p {
  margin: 0;
  font-size: 0.93rem;
  line-height: 1.55;
  color: #4b6475;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pub-enlace {
  margin-top: auto;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--acento-2);
  text-decoration: none;
}
.pub-enlace:hover { text-decoration: underline; }
.pub-vacia .pub-cuerpo h4 { color: #6b8596; }

@keyframes pub-latido {
  0% { transform: scale(0.7); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .pub-card { transition: none; }
  .pub-latido { animation: none; display: none; }
}
</style>
