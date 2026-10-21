<template>
  <main v-if="auth.usuario" class="pf">
    <!-- ================= Cabecera ================= -->
    <header class="pf-hero">
      <div class="pf-portada" aria-hidden="true">
        <span class="pf-orbe pf-orbe-1"></span>
        <span class="pf-orbe pf-orbe-2"></span>
        <svg class="pf-ecg" viewBox="0 0 800 120" preserveAspectRatio="none">
          <path d="M0 70h180l18-34 24 80 22-62 14 16h120l18-30 24 70 20-50 12 8h348" />
        </svg>
      </div>

      <div class="pf-hero-int">
        <div class="pf-foto">
          <FotoUploader
            :model-value="auth.usuario.foto || ''"
            :nombre="auth.usuario.nombre"
            :size="132"
            :acciones="false"
            @cambio="cambiarFoto"
          />
          <button v-if="auth.usuario.foto" type="button" class="pf-quitar-foto" @click="cambiarFoto('')">
            <Icono name="x" :size="14" /> Quitar foto
          </button>
        </div>

        <div class="pf-id">
          <span class="pf-rol" :class="`rol-${auth.usuario.rol.toLowerCase()}`">
            <Icono :name="auth.esCliente ? 'heart' : 'shield'" :size="14" /> {{ ROLES[auth.usuario.rol] }}
          </span>
          <h1>{{ auth.usuario.nombre }}</h1>
          <p class="pf-correo"><Icono name="mail" :size="16" /> {{ auth.usuario.email }}</p>
          <div class="pf-meta">
            <span v-if="miembroDesde"><Icono name="calendar" :size="14" /> Miembro desde {{ miembroDesde }}</span>
            <span class="pf-sync" :class="{ pendiente: auth.pendiente }" role="status">
              <Icono :name="auth.pendiente ? 'refresh' : 'cloud'" :size="14" />
              {{ auth.sincronizando ? 'Sincronizando…' : auth.pendiente ? 'Guardado en este equipo · pendiente de sincronizar' : 'Sincronizado' }}
              <button v-if="auth.pendiente && !auth.sincronizando" type="button" @click="reintentarSync">Reintentar</button>
            </span>
          </div>
        </div>

        <div class="pf-anillo" :title="`Perfil completo al ${completitud.porcentaje}%`">
          <svg viewBox="0 0 80 80" aria-hidden="true">
            <circle class="pf-anillo-base" cx="40" cy="40" r="34" />
            <circle
              class="pf-anillo-valor"
              cx="40"
              cy="40"
              r="34"
              :stroke-dasharray="`${(completitud.porcentaje / 100) * CIRC} ${CIRC}`"
            />
          </svg>
          <span class="pf-anillo-txt"><b>{{ completitud.porcentaje }}%</b><small>completo</small></span>
        </div>
      </div>
    </header>

    <!-- Bienvenida tras registrarse -->
    <Transition name="pf-pop">
      <div v-if="bienvenida" class="pf-bienvenida" role="status">
        <span class="pf-bienv-ico"><Icono name="sparkle" :size="22" /></span>
        <div>
          <strong>¡Bienvenido/a, {{ primerNombre }}!</strong>
          <p>Tu cuenta está lista. Completa tus datos de salud para que tu médico los tenga a la mano.</p>
        </div>
        <div class="pf-bienv-acc">
          <button v-if="auth.esCliente" type="button" class="pf-btn pf-btn-blanco" @click="irASalud">Completar ahora</button>
          <button type="button" class="pf-cerrar" aria-label="Cerrar aviso" @click="cerrarBienvenida"><Icono name="x" :size="18" /></button>
        </div>
      </div>
    </Transition>

    <div class="pf-grid">
      <!-- ================= Columna lateral ================= -->
      <aside class="pf-lado">
        <template v-if="auth.esCliente">
          <section class="pf-card pf-resumen" v-brillo style="--i: 0">
            <h2><Icono name="pulse" :size="18" /> Resumen de salud</h2>

            <div class="pf-sangre" :class="{ vacio: !form.tipoSangre }">
              <span class="pf-gota"><Icono name="drop" :size="30" /></span>
              <div>
                <b>{{ form.tipoSangre || '—' }}</b>
                <small>Tipo de sangre</small>
              </div>
            </div>

            <div class="pf-mini">
              <div><b>{{ form.pesoKg !== '' ? pesoAnim : '—' }}</b><small>kg</small><span>Peso</span></div>
              <div><b>{{ form.estaturaCm !== '' ? estaturaAnim : '—' }}</b><small>cm</small><span>Estatura</span></div>
              <div><b>{{ edad !== null ? edadAnim : '—' }}</b><small>años</small><span>Edad</span></div>
            </div>

            <div class="pf-imc">
              <svg viewBox="0 0 200 118" role="img" :aria-label="imc ? `Índice de masa corporal ${imc.toFixed(1)}, ${categoriaImc.texto}` : 'Índice de masa corporal sin datos'">
                <path v-for="s in SEGMENTOS" :key="s.c" :d="s.d" :stroke="s.c" class="pf-seg-arco" />
                <g class="pf-aguja" :style="{ transform: `rotate(${anguloAguja}deg)`, opacity: imc ? 1 : 0.25 }">
                  <line x1="100" y1="100" x2="100" y2="34" />
                  <circle cx="100" cy="100" r="7" />
                </g>
              </svg>
              <div class="pf-imc-val">
                <b>{{ imc ? imcAnim.toFixed(1) : '—' }}</b>
                <span :style="{ color: categoriaImc.color }">{{ categoriaImc.texto }}</span>
              </div>
            </div>
            <p class="pf-nota"><Icono name="info" :size="14" /> El IMC es solo una referencia; tu médico interpreta tus datos.</p>
          </section>

          <section v-if="form.alergias.length || form.condiciones.length" class="pf-card" v-brillo style="--i: 1">
            <h2><Icono name="alert" :size="18" /> Alertas médicas</h2>
            <div v-if="form.alergias.length" class="pf-grupo">
              <small>Alergias</small>
              <div class="pf-etiquetas"><span v-for="a in form.alergias" :key="a" class="pf-tag pf-tag-rojo">{{ a }}</span></div>
            </div>
            <div v-if="form.condiciones.length" class="pf-grupo">
              <small>Condiciones</small>
              <div class="pf-etiquetas"><span v-for="c in form.condiciones" :key="c" class="pf-tag">{{ c }}</span></div>
            </div>
          </section>
        </template>

        <section v-else class="pf-card" v-brillo style="--i: 0">
          <h2><Icono name="key" :size="18" /> Permisos de tu rol</h2>
          <p class="pf-rol-desc">{{ PERMISOS[auth.usuario.rol]?.resumen }}</p>
          <ul class="pf-permisos">
            <li v-for="p in PERMISOS[auth.usuario.rol]?.items || []" :key="p"><Icono name="check" :size="15" /> {{ p }}</li>
          </ul>
          <RouterLink to="/admin" class="pf-btn pf-btn-primario pf-btn-bloque">
            <Icono name="dashboard" :size="18" /> Ir al panel de administración
          </RouterLink>
        </section>

        <section v-if="auth.esCliente" class="pf-card pf-info" v-brillo style="--i: 2">
          <h2><Icono name="shield" :size="18" /> Tu privacidad</h2>
          <p>Tus datos de salud son privados: solo tú y el personal autorizado de la clínica pueden consultarlos.</p>
        </section>
      </aside>

      <!-- ================= Contenido principal ================= -->
      <section class="pf-principal">
        <div class="pf-tabs" role="tablist" aria-label="Secciones del perfil" :style="{ '--n': pestanas.length, '--k': indicePestana }">
          <span class="pf-indicador" aria-hidden="true"></span>
          <button
            v-for="t in pestanas"
            :id="`tab-${t.id}`"
            :key="t.id"
            type="button"
            role="tab"
            class="pf-tab"
            :class="{ activa: tab === t.id }"
            :aria-selected="tab === t.id"
            :aria-controls="`panel-${t.id}`"
            @click="tab = t.id"
          >
            <Icono :name="t.icono" :size="18" /> <span>{{ t.texto }}</span>
            <i v-if="t.error" class="pf-punto-error" aria-label="Hay campos por corregir"></i>
          </button>
        </div>

        <Transition name="pf-cambio" mode="out-in">
          <!-- ---------- Datos personales ---------- -->
          <div v-if="tab === 'personal'" id="panel-personal" key="personal" class="pf-card pf-panel" role="tabpanel" aria-labelledby="tab-personal" v-brillo>
            <h2>Información personal</h2>
            <p class="pf-sub">Estos datos identifican tu cuenta.</p>
            <div class="pf-campos">
              <InputField v-model="form.nombre" label="Nombre completo" icono="user" autocomplete="name" maxlength="120" :error="errores.nombre" />
              <InputField :model-value="auth.usuario.email" label="Correo electrónico" icono="mail" disabled hint="El correo es tu usuario de acceso y no se puede cambiar." />
              <InputField v-model="form.telefono" label="Teléfono" icono="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" :error="errores.telefono" />
              <template v-if="auth.esCliente">
                <InputField v-model="form.fechaNacimiento" label="Fecha de nacimiento" icono="calendar" type="date" :max="hoy" autocomplete="bday" :error="errores.fechaNacimiento" />
              </template>
            </div>

            <template v-if="auth.esCliente">
              <h3 class="pf-sep"><Icono name="phone" :size="18" /> Contacto de emergencia</h3>
              <div class="pf-campos">
                <InputField v-model="form.emNombre" label="Nombre del contacto" icono="users" maxlength="80" />
                <InputField v-model="form.emTelefono" label="Teléfono del contacto" icono="phone" type="tel" inputmode="tel" maxlength="20" :error="errores.emTelefono" />
              </div>
            </template>
          </div>

          <!-- ---------- Salud (solo cliente) ---------- -->
          <div v-else-if="tab === 'salud'" id="panel-salud" key="salud" class="pf-card pf-panel" role="tabpanel" aria-labelledby="tab-salud" v-brillo>
            <h2>Datos de salud</h2>
            <p class="pf-sub">Información que ayuda a tu médico a atenderte mejor. Todo es opcional.</p>

            <fieldset class="pf-fieldset">
              <legend>Sexo</legend>
              <div class="pf-seg" role="radiogroup" aria-label="Sexo">
                <button
                  v-for="o in OPCIONES_SEXO"
                  :key="o.valor"
                  type="button"
                  role="radio"
                  :aria-checked="form.sexo === o.valor"
                  :class="{ on: form.sexo === o.valor }"
                  @click="form.sexo = form.sexo === o.valor ? '' : o.valor"
                >
                  <span class="pf-glifo" aria-hidden="true">{{ o.glifo }}</span> {{ o.texto }}
                </button>
              </div>
            </fieldset>

            <fieldset class="pf-fieldset">
              <legend>Tipo de sangre</legend>
              <div class="pf-sangres" role="radiogroup" aria-label="Tipo de sangre">
                <button
                  v-for="t in TIPOS_SANGRE"
                  :key="t"
                  type="button"
                  role="radio"
                  :aria-checked="form.tipoSangre === t"
                  :class="{ on: form.tipoSangre === t }"
                  @click="form.tipoSangre = form.tipoSangre === t ? '' : t"
                >
                  <Icono name="drop" :size="14" /> {{ t }}
                </button>
              </div>
            </fieldset>

            <div class="pf-campos">
              <InputField v-model="form.pesoKg" label="Peso" icono="scale" type="number" inputmode="decimal" sufijo="kg" min="1" max="500" step="0.1" :error="errores.pesoKg" />
              <InputField v-model="form.estaturaCm" label="Estatura" icono="ruler" type="number" inputmode="decimal" sufijo="cm" min="30" max="260" step="0.1" :error="errores.estaturaCm" />
            </div>

            <div v-for="g in GRUPOS_ETIQUETAS" :key="g.clave" class="pf-fieldset">
              <label class="pf-leyenda" :for="`chip-${g.clave}`"><Icono :name="g.icono" :size="16" /> {{ g.titulo }}</label>
              <div class="pf-chips" @click="$event.currentTarget.querySelector('input')?.focus()">
                <TransitionGroup name="pf-chip">
                  <span v-for="item in form[g.clave]" :key="item" class="pf-chip">
                    {{ item }}
                    <button type="button" :aria-label="`Quitar ${item}`" @click.stop="quitarEtiqueta(g.clave, item)"><Icono name="x" :size="13" /></button>
                  </span>
                </TransitionGroup>
                <input
                  :id="`chip-${g.clave}`"
                  v-model="nuevo[g.clave]"
                  type="text"
                  maxlength="40"
                  :placeholder="form[g.clave].length ? 'Añadir otra…' : g.placeholder"
                  @keydown="teclaEtiqueta($event, g.clave)"
                  @blur="agregarEtiqueta(g.clave)"
                />
              </div>
              <div class="pf-sugeridas">
                <span>Sugeridas:</span>
                <button
                  v-for="s in g.sugeridas.filter((x) => !tieneEtiqueta(g.clave, x))"
                  :key="s"
                  type="button"
                  @click="agregarEtiqueta(g.clave, s)"
                >
                  <Icono name="plus" :size="12" /> {{ s }}
                </button>
              </div>
              <small class="pf-ayuda">{{ g.ayuda }}</small>
            </div>
          </div>

          <!-- ---------- Seguridad ---------- -->
          <div v-else id="panel-seguridad" key="seguridad" class="pf-seguridad" role="tabpanel" aria-labelledby="tab-seguridad">
            <form class="pf-card pf-panel" novalidate v-brillo @submit.prevent="cambiarPassword">
              <h2>Cambiar contraseña</h2>
              <p class="pf-sub">Usa una contraseña que no utilices en otros sitios.</p>
              <InputField v-model="pw.actual" label="Contraseña actual" type="password" icono="lock" autocomplete="current-password" :error="erroresPw.actual" />
              <InputField v-model="pw.nueva" label="Nueva contraseña" type="password" icono="key" autocomplete="new-password" maxlength="72" hint="Mínimo 8 caracteres, con al menos una letra y un número." :error="erroresPw.nueva" />
              <InputField v-model="pw.confirmar" label="Confirmar nueva contraseña" type="password" icono="key" autocomplete="new-password" maxlength="72" :error="erroresPw.confirmar" />
              <button class="pf-btn pf-btn-primario" type="submit" :disabled="cambiandoPw">
                <i v-if="cambiandoPw" class="pf-spin"></i><Icono v-else name="shield" :size="18" />
                {{ cambiandoPw ? 'Actualizando…' : 'Actualizar contraseña' }}
              </button>
            </form>

            <div class="pf-card pf-panel" v-brillo>
              <h2>Tus datos y tu sesión</h2>
              <ul class="pf-estado">
                <li><span class="pf-ico-ok"><Icono name="cloud" :size="18" /></span><div><strong>Guardado en la nube</strong><small>Tu perfil vive en la base de datos: lo verás al iniciar sesión desde cualquier dispositivo.</small></div></li>
                <li><span class="pf-ico-ok"><Icono name="pulse" :size="18" /></span><div><strong>Acceso instantáneo en este equipo</strong><small>Una copia de tu perfil se guarda en este navegador para que todo cargue al momento. Se borra al cerrar sesión.</small></div></li>
              </ul>
              <button type="button" class="pf-btn pf-btn-peligro" @click="cerrarSesion"><Icono name="logout" :size="18" /> Cerrar sesión</button>
            </div>
          </div>
        </Transition>
      </section>
    </div>

    <!-- ================= Barra de cambios sin guardar ================= -->
    <Transition name="pf-barra">
      <div v-if="sucio && tab !== 'seguridad'" class="pf-barra" role="region" aria-label="Cambios sin guardar">
        <span class="pf-barra-txt"><i></i> Tienes cambios sin guardar</span>
        <div class="pf-barra-acc">
          <button type="button" class="pf-btn pf-btn-suave" :disabled="guardando" @click="descartar">Descartar</button>
          <button type="button" class="pf-btn pf-btn-primario" :disabled="guardando" @click="guardar">
            <i v-if="guardando" class="pf-spin"></i><Icono v-else name="check" :size="18" />
            {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- ================= Aviso flotante ================= -->
    <Transition name="pf-toast">
      <div v-if="toast" class="pf-toast" :class="`pf-toast-${toast.tipo}`" role="status" aria-live="polite">
        <Icono :name="toast.tipo === 'error' ? 'alert' : toast.tipo === 'aviso' ? 'cloud' : 'check'" :size="18" /> {{ toast.texto }}
      </div>
    </Transition>
  </main>
</template>

<script setup>
import { computed, reactive, ref, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useContador, vBrillo } from '../composables/efectos.js';
import FotoUploader from '../components/FotoUploader.vue';
import InputField from '../components/InputField.vue';
import Icono from '../components/Icono.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

/* ------------------------------ Constantes ------------------------------ */
const ROLES = { ADMINISTRADOR: 'Administrador', RECEPCIONISTA: 'Recepción', PROFESIONAL: 'Profesional', CLIENTE: 'Cliente' };
const PERMISOS = {
  ADMINISTRADOR: {
    resumen: 'Control total del sitio: puedes editar su contenido y gestionar al equipo.',
    items: ['Crear y administrar usuarios y roles', 'Editar servicios, horarios y contenidos del sitio', 'Publicar noticias y materiales educativos', 'Gestionar pacientes, citas, pagos y caja']
  },
  RECEPCIONISTA: {
    resumen: 'Atención y operación diaria de la clínica.',
    items: ['Gestionar pacientes y responsables', 'Consultar y administrar citas', 'Registrar pagos y manejar la caja']
  },
  PROFESIONAL: {
    resumen: 'Acceso al material educativo para tus pacientes.',
    items: ['Consultar los materiales educativos', 'Asignar materiales a los pacientes']
  }
};
const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const OPCIONES_SEXO = [
  { valor: 'FEMENINO', texto: 'Mujer', glifo: '♀' },
  { valor: 'MASCULINO', texto: 'Hombre', glifo: '♂' }
];
const GRUPOS_ETIQUETAS = [
  {
    clave: 'alergias', titulo: 'Alergias', icono: 'alert', placeholder: 'Escribe una alergia y pulsa Enter',
    sugeridas: ['Penicilina', 'Polen', 'Mariscos', 'Látex', 'Maní', 'Lactosa'],
    ayuda: 'Si no tienes alergias conocidas, déjalo vacío.'
  },
  {
    clave: 'condiciones', titulo: 'Condiciones o antecedentes', icono: 'pill', placeholder: 'Ej.: Asma, diabetes, hipertensión…',
    sugeridas: ['Asma', 'Diabetes', 'Hipertensión'],
    ayuda: 'Enfermedades crónicas o antecedentes que tu médico deba conocer.'
  }
];
const CIRC = 2 * Math.PI * 34;
const RE_TEL = /^[0-9+()\-\s]{0,20}$/;
const RE_NOMBRE = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$/u;

/* ------------------------- Formulario (copia editable) ------------------------- */
function formDesdeUsuario(u) {
  const p = u?.perfil || {};
  const ce = p.contactoEmergencia || {};
  return {
    nombre: u?.nombre || '',
    telefono: p.telefono || '',
    fechaNacimiento: p.fechaNacimiento || '',
    sexo: p.sexo || '',
    tipoSangre: p.tipoSangre || '',
    pesoKg: p.pesoKg != null ? String(p.pesoKg) : '',
    estaturaCm: p.estaturaCm != null ? String(p.estaturaCm) : '',
    alergias: [...(p.alergias || [])],
    condiciones: [...(p.condiciones || [])],
    emNombre: ce.nombre || '',
    emTelefono: ce.telefono || ''
  };
}

const form = reactive(formDesdeUsuario(auth.usuario));
const base = ref(JSON.stringify(form));
const sucio = computed(() => JSON.stringify(form) !== base.value);
const nuevo = reactive({ alergias: '', condiciones: '' });

// Si el perfil cambia desde fuera (refresco desde MongoDB) y no hay ediciones, el formulario se actualiza.
// Los errores de un campo se quitan al editarlo.
watch(() => [form.nombre, form.telefono, form.fechaNacimiento, form.pesoKg, form.estaturaCm, form.emTelefono], () => {
  Object.keys(errores).forEach((k) => { errores[k] = ''; });
});

watch(
  () => auth.usuario,
  (u) => {
    if (!u) return;
    const nueva = formDesdeUsuario(u);
    if (JSON.stringify(form) === base.value) Object.assign(form, nueva);
    base.value = JSON.stringify(nueva);
  },
  { deep: true }
);

function descartar() {
  Object.assign(form, JSON.parse(base.value));
  Object.keys(errores).forEach((k) => { errores[k] = ''; });
}

/* ------------------------------ Pestañas ------------------------------ */
const tab = ref('personal');
const errores = reactive({ nombre: '', telefono: '', fechaNacimiento: '', pesoKg: '', estaturaCm: '', emTelefono: '' });

const pestanas = computed(() => {
  const lista = [{ id: 'personal', texto: 'Personal', icono: 'user', error: !!(errores.nombre || errores.telefono || errores.fechaNacimiento || errores.emTelefono) }];
  if (auth.esCliente) lista.push({ id: 'salud', texto: 'Salud', icono: 'heart', error: !!(errores.pesoKg || errores.estaturaCm) });
  lista.push({ id: 'seguridad', texto: 'Seguridad', icono: 'lock', error: false });
  return lista;
});
const indicePestana = computed(() => Math.max(0, pestanas.value.findIndex((t) => t.id === tab.value)));

/* ------------------------------ Etiquetas (alergias…) ------------------------------ */
const tieneEtiqueta = (clave, v) => form[clave].some((x) => x.toLowerCase() === v.toLowerCase());

function agregarEtiqueta(clave, valor) {
  const v = (valor ?? nuevo[clave]).trim().replace(/\s+/g, ' ').replace(/,$/, '');
  nuevo[clave] = '';
  if (!v || tieneEtiqueta(clave, v) || form[clave].length >= 20) return;
  form[clave].push(v.slice(0, 40));
}
function quitarEtiqueta(clave, item) {
  form[clave] = form[clave].filter((x) => x !== item);
}
function teclaEtiqueta(e, clave) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    agregarEtiqueta(clave);
  } else if (e.key === 'Backspace') {
    borrarUltima(clave);
  }
}
function borrarUltima(clave) {
  if (!nuevo[clave] && form[clave].length) form[clave].pop();
}

/* ------------------------------ Datos calculados ------------------------------ */
const hoy = new Date().toISOString().slice(0, 10);
const primerNombre = computed(() => (auth.usuario?.nombre || '').split(' ')[0]);
const miembroDesde = computed(() => {
  const f = auth.usuario?.creadoEn;
  return f ? new Date(f).toLocaleDateString('es', { month: 'long', year: 'numeric' }) : '';
});

const edad = computed(() => {
  if (!form.fechaNacimiento) return null;
  const n = new Date(`${form.fechaNacimiento}T00:00:00`);
  if (Number.isNaN(n.getTime()) || n > new Date()) return null;
  const h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
  return e;
});

const imc = computed(() => {
  const p = Number(form.pesoKg);
  const h = Number(form.estaturaCm) / 100;
  return p > 0 && h > 0.3 ? p / (h * h) : null;
});
const categoriaImc = computed(() => {
  const v = imc.value;
  if (!v) return { texto: 'Sin datos', color: '#7a93a2' };
  if (v < 18.5) return { texto: 'Bajo peso', color: '#3b8ed0' };
  if (v < 25) return { texto: 'Peso normal', color: '#1f9d8f' };
  if (v < 30) return { texto: 'Sobrepeso', color: '#d9962b' };
  return { texto: 'Obesidad', color: '#d0584a' };
});

// Medidor semicircular del IMC (escala 12 → 40).
const IMC_MIN = 12;
const IMC_MAX = 40;
const pt = (t) => [100 + 80 * Math.cos(Math.PI * (1 - t)), 100 - 80 * Math.sin(Math.PI * (1 - t))];
const arco = (t0, t1) => {
  const [x0, y0] = pt(t0);
  const [x1, y1] = pt(t1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A80 80 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
const tIMC = (v) => (v - IMC_MIN) / (IMC_MAX - IMC_MIN);
const SEGMENTOS = [
  { c: '#4aa3df', d: arco(0.005, tIMC(18.5) - 0.005) },
  { c: '#35c4bf', d: arco(tIMC(18.5) + 0.005, tIMC(25) - 0.005) },
  { c: '#f0b64a', d: arco(tIMC(25) + 0.005, tIMC(30) - 0.005) },
  { c: '#e26a5a', d: arco(tIMC(30) + 0.005, 0.995) }
];
const anguloAguja = computed(() => {
  const t = imc.value ? Math.min(1, Math.max(0, tIMC(imc.value))) : 0;
  return -90 + t * 180;
});

const pesoAnim = useContador(() => Number(form.pesoKg), { decimales: 1 });
const estaturaAnim = useContador(() => Number(form.estaturaCm), { decimales: 0 });
const edadAnim = useContador(() => edad.value ?? 0);
const imcAnim = useContador(() => imc.value ?? 0, { decimales: 1 });

// Porcentaje de perfil completo (según lo que ya está guardado).
const completitud = computed(() => {
  const u = auth.usuario;
  const p = u?.perfil || {};
  const campos = [!!u?.foto, !!p.telefono];
  if (auth.esCliente) {
    campos.push(!!p.fechaNacimiento, !!p.sexo, !!p.tipoSangre, p.pesoKg != null, p.estaturaCm != null, !!p.contactoEmergencia?.telefono);
  }
  const hechos = campos.filter(Boolean).length;
  return { porcentaje: Math.round((hechos / campos.length) * 100) };
});

/* ------------------------------ Avisos ------------------------------ */
const toast = ref(null);
let tToast = 0;
function avisar(texto, tipo = 'ok') {
  clearTimeout(tToast);
  toast.value = { texto, tipo };
  tToast = setTimeout(() => { toast.value = null; }, tipo === 'error' ? 5000 : 3400);
}
onUnmounted(() => clearTimeout(tToast));

/* ------------------------------ Guardar ------------------------------ */
const guardando = ref(false);

function validar() {
  const nombre = form.nombre.trim().replace(/\s+/g, ' ');
  errores.nombre = nombre.length >= 5 && RE_NOMBRE.test(nombre) && nombre.split(' ').length >= 2 ? '' : 'Escribe tu nombre completo (nombre y apellido)';
  errores.telefono = RE_TEL.test(form.telefono) ? '' : 'Usa solo números, espacios, + ( ) y guiones';
  if (auth.esCliente) {
    errores.emTelefono = RE_TEL.test(form.emTelefono) ? '' : 'Usa solo números, espacios, + ( ) y guiones';
    errores.fechaNacimiento = !form.fechaNacimiento || edad.value !== null ? '' : 'La fecha no puede ser futura';
    const p = form.pesoKg === '' ? null : Number(form.pesoKg);
    errores.pesoKg = p === null || (p >= 1 && p <= 500) ? '' : 'El peso debe estar entre 1 y 500 kg';
    const h = form.estaturaCm === '' ? null : Number(form.estaturaCm);
    errores.estaturaCm = h === null || (h >= 30 && h <= 260) ? '' : 'La estatura debe estar entre 30 y 260 cm';
  }
  const malos = Object.entries(errores).filter(([, v]) => v).map(([k]) => k);
  if (malos.length) {
    if (malos.some((k) => ['pesoKg', 'estaturaCm'].includes(k)) && !malos.some((k) => ['nombre', 'telefono', 'fechaNacimiento', 'emTelefono'].includes(k))) tab.value = 'salud';
    else tab.value = 'personal';
  }
  return malos.length === 0;
}

function construirCambios() {
  const perfil = { telefono: form.telefono.trim() };
  if (auth.esCliente) {
    Object.assign(perfil, {
      fechaNacimiento: form.fechaNacimiento || null,
      sexo: form.sexo,
      tipoSangre: form.tipoSangre,
      pesoKg: form.pesoKg === '' ? null : Number(form.pesoKg),
      estaturaCm: form.estaturaCm === '' ? null : Number(form.estaturaCm),
      alergias: [...form.alergias],
      condiciones: [...form.condiciones],
      contactoEmergencia: { nombre: form.emNombre.trim(), telefono: form.emTelefono.trim() }
    });
  }
  return { nombre: form.nombre.trim().replace(/\s+/g, ' '), perfil };
}

async function guardar() {
  agregarEtiqueta('alergias');
  agregarEtiqueta('condiciones');
  if (!validar()) {
    avisar('Revisa los campos marcados en rojo', 'error');
    return;
  }
  guardando.value = true;
  try {
    const r = await auth.guardarPerfil(construirCambios());
    Object.assign(form, formDesdeUsuario(auth.usuario));
    base.value = JSON.stringify(formDesdeUsuario(auth.usuario));
    r.sincronizado
      ? avisar('Cambios guardados')
      : avisar('Guardado en este equipo. Se enviará a la base de datos cuando haya conexión.', 'aviso');
  } catch (e) {
    avisar(e.message, 'error');
  } finally {
    guardando.value = false;
  }
}

async function cambiarFoto(data) {
  try {
    const r = await auth.guardarPerfil({ foto: data });
    r.sincronizado
      ? avisar(data ? 'Foto de perfil actualizada' : 'Foto eliminada')
      : avisar('Foto guardada en este equipo. Se enviará cuando haya conexión.', 'aviso');
  } catch (e) {
    avisar(e.message, 'error');
  }
}

async function reintentarSync() {
  const ok = await auth.sincronizar();
  ok ? avisar('Datos sincronizados') : avisar('Aún no hay conexión con el servidor', 'error');
}

/* ------------------------------ Contraseña ------------------------------ */
const pw = reactive({ actual: '', nueva: '', confirmar: '' });
const erroresPw = reactive({ actual: '', nueva: '', confirmar: '' });
const cambiandoPw = ref(false);

async function cambiarPassword() {
  erroresPw.actual = pw.actual ? '' : 'Escribe tu contraseña actual';
  erroresPw.nueva = pw.nueva.length >= 8 && /[A-Za-z]/.test(pw.nueva) && /\d/.test(pw.nueva) ? '' : 'Mínimo 8 caracteres, con una letra y un número';
  erroresPw.confirmar = pw.nueva === pw.confirmar && pw.confirmar ? '' : 'Las contraseñas no coinciden';
  if (erroresPw.actual || erroresPw.nueva || erroresPw.confirmar) return;
  cambiandoPw.value = true;
  try {
    await auth.cambiarPassword(pw.actual, pw.nueva);
    Object.assign(pw, { actual: '', nueva: '', confirmar: '' });
    avisar('Contraseña actualizada');
  } catch (e) {
    if (e.status === 400) erroresPw.actual = e.message;
    else avisar(e.message, 'error');
  } finally {
    cambiandoPw.value = false;
  }
}

function cerrarSesion() {
  auth.logout();
  router.push('/');
}

/* ------------------------------ Bienvenida ------------------------------ */
const bienvenida = ref(route.query.bienvenida === '1');
function cerrarBienvenida() {
  bienvenida.value = false;
  router.replace({ name: 'perfil' });
}
function irASalud() {
  tab.value = 'salud';
  cerrarBienvenida();
}
</script>

<style>
.pf {
  --card: #fff;
  --linea: #e1ebf1;
  box-sizing: border-box;
  min-height: calc(100vh - var(--nav-h, 64px) - var(--pie-h, 64px));
  min-height: calc(100dvh - var(--nav-h, 64px) - var(--pie-h, 64px));
  padding-bottom: 7rem;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #12354d;
  background:
    radial-gradient(700px circle at 100% 20%, rgba(53, 196, 191, 0.1), transparent 60%),
    radial-gradient(600px circle at 0% 60%, rgba(26, 92, 138, 0.08), transparent 60%),
    #eef5f8;
}

/* ---------------- Cabecera ---------------- */
.pf-hero { position: relative; }
.pf-portada {
  position: relative;
  height: clamp(150px, 22vw, 220px);
  overflow: hidden;
  background: linear-gradient(120deg, #0a2d47, #1a5c8a 55%, #1f8f95);
}
.pf-orbe { position: absolute; border-radius: 50%; filter: blur(46px); opacity: 0.55; }
.pf-orbe-1 { width: 320px; height: 320px; left: 8%; top: -140px; background: #35c4bf; animation: pf-deriva 14s ease-in-out infinite alternate; }
.pf-orbe-2 { width: 260px; height: 260px; right: 6%; bottom: -120px; background: #3c7fd0; animation: pf-deriva 11s ease-in-out infinite alternate-reverse; }
.pf-ecg { position: absolute; left: 0; bottom: 14px; width: 100%; height: 80px; }
.pf-ecg path { fill: none; stroke: #7ff5ee; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; stroke-dasharray: 140 1100; filter: drop-shadow(0 0 6px #5eeaea); animation: pf-ecg 4s linear infinite; }

.pf-hero-int {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: clamp(1rem, 3vw, 2rem);
  max-width: 1180px;
  margin: calc(-1 * 66px) auto 0;
  padding: 0 clamp(1rem, 3vw, 2rem) 1.4rem;
}
.pf-foto { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex: none; }
.pf-quitar-foto { appearance: none; border: 0; background: rgba(178, 58, 58, 0.1); color: #b23a3a; font: inherit; font-size: 0.76rem; font-weight: 600; padding: 0.25rem 0.65rem; border-radius: 999px; display: inline-flex; align-items: center; gap: 0.25rem; cursor: pointer; transition: background 0.2s; }
.pf-quitar-foto:hover { background: rgba(178, 58, 58, 0.2); }

.pf-id { flex: 1; min-width: 0; padding-bottom: 0.3rem; animation: pf-subir 0.6s both; }
.pf-id h1 { margin: 0.35rem 0 0.2rem; font-size: clamp(1.5rem, 3.4vw, 2.2rem); font-weight: 800; letter-spacing: -0.02em; color: #0f3d5e; overflow-wrap: anywhere; line-height: 1.15; }
.pf-correo { margin: 0; display: flex; align-items: center; gap: 0.4rem; color: #4f6b7c; font-size: 0.95rem; overflow-wrap: anywhere; }
.pf-meta { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin-top: 0.7rem; font-size: 0.82rem; color: #5b7686; }
.pf-meta > span { display: inline-flex; align-items: center; gap: 0.35rem; }
.pf-sync { padding: 0.2rem 0.65rem; border-radius: 999px; background: #e1f5ef; color: #17806f; font-weight: 600; }
.pf-sync.pendiente { background: #fff3dc; color: #a56a07; }
.pf-sync button { appearance: none; border: 0; background: #a56a07; color: #fff; font: inherit; font-size: 0.74rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 999px; cursor: pointer; }
.pf-sync.pendiente .icono { animation: pf-girar 2.4s linear infinite; }

.pf-rol { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.28rem 0.75rem; border-radius: 999px; font-size: 0.76rem; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; color: #fff; background: linear-gradient(120deg, #1a5c8a, #2a9d9a); box-shadow: 0 6px 14px -8px rgba(26, 92, 138, 0.9); }
.pf-rol.rol-administrador { background: linear-gradient(120deg, #4b3c9c, #1a5c8a); }
.pf-rol.rol-cliente { background: linear-gradient(120deg, #2a9d9a, #35b88f); }

.pf-anillo { position: relative; width: 84px; height: 84px; flex: none; margin-bottom: 0.3rem; filter: drop-shadow(0 10px 14px rgba(26, 92, 138, 0.25)); }
.pf-anillo svg { width: 100%; height: 100%; transform: rotate(-90deg); background: #fff; border-radius: 50%; }
.pf-anillo circle { fill: none; stroke-width: 7; }
.pf-anillo-base { stroke: #e1ebf1; }
.pf-anillo-valor { stroke: #2a9d9a; stroke-linecap: round; transition: stroke-dasharray 0.9s cubic-bezier(0.3, 1, 0.4, 1); }
.pf-anillo-txt { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.05; }
.pf-anillo-txt b { font-size: 1.15rem; color: #0f3d5e; }
.pf-anillo-txt small { font-size: 0.62rem; color: #5b7686; text-transform: uppercase; letter-spacing: 0.05em; }

/* ---------------- Bienvenida ---------------- */
.pf-bienvenida {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: calc(1180px - 2 * clamp(1rem, 3vw, 2rem));
  margin: 0 auto 1.2rem;
  padding: 1rem 1.2rem;
  border-radius: 20px;
  color: #fff;
  background: linear-gradient(110deg, #1a5c8a, #2a9d9a);
  box-shadow: 0 20px 36px -22px rgba(26, 92, 138, 0.9);
}
.pf-bienvenida { width: calc(100% - 2 * clamp(1rem, 3vw, 2rem)); box-sizing: border-box; }
.pf-bienv-ico { display: grid; place-items: center; width: 46px; height: 46px; flex: none; border-radius: 14px; background: rgba(255, 255, 255, 0.2); animation: pf-latir 2s ease-in-out infinite; }
.pf-bienvenida p { margin: 0.15rem 0 0; font-size: 0.9rem; opacity: 0.92; }
.pf-bienv-acc { margin-left: auto; display: flex; align-items: center; gap: 0.4rem; flex: none; }
.pf-cerrar { appearance: none; border: 0; background: rgba(255, 255, 255, 0.15); color: #fff; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; transition: background 0.2s; }
.pf-cerrar:hover { background: rgba(255, 255, 255, 0.3); }

/* ---------------- Rejilla ---------------- */
.pf-grid {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: clamp(1rem, 2vw, 1.6rem);
  align-items: start;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 3vw, 2rem);
}
.pf-lado { display: grid; gap: 1rem; position: sticky; top: calc(var(--nav-h, 64px) + 1rem); }

.pf-card {
  --mx: 50%;
  --my: 0%;
  position: relative;
  box-sizing: border-box;
  padding: 1.3rem 1.3rem 1.4rem;
  border-radius: 22px;
  background: var(--card);
  border: 1px solid var(--linea);
  box-shadow: 0 18px 36px -26px rgba(15, 61, 94, 0.5);
  overflow: hidden;
  animation: pf-subir 0.55s both;
  animation-delay: calc(var(--i, 0) * 0.09s);
  transition: box-shadow 0.3s, transform 0.3s;
}
.pf-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(320px circle at var(--mx) var(--my), rgba(42, 157, 154, 0.1), transparent 65%); opacity: 0; transition: opacity 0.3s; pointer-events: none; }
.pf-card:hover::before { opacity: 1; }
.pf-card:hover { box-shadow: 0 24px 44px -26px rgba(15, 61, 94, 0.55); }
.pf-card h2 { margin: 0 0 0.9rem; font-size: 1.08rem; font-weight: 800; color: #0f3d5e; display: flex; align-items: center; gap: 0.5rem; }
.pf-card h2 .icono { color: #2a9d9a; }
.pf-sub { margin: -0.5rem 0 1.2rem; color: #5b7686; font-size: 0.9rem; }

/* ---------------- Resumen de salud ---------------- */
.pf-sangre { display: flex; align-items: center; gap: 0.9rem; padding: 0.85rem 1rem; border-radius: 16px; background: linear-gradient(120deg, #fff1f1, #fff7f3); border: 1px solid #f6d6d6; }
.pf-sangre.vacio { background: #f1f6f9; border-color: var(--linea); }
.pf-gota { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; color: #fff; background: linear-gradient(135deg, #e6564f, #c93a3a); box-shadow: 0 10px 18px -10px rgba(201, 58, 58, 0.9); animation: pf-latir 2.6s ease-in-out infinite; }
.pf-sangre.vacio .pf-gota { background: #b9cad5; box-shadow: none; animation: none; }
.pf-sangre b { display: block; font-size: 1.9rem; line-height: 1; color: #b53030; }
.pf-sangre.vacio b { color: #7a93a2; }
.pf-sangre small { color: #6b5b5b; font-size: 0.8rem; }

.pf-mini { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin: 0.9rem 0; }
.pf-mini > div { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 0.2rem; padding: 0.7rem 0.3rem; border-radius: 14px; background: #f3f8fa; text-align: center; transition: transform 0.25s, background 0.25s; }
.pf-mini > div:hover { transform: translateY(-3px); background: #e6f2f5; }
.pf-mini b { font-size: 1.3rem; color: #0f3d5e; font-variant-numeric: tabular-nums; }
.pf-mini small { color: #5b7686; font-size: 0.72rem; font-weight: 600; }
.pf-mini span { width: 100%; font-size: 0.7rem; color: #7a93a2; text-transform: uppercase; letter-spacing: 0.05em; }

.pf-imc svg { display: block; width: 100%; max-width: 260px; margin: 0.3rem auto 0; overflow: visible; }
.pf-seg-arco { fill: none; stroke-width: 15; stroke-linecap: butt; }
.pf-aguja { transform-origin: 100px 100px; transition: transform 0.9s cubic-bezier(0.3, 1.5, 0.5, 1), opacity 0.4s; }
.pf-aguja line { stroke: #0f3d5e; stroke-width: 4; stroke-linecap: round; }
.pf-aguja circle { fill: #0f3d5e; stroke: #fff; stroke-width: 3; }
.pf-imc-val { display: flex; flex-direction: column; align-items: center; margin-top: -0.2rem; }
.pf-imc-val b { font-size: 1.7rem; color: #0f3d5e; font-variant-numeric: tabular-nums; line-height: 1.1; }
.pf-imc-val span { font-size: 0.85rem; font-weight: 700; transition: color 0.3s; }
.pf-nota { display: flex; align-items: flex-start; gap: 0.4rem; margin: 0.8rem 0 0; font-size: 0.76rem; color: #7a93a2; line-height: 1.4; }
.pf-nota .icono { margin-top: 1px; }

.pf-grupo + .pf-grupo { margin-top: 0.8rem; }
.pf-grupo small { display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 700; color: #7a93a2; text-transform: uppercase; letter-spacing: 0.05em; }
.pf-etiquetas { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.pf-tag { padding: 0.25rem 0.7rem; border-radius: 999px; background: #e3f1f4; color: #1a5c8a; font-size: 0.82rem; font-weight: 600; }
.pf-tag-rojo { background: #fde9e9; color: #b53030; }
.pf-info p { margin: 0; font-size: 0.88rem; color: #5b7686; line-height: 1.5; }

.pf-rol-desc { margin: -0.3rem 0 0.9rem; font-size: 0.88rem; color: #5b7686; line-height: 1.5; }
.pf-permisos { list-style: none; margin: 0 0 1.2rem; padding: 0; display: grid; gap: 0.55rem; }
.pf-permisos li { display: flex; align-items: flex-start; gap: 0.55rem; font-size: 0.9rem; line-height: 1.4; }
.pf-permisos .icono { margin-top: 2px; padding: 3px; border-radius: 50%; background: #1f9d8f; color: #fff; box-sizing: content-box; width: 13px; height: 13px; }

/* ---------------- Pestañas ---------------- */
.pf-tabs { position: relative; display: grid; grid-template-columns: repeat(var(--n), 1fr); margin-bottom: 1rem; padding: 5px; border-radius: 18px; background: #fff; border: 1px solid var(--linea); box-shadow: 0 12px 26px -22px rgba(15, 61, 94, 0.6); }
.pf-indicador { position: absolute; top: 5px; bottom: 5px; left: 5px; width: calc((100% - 10px) / var(--n)); border-radius: 13px; background: linear-gradient(120deg, #1a5c8a, #2a9d9a); box-shadow: 0 10px 18px -10px rgba(26, 92, 138, 0.9); transform: translateX(calc(var(--k) * 100%)); transition: transform 0.4s cubic-bezier(0.3, 1.3, 0.5, 1); }
.pf-tab { position: relative; z-index: 1; appearance: none; border: 0; background: transparent; font: inherit; font-size: 0.95rem; font-weight: 700; color: #4f6b7c; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.8rem 0.5rem; border-radius: 13px; cursor: pointer; transition: color 0.25s; }
.pf-tab:hover { color: #1a5c8a; }
.pf-tab.activa { color: #fff; }
.pf-tab:focus-visible { outline: 3px solid #35c4bf; outline-offset: 2px; }
.pf-punto-error { position: absolute; top: 8px; right: 12%; width: 9px; height: 9px; border-radius: 50%; background: #e05252; box-shadow: 0 0 0 2px #fff; }

.pf-cambio-enter-active, .pf-cambio-leave-active { transition: opacity 0.2s, transform 0.25s; }
.pf-cambio-enter-from { opacity: 0; transform: translateY(12px); }
.pf-cambio-leave-to { opacity: 0; transform: translateY(-6px); }

/* ---------------- Formularios ---------------- */
.pf-panel { animation: none; }
.pf-campos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1rem; }
.pf-sep { display: flex; align-items: center; gap: 0.5rem; margin: 0.8rem 0 1rem; padding-top: 1.1rem; border-top: 1px dashed #cfe0e8; font-size: 1rem; color: #0f3d5e; }
.pf-sep .icono { color: #2a9d9a; }
.pf-fieldset { border: 0; padding: 0; margin: 0 0 1.3rem; min-width: 0; }
.pf-fieldset legend, .pf-leyenda { display: flex; align-items: center; gap: 0.4rem; padding: 0; margin-bottom: 0.55rem; font-size: 0.88rem; font-weight: 700; color: #1a5c8a; }

.pf-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.pf-seg button, .pf-sangres button {
  appearance: none;
  font: inherit;
  font-weight: 700;
  color: #3b5a6d;
  background: #f3f8fa;
  border: 1.5px solid #d3e2ea;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  transition: transform 0.25s cubic-bezier(0.3, 1.5, 0.5, 1), background 0.25s, border-color 0.25s, color 0.25s, box-shadow 0.25s;
}
.pf-seg button { padding: 0.85rem; font-size: 1rem; }
.pf-glifo { font-size: 1.4rem; line-height: 1; }
.pf-sangres { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.55rem; }
.pf-sangres button { padding: 0.7rem 0.3rem; font-size: 0.98rem; }
.pf-sangres .icono { color: #d0584a; }
.pf-seg button:hover, .pf-sangres button:hover { transform: translateY(-3px); border-color: #7fb9cf; background: #fff; }
.pf-seg button.on, .pf-sangres button.on { color: #fff; border-color: transparent; background: linear-gradient(135deg, #1a5c8a, #2a9d9a); box-shadow: 0 12px 20px -12px rgba(26, 92, 138, 0.95); transform: translateY(-2px) scale(1.04); }
.pf-sangres button.on .icono { color: #fff; }
.pf-seg button:focus-visible, .pf-sangres button:focus-visible { outline: 3px solid #35c4bf; outline-offset: 2px; }

.pf-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; min-height: 54px; box-sizing: border-box; padding: 0.5rem 0.6rem; border: 1.5px solid #cfdde6; border-radius: 14px; background: #fff; cursor: text; transition: border-color 0.25s, box-shadow 0.25s; }
.pf-chips:focus-within { border-color: #2a9d9a; box-shadow: 0 0 0 4px rgba(42, 157, 154, 0.16); }
.pf-chip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.4rem 0.3rem 0.75rem; border-radius: 999px; background: linear-gradient(120deg, #e3f1f4, #e8f6f0); color: #1a5c8a; font-size: 0.86rem; font-weight: 600; }
.pf-chip button { appearance: none; border: 0; background: rgba(26, 92, 138, 0.12); color: #1a5c8a; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; transition: background 0.2s, color 0.2s, transform 0.2s; }
.pf-chip button:hover { background: #d0584a; color: #fff; transform: rotate(90deg); }
.pf-chips input { flex: 1; min-width: 130px; border: 0; outline: 0; background: transparent; font: inherit; font-size: 0.95rem; color: #12354d; padding: 0.3rem 0.2rem; }
.pf-sugeridas { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; margin-top: 0.55rem; font-size: 0.78rem; color: #7a93a2; }
.pf-sugeridas button { appearance: none; border: 1px dashed #b4ccd8; background: transparent; color: #3b6a85; font: inherit; font-size: 0.78rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; display: inline-flex; align-items: center; gap: 0.25rem; cursor: pointer; transition: background 0.2s, border-color 0.2s, transform 0.2s; }
.pf-sugeridas button:hover { background: #e3f1f4; border-style: solid; transform: translateY(-2px); }
.pf-ayuda { display: block; margin-top: 0.45rem; color: #7a93a2; font-size: 0.78rem; }

.pf-chip-enter-active, .pf-chip-leave-active { transition: opacity 0.25s, transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1); }
.pf-chip-enter-from, .pf-chip-leave-to { opacity: 0; transform: scale(0.6); }

/* ---------------- Seguridad ---------------- */
.pf-seguridad { display: grid; gap: 1rem; }
.pf-estado { list-style: none; margin: 0 0 1.2rem; padding: 0; display: grid; gap: 0.9rem; }
.pf-estado li { display: flex; gap: 0.8rem; }
.pf-estado strong { display: block; font-size: 0.95rem; }
.pf-estado small { display: block; margin-top: 0.15rem; color: #5b7686; font-size: 0.83rem; line-height: 1.45; }
.pf-ico-ok { display: grid; place-items: center; flex: none; width: 38px; height: 38px; border-radius: 12px; color: #17806f; background: #e1f5ef; }

/* ---------------- Botones ---------------- */
.pf-btn { appearance: none; border: 0; font: inherit; font-size: 0.95rem; font-weight: 700; padding: 0.8rem 1.2rem; border-radius: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none; transition: transform 0.25s, box-shadow 0.25s, background 0.25s; }
.pf-btn:disabled { opacity: 0.7; cursor: progress; }
.pf-btn:focus-visible { outline: 3px solid #35c4bf; outline-offset: 3px; }
.pf-btn-bloque { width: 100%; box-sizing: border-box; }
.pf-btn-primario { color: #fff; background: linear-gradient(120deg, #1a5c8a, #2a9d9a); box-shadow: 0 14px 24px -14px rgba(26, 92, 138, 0.95); }
.pf-btn-primario:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 18px 28px -14px rgba(26, 92, 138, 1); }
.pf-btn-suave { color: #1a5c8a; background: #e8f1f5; }
.pf-btn-suave:hover:not(:disabled) { background: #d8e8ef; }
.pf-btn-blanco { color: #1a5c8a; background: #fff; }
.pf-btn-blanco:hover { transform: translateY(-2px); }
.pf-btn-peligro { color: #b23a3a; background: #fdecec; }
.pf-btn-peligro:hover { background: #fadada; transform: translateY(-2px); }
.pf-spin { width: 16px; height: 16px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.4); border-top-color: #fff; animation: pf-girar 0.7s linear infinite; }

/* ---------------- Barra de cambios y aviso ---------------- */
.pf-barra {
  position: fixed;
  left: 50%;
  bottom: calc(var(--pie-h, 64px) + 14px);
  z-index: 60;
  transform: translateX(-50%);
  width: min(640px, calc(100% - 1.5rem));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.7rem 0.8rem 0.7rem 1.1rem;
  border-radius: 18px;
  background: rgba(10, 45, 71, 0.94);
  color: #fff;
  backdrop-filter: blur(10px);
  box-shadow: 0 24px 44px -16px rgba(8, 36, 56, 0.7);
}
.pf-barra-txt { display: flex; align-items: center; gap: 0.6rem; font-size: 0.92rem; font-weight: 600; }
.pf-barra-txt i { width: 9px; height: 9px; border-radius: 50%; background: #ffb84d; box-shadow: 0 0 10px #ffb84d; animation: pf-parpadeo 1.4s ease-in-out infinite; }
.pf-barra-acc { display: flex; gap: 0.5rem; }
.pf-barra .pf-btn { padding: 0.6rem 1rem; }
.pf-barra .pf-btn-suave { color: #fff; background: rgba(255, 255, 255, 0.14); }
.pf-barra .pf-btn-suave:hover:not(:disabled) { background: rgba(255, 255, 255, 0.24); }
.pf-barra-enter-active, .pf-barra-leave-active { transition: opacity 0.3s, transform 0.4s cubic-bezier(0.3, 1.4, 0.5, 1); }
.pf-barra-enter-from, .pf-barra-leave-to { opacity: 0; transform: translate(-50%, 30px); }

.pf-toast { position: fixed; top: calc(var(--nav-h, 64px) + 14px); left: 50%; transform: translateX(-50%); z-index: 70; max-width: calc(100% - 1.5rem); box-sizing: border-box; display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 1.1rem; border-radius: 14px; font-size: 0.92rem; font-weight: 600; color: #fff; background: #17806f; box-shadow: 0 18px 32px -14px rgba(0, 0, 0, 0.5); }
.pf-toast-error { background: #b23a3a; }
.pf-toast-aviso { background: #a56a07; }
.pf-toast-enter-active, .pf-toast-leave-active { transition: opacity 0.3s, transform 0.4s cubic-bezier(0.3, 1.5, 0.5, 1); }
.pf-toast-enter-from, .pf-toast-leave-to { opacity: 0; transform: translate(-50%, -20px) scale(0.92); }
.pf-pop-enter-active, .pf-pop-leave-active { transition: opacity 0.3s, transform 0.4s cubic-bezier(0.3, 1.4, 0.5, 1); }
.pf-pop-enter-from, .pf-pop-leave-to { opacity: 0; transform: translateY(-12px) scale(0.97); }

@keyframes pf-subir { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes pf-ecg { from { stroke-dashoffset: 140; } to { stroke-dashoffset: -960; } }
@keyframes pf-deriva { to { transform: translate(60px, 24px) scale(1.15); } }
@keyframes pf-girar { to { transform: rotate(360deg); } }
@keyframes pf-parpadeo { 50% { opacity: 0.35; } }
@keyframes pf-latir { 0%, 100% { transform: scale(1); } 12% { transform: scale(1.09); } 24% { transform: scale(1); } }

/* ---------------- Responsivo ---------------- */
@media (max-width: 960px) {
  .pf-grid { grid-template-columns: 1fr; }
  .pf-lado { position: static; order: 2; }
  .pf-principal { order: 1; }
}
@media (max-width: 680px) {
  .pf-hero-int { flex-direction: column; align-items: center; text-align: center; margin-top: -76px; }
  .pf-id { display: flex; flex-direction: column; align-items: center; }
  .pf-meta { justify-content: center; }
  .pf-anillo { position: absolute; top: 90px; right: 1rem; width: 64px; height: 64px; margin: 0; }
  .pf-anillo-txt b { font-size: 0.95rem; }
  .pf-anillo-txt small { display: none; }
  .pf-campos { grid-template-columns: 1fr; }
  .pf-tab span { display: none; }
  .pf-tab.activa span { display: inline; }
  .pf-sangres { grid-template-columns: repeat(4, 1fr); gap: 0.4rem; }
  .pf-sangres .icono { display: none; }
  .pf-bienvenida { flex-wrap: wrap; }
  .pf-bienv-acc { margin-left: 0; width: 100%; justify-content: space-between; }
  .pf-barra { flex-direction: column; align-items: stretch; text-align: center; }
  .pf-barra-txt { justify-content: center; }
  .pf-barra-acc .pf-btn { flex: 1; }
}
@media (max-width: 400px) {
  .pf-card { padding: 1.1rem 1rem; }
  .pf-mini b { font-size: 1.1rem; }
}

@media (prefers-reduced-motion: reduce) {
  .pf-card, .pf-id, .pf-orbe, .pf-ecg path, .pf-gota, .pf-bienv-ico, .pf-barra-txt i, .pf-spin, .pf-sync.pendiente .icono { animation: none; }
  .pf-card, .pf-indicador, .pf-aguja, .pf-anillo-valor, .pf-seg button, .pf-sangres button, .pf-chip, .pf-mini > div { transition: none; }
}
</style>
