<template>
  <main class="contenedor">
    <p class="volver"><RouterLink to="/admin/pacientes">← Volver a pacientes</RouterLink></p>
    <h1>Historial de {{ paciente.nombre }} {{ paciente.apellido }}</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <Card titulo="Datos del paciente">
      <div v-if="cargando">Cargando…</div>
      <template v-else>
        <div class="datos">
          <span class="dato"><strong>Edad:</strong> {{ paciente.edad ?? '—' }} años</span>
          <span class="dato"><strong>Teléfono:</strong> {{ paciente.telefono || '—' }}</span>
          <span class="dato"><strong>Estado:</strong>
            <span class="badge" :class="paciente.activo ? 'activo' : 'inactivo'">
              {{ paciente.activo ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          </span>
          <span v-if="!esProfesional" class="dato"><strong>Email:</strong> {{ paciente.email || '—' }}</span>
          <span v-if="!esProfesional" class="dato"><strong>Dirección:</strong> {{ paciente.direccion || '—' }}</span>
          <span v-if="!esProfesional" class="dato"><strong>Inicio del proceso:</strong> {{ formatearFechaCorta(paciente.fechaInicioProceso) }}</span>
        </div>
        <p v-if="!esProfesional && paciente.observacionesAdministrativas" class="observaciones">
          <strong>Observaciones:</strong> {{ paciente.observacionesAdministrativas }}
        </p>
      </template>
      <p class="enlaces">
        <RouterLink v-if="!esProfesional" :to="`/admin/pacientes/${pacienteId}/responsables`">Responsables</RouterLink>
        <RouterLink :to="`/admin/pacientes/${pacienteId}/materiales`">Materiales</RouterLink>
      </p>
    </Card>

    <div class="resumen">
      <div class="stat"><span class="numero">{{ resumen.totalCitas }}</span><span class="etiqueta">Citas</span></div>
      <div class="stat"><span class="numero">{{ resumen.completadas }}</span><span class="etiqueta">Completadas</span></div>
      <div class="stat"><span class="numero">{{ resumen.canceladas }}</span><span class="etiqueta">Canceladas</span></div>
      <template v-if="!esProfesional">
        <div class="stat"><span class="numero">{{ formatearMonto(resumen.pagado) }}</span><span class="etiqueta">Pagado</span></div>
        <div class="stat" :class="{ alerta: resumen.saldo > 0 }">
          <span class="numero">{{ formatearMonto(resumen.saldo) }}</span><span class="etiqueta">Saldo pendiente</span>
        </div>
      </template>
    </div>

    <Card titulo="Citas del paciente">
      <div v-if="cargando">Cargando…</div>
      <div v-else class="tabla-scroll">
        <table v-if="citas.length">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Servicio</th>
              <th>Profesional</th>
              <th>Estado</th>
              <th v-if="!esProfesional">Precio</th>
              <th v-if="!esProfesional">Pagado</th>
              <th v-if="!esProfesional">Saldo</th>
              <th v-if="!esProfesional">Estado financiero</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in citas" :key="c._id">
              <td>{{ formatearFechaHora(c.inicio) }}</td>
              <td>{{ c.servicio?.nombre || '—' }}</td>
              <td>{{ c.profesional?.nombre }} {{ c.profesional?.apellido }}</td>
              <td><span class="badge" :class="'cita-' + c.estado">{{ c.estado }}</span></td>
              <template v-if="!esProfesional">
                <td>{{ formatearMonto(c.precioCentavos) }}</td>
                <td>{{ formatearMonto(saldoDe(c).pagado) }}</td>
                <td>{{ formatearMonto(saldoDe(c).saldo) }}</td>
                <td><span class="badge" :class="'fin-' + saldoDe(c).estado">{{ saldoDe(c).estado }}</span></td>
              </template>
            </tr>
          </tbody>
        </table>
        <p v-else>Este paciente no tiene citas registradas.</p>
      </div>
    </Card>

    <Card v-if="!esProfesional" titulo="Pagos del paciente">
      <div v-if="cargando">Cargando…</div>
      <div v-else class="tabla-scroll">
        <table v-if="pagos.length">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cita</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Comprobante</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pagos" :key="p._id">
              <td class="ahora">{{ formatearFechaHora(p.fecha) }}</td>
              <td>{{ servicioDeCita(p) }}</td>
              <td class="ahora">{{ formatearMonto(p.montoCentavos) }}</td>
              <td>{{ p.metodo }}</td>
              <td>
                <span class="badge" :class="p.estado === 'REGISTRADO' ? 'fin-PAGADO' : 'cita-CANCELADA'">{{ p.estado }}</span>
                <span v-if="p.motivoAnulacion" class="motivo"> · {{ p.motivoAnulacion }}</span>
              </td>
              <td class="ahora">{{ p.numeroComprobante || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>Este paciente no tiene pagos registrados.</p>
      </div>
    </Card>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { getPaciente, getCitas, getPagos } from '../api/client.js';
import Card from '../components/Card.vue';

const route = useRoute();
const auth = useAuthStore();

const pacienteId = route.params.pacienteId;
const esProfesional = computed(() => auth.esProfesional);

const paciente = ref({ nombre: '', apellido: '', edad: null, activo: true });
const citas = ref([]);
const pagos = ref([]);
const cargando = ref(false);
const error = ref('');

const LIMITE = 200;

function formatearMonto(centavos) {
  const monto = (Number(centavos || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `Q${monto}`;
}

function formatearFechaHora(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function formatearFechaCorta(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// Total pagado por cita con pagos válidos (REGISTRADO); mismo criterio que
// backend/src/utils/saldo.js para el estado financiero.
const pagosPorCita = computed(() => {
  const mapa = new Map();
  for (const p of pagos.value) {
    if (p.estado !== 'REGISTRADO') continue;
    const id = String(p.cita?._id || p.cita);
    mapa.set(id, (mapa.get(id) || 0) + Number(p.montoCentavos || 0));
  }
  return mapa;
});

function saldoDe(cita) {
  const pagado = pagosPorCita.value.get(String(cita._id)) || 0;
  const precio = Number(cita.precioCentavos || 0);
  const saldo = Math.max(precio - pagado, 0);
  let estado = 'PENDIENTE';
  if (precio === 0 || pagado >= precio) estado = 'PAGADO';
  else if (pagado > 0) estado = 'PARCIAL';
  return { pagado, saldo, estado };
}

const resumen = computed(() => {
  const totalCitas = citas.value.length;
  const completadas = citas.value.filter((c) => c.estado === 'COMPLETADA').length;
  const canceladas = citas.value.filter((c) => c.estado === 'CANCELADA').length;
  let pagado = 0;
  let saldo = 0;
  if (!esProfesional.value) {
    pagado = pagos.value
      .filter((p) => p.estado === 'REGISTRADO')
      .reduce((acc, p) => acc + Number(p.montoCentavos || 0), 0);
    // Una cita cancelada no genera deuda (RN-27 exige anular sus pagos).
    for (const c of citas.value) {
      if (c.estado !== 'CANCELADA') saldo += saldoDe(c).saldo;
    }
  }
  return { totalCitas, completadas, canceladas, pagado, saldo };
});

function servicioDeCita(pago) {
  const id = String(pago.cita?._id || pago.cita);
  const cita = citas.value.find((c) => String(c._id) === id);
  if (!cita) return formatearFechaCorta(pago.cita?.inicio);
  return `${cita.servicio?.nombre || 'Cita'} · ${formatearFechaCorta(cita.inicio)}`;
}

async function cargar() {
  try {
    error.value = '';
    cargando.value = true;
    const pac = await getPaciente(auth.token, pacienteId).then((d) => d.paciente);
    paciente.value = pac || { nombre: '', apellido: '', edad: null, activo: true };

    const citasDatos = await getCitas(auth.token, { paciente: pacienteId, limit: LIMITE });
    citas.value = citasDatos.citas || [];

    if (!esProfesional.value) {
      const pagosDatos = await getPagos(auth.token, { paciente: pacienteId, limit: LIMITE });
      pagos.value = pagosDatos.pagos || [];
    } else {
      pagos.value = [];
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

onMounted(cargar);
</script>

<style scoped>
.contenedor { max-width: 1100px; margin: 2rem auto; font-family: sans-serif; }
.error { color: red; }
.volver { margin: 0 0 0.5rem; }
.datos { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.dato { background: #f2f2f2; padding: 0.4rem 0.7rem; border-radius: 4px; }
.observaciones { margin: 0.75rem 0 0; }
.enlaces { display: flex; gap: 1rem; margin: 0.75rem 0 0; }
.resumen { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; }
.stat { flex: 1; min-width: 130px; border: 1px solid #ccc; border-radius: 8px; padding: 0.75rem 1rem; }
.stat.alerta { border-color: #e67e22; background: #fff7ec; }
.numero { display: block; font-size: 1.35rem; font-weight: 700; }
.etiqueta { color: #555; font-size: 0.85rem; }
.tabla-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; }
td.ahora, th { white-space: nowrap; }
.badge { padding: 0.2rem 0.55rem; border-radius: 12px; color: #fff; font-size: 0.78rem; }
.activo, .fin-PAGADO, .cita-CONFIRMADA { background: #27ae60; }
.inactivo, .cita-CANCELADA { background: #c0392b; }
.cita-PENDIENTE, .fin-PARCIAL { background: #e67e22; }
.cita-COMPLETADA { background: #8e44ad; }
.fin-PENDIENTE { background: #c0392b; }
.motivo { color: #777; font-size: 0.85rem; }
</style>
