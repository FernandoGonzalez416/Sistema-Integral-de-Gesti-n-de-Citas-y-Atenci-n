<template>
  <h1>Usuarios</h1>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="mensaje" class="ok">{{ mensaje }}</p>

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
            <button class="secundario" @click="abrirReset(u)">Restablecer contraseña</button>
          </td>
        </tr>
      </tbody>
    </table>
  </Card>

  <div v-if="reset.abierto" class="modal-fondo" @click.self="cerrarReset">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="reset-titulo">
      <h2 id="reset-titulo">Restablecer contraseña</h2>
      <p>
        Usuario: <strong>{{ reset.usuario?.nombre }}</strong>
        <small>({{ reset.usuario?.email }})</small>
      </p>
      <form @submit.prevent="guardarReset">
        <FormField etiqueta="Nueva contraseña (mín. 6)" type="password" v-model="reset.password" />
        <p class="nota">La contraseña anterior dejará de funcionar de inmediato. No se muestra ni se guarda en la interfaz.</p>
        <div class="acciones">
          <button type="submit" :disabled="reset.guardando">
            {{ reset.guardando ? 'Guardando…' : 'Restablecer' }}
          </button>
          <button type="button" class="secundario" @click="cerrarReset">Cancelar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { getUsuarios, createUsuario, updateUsuario, restablecerPasswordUsuario } from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const auth = useAuthStore();
const usuarios = ref([]);
const error = ref('');
const mensaje = ref('');
const form = reactive({ nombre: '', email: '', password: '', rol: 'RECEPCIONISTA' });
const reset = reactive({ abierto: false, usuario: null, password: '', guardando: false });

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
    mensaje.value = '';
    await createUsuario(auth.token, { ...form });
    Object.assign(form, { nombre: '', email: '', password: '', rol: 'RECEPCIONISTA' });
    mensaje.value = 'Usuario registrado';
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

async function cambiarActivo(u) {
  try {
    error.value = '';
    mensaje.value = '';
    await updateUsuario(auth.token, u.id, { activo: !u.activo });
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

function abrirReset(u) {
  reset.abierto = true;
  reset.usuario = u;
  reset.password = '';
  error.value = '';
  mensaje.value = '';
}

function cerrarReset() {
  reset.abierto = false;
  reset.usuario = null;
  reset.password = '';
  reset.guardando = false;
}

async function guardarReset() {
  try {
    error.value = '';
    mensaje.value = '';
    reset.guardando = true;
    await restablecerPasswordUsuario(auth.token, reset.usuario.id, reset.password);
    mensaje.value = `Contraseña restablecida para ${reset.usuario.email}`;
    cerrarReset();
  } catch (e) {
    error.value = e.message;
  } finally {
    reset.guardando = false;
  }
}

onMounted(cargar);
</script>

<style>
.error { color: red; }
.ok { color: #1e7e34; }
.campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
.campo select { padding: 0.5rem; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; }
.secundario { background: #6c757d; border-color: #6c757d; margin-left: 0.35rem; }
.modal-fondo { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 8px; padding: 1.5rem; width: min(440px, 92vw); box-shadow: 0 8px 30px rgba(0,0,0,0.25); }
.modal h2 { margin-top: 0; }
.nota { color: #666; font-size: 0.85rem; }
.acciones { display: flex; gap: 0.5rem; }
</style>
