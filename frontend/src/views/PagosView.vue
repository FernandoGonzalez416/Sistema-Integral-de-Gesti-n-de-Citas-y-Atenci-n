<template>
  <main class="contenedor">
    <h1>Pagos y saldos</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mensaje" class="ok">{{ mensaje }}</p>

    <Card titulo="Buscar citas">
      <div class="fila">
        <label class="campo">
          <span>Estado</span>
          <select v-model="filtroEstado">
            <option value="">Todos</option>
            <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
          </select>
        </label>
        <FormField etiqueta="Desde" type="date" v-model="filtroDesde" />
        <FormField etiqueta="Hasta" type="date" v-model="filtroHasta" />
      </div>
      <button @click="cargarCitas">Buscar</button>
    </Card>

    <Card titulo="Citas">
      <div v-if="cargandoCitas">Cargando…</div>
      <table v-else>
        <thead>
          <tr><th>Paciente</th><th>Servicio</th><th>Inicio</th><th>Precio</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="c in citas" :key="c._id" :class="{ seleccionada: citaSeleccionada && citaSeleccionada._id === c._id }">
            <td>{{ c.paciente?.nombre }} {{ c.paciente?.apellido }}</td>
            <td>{{ c.servicio?.nombre }}</td>
            <td>{{ formatearFecha(c.inicio) }}</td>
            <td>{{ formatearMonto(c.precioCentavos) }}</td>
            <td>{{ c.estado }}</td>
            <td><button @click="seleccionar(c)">Ver / cobrar</button></td>
          </tr>
        </tbody>
      </table>
      <p v-if="citas.length === 0">No hay citas.</p>
      <div class="paginacion" v-if="totalCitas > 0">
        <button @click="pagina--" :disabled="pagina === 1">« Anterior</button>
        <span>Página {{ pagina }} de {{ Math.ceil(totalCitas / limite) }}</span>
        <button @click="pagina++" :disabled="pagina >= Math.ceil(totalCitas / limite)">Siguiente »</button>
      </div>
    </Card>

    <template v-if="citaSeleccionada">
      <Card titulo="Saldo de la cita">
        <p><strong>Paciente:</strong> {{ citaSeleccionada.paciente?.nombre }} {{ citaSeleccionada.paciente?.apellido }}</p>
        <p><strong>Servicio:</strong> {{ citaSeleccionada.servicio?.nombre }} · {{ formatearFecha(citaSeleccionada.inicio) }}</p>
        <div class="saldo" v-if="saldo">
          <span class="dato">Precio: {{ formatearMonto(saldo.precioCentavos) }}</span>
          <span class="dato">Pagado: {{ formatearMonto(saldo.pagadoCentavos) }}</span>
          <span class="dato">Saldo: {{ formatearMonto(saldo.saldoCentavos) }}</span>
          <span class="badge" :class="'estado-' + saldo.estadoSaldo">{{ saldo.estadoSaldo }}</span>
        </div>
      </Card>

      <Card titulo="Registrar pago">
        <form @submit.prevent="registrarPago">
          <div class="fila">
            <FormField etiqueta="Monto" type="number" v-model="form.monto" placeholder="0.00" />
            <label class="campo">
              <span>Método</span>
              <select v-model="form.metodo">
                <option v-for="m in metodos" :key="m" :value="m">{{ m }}</option>
              </select>
            </label>
          </div>
          <FormField etiqueta="Notas (opcional)" v-model="form.notas" placeholder="Seña, saldo, etc." />
          <button type="submit" :disabled="!puedePagar">Registrar pago</button>
          <p class="ayuda" v-if="saldo && saldo.estadoSaldo === 'PAGADO'">La cita ya está pagada.</p>
        </form>
      </Card>

      <Card titulo="Pagos de la cita">
        <div v-if="cargandoPagos">Cargando…</div>
        <table v-else>
          <thead>
            <tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Estado</th><th>Notas</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="p in pagos" :key="p._id">
              <td>{{ formatearFecha(p.fecha) }}</td>
              <td>{{ formatearMonto(p.montoCentavos) }}</td>
              <td>{{ p.metodo }}</td>
              <td>{{ p.estado }}<span v-if="p.motivoAnulacion"> ({{ p.motivoAnulacion }})</span></td>
              <td>{{ p.notas || '—' }}</td>
              <td>
                <button v-if="p.estado === 'ACTIVO'" @click="anular(p)">Anular</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="pagos.length === 0">Sin pagos registrados.</p>
      </Card>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { getCitas, getPagos, getSaldoCita, createPago, anularPago } from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const auth = useAuthStore();

const estados = ['PROGRAMADA', 'CONFIRMADA', 'REPROGRAMADA', 'CANCELADA', 'COMPLETADA', 'NO_ASISTIO'];
const metodos = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'];

const citas = ref([]);
const totalCitas = ref(0);
const pagina = ref(1);
const limite = 20;
const filtroEstado = ref('');
const filtroDesde = ref('');
const filtroHasta = ref('');
const cargandoCitas = ref(false);

const citaSeleccionada = ref(null);
const saldo = ref(null);
const pagos = ref([]);
const cargandoPagos = ref(false);

const error = ref('');
const mensaje = ref('');

const form = reactive({ monto: '', metodo: 'EFECTIVO', notas: '' });

const puedePagar = computed(() => saldo.value && saldo.value.estadoSaldo !== 'PAGADO' && Number(form.monto) > 0);

function formatearMonto(centavos) {
  return (Number(centavos || 0) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

async function cargarCitas() {
  try {
    error.value = '';
    cargandoCitas.value = true;
    const params = { page: pagina.value, limit: limite };
    if (filtroEstado.value) params.estado = filtroEstado.value;
    if (filtroDesde.value) params.desde = filtroDesde.value;
    if (filtroHasta.value) params.hasta = filtroHasta.value;
    const datos = await getCitas(auth.token, params);
    citas.value = datos.citas;
    totalCitas.value = datos.total;
  } catch (e) {
    error.value = e.message;
  } finally {
    cargandoCitas.value = false;
  }
}

async function seleccionar(cita) {
  citaSeleccionada.value = cita;
  form.monto = '';
  form.metodo = 'EFECTIVO';
  form.notas = '';
  await Promise.all([cargarSaldo(), cargarPagos()]);
}

async function cargarSaldo() {
  if (!citaSeleccionada.value) return;
  const datos = await getSaldoCita(auth.token, citaSeleccionada.value._id);
  saldo.value = datos.saldo;
}

async function cargarPagos() {
  if (!citaSeleccionada.value) return;
  try {
    cargandoPagos.value = true;
    const datos = await getPagos(auth.token, { cita: citaSeleccionada.value._id, limit: 100 });
    pagos.value = datos.pagos;
  } catch (e) {
    error.value = e.message;
  } finally {
    cargandoPagos.value = false;
  }
}

async function registrarPago() {
  try {
    error.value = '';
    mensaje.value = '';
    const montoCentavos = Math.round(Number(form.monto) * 100);
    if (!Number.isInteger(montoCentavos) || montoCentavos <= 0) {
      error.value = 'Monto inválido';
      return;
    }
    const datos = await createPago(auth.token, {
      citaId: citaSeleccionada.value._id,
      montoCentavos,
      metodo: form.metodo,
      notas: form.notas
    });
    saldo.value = datos.saldo;
    form.monto = '';
    form.notas = '';
    mensaje.value = 'Pago registrado';
    await cargarPagos();
  } catch (e) {
    error.value = e.message;
  }
}

async function anular(pago) {
  const motivo = window.prompt('Motivo de anulación:');
  if (motivo === null) return;
  if (!motivo.trim()) {
    error.value = 'El motivo de anulación es obligatorio';
    return;
  }
  try {
    error.value = '';
    mensaje.value = '';
    const datos = await anularPago(auth.token, pago._id, motivo.trim());
    saldo.value = datos.saldo;
    mensaje.value = 'Pago anulado';
    await cargarPagos();
  } catch (e) {
    error.value = e.message;
  }
}

watch([filtroEstado, filtroDesde, filtroHasta], () => {
  if (pagina.value !== 1) pagina.value = 1;
  else cargarCitas();
});
watch(pagina, cargarCitas);

onMounted(cargarCitas);
</script>

<style scoped>
.contenedor { max-width: 1000px; margin: 2rem auto; font-family: sans-serif; }
.error { color: red; }
.ok { color: green; }
.fila { display: flex; gap: 1rem; flex-wrap: wrap; }
.fila > * { flex: 1; min-width: 160px; }
.campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
.campo select, .campo input { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; }
tr.seleccionada { background: #eef6ff; }
.saldo { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-top: 0.5rem; }
.dato { background: #f2f2f2; padding: 0.4rem 0.7rem; border-radius: 4px; }
.badge { padding: 0.25rem 0.6rem; border-radius: 12px; color: white; font-size: 0.85rem; }
.estado-PENDIENTE { background: #c0392b; }
.estado-PARCIAL { background: #e67e22; }
.estado-PAGADO { background: #27ae60; }
.ayuda { color: #2b7a0b; font-size: 0.9rem; }
.paginacion { display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
