<template>
  <main class="contenedor">
    <div class="cab-pagina">
      <div>
        <h1>Responsables</h1>
        <p class="ayuda">Tutores y familiares vinculados a los pacientes.</p>
      </div>
      <button type="button" class="principal" @click="abrirNuevo">
        <Icono name="plus" :size="18" /> Nuevo responsable
      </button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>


    <Card titulo="Buscar">
      <div class="fila">
        <FormField etiqueta="Buscar (nombre, apellido, tel, email, parentesco)" v-model="busqueda" @keyup.enter="cargar" />
        <FormField etiqueta="Activos" v-model="soloActivos" type="checkbox" />
      </div>
      <button @click="cargar">Buscar</button>
    </Card>

    <Card titulo="Lista de responsables">
      <div v-if="cargando">Cargando…</div>
      <table v-else>
        <thead>
          <tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Parentesco</th><th>Activo</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="r in responsables" :key="r._id">
            <td>{{ r.nombre }} {{ r.apellido }}</td>
            <td>{{ r.telefono }}</td>
            <td>{{ r.email || '—' }}</td>
            <td>{{ r.direccion || '—' }}</td>
            <td>{{ r.parentesco }}</td>
            <td>{{ r.activo ? 'Sí' : 'No' }}</td>
            <td>
              <button @click="editar(r)">Editar</button>
              <button @click="toggleActivo(r)">{{ r.activo ? 'Desactivar' : 'Activar' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="responsables.length === 0">No hay responsables.</p>
      <div class="paginacion" v-if="total > 0">
        <button @click="pagina--" :disabled="pagina === 1">« Anterior</button>
        <span>Página {{ pagina }} de {{ Math.ceil(total / limite) }}</span>
        <button @click="pagina++" :disabled="pagina >= Math.ceil(total / limite)">Siguiente »</button>
      </div>
    </Card>

    <AdminModal
      :abierto="formAbierto"
      :titulo="editando ? 'Editar responsable' : 'Registrar responsable'"
      subtitulo="Datos de contacto y parentesco con el paciente."
      icono="family"
      :bloquear="guardando"
      @cerrar="cerrarForm"
    >
      <p v-if="errorForm" class="error" role="alert">{{ errorForm }}</p>
    <form @submit.prevent="crear">
            <div class="fila">
              <FormField etiqueta="Nombre" v-model="form.nombre" placeholder="Nombre" />
              <FormField etiqueta="Apellido" v-model="form.apellido" placeholder="Apellido" />
            </div>
            <div class="fila">
              <FormField etiqueta="Teléfono" v-model="form.telefono" placeholder="0000-0000" />
              <FormField etiqueta="Email (obligatorio)" type="email" v-model="form.email" placeholder="correo@ejemplo.com" />
            </div>
            <FormField etiqueta="Dirección (obligatoria)" v-model="form.direccion" placeholder="Calle, número, colonia" />
            <FormField etiqueta="Foto URL" v-model="form.fotoUrl" placeholder="Opcional" />
            <FormField etiqueta="Parentesco" v-model="form.parentesco" placeholder="Padre, Madre, Tutor..." />
            <div class="acciones">
        <button type="submit" class="principal" :disabled="guardando">
          {{ guardando ? 'Guardando…' : (editando ? 'Guardar cambios' : 'Registrar responsable') }}
        </button>
        <button type="button" class="secundario" :disabled="guardando" @click="cerrarForm">Cancelar</button>
      </div>
          </form>
    </AdminModal>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getResponsables, createResponsable, updateResponsable
} from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';
import AdminModal from '../components/AdminModal.vue';
import Icono from '../components/Icono.vue';

const auth = useAuthStore();
const responsables = ref([]);
const total = ref(0);
const cargando = ref(false);
const error = ref('');
const pagina = ref(1);
const limite = 20;
const busqueda = ref('');
const soloActivos = ref(true);

const form = reactive({
  _id: '', nombre: '', apellido: '', telefono: '', email: '', direccion: '', fotoUrl: '', parentesco: ''
});

const editando = ref(false);
const formAbierto = ref(false);
const guardando = ref(false);
const errorForm = ref('');

async function cargar() {
  try {
    error.value = '';
    cargando.value = true;
    const params = { page: pagina.value, limit: limite };
    if (busqueda.value) params.q = busqueda.value;
    if (soloActivos.value) params.activo = 'true';
    const datos = await getResponsables(auth.token, params);
    responsables.value = datos.responsables;
    total.value = datos.total;
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

function limpiar() {
  Object.assign(form, { _id: '', nombre: '', apellido: '', telefono: '', email: '', direccion: '', fotoUrl: '', parentesco: '' });
  editando.value = false;
}

function abrirNuevo() {
  limpiar();
  errorForm.value = '';
  formAbierto.value = true;
}

function cerrarForm() {
  if (guardando.value) return;
  formAbierto.value = false;
  errorForm.value = '';
  limpiar();
}

async function crear() {
  try {
    error.value = '';
    errorForm.value = '';
    guardando.value = true;
    if (editando.value) {
      await updateResponsable(auth.token, form._id, { ...form });
    } else {
      await createResponsable(auth.token, { ...form });
    }
    guardando.value = false;
    cerrarForm();
    await cargar();
  } catch (e) {
    errorForm.value = e.message;
  } finally {
    guardando.value = false;
  }
}

function editar(r) {
  errorForm.value = '';
  formAbierto.value = true;
  editando.value = true;
  Object.assign(form, r);
}

async function toggleActivo(r) {
  try {
    error.value = '';
    await updateResponsable(auth.token, r._id, { activo: !r.activo });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>
