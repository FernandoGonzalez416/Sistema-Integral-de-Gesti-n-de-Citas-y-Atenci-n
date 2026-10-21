<template>
  <h1>Usuarios</h1>
  <p v-if="error" class="error">{{ error }}</p>

  <Card titulo="Registrar usuario">
    <form @submit.prevent="crear">
      <FormField etiqueta="Nombre" v-model="form.nombre" placeholder="Nombre completo" />
      <FormField etiqueta="Email" type="email" v-model="form.email" placeholder="usuario@sigca.local" />
      <FormField etiqueta="Password (mín. 6)" type="password" v-model="form.password" />
      <label class="campo">
        <span>Rol</span>
        <select v-model="form.rol">
          <option>ADMINISTRADOR</option>
          <option>RECEPCIONISTA</option>
          <option>PROFESIONAL</option>
        </select>
      </label>
      <button type="submit">Registrar</button>
    </form>
  </Card>

  <Card titulo="Lista de usuarios">
    <table>
      <thead>
        <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Activo</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="u in usuarios" :key="u.id">
          <td>{{ u.nombre }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.rol }}</td>
          <td>{{ u.activo ? 'Sí' : 'No' }}</td>
          <td>
            <button @click="cambiarActivo(u)">{{ u.activo ? 'Desactivar' : 'Activar' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </Card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { getUsuarios, createUsuario, updateUsuario } from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const auth = useAuthStore();
const usuarios = ref([]);
const error = ref('');
const form = reactive({ nombre: '', email: '', password: '', rol: 'RECEPCIONISTA' });

async function cargar() {
  try {
    error.value = '';
    const datos = await getUsuarios(auth.token);
    usuarios.value = datos.usuarios;
  } catch (e) {
    error.value = e.message;
  }
}

async function crear() {
  try {
    error.value = '';
    await createUsuario(auth.token, { ...form });
    Object.assign(form, { nombre: '', email: '', password: '', rol: 'RECEPCIONISTA' });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

async function cambiarActivo(u) {
  try {
    error.value = '';
    await updateUsuario(auth.token, u.id, { activo: !u.activo });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>

<style>
.error { color: red; }
.campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
.campo select { padding: 0.5rem; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; }
</style>
