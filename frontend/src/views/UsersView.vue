<template>
  <div>
  <div class="cab-pagina">
    <div>
      <h1>Usuarios</h1>
      <p class="ayuda">Cuentas del personal que ingresa al sistema.</p>
    </div>
    <button type="button" class="principal" @click="abrirNuevo">
      <Icono name="plus" :size="18" /> Nuevo usuario
    </button>
  </div>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="mensaje" class="ok">{{ mensaje }}</p>


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

  <!-- Ventanita: registrar usuario -->
  <AdminModal
    :abierto="nuevoAbierto"
    titulo="Registrar usuario"
    subtitulo="Crea una cuenta para el personal del centro."
    icono="id-card"
    ancho="sm"
    :bloquear="guardandoNuevo"
    @cerrar="cerrarNuevo"
  >
    <p v-if="errorModal" class="error" role="alert">{{ errorModal }}</p>
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
        <div class="acciones">
        <button type="submit" class="principal" :disabled="guardandoNuevo">{{ guardandoNuevo ? 'Guardando…' : 'Registrar usuario' }}</button>
        <button type="button" class="secundario" :disabled="guardandoNuevo" @click="cerrarNuevo">Cancelar</button>
      </div>
      </form>
  </AdminModal>

  <!-- Ventanita: restablecer contraseña -->
  <AdminModal
    :abierto="reset.abierto"
    titulo="Restablecer contraseña"
    icono="key"
    ancho="sm"
    :bloquear="reset.guardando"
    @cerrar="cerrarReset"
  >
    <p v-if="errorModal" class="error" role="alert">{{ errorModal }}</p>
    <p>
      Usuario: <strong>{{ reset.usuario?.nombre }}</strong>
      <small>({{ reset.usuario?.email }})</small>
    </p>
  <form @submit.prevent="guardarReset">
          <FormField etiqueta="Nueva contraseña (mín. 6)" type="password" v-model="reset.password" />
          <p class="nota">La contraseña anterior dejará de funcionar de inmediato. No se muestra ni se guarda en la interfaz.</p>
          <div class="acciones">
            <button type="submit" class="principal" :disabled="reset.guardando">
              {{ reset.guardando ? 'Guardando…' : 'Restablecer contraseña' }}
            </button>
            <button type="button" class="secundario" :disabled="reset.guardando" @click="cerrarReset">Cancelar</button>
          </div>
        </form>
  </AdminModal>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { getUsuarios, createUsuario, updateUsuario, restablecerPasswordUsuario } from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';
import AdminModal from '../components/AdminModal.vue';
import Icono from '../components/Icono.vue';

const auth = useAuthStore();
const usuarios = ref([]);
const error = ref('');
const mensaje = ref('');
const errorModal = ref('');
const nuevoAbierto = ref(false);
const guardandoNuevo = ref(false);
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

function abrirNuevo() {
  Object.assign(form, { nombre: '', email: '', password: '', rol: 'RECEPCIONISTA' });
  errorModal.value = '';
  nuevoAbierto.value = true;
}

function cerrarNuevo() {
  if (guardandoNuevo.value) return;
  nuevoAbierto.value = false;
  errorModal.value = '';
}

async function crear() {
  try {
    error.value = '';
    errorModal.value = '';
    mensaje.value = '';
    guardandoNuevo.value = true;
    await createUsuario(auth.token, { ...form });
    Object.assign(form, { nombre: '', email: '', password: '', rol: 'RECEPCIONISTA' });
    mensaje.value = 'Usuario registrado';
    guardandoNuevo.value = false;
    cerrarNuevo();
    await cargar();
  } catch (e) {
    errorModal.value = e.message;
  } finally {
    guardandoNuevo.value = false;
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
  errorModal.value = '';
  mensaje.value = '';
}

function cerrarReset() {
  if (reset.guardando) return;
  reset.abierto = false;
  errorModal.value = '';
  reset.usuario = null;
  reset.password = '';
  reset.guardando = false;
}

async function guardarReset() {
  try {
    error.value = '';
    errorModal.value = '';
    mensaje.value = '';
    reset.guardando = true;
    await restablecerPasswordUsuario(auth.token, reset.usuario.id, reset.password);
    mensaje.value = `Contraseña restablecida para ${reset.usuario.email}`;
    reset.guardando = false;
    cerrarReset();
  } catch (e) {
    errorModal.value = e.message;
  } finally {
    reset.guardando = false;
  }
}

onMounted(cargar);
</script>
