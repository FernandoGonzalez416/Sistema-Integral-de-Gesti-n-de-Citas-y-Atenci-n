<template>
  <main class="contenedor">
    <h1>Solicitar cita</h1>
    <Card titulo="Tus datos">
      <form @submit.prevent="enviar">
        <FormField etiqueta="Nombre completo" v-model="form.nombre" placeholder="Tu nombre" />
        <FormField etiqueta="Teléfono" v-model="form.telefono" placeholder="0000-0000" />
        <FormField etiqueta="Email (opcional)" type="email" v-model="form.email" />
        <label class="campo">
          <span>Servicio (opcional)</span>
          <select v-model="form.servicio">
            <option value="">Sin preferencia</option>
            <option v-for="s in servicios" :key="s._id" :value="s._id">{{ s.nombre }}</option>
          </select>
        </label>
        <FormField etiqueta="Fecha preferida (opcional)" type="date" v-model="form.fechaPreferida" />
        <FormField etiqueta="Mensaje (opcional)" v-model="form.mensaje" placeholder="Cuéntanos tu caso" />
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="enviado" class="ok">Solicitud recibida. Te contactaremos para confirmar.</p>
        <button type="submit">Enviar solicitud</button>
      </form>
    </Card>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { getServicios, postSolicitud } from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const servicios = ref([]);
const form = reactive({ nombre: '', telefono: '', email: '', servicio: '', fechaPreferida: '', mensaje: '' });
const error = ref('');
const enviado = ref(false);

onMounted(async () => {
  try {
    servicios.value = await getServicios();
  } catch {
    servicios.value = [];
  }
});

async function enviar() {
  try {
    error.value = '';
    enviado.value = false;
    const datos = { ...form };
    if (!datos.servicio) delete datos.servicio;
    if (!datos.fechaPreferida) delete datos.fechaPreferida;
    await postSolicitud(datos);
    enviado.value = true;
    Object.assign(form, { nombre: '', telefono: '', email: '', servicio: '', fechaPreferida: '', mensaje: '' });
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<style>
.contenedor { max-width: 640px; margin: 2rem auto; font-family: sans-serif; }
.error { color: red; }
.ok { color: green; }
.campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
</style>
