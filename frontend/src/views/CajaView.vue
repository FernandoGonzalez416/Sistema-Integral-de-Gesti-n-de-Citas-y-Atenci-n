<template>
  <main class="contenedor">
    <h1>Caja diaria</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mensaje" class="ok">{{ mensaje }}</p>

    <Card titulo="Estado actual">
      <div v-if="cargando">Cargando…</div>
      <div v-else-if="cajaAbierta">
        <p><strong>Caja ABIERTA</strong> desde {{ formatearFecha(cajaAbierta.fechaApertura) }}</p>
        <p>Responsable: {{ cajaAbierta.abiertaPor?.nombre || '—' }}</p>
        <p>Monto inicial: {{ formatearMonto(cajaAbierta.montoInicialCentavos) }}</p>
        <p v-if="cajaAbierta.observacionesApertura">Observaciones: {{ cajaAbierta.observacionesApertura }}</p>

        <h3>Ingresos de la caja</h3>
        <div class="totales">
          <span class="dato">Efectivo: {{ formatearMonto(resumen.totales.EFECTIVO) }}</span>
          <span class="dato">Tarjeta: {{ formatearMonto(resumen.totales.TARJETA) }}</span>
          <span class="dato">Transferencia: {{ formatearMonto(resumen.totales.TRANSFERENCIA) }}</span>
          <span class="dato">Total ingresos: {{ formatearMonto(resumen.totalIngresosCentavos) }}</span>
          <span class="dato">Efectivo esperado: {{ formatearMonto(efectivoEsperado) }}</span>
        </div>
        <p v-if="resumen.totalAnuladoCentavos > 0" class="nota">
          Pagos anulados (no suman): {{ formatearMonto(resumen.totalAnuladoCentavos) }}
        </p>

        <h3>Movimientos</h3>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Paciente</th><th>Monto</th><th>Método</th><th>Estado</th></tr>
          </thead>
          <tbody>
            <tr v-for="m in movimientos" :key="m._id">
              <td>{{ formatearFecha(m.fecha) }}</td>
              <td>{{ m.paciente?.nombre }} {{ m.paciente?.apellido }}</td>
              <td>{{ formatearMonto(m.montoCentavos) }}</td>
              <td>{{ m.metodo }}</td>
              <td>{{ m.estado }}<span v-if="m.motivoAnulacion"> ({{ m.motivoAnulacion }})</span></td>
            </tr>
          </tbody>
        </table>
        <p v-if="movimientos.length === 0">Sin movimientos registrados.</p>

        <h3>Cerrar caja</h3>
        <form @submit.prevent="cerrar">
          <div class="fila">
            <FormField etiqueta="Efectivo contado (Q)" type="number" v-model="formCierre.totalReal" placeholder="0.00" />
          </div>
          <FormField etiqueta="Observaciones (opcional)" v-model="formCierre.observaciones" />
          <button type="submit">Cerrar caja</button>
        </form>
      </div>
      <div v-else>
        <p>No tiene una caja abierta.</p>
        <form @submit.prevent="abrir">
          <div class="fila">
            <FormField etiqueta="Monto inicial (Q)" type="number" v-model="formApertura.montoInicial" placeholder="0.00" />
          </div>
          <FormField etiqueta="Observaciones (opcional)" v-model="formApertura.observaciones" />
          <button type="submit">Abrir caja</button>
        </form>
      </div>
    </Card>

    <Card titulo="Historial de cajas">
      <table>
        <thead>
          <tr>
            <th>Responsable</th><th>Apertura</th><th>Cierre</th><th>Estado</th>
            <th>Efectivo</th><th>Tarjeta</th><th>Transf.</th><th>Ingresos</th>
            <th>Esperado</th><th>Contado</th><th>Diferencia</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cajas" :key="c._id">
            <td>{{ c.abiertaPor?.nombre || '—' }}</td>
            <td>{{ formatearFecha(c.fechaApertura) }}</td>
            <td>{{ c.fechaCierre ? formatearFecha(c.fechaCierre) : '—' }}</td>
            <td>{{ c.estado }}</td>
            <td>{{ formatearMonto(c.totalesPorMetodo?.EFECTIVO) }}</td>
            <td>{{ formatearMonto(c.totalesPorMetodo?.TARJETA) }}</td>
            <td>{{ formatearMonto(c.totalesPorMetodo?.TRANSFERENCIA) }}</td>
            <td>{{ formatearMonto(c.totalIngresosCentavos) }}</td>
            <td>{{ formatearMonto(c.totalEsperadoCentavos) }}</td>
            <td>{{ formatearMonto(c.totalRealCentavos) }}</td>
            <td :class="{ neg: c.diferenciaCentavos < 0, pos: c.diferenciaCentavos > 0 }">
              {{ formatearMonto(c.diferenciaCentavos) }}
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="cajas.length === 0">Sin cajas registradas.</p>
    </Card>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { getCajaActual, getCajas, getMovimientosCaja, abrirCaja, cerrarCaja } from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const auth = useAuthStore();

const cajaAbierta = ref(null);
const cajas = ref([]);
const movimientos = ref([]);
const cargando = ref(false);
const error = ref('');
const mensaje = ref('');

const formApertura = reactive({ montoInicial: '', observaciones: '' });
const formCierre = reactive({ totalReal: '', observaciones: '' });

const resumen = reactive({
  totales: { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 },
  totalIngresosCentavos: 0,
  totalAnuladoCentavos: 0
});

const efectivoEsperado = computed(
  () => Number(cajaAbierta.value?.montoInicialCentavos || 0) + Number(resumen.totales.EFECTIVO || 0)
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

async function cargar() {
  try {
    error.value = '';
    cargando.value = true;
    const [propia, lista] = await Promise.all([
      getCajaActual(auth.token),
      getCajas(auth.token, { limit: 50 })
    ]);
    cajaAbierta.value = propia.caja;
    cajas.value = lista.cajas;

    if (cajaAbierta.value) {
      Object.assign(resumen.totales, propia.resumen?.totales || {});
      resumen.totalIngresosCentavos = propia.resumen?.totalIngresosCentavos || 0;
      resumen.totalAnuladoCentavos = propia.resumen?.totalAnuladoCentavos || 0;
      const detalle = await getMovimientosCaja(auth.token, cajaAbierta.value._id);
      movimientos.value = detalle.movimientos;
    } else {
      movimientos.value = [];
      Object.assign(resumen.totales, { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 });
      resumen.totalIngresosCentavos = 0;
      resumen.totalAnuladoCentavos = 0;
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

async function abrir() {
  try {
    error.value = '';
    mensaje.value = '';
    const montoInicialCentavos = Math.round(Number(formApertura.montoInicial || 0) * 100);
    if (!Number.isInteger(montoInicialCentavos) || montoInicialCentavos < 0) {
      error.value = 'Monto inicial inválido';
      return;
    }
    await abrirCaja(auth.token, { montoInicialCentavos, observacionesApertura: formApertura.observaciones });
    formApertura.montoInicial = '';
    formApertura.observaciones = '';
    mensaje.value = 'Caja abierta';
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

async function cerrar() {
  try {
    error.value = '';
    mensaje.value = '';
    const totalRealCentavos = Math.round(Number(formCierre.totalReal || 0) * 100);
    if (!Number.isInteger(totalRealCentavos) || totalRealCentavos < 0) {
      error.value = 'Efectivo contado inválido';
      return;
    }
    const datos = await cerrarCaja(auth.token, cajaAbierta.value._id, {
      totalRealCentavos,
      observacionesCierre: formCierre.observaciones
    });
    formCierre.totalReal = '';
    formCierre.observaciones = '';
    mensaje.value = `Caja cerrada. Diferencia: ${formatearMonto(datos.caja.diferenciaCentavos)}`;
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>

<style scoped>
.contenedor { max-width: 1100px; margin: 2rem auto; font-family: sans-serif; }
.error { color: red; }
.ok { color: green; }
.nota { color: #7f8c8d; font-size: 0.9rem; }
.fila { display: flex; gap: 1rem; flex-wrap: wrap; }
.fila > * { flex: 1; min-width: 160px; }
.totales { display: flex; gap: 0.75rem; flex-wrap: wrap; margin: 0.5rem 0 1rem; }
.dato { background: #f2f2f2; padding: 0.4rem 0.7rem; border-radius: 4px; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; }
td.neg { color: #c0392b; font-weight: bold; }
td.pos { color: #27ae60; font-weight: bold; }
h3 { margin: 1rem 0 0.5rem; }
</style>
