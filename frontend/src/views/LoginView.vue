<template>
  <AuthShell titulo="Bienvenido de nuevo" subtitulo="Inicia sesión para acceder a tu cuenta">
    <form novalidate @submit.prevent="entrar">
      <InputField
        v-model="email"
        label="Correo electrónico"
        type="email"
        icono="mail"
        autocomplete="username"
        inputmode="email"
        :error="errores.email"
        @blur="validarEmail"
      />
      <InputField
        v-model="password"
        label="Contraseña"
        type="password"
        icono="lock"
        autocomplete="current-password"
        :error="errores.password"
      />

      <Transition name="lg-aviso">
        <p v-if="errorGeneral" class="lg-aviso" role="alert">
          <Icono name="alert" :size="18" /> {{ errorGeneral }}
        </p>
      </Transition>

      <button class="lg-enviar" type="submit" :disabled="cargando">
        <span v-if="!cargando" class="lg-texto">Iniciar sesión <Icono name="arrow" :size="18" /></span>
        <span v-else class="lg-texto"><i class="lg-spin"></i> Verificando…</span>
        <span class="lg-brillo" aria-hidden="true"></span>
      </button>
    </form>

    <template #pie>
      ¿Aún no tienes cuenta?
      <RouterLink :to="{ name: 'registro', query: $route.query.redirect ? { redirect: $route.query.redirect } : {} }">Regístrate gratis</RouterLink>
    </template>
  </AuthShell>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import AuthShell from '../components/AuthShell.vue';
import InputField from '../components/InputField.vue';
import Icono from '../components/Icono.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const cargando = ref(false);
const errorGeneral = ref('');
const errores = reactive({ email: '', password: '' });

watch(email, () => { errores.email = ''; errorGeneral.value = ''; });
watch(password, () => { errores.password = ''; errorGeneral.value = ''; });

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validarEmail() {
  errores.email = !email.value.trim()
    ? 'Escribe tu correo electrónico'
    : RE_EMAIL.test(email.value.trim()) ? '' : 'El correo no parece válido';
  return !errores.email;
}

// Solo se aceptan rutas internas para evitar redirecciones a otros sitios.
function destino() {
  const r = route.query.redirect;
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : auth.rutaInicio;
}

async function entrar() {
  errorGeneral.value = '';
  const okEmail = validarEmail();
  errores.password = password.value ? '' : 'Escribe tu contraseña';
  if (!okEmail || errores.password) return;

  cargando.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push(destino());
  } catch (e) {
    errorGeneral.value = e.message;
  } finally {
    cargando.value = false;
  }
}
</script>