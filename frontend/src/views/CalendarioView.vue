<template>
  <main class="contenedor">
    <h1>Calendario de citas</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <!-- Filtros -->
    <Card titulo="Filtros">
      <div class="filtros-grid">
        <div class="campo">
          <label>Profesional</label>
          <select v-model="filtroProfesional" @change="recargar">
            <option value="">Todos</option>
            <option v-for="p in profesionales" :key="p._id" :value="p._id">
              {{ p.nombre }} {{ p.apellido }} ({{ p.especialidad }})
            </option>
          </select>
        </div>
        <div class="campo">
          <label>Estado</label>
          <select v-model="filtroEstado" @change="recargar">
            <option value="">Todos</option>
            <option value="PROGRAMADA">PROGRAMADA</option>
            <option value="CONFIRMADA">CONFIRMADA</option>
            <option value="REPROGRAMADA">REPROGRAMADA</option>
            <option value="CANCELADA">CANCELADA</option>
            <option value="COMPLETADA">COMPLETADA</option>
            <option value="NO_ASISTIO">NO_ASISTIO</option>
          </select>
        </div>
        <div class="campo">
          <label>Desde</label>
          <input type="date" v-model="filtroDesde" @change="recargar" />
        </div>
        <div class="campo">
          <label>Hasta</label>
          <input type="date" v-model="filtroHasta" @change="recargar" />
        </div>
      </div>
    </Card>

    <!-- Leyenda de estados -->
    <Card titulo="Leyenda de estados">
      <div class="leyenda">
        <span class="leyenda-item" v-for="(color, estado) in coloresEstados" :key="estado">
          <span class="leyenda-color" :style="{ backgroundColor: color }"></span>
          {{ estado }}
        </span>
      </div>
    </Card>

    <!-- Calendario -->
    <Card>
      <FullCalendar
        ref="calendarRef"
        :initialView="initialView"
        :events="cargarEventos"
        :eventClick="verDetalle"
        :locale="'es'"
        :height="600"
        :headerToolbar="headerToolbar"
        :weekends="true"
        :dayMaxEventRows="3"
        :eventDisplay="'block'"
      />
    </Card>

    <!-- Modal de detalle -->
    <div v-if="citaSeleccionada" class="modal-overlay" @click="cerrarModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Detalle de la cita</h2>
          <button class="btn-cerrar" @click="cerrarModal">&times;</button>
        </div>
        <div class="modal-body">
          <dl>
            <dt>Paciente</dt>
            <dd>{{ citaSeleccionada.paciente?.nombre }} {{ citaSeleccionada.paciente?.apellido }}</dd>

            <dt>Profesional</dt>
            <dd>{{ citaSeleccionada.profesional?.nombre }} {{ citaSeleccionada.profesional?.apellido }} ({{ citaSeleccionada.profesional?.especialidad }})</dd>

            <dt>Servicio</dt>
            <dd>{{ citaSeleccionada.servicio?.nombre }}</dd>

            <dt>Inicio</dt>
            <dd>{{ formatearFecha(citaSeleccionada.inicio) }}</dd>

            <dt>Fin</dt>
            <dd>{{ formatearFecha(citaSeleccionada.fin) }}</dd>

            <dt>Estado</dt>
            <dd>
              <span class="badge" :style="{ backgroundColor: colorPorEstado(citaSeleccionada.estado) }">
                {{ citaSeleccionada.estado }}
              </span>
            </dd>

            <dt>Observaciones</dt>
            <dd>{{ citaSeleccionada.observaciones || '—' }}</dd>
          </dl>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="cerrarModal">Cerrar</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { getCitas, getCita, getProfesionales } from '../api/client.js';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import Card from '../components/Card.vue';

const auth = useAuthStore();
const error = ref('');
const calendarRef = ref(null);
const citaSeleccionada = ref(null);

const filtroProfesional = ref('');
const filtroEstado = ref('');
const filtroDesde = ref('');
const filtroHasta = ref('');

const profesionales = ref([]);
const coloresEstados = {
  PROGRAMADA: '#3498db',
  CONFIRMADA: '#2ecc71',
  REPROGRAMADA: '#f39c12',
  CANCELADA: '#e74c3c',
  COMPLETADA: '#9b59b6',
  NO_ASISTIO: '#95a5a6'
};

const initialView = 'dayGridMonth';
const headerToolbar = {
  left: 'prev,next today',
  center: 'title',
  right: 'dayGridMonth,dayGridWeek,dayGridDay'
};

async function cargarProfesionales() {
  try {
    const datos = await getProfesionales(auth.token, { activo: 'true' });
    profesionales.value = datos.profesionales || [];
  } catch (e) {
    error.value = e.message;
  }
}

function paramsFiltrados() {
  const params = { limit: 500 };
  if (filtroProfesional.value) params.profesional = filtroProfesional.value;
  if (filtroEstado.value) params.estado = filtroEstado.value;
  if (filtroDesde.value) params.desde = filtroDesde.value;
  if (filtroHasta.value) params.hasta = filtroHasta.value;
  return params;
}

async function cargarEventos(info, successCallback, failureCallback) {
  try {
    const params = paramsFiltrados();
    params.desde = info.startStr;
    params.hasta = info.endStr;
    const datos = await getCitas(auth.token, params);
    const eventos = datos.citas.map(c => ({
      id: c._id,
      title: `${c.paciente?.nombre || ''} ${c.paciente?.apellido || ''} — ${c.servicio?.nombre || c.servicio}`,
      start: c.inicio,
      end: c.fin,
      extendedProps: {
        paciente: c.paciente,
        profesional: c.profesional,
        servicio: c.servicio,
        estado: c.estado,
        observaciones: c.observaciones
      },
      backgroundColor: colorPorEstado(c.estado),
      borderColor: colorPorEstado(c.estado)
    }));
    successCallback(eventos);
  } catch (e) {
    error.value = e.message;
    failureCallback(e);
  }
}

function recargar() {
  if (calendarRef.value?.getApi) {
    calendarRef.value.getApi().refetchEvents();
  }
}

function colorPorEstado(estado) {
  return coloresEstados[estado] || '#1a5c8a';
}

async function verDetalle(info) {
  try {
    const datos = await getCita(auth.token, info.event.id);
    citaSeleccionada.value = datos.cita;
  } catch (e) {
    error.value = e.message;
  }
}

function cerrarModal() {
  citaSeleccionada.value = null;
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

onUnmounted(() => {
  // cleanup
});

// Cargar profesionales al montar
cargarProfesionales();
</script>

<style scoped>
.contenedor { max-width: 1100px; margin: 2rem auto; font-family: sans-serif; }
.error { color: red; margin-bottom: 1rem; }

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}
.campo { display: flex; flex-direction: column; gap: 0.25rem; }
.campo label { font-size: 0.85rem; color: #555; }
.campo select, .campo input { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }

.leyenda { display: flex; flex-wrap: wrap; gap: 1rem; }
.leyenda-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.leyenda-color { width: 16px; height: 16px; border-radius: 3px; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.modal-header h2 { margin: 0; }
.btn-cerrar { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
.modal-body dl { display: grid; grid-template-columns: 120px 1fr; gap: 0.5rem 1rem; margin: 0; }
.modal-body dt { font-weight: bold; color: #444; }
.modal-body dd { margin: 0; }
.badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; color: white; font-size: 0.85rem; }
.modal-footer { display: flex; justify-content: flex-end; margin-top: 1.5rem; }
.btn { padding: 0.5rem 1rem; background: #1a5c8a; color: white; border: none; border-radius: 4px; cursor: pointer; }
.btn:hover { background: #154a70; }
</style>