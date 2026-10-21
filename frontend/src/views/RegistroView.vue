<template>
  <AuthShell titulo="Crea tu cuenta" subtitulo="Solo necesitas unos datos. Podrás completar tu perfil de salud después.">
    <form novalidate @submit.prevent="registrar">
      <div class="rg-foto">
        <FotoUploader v-model="foto" :nombre="nombre" :size="104" />
        <small>Foto de perfil <em>(opcional)</em></small>
      </div>

      <InputField
        v-model="nombre"
        label="Nombre completo"
        icono="user"
        autocomplete="name"
        maxlength="120"
        :error="errores.nombre"
        @blur="validarNombre"
      />
      <InputField
        v-model="email"
        label="Correo electrónico"
        type="email"
        icono="mail"
        autocomplete="email"
        inputmode="email"
        :error="errores.email"
        @blur="validarEmail"
      />
      <InputField
        v-model="password"
        label="Contraseña"
        type="password"
        icono="lock"
        autocomplete="new-password"
        maxlength="72"
        :error="errores.password"
      />

      <!-- Fuerza de la contraseña -->
      <div v-if="password" class="rg-fuerza" :data-nivel="fuerza.nivel">
        <div class="rg-barras" aria-hidden="true"><i v-for="n in 4" :key="n" :class="{ on: n <= fuerza.nivel }"></i></div>
        <span class="rg-etiqueta">Seguridad: <strong>{{ fuerza.texto }}</strong></span>
      </div>
      <ul class="rg-reglas" aria-label="Requisitos de la contraseña">
        <li v-for="r in reglas" :key="r.texto" :class="{ ok: r.ok }">
          <Icono :name="r.ok ? 'check' : 'plus'" :size="13" /> {{ r.texto }}
        </li>
      </ul>

      <InputField
        v-model="confirmar"
        label="Confirmar contraseña"
        type="password"
        icono="lock"
        autocomplete="new-password"
        maxlength="72"
        :error="errores.confirmar"
      />

      <Transition name="rg-aviso">
        <p v-if="errorGeneral" class="lg-aviso" role="alert"><Icono name="alert" :size="18" /> {{ errorGeneral }}</p>
      </Transition>

      <button class="lg-enviar" type="submit" :disabled="cargando">
        <span v-if="!cargando" class="lg-texto">Crear mi cuenta <Icono name="arrow" :size="18" /></span>
        <span v-else class="lg-texto"><i class="lg-spin"></i> Creando cuenta…</span>
        <span class="lg-brillo" aria-hidden="true"></span>
      </button>
    </form>

    <template #pie>
      ¿Ya tienes cuenta?
      <RouterLink :to="{ name: 'login', query: $route.query.redirect ? { redirect: $route.query.redirect } : {} }">Inicia sesión</RouterLink>
    </template>
  </AuthShell>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import AuthShell from '../components/AuthShell.vue';
import InputField from '../components/InputField.vue';
import FotoUploader from '../components/FotoUploader.vue';
import Icono from '../components/Icono.vue';

const auth = useAuthStore();
const router = useRouter();

const foto = ref('');
const nombre = ref('');
const email = ref('');
const password = ref('');
const confirmar = ref('');
const cargando = ref(false);
const errorGeneral = ref('');
const errores = reactive({ nombre: '', email: '', password: '', confirmar: '' });

// El error de un campo desaparece en cuanto la persona lo corrige.
watch(nombre, () => { errores.nombre = ''; });
watch(email, () => { errores.email = ''; });
watch(password, () => { errores.password = ''; if (errores.confirmar) errores.confirmar = ''; });
watch(confirmar, () => { errores.confirmar = ''; });

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_NOMBRE = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$/u;

const reglas = computed(() => [
  { texto: '8 caracteres o más', ok: password.value.length >= 8 },
  { texto: 'Una letra', ok: /[A-Za-z]/.test(password.value) },
  { texto: 'Un número', ok: /\d/.test(password.value) }
]);

const fuerza = computed(() => {
  const p = password.value;
  let puntos = 0;
  if (p.length >= 8) puntos++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) puntos++;
  if (/\d/.test(p)) puntos++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) puntos++;
  if (p.length < 8) puntos = Math.min(puntos, 1);
  return { nivel: puntos, texto: ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'][puntos] };
});

function validarNombre() {
  const n = nombre.value.trim().replace(/\s+/g, ' ');
  errores.nombre = n.length >= 5 && RE_NOMBRE.test(n) && n.split(' ').length >= 2 ? '' : 'Escribe tu nombre completo (nombre y apellido)';
  return !errores.nombre;
}
function validarEmail() {
  errores.email = RE_EMAIL.test(email.value.trim()) ? '' : 'Escribe un correo electrónico válido';
  return !errores.email;
}
function validarPassword() {
  errores.password = reglas.value.every((r) => r.ok) ? '' : 'La contraseña no cumple los requisitos';
  errores.confirmar = confirmar.value === password.value && confirmar.value ? '' : 'Las contraseñas no coinciden';
  return !errores.password && !errores.confirmar;
}

async function registrar() {
  errorGeneral.value = '';
  const a = validarNombre();
  const b = validarEmail();
  const c = validarPassword();
  if (!(a && b && c)) return;

  cargando.value = true;
  try {
    await auth.registrar({ nombre: nombre.value.trim().replace(/\s+/g, ' '), email: email.value, password: password.value, foto: foto.value });
    router.push({ name: 'perfil', query: { bienvenida: '1' } });
  } catch (e) {
    errorGeneral.value = e.message;
  } finally {
    cargando.value = false;
  }
}
</script>

<style>
.rg-foto { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 1.3rem; }
.rg-foto small { color: #5b7686; font-size: 0.82rem; }
.rg-foto em { font-style: normal; opacity: 0.75; }

.rg-fuerza { display: flex; align-items: center; gap: 0.7rem; margin: -0.3rem 0.2rem 0.5rem; }
.rg-barras { display: flex; gap: 4px; flex: 1; }
.rg-barras i { flex: 1; height: 6px; border-radius: 4px; background: #dbe7ee; transition: background 0.3s, transform 0.3s; transform-origin: left; }
.rg-fuerza[data-nivel='1'] .rg-barras i.on { background: #e05252; }
.rg-fuerza[data-nivel='2'] .rg-barras i.on { background: #e8a33a; }
.rg-fuerza[data-nivel='3'] .rg-barras i.on { background: #4fb286; }
.rg-fuerza[data-nivel='4'] .rg-barras i.on { background: #1f9d8f; }
.rg-etiqueta { font-size: 0.8rem; color: #5b7686; white-space: nowrap; }

.rg-reglas { list-style: none; margin: 0 0 1rem 0.2rem; padding: 0; display: flex; flex-wrap: wrap; gap: 0.4rem 0.9rem; }
.rg-reglas li { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: #7a93a2; transition: color 0.25s; }
.rg-reglas li .icono { padding: 2px; border-radius: 50%; background: #e3edf2; color: #7a93a2; box-sizing: content-box; transition: background 0.25s, color 0.25s, transform 0.3s; }
.rg-reglas li.ok { color: #1a7f72; }
.rg-reglas li.ok .icono { background: #1f9d8f; color: #fff; transform: scale(1.15) rotate(360deg); }

.rg-aviso-enter-active, .rg-aviso-leave-active { transition: opacity 0.25s, transform 0.25s; }
.rg-aviso-enter-from, .rg-aviso-leave-to { opacity: 0; transform: translateY(-6px); }
@media (prefers-reduced-motion: reduce) {
  .rg-barras i, .rg-reglas li, .rg-reglas li .icono { transition: none; }
}
</style>
