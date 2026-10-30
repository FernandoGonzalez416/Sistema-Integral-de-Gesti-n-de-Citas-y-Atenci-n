<template>
  <main class="contenedor">
    <div class="cab-pagina">
      <div>
        <h1>Solicitudes de cita</h1>
        <p class="ayuda">
          Atiende una solicitud registrando al paciente y la cita, o recházala indicando el motivo.
          Una solicitud solo puede convertirse en una cita.
        </p>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mensaje" class="ok">{{ mensaje }}</p>

    <Card titulo="Filtros">
      <div class="filtros-grid">
        <label class="campo">
          <span>Estado</span>
          <select v-model="filtroEstado" @change="cargar">
            <option value="">Todas</option>
            <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
          </select>
        </label>
      </div>
      <button class="secundario" @click="cargar">Actualizar</button>
    </Card>



    <Card titulo="Bandeja de solicitudes">
      <div v-if="cargando">Cargando…</div>
      <table v-else>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Solicitante</th>
            <th>Servicio</th>
            <th>Preferencia</th>
            <th>Estado</th>
            <th>Cita / motivo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in solicitudes" :key="s._id">
            <td>{{ formatearFecha(s.createdAt) }}</td>
            <td>
              {{ s.nombre }}<br />
              <small>{{ s.telefono }} · {{ s.email }}</small>
            </td>
            <td>{{ s.servicio?.nombre || '—' }}</td>
            <td>
              {{ s.fechaPreferida ? formatearDia(s.fechaPreferida) : 'Sin fecha' }}
              <small v-if="s.franja"> · {{ s.franja }}</small>
            </td>
            <td><span class="badge" :style="{ backgroundColor: colorEstado(s.estado) }">{{ s.estado }}</span></td>
            <td>
              <template v-if="s.citaGenerada">
                Cita {{ s.citaGenerada.estado }}<br />
                <small>{{ formatearFecha(s.citaGenerada.inicio) }}</small>
              </template>
              <template v-else-if="s.motivoRechazo">{{ s.motivoRechazo }}</template>
              <template v-else>—</template>
              <div v-if="s.atendidaPor"><small>Por {{ s.atendidaPor.nombre }}</small></div>
            </td>
            <td class="acciones-celda">
              <template v-if="s.estado === 'PENDIENTE'">
                <button class="mini" @click="abrirAtender(s)">Atender</button>
                <button class="mini peligro" @click="abrirRechazar(s)">Rechazar</button>
              </template>
              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!cargando && solicitudes.length === 0">No hay solicitudes con ese estado.</p>
    </Card>

    <!-- Ventanita: atender solicitud -->
    <AdminModal
      :abierto="!!solicitudActiva && modo === 'atender'"
      titulo="Atender solicitud"
      subtitulo="Registra la cita y la solicitud quedará como atendida."
      icono="inbox"
      ancho="lg"
      :bloquear="guardando"
      @cerrar="cerrar"
    >
      <p v-if="errorModal" class="error" role="alert">{{ errorModal }}</p>
    <p class="resumen">
            <strong>{{ solicitudActiva.nombre }}</strong> · {{ solicitudActiva.telefono }} ·
            {{ solicitudActiva.email }} · {{ solicitudActiva.servicio?.nombre || 'Sin servicio' }}
          </p>
    <form @submit.prevent="atender">
            <div class="fila">
              <label class="campo">
                <span>Paciente registrado *</span>
                <select v-model="form.pacienteId" required>
                  <option value="">Selecciona un paciente</option>
                  <option v-for="p in pacientes" :key="p._id" :value="p._id">
                    {{ p.nombre }} {{ p.apellido }}
                  </option>
                </select>
              </label>
              <label class="campo">
                <span>Profesional *</span>
                <select v-model="form.profesionalId" required>
                  <option value="">Selecciona un profesional</option>
                  <option v-for="p in profesionales" :key="p._id" :value="p._id">
                    {{ p.nombre }} {{ p.apellido }} ({{ p.especialidad }})
                  </option>
                </select>
              </label>
            </div>
            <div class="fila">
              <label class="campo">
                <span>Servicio *</span>
                <select v-model="form.servicioId" required>
                  <option value="">Selecciona un servicio</option>
                  <option v-for="s in servicios" :key="s._id" :value="s._id">{{ s.nombre }}</option>
                </select>
              </label>
              <label class="campo">
                <span>Inicio *</span>
                <input type="datetime-local" v-model="form.inicio" required />
              </label>
            </div>
            <label class="campo">
              <span>Observaciones (opcional)</span>
              <textarea v-model="form.observaciones" rows="2" maxlength="1000"></textarea>
            </label>
            <div class="acciones">
              <button type="submit" class="principal" :disabled="guardando">
                {{ guardando ? 'Atendiendo…' : 'Crear cita y marcar ATENDIDA' }}
              </button>
              <button type="button" class="secundario" @click="cerrar">Cancelar</button>
            </div>
          </form>
    </AdminModal>

    <!-- Ventanita: rechazar solicitud -->
    <AdminModal
      :abierto="!!solicitudActiva && modo === 'rechazar'"
      titulo="Rechazar solicitud"
      subtitulo="Indica el motivo: quedará registrado en la solicitud."
      icono="alert"
      ancho="sm"
      :bloquear="guardando"
      @cerrar="cerrar"
    >
      <p v-if="errorModal" class="error" role="alert">{{ errorModal }}</p>
    <p class="resumen">
            <strong>{{ solicitudActiva.nombre }}</strong> · {{ solicitudActiva.telefono }} ·
            {{ solicitudActiva.email }}
          </p>
    <form @submit.prevent="rechazar">
            <label class="campo">
              <span>Motivo del rechazo *</span>
              <textarea v-model="motivoRechazo" rows="3" maxlength="1000" required
                placeholder="Explica brevemente por qué no se puede atender"></textarea>
            </label>
            <div class="acciones">
              <button type="submit" class="peligro" :disabled="guardando">
                {{ guardando ? 'Rechazando…' : 'Rechazar solicitud' }}
              </button>
              <button type="button" class="secundario" @click="cerrar">Cancelar</button>
            </div>
          </form>
    </AdminModal>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getSolicitudes, atenderSolicitud, rechazarSolicitud,
  getPacientes, getProfesionales, getServicios
} from '../api/client.js';
import { ESTADOS_SOLICITUD } from '../constants/sigca.js';
import Card from '../components/Card.vue';
import AdminModal from '../components/AdminModal.vue';
import Icono from '../components/Icono.vue';

const auth = useAuthStore();
const estados = ESTADOS_SOLICITUD;
const solicitudes = ref([]);
const pacientes = ref([]);
const profesionales = ref([]);
const servicios = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const error = ref('');
const mensaje = ref('');
const errorModal = ref('');
const filtroEstado = ref('PENDIENTE');

const solicitudActiva = ref(null);
const modo = ref('');
const motivoRechazo = ref('');
const form = reactive({ pacienteId: '', profesionalId: '', servicioId: '', inicio: '', observaciones: '' });

const COLORES = {
  PENDIENTE: '#e6a23c',
  ATENDIDA: '#2ecc71',
  RECHAZADA: '#e74c3c'
};

function colorEstado(estado) {
  return COLORES[estado] || '#1a5c8a';
}

function formatearFecha(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es-ES', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

function formatearDia(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function aInputDatetime(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

async function cargar() {
  try {
    error.value = '';
    cargando.value = true;
    const params = {};
    if (filtroEstado.value) params.estado = filtroEstado.value;
    const datos = await getSolicitudes(auth.token, params);
    solicitudes.value = datos.solicitudes || [];
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

async function cargarCatalogos() {
  const [pacs, profs] = await Promise.all([
    getPacientes(auth.token, { limit: 500, activo: 'true' }),
    getProfesionales(auth.token, { limit: 500, activo: 'true' })
  ]);
  pacientes.value = pacs.pacientes || [];
  profesionales.value = profs.profesionales || [];
  servicios.value = await getServicios();
}

function abrirAtender(s) {
  errorModal.value = '';
  solicitudActiva.value = s;
  modo.value = 'atender';
  motivoRechazo.value = '';
  Object.assign(form, {
    pacienteId: '',
    profesionalId: '',
    servicioId: s.servicio?._id || s.servicio || '',
    inicio: aInputDatetime(s.fechaPreferida),
    observaciones: ''
  });
}

function abrirRechazar(s) {
  errorModal.value = '';
  solicitudActiva.value = s;
  modo.value = 'rechazar';
  motivoRechazo.value = '';
}

function cerrar() {
  if (guardando.value) return;
  errorModal.value = '';
  solicitudActiva.value = null;
  modo.value = '';
  motivoRechazo.value = '';
}

async function atender() {
  try {
    error.value = '';
    errorModal.value = '';
    mensaje.value = '';
    guardando.value = true;
    await atenderSolicitud(auth.token, solicitudActiva.value._id, {
      pacienteId: form.pacienteId,
      profesionalId: form.profesionalId,
      servicioId: form.servicioId || undefined,
      inicio: new Date(form.inicio).toISOString(),
      observaciones: form.observaciones
    });
    mensaje.value = 'Solicitud atendida y cita creada';
    guardando.value = false;
    cerrar();
    await cargar();
  } catch (e) {
    errorModal.value = e.message;
  } finally {
    guardando.value = false;
  }
}

async function rechazar() {
  try {
    error.value = '';
    errorModal.value = '';
    mensaje.value = '';
    guardando.value = true;
    await rechazarSolicitud(auth.token, solicitudActiva.value._id, motivoRechazo.value);
    mensaje.value = 'Solicitud rechazada';
    guardando.value = false;
    cerrar();
    await cargar();
  } catch (e) {
    errorModal.value = e.message;
  } finally {
    guardando.value = false;
  }
}

onMounted(async () => {
  try {
    await cargarCatalogos();
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
});
</script>
