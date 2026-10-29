<template>
  <main class="contenedor">
    <h1>Pagos y saldos</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mensaje" class="ok">{{ mensaje }}</p>

    <Card titulo="Caja de trabajo">
      <p v-if="!cajaPropia" class="aviso">
        No tiene una caja abierta. <RouterLink to="/admin/caja">Abra su caja</RouterLink> antes de registrar pagos.
      </p>
      <p v-else>
        Caja ABIERTA desde {{ formatearFecha(cajaPropia.fechaApertura) }} ·
        Responsable: {{ cajaPropia.abiertaPor?.nombre || '—' }}
      </p>
    </Card>

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
            <FormField etiqueta="Monto (Q)" type="number" v-model="form.monto" placeholder="0.00" />
            <label class="campo">
              <span>Método</span>
              <select v-model="form.metodo">
                <option v-for="m in metodos" :key="m" :value="m">{{ m }}</option>
              </select>
            </label>
          </div>
          <FormField etiqueta="Notas (opcional)" v-model="form.notas" placeholder="Seña, saldo, etc." />
          <button type="submit" :disabled="!puedePagar">Registrar pago</button>
          <p class="ayuda" v-if="!cajaPropia">Debe abrir su propia caja para registrar pagos.</p>
          <p class="ayuda" v-else-if="saldo && saldo.estadoSaldo === 'PAGADO'">La cita ya está pagada.</p>
        </form>
      </Card>

      <Card titulo="Pagos de la cita">
        <div v-if="cargandoPagos">Cargando…</div>
        <div v-else class="tabla-scroll">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Estado</th><th>Comprobante</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="p in pagos" :key="p._id">
                <td class="ahora">
                  {{ formatearFecha(p.fecha) }}
                  <span v-if="p.notas" class="nota-pago">{{ p.notas }}</span>
                </td>
                <td class="ahora">{{ formatearMonto(p.montoCentavos) }}</td>
                <td>{{ p.metodo }}</td>
                <td>
                  <span class="badge" :class="p.estado === 'REGISTRADO' ? 'estado-PAGADO' : 'estado-ANULADO'">{{ p.estado }}</span>
                  <span v-if="p.motivoAnulacion" class="motivo"> · {{ p.motivoAnulacion }}</span>
                </td>
                <td class="ahora">{{ p.numeroComprobante || '—' }}</td>
                <td>
                  <div class="acciones-pago">
                    <button class="secundario" :disabled="cargandoComprobante" @click="verComprobante(p)">Ver comprobante</button>
                    <button v-if="p.estado === 'REGISTRADO'" @click="anular(p)">Anular</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!cargandoPagos && pagos.length === 0">Sin pagos registrados.</p>
      </Card>
    </template>

    <Card titulo="Consulta global de pagos">
      <p class="ayuda">
        Consulta todos los pagos de la base por rango de fechas, método, estado o paciente,
        sin importar la cita seleccionada. Los pagos anulados no suman a los ingresos.
      </p>

      <div class="filtros-pagos">
        <FormField etiqueta="Desde" type="date" v-model="filtrosPago.desde" />
        <FormField etiqueta="Hasta" type="date" v-model="filtrosPago.hasta" />
        <label class="campo">
          <span>Método</span>
          <select v-model="filtrosPago.metodo">
            <option value="">Todos</option>
            <option v-for="m in metodos" :key="m" :value="m">{{ m }}</option>
          </select>
        </label>
        <label class="campo">
          <span>Estado</span>
          <select v-model="filtrosPago.estado">
            <option value="">Todos</option>
            <option value="REGISTRADO">REGISTRADO</option>
            <option value="ANULADO">ANULADO</option>
          </select>
        </label>
        <label class="campo">
          <span>Paciente</span>
          <select v-model="filtrosPago.paciente">
            <option value="">Todos</option>
            <option v-for="p in pacientes" :key="p._id" :value="p._id">
              {{ p.nombre }} {{ p.apellido }}
            </option>
          </select>
        </label>
        <button type="button" class="secundario limpiar" @click="limpiarFiltrosPagos">Limpiar</button>
      </div>

      <div class="resumen-pagos">
        <div class="stat">
          <span class="etiqueta">Registrados</span>
          <strong>{{ resumenPagos.registrado.cantidad }}</strong>
          <span class="monto">{{ formatearMonto(resumenPagos.registrado.montoCentavos) }}</span>
        </div>
        <div class="stat anulado">
          <span class="etiqueta">Anulados</span>
          <strong>{{ resumenPagos.anulado.cantidad }}</strong>
          <span class="monto">{{ formatearMonto(resumenPagos.anulado.montoCentavos) }}</span>
        </div>
        <div class="stat">
          <span class="etiqueta">Pagos en el filtro</span>
          <strong>{{ totalPagos }}</strong>
          <span class="monto">incluye anulados</span>
        </div>
      </div>

      <div v-if="cargandoPagosGlobal">Cargando…</div>
      <div v-else class="tabla-scroll">
        <table v-if="pagosGlobal.length">
          <thead>
            <tr><th>Fecha</th><th>Comprobante</th><th>Paciente</th><th>Monto</th><th>Método</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="p in pagosGlobal" :key="p._id">
              <td class="ahora">{{ formatearFecha(p.fecha) }}</td>
              <td class="ahora">{{ p.numeroComprobante || '—' }}</td>
              <td>{{ p.paciente?.nombre }} {{ p.paciente?.apellido }}</td>
              <td class="ahora">{{ formatearMonto(p.montoCentavos) }}</td>
              <td>{{ p.metodo }}</td>
              <td>
                <span class="badge" :class="p.estado === 'REGISTRADO' ? 'estado-PAGADO' : 'estado-ANULADO'">{{ p.estado }}</span>
              </td>
              <td><button class="secundario" :disabled="cargandoComprobante" @click="verComprobante(p)">Ver</button></td>
            </tr>
          </tbody>
        </table>
        <p v-else>No hay pagos con esos filtros.</p>
      </div>

      <div class="paginacion" v-if="totalPagos > 0">
        <button @click="paginaPagos--" :disabled="paginaPagos === 1">« Anterior</button>
        <span>Página {{ paginaPagos }} de {{ Math.ceil(totalPagos / limitePagos) }}</span>
        <button @click="paginaPagos++" :disabled="paginaPagos >= Math.ceil(totalPagos / limitePagos)">Siguiente »</button>
      </div>
    </Card>

    <Teleport to="body">
      <div v-if="comprobante" class="rec-fondo" @mousedown.self="cerrarComprobante">
        <div class="rec-ventana" role="dialog" aria-modal="true" aria-labelledby="rec-titulo">
          <div class="rec-acciones no-print">
            <button class="secundario" @click="cerrarComprobante">Cerrar</button>
            <button @click="imprimirComprobante">Imprimir</button>
          </div>

          <article class="rec-hoja">
            <header class="rec-encabezado">
              <div>
                <p class="rec-centro">Centro de Salud SIGSA</p>
                <h2 id="rec-titulo">Comprobante interno de pago</h2>
              </div>
              <div class="rec-numero">
                <span class="rec-etiqueta">No.</span>
                <strong>{{ comprobante.numero }}</strong>
                <span class="rec-estado" :class="comprobante.estado === 'EMITIDO' ? 'rec-vigente' : 'rec-anulado'">
                  {{ comprobante.estado }}
                </span>
              </div>
            </header>

            <p class="rec-emitido">Emitido: {{ formatearFecha(comprobante.createdAt) }}</p>

            <dl class="rec-datos">
              <div><dt>Paciente</dt><dd>{{ comprobante.paciente?.nombre }} {{ comprobante.paciente?.apellido }}</dd></div>
              <div><dt>Servicio</dt><dd>{{ comprobante.cita?.servicio?.nombre || '—' }}</dd></div>
              <div><dt>Cita</dt><dd>{{ formatearFecha(comprobante.cita?.inicio) }}</dd></div>
              <div><dt>Profesional</dt><dd>{{ nombreProfesional }}</dd></div>
              <div><dt>Método de pago</dt><dd>{{ comprobante.metodo }}</dd></div>
              <div><dt>Fecha del pago</dt><dd>{{ formatearFecha(comprobante.fecha) }}</dd></div>
              <div><dt>Registrado por</dt><dd>{{ comprobante.pago?.registradoPor?.nombre || '—' }}</dd></div>
              <div><dt>Caja</dt><dd>{{ pagoComprobante?.caja ? formatearFecha(pagoComprobante.caja.fechaApertura) : '—' }}</dd></div>
            </dl>

            <div class="rec-total">
              <span>Total pagado</span>
              <strong>{{ formatearMonto(comprobante.montoCentavos) }}</strong>
            </div>

            <p v-if="comprobante.notas" class="rec-notas"><strong>Notas:</strong> {{ comprobante.notas }}</p>

            <div v-if="comprobante.estado === 'ANULADO'" class="rec-bloque-anulado">
              <strong>Pago ANULADO</strong>
              <p v-if="comprobante.pago?.motivoAnulacion">Motivo: {{ comprobante.pago.motivoAnulacion }}</p>
              <p v-if="comprobante.pago?.anuladoEn">Fecha de anulación: {{ formatearFecha(comprobante.pago.anuladoEn) }}</p>
              <p v-if="comprobante.pago?.anuladoPor">Anulado por: {{ comprobante.pago.anuladoPor.nombre || comprobante.pago.anuladoPor.email }}</p>
            </div>

            <p class="rec-pie">Documento interno sin validez fiscal. Conserve este comprobante.</p>
          </article>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getCitas,
  getPagos,
  getPagosCita,
  getSaldoCita,
  getComprobantePago,
  getPacientes,
  createPago,
  anularPago,
  getCajaActual
} from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';
import { ESTADOS_CITA, METODOS_PAGO } from '../constants/sigca.js';

const auth = useAuthStore();

const estados = ESTADOS_CITA;
const metodos = METODOS_PAGO;

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
const cajaPropia = ref(null);

const comprobante = ref(null);
const pagoComprobante = ref(null);
const cargandoComprobante = ref(false);

const pacientes = ref([]);
const filtrosPago = reactive({ desde: '', hasta: '', metodo: '', estado: '', paciente: '' });
const pagosGlobal = ref([]);
const totalPagos = ref(0);
const paginaPagos = ref(1);
const limitePagos = 20;
const cargandoPagosGlobal = ref(false);
const resumenPagos = ref({
  registrado: { cantidad: 0, montoCentavos: 0 },
  anulado: { cantidad: 0, montoCentavos: 0 }
});

const error = ref('');
const mensaje = ref('');

const form = reactive({ monto: '', metodo: 'EFECTIVO', notas: '' });

const puedePagar = computed(
  () => Boolean(cajaPropia.value) && saldo.value && saldo.value.estadoSaldo !== 'PAGADO' && Number(form.monto) > 0
);

function formatearMonto(centavos) {
  // Quetzales (GTQ): Q1,250.00
  const monto = (Number(centavos || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Q${monto}`;
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

const nombreProfesional = computed(() => {
  const p = comprobante.value?.cita?.profesional;
  if (!p) return '—';
  return `${p.nombre || ''} ${p.apellido || ''}`.trim() || '—';
});

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
  try {
    const datos = await getSaldoCita(auth.token, citaSeleccionada.value._id);
    saldo.value = datos.saldo;
  } catch (e) {
    error.value = e.message;
  }
}

async function cargarPagos() {
  if (!citaSeleccionada.value) return;
  try {
    cargandoPagos.value = true;
    const datos = await getPagosCita(auth.token, citaSeleccionada.value._id);
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
    if (comprobante.value && String(comprobante.value.pago?._id) === String(pago._id)) {
      await verComprobante(pago);
    }
  } catch (e) {
    error.value = e.message;
  }
}

// RF-10: consultar el comprobante interno del pago y mostrarlo imprimible.
async function verComprobante(pago) {
  try {
    error.value = '';
    cargandoComprobante.value = true;
    const datos = await getComprobantePago(auth.token, pago._id);
    comprobante.value = datos.comprobante;
    pagoComprobante.value = pago;
    // El backend emite el comprobante si el pago aún no lo tenía (datos heredados).
    if (!pago.numeroComprobante && datos.comprobante?.numero) {
      pago.numeroComprobante = datos.comprobante.numero;
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    cargandoComprobante.value = false;
  }
}

function cerrarComprobante() {
  comprobante.value = null;
  pagoComprobante.value = null;
}

function imprimirComprobante() {
  window.print();
}

function alPresionarTecla(evento) {
  if (evento.key === 'Escape' && comprobante.value) cerrarComprobante();
}

async function cargarCaja() {
  try {
    const datos = await getCajaActual(auth.token);
    cajaPropia.value = datos.caja;
  } catch (e) {
    error.value = e.message;
  }
}

let peticionPagos = 0;

async function cargarPagosGlobal() {
  const solicitud = ++peticionPagos;
  try {
    error.value = '';
    cargandoPagosGlobal.value = true;
    const params = { page: paginaPagos.value, limit: limitePagos };
    for (const [campo, valor] of Object.entries(filtrosPago)) {
      if (valor) params[campo] = valor;
    }
    const datos = await getPagos(auth.token, params);
    if (solicitud !== peticionPagos) return;
    pagosGlobal.value = datos.pagos || [];
    totalPagos.value = datos.total || 0;
    resumenPagos.value = datos.resumen || {
      registrado: { cantidad: 0, montoCentavos: 0 },
      anulado: { cantidad: 0, montoCentavos: 0 }
    };
  } catch (e) {
    if (solicitud === peticionPagos) error.value = e.message;
  } finally {
    if (solicitud === peticionPagos) cargandoPagosGlobal.value = false;
  }
}

async function cargarPacientes() {
  try {
    const datos = await getPacientes(auth.token, { limit: 200 });
    pacientes.value = datos.pacientes || [];
  } catch {
    pacientes.value = [];
  }
}

function limpiarFiltrosPagos() {
  filtrosPago.desde = '';
  filtrosPago.hasta = '';
  filtrosPago.metodo = '';
  filtrosPago.estado = '';
  filtrosPago.paciente = '';
}

watch([filtroEstado, filtroDesde, filtroHasta], () => {
  if (pagina.value !== 1) pagina.value = 1;
  else cargarCitas();
});
watch(pagina, cargarCitas);

watch(filtrosPago, () => {
  if (paginaPagos.value !== 1) paginaPagos.value = 1;
  else cargarPagosGlobal();
});
watch(paginaPagos, cargarPagosGlobal);

onMounted(() => {
  cargarCaja();
  cargarCitas();
  cargarPacientes();
  cargarPagosGlobal();
  window.addEventListener('keydown', alPresionarTecla);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', alPresionarTecla);
});
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
td.ahora, th { white-space: nowrap; }
.tabla-scroll { overflow-x: auto; }
tr.seleccionada { background: #eef6ff; }
.saldo { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-top: 0.5rem; }
.dato { background: #f2f2f2; padding: 0.4rem 0.7rem; border-radius: 4px; }
.badge { padding: 0.25rem 0.6rem; border-radius: 12px; color: white; font-size: 0.85rem; }
.estado-PENDIENTE { background: #c0392b; }
.estado-PARCIAL { background: #e67e22; }
.estado-PAGADO { background: #27ae60; }
.estado-ANULADO { background: #c0392b; }
.motivo { color: #777; font-size: 0.85rem; }
.nota-pago { display: block; max-width: 220px; margin-top: 0.15rem; color: #777; font-size: 0.78rem; white-space: normal; }
.acciones-pago { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.acciones-pago button { white-space: nowrap; }
button.secundario { background: #fff; color: #1a5c8a; border: 1px solid #1a5c8a; }
.ayuda { color: #2b7a0b; font-size: 0.9rem; }
.aviso { color: #c0392b; }
.paginacion { display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; }
button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Consulta global de pagos (RF-10: por fecha, método, estado y paciente). */
.filtros-pagos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  align-items: end;
  margin-bottom: 1rem;
}
.filtros-pagos .campo { margin-bottom: 0; }
.filtros-pagos .limpiar { height: fit-content; padding: 0.55rem 0.9rem; border-radius: 4px; cursor: pointer; }
.resumen-pagos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.resumen-pagos .stat { padding: 0.65rem 0.85rem; border: 1px solid #d7dee8; border-radius: 8px; background: #f8fafc; }
.resumen-pagos .stat.anulado { border-color: #e3b0aa; background: #fdf4f3; }
.resumen-pagos .etiqueta { display: block; color: #64748b; font-size: 0.75rem; letter-spacing: 0.04em; text-transform: uppercase; }
.resumen-pagos strong { display: block; color: #1e293b; font-size: 1.3rem; }
.resumen-pagos .monto { color: #1a5c8a; font-weight: 700; }

/* Comprobante interno imprimible (RF-10). */
.rec-fondo {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1rem;
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.55);
}
.rec-ventana { width: min(760px, 100%); }
.rec-acciones { display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 0.6rem; }
.rec-acciones button { padding: 0.55rem 1rem; border-radius: 6px; border: 1px solid #1a5c8a; background: #1a5c8a; color: #fff; cursor: pointer; }
.rec-acciones button.secundario { background: #fff; color: #1a5c8a; }
.rec-hoja {
  background: #fff;
  color: #1e293b;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
  font-family: Arial, Helvetica, sans-serif;
}
.rec-encabezado { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; border-bottom: 2px solid #1a5c8a; padding-bottom: 1rem; }
.rec-centro { margin: 0 0 0.2rem; color: #1a5c8a; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.rec-encabezado h2 { margin: 0; font-size: 1.35rem; }
.rec-numero { text-align: right; white-space: nowrap; }
.rec-etiqueta { display: block; color: #64748b; font-size: 0.72rem; text-transform: uppercase; }
.rec-numero strong { display: block; font-size: 1.1rem; letter-spacing: 0.03em; }
.rec-estado { display: inline-block; margin-top: 0.35rem; padding: 0.15rem 0.55rem; border-radius: 10px; color: #fff; font-size: 0.72rem; font-weight: 700; }
.rec-vigente { background: #27ae60; }
.rec-anulado { background: #c0392b; }
.rec-emitido { margin: 0.75rem 0 1rem; color: #64748b; font-size: 0.85rem; }
.rec-datos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem 1.5rem; margin: 0 0 1.25rem; }
.rec-datos div { border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem; }
.rec-datos dt { color: #64748b; font-size: 0.72rem; letter-spacing: 0.05em; text-transform: uppercase; }
.rec-datos dd { margin: 0.15rem 0 0; font-weight: 600; }
.rec-total { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.85rem 1rem; border-radius: 6px; background: #f1f5f9; font-size: 1.05rem; }
.rec-total strong { color: #1a5c8a; font-size: 1.5rem; }
.rec-notas { margin: 0.9rem 0 0; }
.rec-bloque-anulado { margin-top: 1rem; padding: 0.75rem 1rem; border: 1px solid #c0392b; border-radius: 6px; background: #fdf2f2; color: #7f1d1d; }
.rec-bloque-anulado p { margin: 0.3rem 0 0; }
.rec-pie { margin: 1.25rem 0 0; color: #94a3b8; font-size: 0.75rem; text-align: center; }
</style>

<style>
/* Impresión del comprobante: solo se imprime la hoja, sin menú ni botones. */
@media print {
  @page { margin: 14mm; }
  body * { visibility: hidden !important; }
  .rec-hoja, .rec-hoja * { visibility: visible !important; }
  .rec-fondo { position: static !important; display: block !important; padding: 0 !important; background: #fff !important; overflow: visible !important; }
  .rec-ventana { width: 100% !important; }
  .rec-hoja { position: absolute; top: 0; left: 0; width: 100%; padding: 0; border-radius: 0; box-shadow: none; }
  .no-print { display: none !important; }
}
</style>