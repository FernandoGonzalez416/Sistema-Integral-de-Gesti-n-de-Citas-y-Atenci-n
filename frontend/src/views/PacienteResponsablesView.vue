<template>
  <main class="contenedor">
    <h1>Responsables de {{ paciente.nombre }} {{ paciente.apellido }} ({{ paciente.edad }} años)</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <Card titulo="Asociar responsable">
      <form @submit.prevent="asociar">
        <label class="campo">
          <span>Responsable</span>
          <select v-model="form.responsableId" required>
            <option value="">Selecciona un responsable</option>
            <option v-for="r in disponibles" :key="r._id" :value="r._id">
              {{ r.nombre }} {{ r.apellido }} ({{ r.parentesco }})
            </option>
          </select>
        </label>
        <button type="submit">Asociar</button>
      </form>
      <p class="ayuda" v-if="paciente.edad !== null && paciente.edad < 18">
        ⚠ Paciente menor de edad: debe tener al menos un responsable activo.
      </p>
    </Card>

    <Card titulo="Responsables actuales">
      <div v-if="cargando">Cargando…</div>
      <ul v-else>
        <li v-for="rel in relaciones" :key="rel._id">
          {{ rel.responsable.nombre }} {{ rel.responsable.apellido }} — {{ rel.responsable.parentesco }} ({{ rel.responsable.telefono }})
          <button @click="desasociar(rel._id)">Desasociar</button>
        </li>
        <li v-if="relaciones.length === 0">Sin responsables asociados.</li>
      </ul>
    </Card>
  </main>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { getPacientes, getResponsables, getRelaciones, asociarResponsable, desasociarResponsable } from '../api/client.js';
import Card from '../components/Card.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const pacienteId = route.params.pacienteId;
const paciente = ref({ nombre: '', apellido: '', edad: null });
const relaciones = ref([]);
const disponibles = ref([]);
const cargando = ref(false);
const error = ref('');
const form = reactive({ responsableId: '' });

async function cargar() {
  try {
    error.value = '';
    cargando.value = true;
    const [pac, rels, todosResp] = await Promise.all([
      getPacientes(auth.token, { q: pacienteId, limit: 1 }).then(d => d.pacientes[0]),
      getRelaciones(auth.token, pacienteId),
      getResponsables(auth.token, { activo: 'true' })
    ]);
    paciente.value = pac || { nombre: '', apellido: '', edad: null };
    relaciones.value = rels.relaciones;
    // Filtrar los ya asociados
    const asociadosIds = new Set(rels.relaciones.map(r => r.responsable._id));
    disponibles.value = todosResp.responsables.filter(r => !asociadosIds.has(r._id));
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

async function asociar() {
  try {
    error.value = '';
    await asociarResponsable(auth.token, pacienteId, form.responsableId);
    form.responsableId = '';
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

async function desasociar(relacionId) {
  try {
    error.value = '';
    await desasociarResponsable(auth.token, pacienteId, relacionId);
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>

<style>
.contenedor { max-width: 700px; margin: 2rem auto; font-family: sans-serif; }
.error { color: red; }
.ayuda { color: #b8860b; font-size: 0.9rem; }
ul { list-style: none; padding: 0; }
li { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #eee; }
</style>