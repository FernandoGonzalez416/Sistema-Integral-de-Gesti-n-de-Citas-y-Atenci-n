<template>
  <div>
  <div class="cab-pagina">
    <div>
      <h1>Servicios</h1>
      <p class="ayuda">Catálogo de servicios con su precio y duración.</p>
    </div>
    <button type="button" class="principal" @click="abrirNuevo">
      <Icono name="plus" :size="18" /> Nuevo servicio
    </button>
  </div>
  <p v-if="error" class="error">{{ error }}</p>


  <Card titulo="Lista de servicios">
    <table>
      <thead>
        <tr><th>Nombre</th><th>Precio</th><th>Duración</th><th>Imagen</th><th>Activo</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="s in servicios" :key="s._id">
          <td>{{ s.nombre }}</td>
          <td>{{ formatoMoneda(s.precioCentavos) }}</td>
          <td>{{ s.duracionMinutos }} min</td>
          <td><a v-if="s.imagenUrl" :href="s.imagenUrl" target="_blank" rel="noopener">Ver</a><span v-else>—</span></td>
          <td>{{ s.activo ? 'Sí' : 'No' }}</td>
          <td>
            <button @click="editar(s)">Editar</button>
            <button @click="cambiarActivo(s)">{{ s.activo ? 'Desactivar' : 'Activar' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </Card>

  <AdminModal
    :abierto="formAbierto"
    :titulo="editando ? 'Editar servicio' : 'Registrar servicio'"
    subtitulo="Nombre, precio y duración de la atención."
    icono="briefcase"
    @cerrar="cancelar"
  >
    <p v-if="errorForm" class="error" role="alert">{{ errorForm }}</p>
  <form @submit.prevent="guardar">
        <FormField etiqueta="Nombre" v-model="form.nombre" placeholder="Limpieza dental" />
        <FormField etiqueta="Descripción" v-model="form.descripcion" placeholder="Opcional" />
        <FormField etiqueta="Imagen URL" v-model="form.imagenUrl" placeholder="https://... (opcional)" />
        <FormField etiqueta="Precio (Q)" type="number" v-model="form.precio" placeholder="250.00" />
        <FormField etiqueta="Duración (minutos)" type="number" v-model="form.duracion" placeholder="60" />
        <div class="acciones">
          <button type="submit" class="principal">{{ editando ? 'Guardar cambios' : 'Registrar servicio' }}</button>
          <button type="button" class="secundario" @click="cancelar">Cancelar</button>
        </div>
      </form>
  </AdminModal>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { getServiciosTodos, createServicio, updateServicio } from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';
import AdminModal from '../components/AdminModal.vue';
import Icono from '../components/Icono.vue';
import { formatoMoneda } from '../composables/catalogo.js';

const auth = useAuthStore();
const servicios = ref([]);
const error = ref('');
const errorForm = ref('');
const formAbierto = ref(false);
const editando = ref(null);
const form = reactive({ nombre: '', descripcion: '', imagenUrl: '', precio: '', duracion: '' });

function aCentavos(precio) {
  return Math.round(Number(precio) * 100);
}

async function cargar() {
  try {
    error.value = '';
    const datos = await getServiciosTodos(auth.token);
    servicios.value = datos.servicios;
  } catch (e) {
    error.value = e.message;
  }
}

function limpiar() {
  Object.assign(form, { nombre: '', descripcion: '', imagenUrl: '', precio: '', duracion: '' });
  editando.value = null;
}

function abrirNuevo() {
  limpiar();
  errorForm.value = '';
  formAbierto.value = true;
}

async function guardar() {
  try {
    error.value = '';
    errorForm.value = '';
    const datos = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      imagenUrl: form.imagenUrl,
      precioCentavos: aCentavos(form.precio),
      duracionMinutos: Number(form.duracion)
    };
    if (editando.value) {
      await updateServicio(auth.token, editando.value, datos);
    } else {
      await createServicio(auth.token, datos);
    }
    cancelar();
    await cargar();
  } catch (e) {
    errorForm.value = e.message;
  }
}

function editar(s) {
  errorForm.value = '';
  formAbierto.value = true;
  editando.value = s._id;
  Object.assign(form, {
    nombre: s.nombre,
    descripcion: s.descripcion,
    imagenUrl: s.imagenUrl || '',
    precio: (s.precioCentavos / 100).toFixed(2),
    duracion: String(s.duracionMinutos)
  });
}

function cancelar() {
  formAbierto.value = false;
  errorForm.value = '';
  limpiar();
}

async function cambiarActivo(s) {
  try {
    error.value = '';
    await updateServicio(auth.token, s._id, { activo: !s.activo });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>
