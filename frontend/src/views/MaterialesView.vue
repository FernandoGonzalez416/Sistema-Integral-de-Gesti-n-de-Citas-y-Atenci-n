<template>
  <main class="contenedor">
    <div class="cab-pagina">
      <div>
        <h1>Materiales educativos</h1>
        <p class="ayuda">
          {{ auth.esProfesional
            ? 'Catálogo de materiales disponible. Para asignar material a un paciente, entra a Pacientes → Materiales.'
            : 'Documentos, videos y enlaces que se comparten con los pacientes.' }}
        </p>
      </div>
      <button v-if="!auth.esProfesional" type="button" class="principal" @click="abrirNuevo">
        <Icono name="plus" :size="18" /> Nuevo material
      </button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mensaje" class="ok">{{ mensaje }}</p>


    <Card titulo="Buscar">
      <div class="fila">
        <FormField etiqueta="Buscar (título, descripción)" v-model="busqueda" @keyup.enter="cargar" />
        <label class="campo">
          <span>Tipo</span>
          <select v-model="filtroTipo">
            <option value="">Todos</option>
            <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>
        <FormField etiqueta="Activos" v-model="soloActivos" type="checkbox" />
      </div>
      <button @click="cargar">Buscar</button>
    </Card>

    <Card titulo="Lista de materiales">
      <div v-if="cargando">Cargando…</div>
      <table v-else>
        <thead>
          <tr>
            <th>Título</th><th>Tipo</th><th>Descripción</th><th>Activo</th>
            <th v-if="!auth.esProfesional"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in materiales" :key="m._id">
            <td>{{ m.titulo }}</td>
            <td>{{ m.tipo }}</td>
            <td class="desc">{{ m.descripcion }}</td>
            <td>{{ m.activo ? 'Sí' : 'No' }}</td>
            <td v-if="!auth.esProfesional" class="acciones-celda">
              <button @click="editar(m)">Editar</button>
              <button @click="toggleActivo(m)">{{ m.activo ? 'Desactivar' : 'Activar' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="materiales.length === 0">No hay materiales.</p>
      <div class="paginacion" v-if="total > 0">
        <button @click="pagina--" :disabled="pagina === 1">« Anterior</button>
        <span>Página {{ pagina }} de {{ Math.ceil(total / limite) }}</span>
        <button @click="pagina++" :disabled="pagina >= Math.ceil(total / limite)">Siguiente »</button>
      </div>
    </Card>

    <AdminModal
      :abierto="formAbierto && !auth.esProfesional"
      :titulo="editando ? 'Editar material' : 'Registrar material'"
      subtitulo="Título, tipo y enlace del recurso educativo."
      icono="book"
      @cerrar="cerrarForm"
    >
      <p v-if="errorForm" class="error" role="alert">{{ errorForm }}</p>
    <form @submit.prevent="guardar">
            <FormField etiqueta="Título" v-model="form.titulo" placeholder="Título del material" />
            <FormField etiqueta="Descripción" v-model="form.descripcion" placeholder="Descripción" />
            <div class="fila">
              <label class="campo">
                <span>Tipo</span>
                <select v-model="form.tipo">
                  <option value="">Selecciona tipo</option>
                  <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
                </select>
              </label>
              <FormField etiqueta="URL (opcional)" v-model="form.url" placeholder="https://..." />
            </div>
            <div class="acciones">
              <button type="submit" class="principal">{{ editando ? 'Guardar cambios' : 'Registrar material' }}</button>
              <button type="button" class="secundario" @click="cerrarForm">Cancelar</button>
            </div>
          </form>
    </AdminModal>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getMateriales, createMaterial, updateMaterial
} from '../api/client.js';
import { TIPOS_MATERIAL } from '../constants/sigca.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';
import AdminModal from '../components/AdminModal.vue';
import Icono from '../components/Icono.vue';

const auth = useAuthStore();
const materiales = ref([]);
const total = ref(0);
const cargando = ref(false);
const error = ref('');
const mensaje = ref('');
const pagina = ref(1);
const limite = 20;
const busqueda = ref('');
const filtroTipo = ref('');
const soloActivos = ref(false);
const editando = ref(false);
const formAbierto = ref(false);
const errorForm = ref('');

const tipos = TIPOS_MATERIAL;

const form = reactive({ _id: '', titulo: '', descripcion: '', tipo: '', url: '' });

async function cargar() {
  try {
    error.value = '';
    cargando.value = true;
    const params = { page: pagina.value, limit: limite };
    if (busqueda.value) params.q = busqueda.value;
    if (filtroTipo.value) params.tipo = filtroTipo.value;
    if (soloActivos.value) params.activo = 'true';
    const datos = await getMateriales(auth.token, params);
    materiales.value = datos.materiales;
    total.value = datos.total;
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

function limpiar() {
  Object.assign(form, { _id: '', titulo: '', descripcion: '', tipo: '', url: '' });
  editando.value = false;
}

function abrirNuevo() {
  limpiar();
  errorForm.value = '';
  formAbierto.value = true;
}

function cerrarForm() {
  formAbierto.value = false;
  errorForm.value = '';
  limpiar();
}

async function guardar() {
  try {
    error.value = '';
    errorForm.value = '';
    mensaje.value = '';
    if (!form.titulo || !form.descripcion || !form.tipo) {
      errorForm.value = 'Título, descripción y tipo son obligatorios';
      return;
    }
    if (editando.value) {
      await updateMaterial(auth.token, form._id, {
        titulo: form.titulo, descripcion: form.descripcion, tipo: form.tipo, url: form.url
      });
      mensaje.value = 'Material actualizado';
    } else {
      await createMaterial(auth.token, {
        titulo: form.titulo, descripcion: form.descripcion, tipo: form.tipo, url: form.url
      });
      mensaje.value = 'Material registrado';
    }
    cerrarForm();
    await cargar();
  } catch (e) {
    errorForm.value = e.message;
  }
}

function editar(m) {
  errorForm.value = '';
  formAbierto.value = true;
  editando.value = true;
  Object.assign(form, {
    _id: m._id, titulo: m.titulo, descripcion: m.descripcion, tipo: m.tipo, url: m.url || ''
  });
}

async function toggleActivo(m) {
  try {
    error.value = '';
    await updateMaterial(auth.token, m._id, { activo: !m.activo });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>
