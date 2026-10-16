<template>
  <main class="contenedor">
    <h1>Contacto</h1>
    <Card titulo="Datos de contacto">
      <p><strong>{{ datos.nombre }}</strong></p>
      <p>Email: {{ datos.email }}</p>
      <p>Teléfono: {{ datos.telefono }}</p>
      <p>Dirección: {{ datos.direccion }}</p>
    </Card>

    <Card titulo="Escríbenos">
      <form @submit.prevent="enviar">
        <FormField etiqueta="Nombre" v-model="form.nombre" placeholder="Tu nombre" />
        <FormField etiqueta="Email" type="email" v-model="form.email" placeholder="tu@correo.com" />
        <FormField etiqueta="Mensaje (mín. 10 caracteres)" v-model="form.mensaje" placeholder="¿En qué te ayudamos?" />
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="enviado" class="ok">Mensaje recibido. Te contactaremos pronto.</p>
        <button type="submit">Enviar</button>
      </form>
    </Card>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { getContacto, postContacto } from '../api/client.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const datos = reactive({ nombre: '…', email: '…', telefono: '…', direccion: '…' });
const form = reactive({ nombre: '', email: '', mensaje: '' });
const error = ref('');
const enviado = ref(false);

async function enviar() {
  try {
    error.value = '';
    enviado.value = false;
    await postContacto({ ...form });
    enviado.value = true;
    Object.assign(form, { nombre: '', email: '', mensaje: '' });
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(async () => {
  try {
    const contenidos = await getContacto();
    const porClave = Object.fromEntries(contenidos.map((c) => [c.clave, c.cuerpo]));
    datos.nombre = porClave['contacto-nombre'] || datos.nombre;
    datos.email = porClave['contacto-email'] || datos.email;
    datos.telefono = porClave['contacto-telefono'] || datos.telefono;
    datos.direccion = porClave['contacto-direccion'] || datos.direccion;
  } catch {
    // se quedan los valores por defecto
  }
});
</script>

<style>
.contenedor { max-width: 640px; margin: 2rem auto; font-family: sans-serif; }
</style>
