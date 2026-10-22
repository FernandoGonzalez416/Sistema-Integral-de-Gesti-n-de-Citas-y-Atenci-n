<template>
  <main class="contenedor">
    <div class="cabecera">
      <div>
        <h1>{{ esProfesional ? 'Mis citas' : 'Citas' }}</h1>
        <p class="ayuda">
          {{ esProfesional
            ? 'Consulta tus citas y marca como completadas las que ya atendiste.'
            : 'Crea, reprograma y cambia el estado de las citas. El backend valida horarios, traslapes y transiciones.' }}
        </p>
      </div>
      <button v-if="!esProfesional" class="principal" @click="abrirNueva">+ Nueva cita</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mensaje" class="ok">{{ mensaje }}</p>

    <Card titulo="Filtros">
      <div class="filtros-grid">
        <label class="campo">
          <span>Estado</span>
          <select v-model="filtros.estado" @change="recargar">
            <option value="">Todos</option>
            <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
          </select>
        </label>
        <label class="campo">
          <span>Desde</span>
          <input type="date" v-model="filtros.desde" @change="recargar" />
        </label>
        <label class="campo">
          <span>Hasta</span>
          <input type="date" v-model="filtros.hasta" @change="recargar" />
        </label>
        <label class="campo">
          <span>Paciente</span>
          <select v-model="filtros.paciente" @change="recargar">
            <option value="">Todos</option>
            <option v-for="p in pacientes" :key="p._id" :value="p._id">
              {{ p.nombre }} {{ p.apellido }}
            </option>
          </select>
        </label>
        <label v-if="!esProfesional" class="campo">
          <span>Profesional</span>
          <select v-model="filtros.profesional" @change="recargar">
            <option value="">Todos</option>
            <option v-for="p in profesionales" :key="p._id" :value="p._id">
              {{ p.nombre }} {{ p.apellido }} ({{ p.especialidad }})
            </option>
          </select>
        </label>
        <label class="campo">
          <span>Servicio</span>
          <select v-model="filtros.servicio" @change="recargar">
            <option value="">Todos</option>
            <option v-for="s in servicios" :key="s._id" :value="s._id">{{ s.nombre }}</option>
          </select>
        </label>
      </div>
      <div class="acciones">
        <button class="secundario" @click="limpiarFiltros">Limpiar filtros</button>
        <button class="secundario" @click="recargar">Actualizar</button>
      </div>
    </Card>

    <Card v-if="formAbierto && !esProfesional" :titulo="editando ? 'Reprogramar cita' : 'Nueva cita'">
      <form @submit.prevent="guardar">
        <div class="fila">
          <label class="campo">
            <span>Paciente *</span>
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
              <option v-for="s in servicios" :key="s._id" :value="s._id">
                {{ s.nombre }} — {{ formatoMoneda(s.precioCentavos) }} ({{ s.duracionMinutos }} min)
              </option>
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
            {{ guardando ? 'Guardando…' : (editando ? 'Guardar cambios' : 'Crear cita') }}
          </button>
          <button type="button" class="secundario" @click="cerrarFormulario">Cancelar</button>
        </div>
      </form>
    </Card>

    <Card titulo="Listado de citas">
      <div v-if="cargando">Cargando…</div>
      <table v-else>
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Profesional</th>
            <th>Servicio</th>
            <th>Inicio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in citas" :key="c._id">
            <td>{{ c.paciente?.nombre }} {{ c.paciente?.apellido }}</td>
            <td>{{ c.profesional?.nombre }} {{ c.profesional?.apellido }}</td>
            <td>{{ c.servicio?.nombre }}</td>
            <td>{{ formatearFecha(c.inicio) }}</td>
            <td>
              <span class="badge" :style="{ backgroundColor: colorEstado(c.estado) }">{{ c.estado }}</span>
            </td>
            <td class="acciones-celda">
              <button
                v-if="puedeConfirmar(c)"
                class="mini"
                @click="cambiarEstado(c, 'CONFIRMADA')"
              >Confirmar</button>
              <button
                v-if="puedeCompletar(c)"
                class="mini"
                @click="cambiarEstado(c, 'COMPLETADA')"
              >Completar</button>
              <button
                v-if="puedeEditar(c)"
                class="mini secundario"
                @click="abrirEditar(c)"
              >Reprogramar</button>
              <button
                v-if="puedeCancelar(c)"
                class="mini peligro"
                @click="cambiarEstado(c, 'CANCELADA')"
              >Cancelar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!cargando && citas.length === 0">No hay citas con esos filtros.</p>
      <div class="paginacion" v-if="total > 0">
        <button class="secundario" @click="pagina--" :disabled="pagina === 1">« Anterior</button>
        <span>Página {{ pagina }} de {{ Math.ceil(total / limite) }}</span>
        <button class="secundario" @click="pagina++" :disabled="pagina >= Math.ceil(total / limite)">Siguiente »</button>
      </div>
    </Card>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getCitas, createCita, updateCita, patchEstadoCita,
  getPacientes, getProfesionales, getServicios
} from '../api/client.js';
import { ESTADOS_CITA, COLORES_ESTADO_CITA } from '../constants/sigca.js';
import { formatoMoneda } from '../composables/catalogo.js';
import Card from '../components/Card.vue';

const auth = useAuthStore();
const esProfesional = computed(() => auth.usuario?.rol === 'PROFESIONAL');
const estados = ESTADOS_CITA;

const citas = ref([]);
const pacientes = ref([]);
const profesionales = ref([]);
const servicios = ref([]);
const total = ref(0);
const pagina = ref(1);
const limite = 20;
const cargando = ref(false);
const guardando = ref(false);
const error = ref('');
const mensaje = ref('');

const filtros = reactive({ estado: '', desde: '', hasta: '', paciente: '', profesional: '', servicio: '' });
const formAbierto = ref(false);
const editando = ref(false);
const form = reactive({
  _id: '', pacienteId: '', profesionalId: '', servicioId: '', inicio: '', observaciones: ''
});

function formatearFecha(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es-ES', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

function colorEstado(estado) {
  return COLORES_ESTADO_CITA[estado] || '#1a5c8a';
}

function aInputDatetime(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
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

async function cargar() {
  try {
    error.value = '';
    cargando.value = true;
    const params = { page: pagina.value, limit: limite };
    for (const clave of ['estado', 'desde', 'hasta', 'paciente', 'profesional', 'servicio']) {
      if (filtros[clave]) params[clave] = filtros[clave];
    }
    const datos = await getCitas(auth.token, params);
    citas.value = datos.citas || [];
    total.value = datos.total || 0;
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

async function recargar() {
  pagina.value = 1;
  await cargar();
}

function limpiarFiltros() {
  Object.assign(filtros, { estado: '', desde: '', hasta: '', paciente: '', profesional: '', servicio: '' });
  recargar();
}

function limpiarFormulario() {
  Object.assign(form, {
    _id: '', pacienteId: '', profesionalId: '', servicioId: '', inicio: '', observaciones: ''
  });
  editando.value = false;
}

function abrirNueva() {
  limpiarFormulario();
  formAbierto.value = true;
}

function abrirEditar(c) {
  editando.value = true;
  formAbierto.value = true;
  Object.assign(form, {
    _id: c._id,
    pacienteId: c.paciente?._id || c.paciente || '',
    profesionalId: c.profesional?._id || c.profesional || '',
    servicioId: c.servicio?._id || c.servicio || '',
    inicio: aInputDatetime(c.inicio),
    observaciones: c.observaciones || ''
  });
}

function cerrarFormulario() {
  formAbierto.value = false;
  limpiarFormulario();
}

async function guardar() {
  try {
    error.value = '';
    mensaje.value = '';
    guardando.value = true;
    const datos = {
      pacienteId: form.pacienteId,
      profesionalId: form.profesionalId,
      servicioId: form.servicioId,
      inicio: new Date(form.inicio).toISOString(),
      observaciones: form.observaciones
    };
    if (editando.value) {
      await updateCita(auth.token, form._id, datos);
      mensaje.value = 'Cita reprogramada';
    } else {
      await createCita(auth.token, datos);
      mensaje.value = 'Cita creada';
    }
    cerrarFormulario();
    await cargar();
  } catch (e) {
    error.value = e.message;
  } finally {
    guardando.value = false;
  }
}

async function cambiarEstado(c, estado) {
  if (estado === 'CANCELADA' && !window.confirm('¿Cancelar esta cita? Esta acción es terminal.')) return;
  try {
    error.value = '';
    mensaje.value = '';
    await patchEstadoCita(auth.token, c._id, estado);
    mensaje.value = `Cita actualizada a ${estado}`;
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

function puedeConfirmar(c) {
  return !esProfesional.value && c.estado === 'PENDIENTE';
}

function puedeCompletar(c) {
  return c.estado === 'CONFIRMADA';
}

function puedeEditar(c) {
  return !esProfesional.value && ['PENDIENTE', 'CONFIRMADA'].includes(c.estado);
}

function puedeCancelar(c) {
  return !esProfesional.value && ['PENDIENTE', 'CONFIRMADA'].includes(c.estado);
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

<style scoped>
.contenedor { max-width: 1150px; margin: 2rem auto; font-family: sans-serif; }
.cabecera { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.cabecera h1 { margin-bottom: 0.25rem; }
.ayuda { color: #555; margin-top: 0; }
.error { color: #c0392b; }
.ok { color: #1e7e34; }
.filtros-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.75rem; }
.campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.5rem; }
.campo > span { font-size: 0.85rem; color: #555; }
.campo select, .campo input, .campo textarea { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font: inherit; }
.fila { display: flex; gap: 1rem; }
.fila > * { flex: 1; }
.acciones { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.acciones-celda { display: flex; gap: 0.35rem; flex-wrap: wrap; }
button { padding: 0.45rem 0.8rem; border: 1px solid #1a5c8a; border-radius: 4px; background: #1a5c8a; color: #fff; cursor: pointer; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.principal { background: #1a5c8a; }
.secundario { background: #6c757d; border-color: #6c757d; }
.peligro { background: #c0392b; border-color: #c0392b; }
.mini { padding: 0.3rem 0.55rem; font-size: 0.82rem; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; vertical-align: top; }
.badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; color: #fff; font-size: 0.82rem; }
.paginacion { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1rem; }
@media (max-width: 720px) {
  .cabecera, .fila { flex-direction: column; }
  .cabecera { align-items: stretch; }
}
</style>
