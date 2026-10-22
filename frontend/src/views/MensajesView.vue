<template>
  <h1>Mensajes de contacto</h1>
  <p v-if="error" class="error" role="alert">{{ error }}</p>

  <div class="barra">
    <label>
      Mostrar
      <select v-model="filtro">
        <option value="">Todos</option>
        <option value="false">No leídos</option>
        <option value="true">Leídos</option>
      </select>
    </label>
    <button type="button" :disabled="cargando" @click="cargar">Actualizar</button>
    <span class="contador" :class="{ pendiente: noLeidos > 0 }">
      {{ noLeidos }} sin leer
    </span>
  </div>

  <p v-if="cargando" class="estado">Cargando mensajes…</p>
  <div v-else-if="!mensajes.length" class="vacio">
    <strong>No hay mensajes para mostrar.</strong>
    <p v-if="filtro">Prueba con otro filtro o revisa todos los mensajes.</p>
    <p v-else>Los mensajes que envíen desde el portal aparecerán aquí.</p>
  </div>

  <ul v-else class="lista">
    <li v-for="m in mensajes" :key="m._id" class="mensaje" :class="{ noleido: !m.leido }">
      <header class="cabecera">
        <strong>{{ m.asunto }}</strong>
        <time :datetime="m.createdAt">{{ fecha(m.createdAt) }}</time>
      </header>
      <p class="datos">
        <span>{{ m.nombre }}</span>
        <a :href="`mailto:${m.email}`">{{ m.email }}</a>
        <a :href="`tel:${String(m.telefono).replace(/[^\d+]/g, '')}`">{{ m.telefono }}</a>
      </p>
      <p class="cuerpo">{{ m.mensaje }}</p>
      <div class="acciones">
        <span class="chip" :class="{ activo: !m.leido }">{{ m.leido ? 'Leído' : 'No leído' }}</span>
        <button type="button" :disabled="ocupado === m._id" @click="marcar(m)">
          {{ ocupado === m._id ? 'Guardando…' : (m.leido ? 'Marcar no leído' : 'Marcar leído') }}
        </button>
      </div>
    </li>
  </ul>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useMensajesStore } from '../stores/mensajes.js';
import { getMensajes, patchMensaje } from '../api/client.js';

const auth = useAuthStore();
const contador = useMensajesStore();
const filtro = ref('');
const mensajes = ref([]);
const noLeidos = ref(0);
const cargando = ref(false);
const error = ref('');
const ocupado = ref('');

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    const datos = await getMensajes(auth.token, filtro.value ? { leido: filtro.value } : {});
    mensajes.value = datos.mensajes || [];
    noLeidos.value = Number(datos.noLeidos) || 0;
    contador.setNoLeidos(noLeidos.value);
  } catch (e) {
    error.value = e.message || 'No se pudieron cargar los mensajes.';
  } finally {
    cargando.value = false;
  }
}

async function marcar(m) {
  ocupado.value = m._id;
  error.value = '';
  try {
    const datos = await patchMensaje(auth.token, m._id, !m.leido);
    m.leido = datos.mensaje.leido;
    await cargar();
  } catch (e) {
    error.value = e.message || 'No se pudo actualizar el mensaje.';
  } finally {
    ocupado.value = '';
  }
}

function fecha(valor) {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

watch(filtro, cargar);
onMounted(cargar);
</script>

<style scoped>
.error { color: #b42318; font-weight: 600; }
.barra {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.barra label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; }
.barra select, .barra button { padding: 0.45rem 0.65rem; }
.contador {
  margin-left: auto;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: #e8f0f4;
  color: #34576b;
  font-size: 0.85rem;
  font-weight: 700;
}
.contador.pendiente { background: #fde8e8; color: #a72f34; }
.estado, .vacio {
  padding: 1.5rem;
  border: 1px dashed #b9cfda;
  border-radius: 12px;
  background: #f8fbfc;
  color: #456a7e;
}
.vacio p { margin: 0.4rem 0 0; }
.lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.85rem; }
.mensaje {
  padding: 1rem;
  border: 1px solid #d8e4ea;
  border-left: 5px solid #c4d5dd;
  border-radius: 12px;
  background: #fff;
}
.mensaje.noleido { border-left-color: #e04b51; background: #fffafa; }
.cabecera { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.4rem 1rem; }
.cabecera strong { font-size: 1.02rem; color: #123b55; }
.cabecera time { font-size: 0.8rem; color: #6b8596; }
.datos { display: flex; flex-wrap: wrap; gap: 0.35rem 1rem; margin: 0.5rem 0; font-size: 0.85rem; color: #5a7a8c; }
.datos a { color: #1a5c8a; }
.cuerpo { margin: 0.5rem 0 0.8rem; line-height: 1.55; white-space: pre-wrap; color: #24323b; }
.acciones { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
.chip {
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: #eef3f5;
  color: #5a7a8c;
  font-size: 0.75rem;
  font-weight: 700;
}
.chip.activo { background: #fde8e8; color: #a72f34; }
.acciones button { padding: 0.4rem 0.7rem; cursor: pointer; }
</style>
