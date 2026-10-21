<template>
  <main class="contenedor">
    <h1>Pacientes</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <Card titulo="Registrar paciente">
      <form @submit.prevent="crear">
        <div class="fila">
          <FormField etiqueta="Nombre" v-model="form.nombre" placeholder="Nombre" />
          <FormField etiqueta="Apellido" v-model="form.apellido" placeholder="Apellido" />
        </div>
        <div class="fila">
          <FormField etiqueta="Fecha de nacimiento" type="date" v-model="form.fechaNacimiento" />
          <FormField etiqueta="Sexo" v-model="form.sexo" placeholder="M/F/Otro" />
        </div>
        <div class="fila">
          <FormField etiqueta="Teléfono" v-model="form.telefono" placeholder="0000-0000" />
          <FormField etiqueta="Email" type="email" v-model="form.email" placeholder="opcional" />
        </div>
        <FormField etiqueta="Dirección" v-model="form.direccion" placeholder="Opcional" />
        <FormField etiqueta="Foto URL" v-model="form.fotoUrl" placeholder="Opcional" />
        <button type="submit">Registrar</button>
      </form>
    </Card>

    <Card titulo="Buscar">
      <div class="fila">
        <FormField etiqueta="Buscar (nombre, apellido, tel, email)" v-model="busqueda" />
        <FormField etiqueta="Activos" v-model="soloActivos" type="checkbox" />
      </div>
      <button @click="cargar">Buscar</button>
    </Card>

    <Card titulo="Lista de pacientes">
      <div v-if="cargando">Cargando…</div>
      <table v-else>
        <thead>
          <tr><th>Nombre</th><th>Edad</th><th>Teléfono</th><th>Email</th><th>Activo</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="p in pacientes" :key="p._id">
            <td>{{ p.nombre }} {{ p.apellido }}</td>
            <td>{{ p.edad }}</td>
            <td>{{ p.telefono }}</td>
            <td>{{ p.email || '—' }}</td>
            <td>{{ p.activo ? 'Sí' : 'No' }}</td>
            <td>
              <RouterLink :to="`/admin/pacientes/${p._id}/responsables`">Responsables</RouterLink>
              <RouterLink :to="`/admin/pacientes/${p._id}/materiales`">Materiales</RouterLink>
              <button @click="editar(p)">Editar</button>
              <button @click="toggleActivo(p)">{{ p.activo ? 'Desactivar' : 'Activar' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="pacientes.length === 0">No hay pacientes.</p>
      <div class="paginacion" v-if="total > 0">
        <button @click="pagina--" :disabled="pagina === 1">« Anterior</button>
        <span>Página {{ pagina }} de {{ Math.ceil(total / limite) }}</span>
        <button @click="pagina++" :disabled="pagina >= Math.ceil(total / limite)">Siguiente »</button>
      </div>
    </Card>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getPacientes, createPaciente, updatePaciente, patchEstadoPaciente
} from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const auth = useAuthStore();
const pacientes = ref([]);
const total = ref(0);
const cargando = ref(false);
const error = ref('');
const pagina = ref(1);
const limite = 20;
const busqueda = ref('');
const soloActivos = ref(true);

const form = reactive({
  _id: '', nombre: '', apellido: '', fechaNacimiento: '', sexo: 'M',
  telefono: '', email: '', direccion: '', fotoUrl: ''
});

const editando = ref(false);

async function cargar() {
  try {
    error.value = '';
    cargando.value = true;
    const params = { page: pagina.value, limit: limite };
    if (busqueda.value) params.q = busqueda.value;
    if (soloActivos.value) params.activo = 'true';
    const datos = await getPacientes(auth.token, params);
    pacientes.value = datos.pacientes;
    total.value = datos.total;
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

function limpiar() {
  Object.assign(form, {
    _id: '', nombre: '', apellido: '', fechaNacimiento: '', sexo: 'M',
    telefono: '', email: '', direccion: '', fotoUrl: ''
  });
  editando.value = false;
}

async function crear() {
  try {
    error.value = '';
    if (editando.value) {
      await updatePaciente(auth.token, form._id, { ...form });
    } else {
      await createPaciente(auth.token, { ...form });
    }
    limpiar();
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

function editar(p) {
  editando.value = true;
  Object.assign(form, p);
}

async function toggleActivo(p) {
  try {
    error.value = '';
    if (p.activo) {
      await patchEstadoPaciente(auth.token, p._id, false);
    } else {
      await patchEstadoPaciente(auth.token, p._id, true);
    }
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>

<style>
.contenedor { max-width: 900px; margin: 2rem auto; font-family: sans-serif; }
.error { color: red; }
.fila { display: flex; gap: 1rem; }
.fila > * { flex: 1; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; }
.paginacion { display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; }
</style>