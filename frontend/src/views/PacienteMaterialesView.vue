<template>
  <main class="contenedor">
    <h1>Materiales de {{ paciente.nombre }} {{ paciente.apellido }}</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <Card titulo="Asignar material">
      <form @submit.prevent="asignar">
        <label class="campo">
          <span>Material</span>
          <select v-model="form.materialId" required>
            <option value="">Selecciona un material</option>
            <option v-for="m in disponibles" :key="m._id" :value="m._id">
              {{ m.titulo }} ({{ m.tipo }})
            </option>
          </select>
        </label>
        <FormField etiqueta="Notas (opcional)" v-model="form.notas" placeholder="Indicaciones para el paciente" />
        <button type="submit">Asignar</button>
      </form>
    </Card>

    <Card titulo="Materiales asignados">
      <div v-if="cargando">Cargando…</div>
      <ul v-else>
        <li v-for="rel in relaciones" :key="rel._id">
          <span>
            <strong>{{ rel.material?.titulo }}</strong> — {{ rel.material?.tipo }}
            <span v-if="rel.notas"> · {{ rel.notas }}</span>
          </span>
          <button @click="desasignar(rel._id)">Desasignar</button>
        </li>
        <li v-if="relaciones.length === 0">Sin materiales asignados.</li>
      </ul>
    </Card>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import {
  getPaciente, getMateriales, getMaterialesPaciente, asignarMaterial, desasignarMaterial
} from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const route = useRoute();
const auth = useAuthStore();

const pacienteId = route.params.pacienteId;
const paciente = ref({ nombre: '', apellido: '' });
const relaciones = ref([]);
const disponibles = ref([]);
const cargando = ref(false);
const error = ref('');
const form = reactive({ materialId: '', notas: '' });

async function cargar() {
  try {
    error.value = '';
    cargando.value = true;
    const [pac, rels, todos] = await Promise.all([
      getPaciente(auth.token, pacienteId).then(d => d.paciente),
      getMaterialesPaciente(auth.token, pacienteId),
      getMateriales(auth.token, { activo: 'true', limit: 200 })
    ]);
    paciente.value = pac || { nombre: '', apellido: '' };
    relaciones.value = rels.relaciones;
    const asociadosIds = new Set(rels.relaciones.map(r => r.material?._id).filter(Boolean));
    disponibles.value = todos.materiales.filter(m => !asociadosIds.has(m._id));
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

async function asignar() {
  try {
    error.value = '';
    await asignarMaterial(auth.token, pacienteId, form.materialId, form.notas);
    form.materialId = '';
    form.notas = '';
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

async function desasignar(relacionId) {
  try {
    error.value = '';
    await desasignarMaterial(auth.token, pacienteId, relacionId);
    await cargar();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(cargar);
</script>

<style scoped>
.contenedor { max-width: 700px; margin: 2rem auto; font-family: sans-serif; }
.error { color: red; }
.campo { display: flex; flex-direction: column; gap: 0.25rem; }
.campo select { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
ul { list-style: none; padding: 0; }
li { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #eee; }
</style>
