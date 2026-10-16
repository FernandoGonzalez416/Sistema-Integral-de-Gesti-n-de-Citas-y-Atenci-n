<template>
  <main class="contenedor">
    <h1>Materiales educativos</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mensaje" class="ok">{{ mensaje }}</p>

    <Card :titulo="editando ? 'Editar material' : 'Registrar material'">
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
          <button type="submit">{{ editando ? 'Guardar cambios' : 'Registrar' }}</button>
          <button type="button" class="secundario" v-if="editando" @click="limpiar">Cancelar</button>
        </div>
      </form>
    </Card>

    <Card titulo="Buscar">
      <div class="fila">
        <FormField etiqueta="Buscar (título, descripción)" v-model="busqueda" />
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
          <tr><th>Título</th><th>Tipo</th><th>Descripción</th><th>Activo</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="m in materiales" :key="m._id">
            <td>{{ m.titulo }}</td>
            <td>{{ m.tipo }}</td>
            <td class="desc">{{ m.descripcion }}</td>
            <td>{{ m.activo ? 'Sí' : 'No' }}</td>
            <td class="acciones-celda">
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
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getMateriales, createMaterial, updateMaterial, desactivarMaterial
} from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

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

const tipos = ['DOCUMENTO', 'VIDEO', 'ENLACE', 'OTRO'];

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

async function guardar() {
  try {
    error.value = '';
    mensaje.value = '';
    if (!form.titulo || !form.descripcion || !form.tipo) {
      error.value = 'Título, descripción y tipo son obligatorios';
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
    limpiar();
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

function editar(m) {
  editando.value = true;
  Object.assign(form, {
    _id: m._id, titulo: m.titulo, descripcion: m.descripcion, tipo: m.tipo, url: m.url || ''
  });
}

async function toggleActivo(m) {
  try {
    error.value = '';
    if (m.activo) {
      await desactivarMaterial(auth.token, m._id);
    } else {
      await updateMaterial(auth.token, m._id, { activo: true });
    }
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>

<style scoped>
.contenedor { max-width: 900px; margin: 2rem auto; font-family: sans-serif; }
.error { color: red; }
.ok { color: green; }
.fila { display: flex; gap: 1rem; }
.fila > * { flex: 1; }
.campo { display: flex; flex-direction: column; gap: 0.25rem; }
.campo select { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; }
.desc { max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.acciones { display: flex; gap: 0.5rem; }
.acciones-celda { display: flex; gap: 0.5rem; }
.secundario { background: #888; }
.paginacion { display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; }
</style>
