<template>
  <Card titulo="Iniciar sesión">
    <form @submit.prevent="entrar">
      <FormField etiqueta="Email" type="email" v-model="email" placeholder="admin@sigca.local" />
      <FormField etiqueta="Password" type="password" v-model="password" placeholder="••••••••" />
      <p v-if="auth.error" class="error">{{ auth.error }}</p>
      <button type="submit">Entrar</button>
    </form>
  </Card>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const auth = useAuthStore();
const router = useRouter();
const email = ref('');
const password = ref('');

async function entrar() {
  try {
    await auth.login(email.value, password.value);
    router.push('/admin');
  } catch (e) {
    auth.error = e.message;
  }
}
</script>

<style>
.error { color: red; }
</style>
