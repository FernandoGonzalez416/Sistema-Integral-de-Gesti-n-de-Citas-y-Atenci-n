<template>
  <main class="contenedor">
    <h1>Profesionales</h1>
    <p class="ayuda">
      Cada profesional se vincula a un usuario con rol PROFESIONAL. Ese vínculo define
      qué citas y pacientes puede ver en el sistema.
    </p>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mensaje" class="ok">{{ mensaje }}</p>

    <Card :titulo="editando ? 'Editar profesional' : 'Registrar profesional'">
      <form @submit.prevent="guardar">
        <div class="fila">
          <label class="campo">
            <span>Nombre *</span>
            <input v-model="form.nombre" required maxlength="80" />
          </label>
          <label class="campo">
            <span>Apellido *</span>
            <input v-model="form.apellido" required maxlength="80" />
          </label>
        </div>
        <div class="fila">
          <label class="campo">
            <span>Especialidad *</span>
            <input v-model="form.especialidad" required maxlength="80" />
          </label>
          <label class="campo">
            <span>Teléfono *</span>
            <input v-model="form.telefono" required maxlength="30" />
          </label>
        </div>
        <div class="fila">
          <label class="campo">
            <span>DNI *</span>
            <input v-model="form.dni" required maxlength="30" />
          </label>
          <label class="campo">
            <span>Matrícula *</span>
            <input v-model="form.matricula" required maxlength="30" />
          </label>
        </div>
        <div class="fila">
          <label class="campo">
            <span>Email (opcional)</span>
            <input type="email" v-model="form.email" maxlength="120" />
          </label>
          <label class="campo">
            <span>Usuario vinculado *</span>
            <select v-model="form.usuarioId" required>
              <option value="">Selecciona un usuario PROFESIONAL</option>
              <option v-for="u in usuariosDisponibles" :key="u.id" :value="u.id">
                {{ u.nombre }} ({{ u.email }})
              </option>
            </select>
          </label>
        </div>
        <p v-if="usuariosDisponibles.length === 0" class="aviso">
          No hay usuarios PROFESIONAL activos disponibles. Crea uno en Usuarios antes de registrar al profesional.
        </p>
        <div class="acciones">
          <button type="submit" class="principal" :disabled="guardando">
            {{ guardando ? 'Guardando…' : (editando ? 'Guardar cambios' : 'Registrar profesional') }}
          </button>
          <button type="button" class="secundario" v-if="editando" @click="limpiar">Cancelar</button>
        </div>
      </form>
    </Card>

    <Card titulo="Lista de profesionales">
      <div v-if="cargando">Cargando…</div>
      <table v-else>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Especialidad</th>
            <th>Contacto</th>
            <th>Usuario vinculado</th>
            <th>Activo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in profesionales" :key="p._id">
            <td>{{ p.nombre }} {{ p.apellido }}</td>
            <td>{{ p.especialidad }}</td>
            <td>
              {{ p.telefono }}<br />
              <small>{{ p.email || 'Sin email' }}</small>
            </td>
            <td>
              <template v-if="p.usuario">{{ p.usuario.nombre }}<br /><small>{{ p.usuario.email }}</small></template>
              <template v-else>Sin vincular</template>
            </td>
            <td>{{ p.activo ? 'Sí' : 'No' }}</td>
            <td class="acciones-celda">
              <button class="mini secundario" @click="editar(p)">Editar</button>
              <button v-if="p.activo" class="mini peligro" @click="desactivar(p)">Desactivar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!cargando && profesionales.length === 0">No hay profesionales registrados.</p>
    </Card>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getProfesionales, createProfesional, updateProfesional, desactivarProfesional,
  getUsuarios
} from '../api/client.js';
import Card from '../components/Card.vue';

const auth = useAuthStore();
const profesionales = ref([]);
const usuarios = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const editando = ref(false);
const error = ref('');
const mensaje = ref('');

const form = reactive({
  _id: '', nombre: '', apellido: '', especialidad: '', telefono: '',
  email: '', dni: '', matricula: '', usuarioId: ''
});

const usuariosDisponibles = computed(() => {
  const vinculados = new Set(
    profesionales.value
      .filter((p) => String(p._id) !== String(form._id) && p.usuario)
      .map((p) => String(p.usuario._id))
  );
  return usuarios.value.filter(
    (u) => u.rol === 'PROFESIONAL' && u.activo && !vinculados.has(String(u.id))
  );
});

function limpiar() {
  Object.assign(form, {
    _id: '', nombre: '', apellido: '', especialidad: '', telefono: '',
    email: '', dni: '', matricula: '', usuarioId: ''
  });
  editando.value = false;
}

async function cargar() {
  try {
    error.value = '';
    cargando.value = true;
    const [profs, users] = await Promise.all([
      getProfesionales(auth.token, { limit: 500 }),
      getUsuarios(auth.token)
    ]);
    profesionales.value = profs.profesionales || [];
    usuarios.value = users.usuarios || [];
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

function editar(p) {
  editando.value = true;
  Object.assign(form, {
    _id: p._id,
    nombre: p.nombre,
    apellido: p.apellido,
    especialidad: p.especialidad,
    telefono: p.telefono,
    email: p.email || '',
    dni: p.dni,
    matricula: p.matricula,
    usuarioId: p.usuario?._id || ''
  });
}

async function guardar() {
  try {
    error.value = '';
    mensaje.value = '';
    guardando.value = true;
    const datos = {
      nombre: form.nombre,
      apellido: form.apellido,
      especialidad: form.especialidad,
      telefono: form.telefono,
      email: form.email,
      dni: form.dni,
      matricula: form.matricula,
      usuarioId: form.usuarioId
    };
    if (editando.value) {
      await updateProfesional(auth.token, form._id, datos);
      mensaje.value = 'Profesional actualizado';
    } else {
      await createProfesional(auth.token, datos);
      mensaje.value = 'Profesional registrado';
    }
    limpiar();
    await cargar();
  } catch (e) {
    error.value = e.message;
  } finally {
    guardando.value = false;
  }
}

async function desactivar(p) {
  if (!window.confirm(`¿Desactivar a ${p.nombre} ${p.apellido}?`)) return;
  try {
    error.value = '';
    mensaje.value = '';
    await desactivarProfesional(auth.token, p._id);
    mensaje.value = 'Profesional desactivado';
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>

<style scoped>
.contenedor { max-width: 1050px; margin: 2rem auto; font-family: sans-serif; }
.ayuda { color: #555; margin-top: 0; }
.error { color: #c0392b; }
.ok { color: #1e7e34; }
.aviso { color: #8a6d3b; background: #fcf8e3; padding: 0.5rem; border-radius: 4px; }
.campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.5rem; }
.campo > span { font-size: 0.85rem; color: #555; }
.campo input, .campo select { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font: inherit; }
.fila { display: flex; gap: 1rem; }
.fila > * { flex: 1; }
.acciones { display: flex; gap: 0.5rem; }
.acciones-celda { display: flex; gap: 0.35rem; }
button { padding: 0.45rem 0.8rem; border: 1px solid #1a5c8a; border-radius: 4px; background: #1a5c8a; color: #fff; cursor: pointer; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.principal { background: #1a5c8a; }
.secundario { background: #6c757d; border-color: #6c757d; }
.peligro { background: #c0392b; border-color: #c0392b; }
.mini { padding: 0.3rem 0.55rem; font-size: 0.82rem; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; vertical-align: top; }
@media (max-width: 720px) { .fila { flex-direction: column; } }
</style>
