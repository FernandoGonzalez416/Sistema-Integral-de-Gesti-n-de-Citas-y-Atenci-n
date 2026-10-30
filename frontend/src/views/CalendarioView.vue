<template>
  <main class="contenedor">
    <div class="cab-pagina">
      <div>
        <h1>Calendario de citas</h1>
        <p class="ayuda">Toca una cita para ver su detalle.</p>
      </div>
    </div>
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
            <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
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
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </Card>

    <!-- Ventanita con el detalle de la cita -->
    <AdminModal
      :abierto="!!citaSeleccionada"
      titulo="Detalle de la cita"
      icono="calendar"
      ancho="sm"
      @cerrar="cerrarModal"
    >
      <template v-if="citaSeleccionada">
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
      </template>
      <template #pie>
        <button type="button" class="secundario" @click="cerrarModal">Cerrar</button>
      </template>
    </AdminModal>
  </main>
</template>

<script setup>
import { ref, onActivated, onBeforeUnmount } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { getCitas, getCita, getProfesionales } from '../api/client.js';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import Card from '../components/Card.vue';
import AdminModal from '../components/AdminModal.vue';
import { ESTADOS_CITA, COLORES_ESTADO_CITA } from '../constants/sigca.js';

const auth = useAuthStore();
const error = ref('');
const calendarRef = ref(null);
// Evita responderle al calendario cuando ya se salió de la pantalla (cambios rápidos de opción).
let activo = true;
const citaSeleccionada = ref(null);

const filtroProfesional = ref('');
const filtroEstado = ref('');
const filtroDesde = ref('');
const filtroHasta = ref('');

const profesionales = ref([]);
const estados = ESTADOS_CITA;
const coloresEstados = COLORES_ESTADO_CITA;

const initialView = 'dayGridMonth';
const headerToolbar = {
  left: 'prev,next today',
  center: 'title',
  right: 'dayGridMonth,dayGridWeek,dayGridDay'
};

// @fullcalendar/vue3 recibe TODAS las opciones en un único prop `options`.
// Pasarlas como props sueltas (initialView, plugins, events...) las ignoraba.
const calendarOptions = {
  plugins: [dayGridPlugin, interactionPlugin],
  initialView,
  events: cargarEventos,
  eventClick: verDetalle,
  locale: esLocale,
  height: 'auto',
  headerToolbar,
  weekends: true,
  dayMaxEventRows: 3,
  eventDisplay: 'block'
};

async function cargarProfesionales() {
  try {
    const datos = await getProfesionales(auth.token, { activo: 'true' });
    if (!activo) return;
    profesionales.value = datos.profesionales || [];
  } catch (e) {
    if (activo) error.value = e.message;
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
    if (!activo) return;
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
    if (!activo) return;
    error.value = e.message;
    failureCallback(e);
  }
}

function recargar() {
  if (activo && calendarRef.value?.getApi) {
    calendarRef.value.getApi().refetchEvents();
  }
}

// El calendario se conserva en memoria al cambiar de opción: al volver se refrescan los datos y el tamaño.
let primeraVez = true;
onActivated(() => {
  if (primeraVez) { primeraVez = false; return; }
  const api = calendarRef.value?.getApi?.();
  if (!api) return;
  api.updateSize();
  api.refetchEvents();
});

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

onBeforeUnmount(() => {
  activo = false;
});

// Cargar profesionales al montar
cargarProfesionales();
</script>
