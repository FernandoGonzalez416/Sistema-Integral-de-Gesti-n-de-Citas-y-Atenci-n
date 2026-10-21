<template>
  <main class="contenedor">
    <h1>Caja diaria</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mensaje" class="ok">{{ mensaje }}</p>

    <Card titulo="Estado actual">
      <div v-if="cargando">Cargando…</div>
      <div v-else-if="cajaAbierta">
        <p><strong>Caja ABIERTA</strong> desde {{ formatearFecha(cajaAbierta.fechaApertura) }}</p>
        <p>Abierta por: {{ cajaAbierta.abiertaPor?.nombre || '—' }}</p>
        <p>Monto inicial: {{ formatearMonto(cajaAbierta.montoInicialCentavos) }}</p>
        <p v-if="cajaAbierta.observacionesApertura">Observaciones: {{ cajaAbierta.observacionesApertura }}</p>

        <h3>Preview de cobros de la sesión</h3>
        <div class="totales">
          <span class="dato">Efectivo: {{ formatearMonto(preview.EFECTIVO) }}</span>
          <span class="dato">Tarjeta: {{ formatearMonto(preview.TARJETA) }}</span>
          <span class="dato">Transferencia: {{ formatearMonto(preview.TRANSFERENCIA) }}</span>
          <span class="dato">Total: {{ formatearMonto(preview.total) }}</span>
        </div>

        <h3>Cerrar caja</h3>
        <form @submit.prevent="cerrar">
          <div class="fila">
            <FormField etiqueta="Total real contado (Q)" type="number" v-model="formCierre.totalReal" placeholder="0.00" />
          </div>
          <FormField etiqueta="Observaciones (opcional)" v-model="formCierre.observaciones" />
          <button type="submit">Cerrar caja</button>
        </form>
      </div>
      <div v-else>
        <p>No hay caja abierta.</p>
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
            <th>Apertura</th><th>Cierre</th><th>Estado</th>
            <th>Efectivo</th><th>Tarjeta</th><th>Transf.</th>
            <th>Esperado</th><th>Real</th><th>Diferencia</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cajas" :key="c._id">
            <td>{{ formatearFecha(c.fechaApertura) }}</td>
            <td>{{ c.fechaCierre ? formatearFecha(c.fechaCierre) : '—' }}</td>
            <td>{{ c.estado }}</td>
            <td>{{ formatearMonto(c.totalesPorMetodo?.EFECTIVO) }}</td>
            <td>{{ formatearMonto(c.totalesPorMetodo?.TARJETA) }}</td>
            <td>{{ formatearMonto(c.totalesPorMetodo?.TRANSFERENCIA) }}</td>
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
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { getCajaActual, getCajas, abrirCaja, cerrarCaja, getPagos } from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const auth = useAuthStore();

const cajaAbierta = ref(null);
const cajas = ref([]);
const cargando = ref(false);
const error = ref('');
const mensaje = ref('');

const formApertura = reactive({ montoInicial: '', observaciones: '' });
const formCierre = reactive({ totalReal: '', observaciones: '' });

const preview = reactive({ EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0, total: 0 });

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
    const [abierta, lista] = await Promise.all([
      getCajaActual(auth.token),
      getCajas(auth.token, { limit: 50 })
    ]);
    cajaAbierta.value = abierta.caja;
    cajas.value = lista.cajas;
    if (cajaAbierta.value) await cargarPreview();
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

async function cargarPreview() {
  const datos = await getPagos(auth.token, { desde: cajaAbierta.value.fechaApertura, estado: 'REGISTRADO', limit: 500 });
  const t = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
  for (const p of datos.pagos) {
    if (t[p.metodo] !== undefined) t[p.metodo] += p.montoCentavos;
  }
  Object.assign(preview, t);
  preview.total = t.EFECTIVO + t.TARJETA + t.TRANSFERENCIA;
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
      error.value = 'Total real inválido';
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
.contenedor { max-width: 1000px; margin: 2rem auto; font-family: sans-serif; }
.error { color: red; }
.ok { color: green; }
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