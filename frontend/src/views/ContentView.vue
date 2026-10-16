<template>
  <h1>Contenido institucional</h1>
  <p v-if="error" class="error">{{ error }}</p>

  <Card titulo="Bloques de texto (misión, visión, contacto…)">
    <div v-for="c in contenidos" :key="c._id" class="bloque">
      <strong>{{ c.titulo }} ({{ c.clave }})</strong>
      <textarea v-model="c.cuerpo" rows="3"></textarea>
      <button @click="guardarBloque(c)">Guardar</button>
      <button @click="toggleBloque(c)">{{ c.activo ? 'Desactivar' : 'Activar' }}</button>
    </div>
  </Card>

  <Card titulo="Horarios de atención">
    <table>
      <thead>
        <tr><th>Día</th><th>Inicio</th><th>Fin</th><th>Activo</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="h in horarios" :key="h._id">
          <td>{{ DIAS[h.dia] }}</td>
          <td><input v-model="h.horaInicio" size="5" /></td>
          <td><input v-model="h.horaFin" size="5" /></td>
          <td>{{ h.activo ? 'Sí' : 'No' }}</td>
          <td>
            <button @click="guardarHorario(h)">Guardar</button>
            <button @click="toggleHorario(h)">{{ h.activo ? 'Desactivar' : 'Activar' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </Card>

  <Card titulo="Publicaciones">
    <form @submit.prevent="crearPublicacion">
      <FormField etiqueta="Título" v-model="pub.titulo" />
      <FormField etiqueta="Descripción" v-model="pub.descripcion" />
      <label class="campo">
        <span>Tipo</span>
        <select v-model="pub.tipo">
          <option>EDUCATIVO</option>
          <option>CORPORATIVO</option>
        </select>
      </label>
      <FormField etiqueta="Imagen URL (opcional)" v-model="pub.imagenUrl" />
      <FormField etiqueta="Enlace (opcional)" v-model="pub.enlace" />
      <button type="submit">Publicar</button>
    </form>
    <ul>
      <li v-for="p in publicaciones" :key="p._id">
        [{{ p.tipo }}] {{ p.titulo }} ({{ p.activo ? 'visible' : 'oculta' }})
        <button @click="togglePublicacion(p)">{{ p.activo ? 'Ocultar' : 'Mostrar' }}</button>
      </li>
    </ul>
  </Card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getContentsTodos, patchContent,
  getSchedulesTodos, patchSchedule,
  getPublicationsTodas, createPublication, patchPublication
} from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const auth = useAuthStore();
const contenidos = ref([]);
const horarios = ref([]);
const publicaciones = ref([]);
const error = ref('');
const pub = reactive({ titulo: '', descripcion: '', tipo: 'EDUCATIVO', imagenUrl: '', enlace: '' });

async function cargar() {
  try {
    error.value = '';
    contenidos.value = (await getContentsTodos(auth.token)).contenidos;
    horarios.value = (await getSchedulesTodos(auth.token)).horarios;
    publicaciones.value = (await getPublicationsTodas(auth.token)).publicaciones;
  } catch (e) {
    error.value = e.message;
  }
}

async function guardarBloque(c) {
  try {
    await patchContent(auth.token, c._id, { titulo: c.titulo, cuerpo: c.cuerpo });
  } catch (e) {
    error.value = e.message;
  }
}

async function toggleBloque(c) {
  try {
    await patchContent(auth.token, c._id, { activo: !c.activo });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

async function guardarHorario(h) {
  try {
    await patchSchedule(auth.token, h._id, { horaInicio: h.horaInicio, horaFin: h.horaFin });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

async function toggleHorario(h) {
  try {
    await patchSchedule(auth.token, h._id, { activo: !h.activo });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

async function crearPublicacion() {
  try {
    error.value = '';
    await createPublication(auth.token, { ...pub });
    Object.assign(pub, { titulo: '', descripcion: '', tipo: 'EDUCATIVO', imagenUrl: '', enlace: '' });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

async function togglePublicacion(p) {
  try {
    await patchPublication(auth.token, p._id, { activo: !p.activo });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>

<style>
.error { color: red; }
.bloque { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.bloque textarea { width: 100%; }
.campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; }
</style>
