<template>
  <h1>Servicios</h1>
  <p v-if="error" class="error">{{ error }}</p>

  <Card :titulo="editando ? 'Editar servicio' : 'Registrar servicio'">
    <form @submit.prevent="guardar">
      <FormField etiqueta="Nombre" v-model="form.nombre" placeholder="Limpieza dental" />
      <FormField etiqueta="Descripción" v-model="form.descripcion" placeholder="Opcional" />
      <FormField etiqueta="Precio (Q)" type="number" v-model="form.precio" placeholder="250.00" />
      <FormField etiqueta="Duración (minutos)" type="number" v-model="form.duracion" placeholder="60" />
      <button type="submit">{{ editando ? 'Guardar' : 'Registrar' }}</button>
      <button v-if="editando" type="button" @click="cancelar">Cancelar</button>
    </form>
  </Card>

  <Card titulo="Lista de servicios">
    <table>
      <thead>
        <tr><th>Nombre</th><th>Precio</th><th>Duración</th><th>Activo</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="s in servicios" :key="s._id">
          <td>{{ s.nombre }}</td>
          <td>{{ formatoMoneda(s.precioCentavos) }}</td>
          <td>{{ s.duracionMinutos }} min</td>
          <td>{{ s.activo ? 'Sí' : 'No' }}</td>
          <td>
            <button @click="editar(s)">Editar</button>
            <button @click="cambiarActivo(s)">{{ s.activo ? 'Desactivar' : 'Activar' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </Card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { getServicesTodos, createService, patchService } from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const auth = useAuthStore();
const servicios = ref([]);
const error = ref('');
const editando = ref(null);
const form = reactive({ nombre: '', descripcion: '', precio: '', duracion: '' });

function formatoMoneda(centavos) {
  // Quetzales (GTQ): Q1,250.00
  const monto = (Number(centavos || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Q${monto}`;
}

function aCentavos(precio) {
  return Math.round(Number(precio) * 100);
}

async function cargar() {
  try {
    error.value = '';
    const datos = await getServicesTodos(auth.token);
    servicios.value = datos.servicios;
  } catch (e) {
    error.value = e.message;
  }
}

function limpiar() {
  Object.assign(form, { nombre: '', descripcion: '', precio: '', duracion: '' });
  editando.value = null;
}

async function guardar() {
  try {
    error.value = '';
    const datos = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precioCentavos: aCentavos(form.precio),
      duracionMinutos: Number(form.duracion)
    };
    if (editando.value) {
      await patchService(auth.token, editando.value, datos);
    } else {
      await createService(auth.token, datos);
    }
    limpiar();
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

function editar(s) {
  editando.value = s._id;
  Object.assign(form, {
    nombre: s.nombre,
    descripcion: s.descripcion,
    precio: (s.precioCentavos / 100).toFixed(2),
    duracion: String(s.duracionMinutos)
  });
}

function cancelar() {
  limpiar();
}

async function cambiarActivo(s) {
  try {
    error.value = '';
    await patchService(auth.token, s._id, { activo: !s.activo });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>

<style>
.error { color: red; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; }
</style>