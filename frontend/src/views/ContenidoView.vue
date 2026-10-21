<template>
  <main class="contenido-pagina">
    <header class="contenido-cabecera">
      <RouterLink to="/" class="volver" aria-label="Volver a Inicio" title="Volver a Inicio">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      </RouterLink>
      <h1>Contenido educativo y corporativo</h1>
    </header>

    <!-- Buscador único: filtra ambas secciones a la vez -->
    <div class="buscador" role="search">
      <svg class="buscador-lupa" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        v-model="busqueda"
        type="search"
        placeholder="Buscar en contenido educativo y corporativo…"
        aria-label="Buscar en contenido educativo y corporativo"
        autocomplete="off"
        @keydown.esc="busqueda = ''"
      />
      <button v-if="busqueda" type="button" class="buscador-limpiar" aria-label="Borrar búsqueda" @click="busqueda = ''">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
    <p class="resumen" aria-live="polite">
      <template v-if="termino && cargado">
        {{ educativasFiltradas.length + corporativasFiltradas.length }} resultado(s) para «{{ busqueda.trim() }}»
      </template>
    </p>

    <div class="paneles">
      <PanelTarjetas
        titulo="Educativo"
        tipo="EDUCATIVO"
        :items="educativasFiltradas"
        :mensaje-vacio="mensajeVacio('educativo', educativas.length)"
      />
      <PanelTarjetas
        titulo="Corporativo"
        tipo="CORPORATIVO"
        :items="corporativasFiltradas"
        :mensaje-vacio="mensajeVacio('corporativo', corporativas.length)"
      />
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { getPublicaciones } from '../api/client.js';
import PanelTarjetas from '../components/PanelTarjetas.vue';

const educativas = ref([]);
const corporativas = ref([]);
const cargado = ref(false);
const busqueda = ref('');

// Sin tildes ni mayúsculas, para que "educacion" encuentre "Educación".
function normalizar(t) {
  return String(t || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const termino = computed(() => normalizar(busqueda.value).trim());

function filtrar(lista) {
  if (!termino.value) return lista;
  const palabras = termino.value.split(/\s+/);
  return lista.filter((p) => {
    const texto = normalizar(`${p.titulo} ${p.descripcion}`);
    return palabras.every((w) => texto.includes(w));
  });
}

const educativasFiltradas = computed(() => filtrar(educativas.value));
const corporativasFiltradas = computed(() => filtrar(corporativas.value));

function mensajeVacio(seccion, total) {
  if (!cargado.value) return 'Cargando…';
  if (total > 0 && termino.value) return `Sin resultados en contenido ${seccion} para «${busqueda.value.trim()}».`;
  return `No hay contenido ${seccion} por el momento.`;
}

onMounted(async () => {
  const [edu, corp] = await Promise.allSettled([
    getPublicaciones('EDUCATIVO'),
    getPublicaciones('CORPORATIVO')
  ]);
  educativas.value = edu.status === 'fulfilled' ? edu.value : [];
  corporativas.value = corp.status === 'fulfilled' ? corp.value : [];
  cargado.value = true;
});
</script>

<style scoped>
.contenido-pagina {
  box-sizing: border-box;
  min-height: calc(100vh - var(--nav-h, 64px));
  padding: clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 5vw, 3rem) 3rem;
  font-family: sans-serif;
  color: #24323b;
  background: linear-gradient(180deg, #f2f8fb 0%, #e5f1f5 100%);
}
.contenido-cabecera,
.buscador,
.resumen,
.paneles { max-width: 1300px; margin-left: auto; margin-right: auto; }

.contenido-cabecera { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
.contenido-cabecera h1 {
  margin: 0;
  font-size: clamp(1.4rem, 3vw, 2.1rem);
  color: var(--azul-oscuro, #0f3d5e);
}

.volver {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(135deg, var(--azul, #1a5c8a), var(--turquesa, #2a9d9a));
  box-shadow: 0 6px 16px rgba(26, 92, 138, 0.3);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.volver:hover { transform: translateX(-4px); box-shadow: 0 8px 20px rgba(26, 92, 138, 0.45); }
.volver:focus-visible { outline: 3px solid var(--turquesa, #2a9d9a); outline-offset: 3px; }

/* ---- Buscador ---- */
.buscador {
  position: relative;
  display: flex;
  align-items: center;
}
.buscador-lupa { position: absolute; left: 1rem; color: var(--azul, #1a5c8a); pointer-events: none; }
.buscador input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.85rem 3rem 0.85rem 2.9rem;
  font-size: 1rem;
  font-family: inherit;
  color: #24323b;
  background: #fff;
  border: 2px solid rgba(26, 92, 138, 0.18);
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(15, 61, 94, 0.08);
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
}
.buscador input::-webkit-search-cancel-button { display: none; }
.buscador input:focus {
  outline: none;
  border-color: var(--turquesa, #2a9d9a);
  box-shadow: 0 0 0 4px rgba(42, 157, 154, 0.2), 0 6px 18px rgba(15, 61, 94, 0.08);
}
.buscador-limpiar {
  position: absolute;
  right: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  color: var(--azul, #1a5c8a);
  background: rgba(26, 92, 138, 0.1);
  cursor: pointer;
  transition: background 0.2s;
}
.buscador-limpiar:hover { background: rgba(26, 92, 138, 0.22); }

.resumen { min-height: 1.4rem; margin-top: 0.5rem; margin-bottom: 1rem; font-size: 0.9rem; color: #4b6475; }

.paneles { display: flex; flex-direction: column; gap: 2.25rem; }

@media (prefers-reduced-motion: reduce) {
  .volver, .buscador input { transition: none; }
}
</style>