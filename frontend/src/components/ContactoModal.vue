<template>
  <Teleport to="body">
    <Transition name="cm">
      <div v-if="contactoAbierto" class="cm-fondo" @mousedown.self="cerrarContacto">
        <div
          ref="dialogo"
          class="cm-ventana"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cm-titulo"
          @keydown="alTeclado"
        >
          <!-- ===== Panel lateral / encabezado ===== -->
          <aside class="cm-lateral">
            <div class="cm-marca">
              <svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true">
                <defs>
                  <linearGradient id="cm-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#35c4bf" />
                    <stop offset="1" stop-color="#1a5c8a" />
                  </linearGradient>
                </defs>
                <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="url(#cm-grad)" />
                <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" />
                <path d="M17 9h6v8h8v6h-8v8h-6v-8H9v-6h8z" fill="#fff" />
                <path d="M7 24h7l2.5-5 4 10 2.5-5H33" fill="none" stroke="#0f3d5e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div>
                <h2 id="cm-titulo">Contacto</h2>
                <p class="cm-lema">Estamos para ayudarte</p>
              </div>
            </div>

            <div class="cm-pestanas" role="tablist" aria-label="Secciones de contacto" aria-orientation="vertical">
              <button
                v-for="p in PESTANAS"
                :id="`cm-tab-${p.id}`"
                :key="p.id"
                ref="botonesPestana"
                type="button"
                role="tab"
                class="cm-pestana"
                :class="{ activa: contactoPestana === p.id }"
                :aria-selected="contactoPestana === p.id"
                :aria-controls="`cm-panel-${p.id}`"
                :tabindex="contactoPestana === p.id ? 0 : -1"
                @click="contactoPestana = p.id"
              >
                <span class="cm-pestana-icono" aria-hidden="true" v-html="p.icono"></span>
                <span class="cm-pestana-texto">
                  <strong>{{ p.titulo }}</strong>
                  <small>{{ p.subtitulo }}</small>
                </span>
              </button>
            </div>

            <p class="cm-nota">Respondemos tu mensaje en un máximo de 24 horas hábiles.</p>
          </aside>

          <!-- ===== Contenido ===== -->
          <section class="cm-contenido">
            <button ref="botonCerrar" type="button" class="cm-cerrar" aria-label="Cerrar ventana de contacto" @click="cerrarContacto">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>

            <div class="cm-scroll">
            <Transition name="cm-cambio" mode="out-in">
              <!-- ---------- Información ---------- -->
              <div
                v-if="contactoPestana === 'info'"
                id="cm-panel-info"
                key="info"
                class="cm-panel"
                role="tabpanel"
                aria-labelledby="cm-tab-info"
              >
                <h3 class="cm-subtitulo">Información de contacto</h3>
                <p class="cm-intro">{{ datos.nombre }} · Atención cercana, profesional y humana.</p>

                <div class="cm-info-rejilla">
                  <ul class="cm-datos">
                    <li v-for="d in listaDatos" :key="d.clave" class="cm-dato">
                      <span class="cm-dato-icono" aria-hidden="true" v-html="d.icono"></span>
                      <div class="cm-dato-texto">
                        <span class="cm-dato-etiqueta">{{ d.etiqueta }}</span>
                        <a v-if="d.enlace" :href="d.enlace" class="cm-dato-valor">{{ d.valor }}</a>
                        <span v-else class="cm-dato-valor">{{ d.valor }}</span>
                      </div>
                      <button type="button" class="cm-copiar" :class="{ copiado: copiado === d.clave }" :aria-label="`Copiar ${d.etiqueta.toLowerCase()}`" @click="copiar(d)">
                        {{ copiado === d.clave ? '¡Copiado!' : 'Copiar' }}
                      </button>
                    </li>
                    <li>
                      <button type="button" class="cm-boton-secundario" @click="contactoPestana = 'mensaje'">
                        Enviar un mensaje
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </button>
                    </li>
                  </ul>

                  <div class="cm-mapa">
                    <iframe
                      :src="URL_MAPA"
                      title="Ubicación en Google Maps"
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"
                      allowfullscreen
                    ></iframe>
                    <a class="cm-mapa-enlace" :href="URL_RUTA" target="_blank" rel="noopener noreferrer">
                      Cómo llegar
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>
                    </a>
                  </div>
                </div>
              </div>

              <!-- ---------- Mensaje ---------- -->
              <div
                v-else
                id="cm-panel-mensaje"
                key="mensaje"
                class="cm-panel"
                role="tabpanel"
                aria-labelledby="cm-tab-mensaje"
              >
                <!-- Confirmación -->
                <div v-if="enviado" class="cm-exito" role="status">
                  <div class="cm-exito-icono" aria-hidden="true">
                    <svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="3" /><path d="M15 27l8 8 14-17" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </div>
                  <h3>¡Tu mensaje se envió correctamente!</h3>
                  <p>Gracias por escribirnos, <strong>{{ nombreEnviado }}</strong>. Te responderemos al correo <strong>{{ correoEnviado }}</strong> lo antes posible.</p>
                  <div class="cm-exito-acciones">
                    <button type="button" class="cm-boton" @click="otroMensaje">Enviar otro mensaje</button>
                    <button type="button" class="cm-boton-secundario" @click="cerrarContacto">Cerrar</button>
                  </div>
                </div>

                <!-- Formulario -->
                <form v-else novalidate @submit.prevent="enviar">
                  <h3 class="cm-subtitulo">Envíanos un mensaje</h3>
                  <p class="cm-intro">Cuéntanos en qué podemos ayudarte. Los campos con <span class="cm-req">*</span> son obligatorios.</p>

                  <div class="cm-fila">
                    <div class="cm-campo" :class="{ invalido: ver('nombre') }">
                      <label for="cm-nombre">Nombre completo <span class="cm-req">*</span></label>
                      <input
                        id="cm-nombre"
                        :value="form.nombre"
                        type="text"
                        autocomplete="name"
                        maxlength="50"
                        placeholder="Ej. María Méndez"
                        :aria-invalid="ver('nombre')"
                        aria-describedby="cm-ayuda-nombre"
                        @input="alNombre"
                        @blur="tocar('nombre')"
                      />
                      <small id="cm-ayuda-nombre" :class="{ error: ver('nombre') }">{{ ver('nombre') ? errores.nombre : 'De 2 a 4 palabras, máximo 10 letras cada una.' }}</small>
                    </div>

                    <div class="cm-campo" :class="{ invalido: ver('email') }">
                      <label for="cm-email">Correo electrónico <span class="cm-req">*</span></label>
                      <input
                        id="cm-email"
                        :value="form.email"
                        type="email"
                        inputmode="email"
                        autocomplete="email"
                        maxlength="254"
                        placeholder="tucorreo@ejemplo.com"
                        :aria-invalid="ver('email')"
                        aria-describedby="cm-ayuda-email"
                        @input="alCorreo"
                        @blur="tocar('email')"
                      />
                      <small id="cm-ayuda-email" :class="{ error: ver('email') }">{{ ver('email') ? errores.email : 'Usaremos este correo para responderte.' }}</small>
                    </div>
                  </div>

                  <div class="cm-fila">
                    <div class="cm-campo" :class="{ invalido: ver('telefono') }">
                      <label for="cm-telefono">Teléfono <span class="cm-req">*</span></label>
                      <input
                        id="cm-telefono"
                        :value="form.telefono"
                        type="tel"
                        inputmode="tel"
                        autocomplete="tel"
                        maxlength="30"
                        placeholder="Ej. 5555-0101"
                        :aria-invalid="ver('telefono')"
                        aria-describedby="cm-ayuda-telefono"
                        @input="alTelefono"
                        @blur="tocar('telefono')"
                      />
                      <small id="cm-ayuda-telefono" :class="{ error: ver('telefono') }">{{ ver('telefono') ? errores.telefono : 'Para llamarte si necesitamos más detalles.' }}</small>
                    </div>

                    <div class="cm-campo" :class="{ invalido: ver('asunto') }">
                      <label for="cm-asunto">Asunto <span class="cm-req">*</span></label>
                      <input
                        id="cm-asunto"
                        :value="form.asunto"
                        type="text"
                        maxlength="120"
                        placeholder="Motivo de tu consulta"
                        :aria-invalid="ver('asunto')"
                        aria-describedby="cm-ayuda-asunto"
                        @input="form.asunto = $event.target.value"
                        @blur="tocar('asunto')"
                      />
                      <small id="cm-ayuda-asunto" :class="{ error: ver('asunto') }">{{ ver('asunto') ? errores.asunto : 'Resume tu consulta en una frase.' }}</small>
                    </div>
                  </div>

                  <div class="cm-campo" :class="{ invalido: ver('mensaje') }">
                    <label for="cm-mensaje">Mensaje <span class="cm-req">*</span></label>
                    <textarea
                      id="cm-mensaje"
                      v-model="form.mensaje"
                      rows="5"
                      :maxlength="MAX_MENSAJE"
                      placeholder="Escribe aquí tu consulta con el mayor detalle posible…"
                      :aria-invalid="ver('mensaje')"
                      aria-describedby="cm-ayuda-mensaje"
                      @blur="tocar('mensaje')"
                    ></textarea>
                    <div class="cm-pie-campo">
                      <small id="cm-ayuda-mensaje" :class="{ error: ver('mensaje') }">{{ ver('mensaje') ? errores.mensaje : `Mínimo ${MIN_MENSAJE} caracteres y 5 palabras.` }}</small>
                      <small class="cm-contador" :class="{ listo: form.mensaje.trim().length >= MIN_MENSAJE }">{{ form.mensaje.length }}/{{ MAX_MENSAJE }}</small>
                    </div>
                  </div>

                  <p v-if="errorEnvio" class="cm-error" role="alert">{{ errorEnvio }}</p>

                  <div class="cm-acciones">
                    <button type="submit" class="cm-boton" :disabled="enviando">
                      <span v-if="enviando" class="cm-spinner" aria-hidden="true"></span>
                      {{ enviando ? 'Enviando…' : 'Enviar mensaje' }}
                    </button>
                    <button type="button" class="cm-boton-secundario" :disabled="enviando" @click="contactoPestana = 'info'">Ver información</button>
                  </div>
                </form>
              </div>
            </Transition>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, reactive, ref, watch } from 'vue';
import { getContacto, postContacto } from '../api/client.js';
import { cerrarContacto, contactoAbierto, contactoPestana } from '../composables/contactoModal.js';

/* ---------- Datos de contacto (con respaldo realista) ---------- */
const POR_DEFECTO = {
  nombre: 'Centro de Salud SIGSA',
  email: 'contacto@sigsa.com.gt',
  telefono: '+502 7839-4521',
  direccion: '4a. Avenida 5-20, Zona 1, Chimaltenango, Guatemala'
};
// Valores provisionales que trae la base de datos al inicio: se reemplazan por los realistas.
const PROVISIONALES = ['Centro SIGCA', 'contacto@sigca.local', '0000-0000', 'Contenido pendiente de edición.'];

const datos = reactive({ ...POR_DEFECTO });
let datosCargados = false;

async function cargarDatos() {
  if (datosCargados) return;
  datosCargados = true;
  try {
    const lista = await getContacto();
    const porClave = Object.fromEntries(lista.map((c) => [c.clave, String(c.cuerpo || '').trim()]));
    const usar = (clave, campo) => {
      const v = porClave[clave];
      if (v && !PROVISIONALES.includes(v)) datos[campo] = v;
    };
    usar('contacto-nombre', 'nombre');
    usar('contacto-email', 'email');
    usar('contacto-telefono', 'telefono');
    usar('contacto-direccion', 'direccion');
  } catch {
    // Sin conexión con el servidor: se mantienen los datos por defecto.
  }
}

const ICONOS = {
  direccion: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  telefono: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  email: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  info: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  mensaje: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/></svg>'
};

const PESTANAS = [
  { id: 'info', titulo: 'Información', subtitulo: 'Datos y ubicación', icono: ICONOS.info },
  { id: 'mensaje', titulo: 'Enviar mensaje', subtitulo: 'Escríbenos directamente', icono: ICONOS.mensaje }
];

const listaDatos = computed(() => [
  { clave: 'direccion', etiqueta: 'Dirección', valor: datos.direccion, icono: ICONOS.direccion, enlace: URL_RUTA },
  { clave: 'telefono', etiqueta: 'Teléfono', valor: datos.telefono, icono: ICONOS.telefono, enlace: `tel:${datos.telefono.replace(/[^\d+]/g, '')}` },
  { clave: 'email', etiqueta: 'Correo electrónico', valor: datos.email, icono: ICONOS.email, enlace: `mailto:${datos.email}` }
]);

/* ---------- Mapa (Google Maps, sin clave de API) ---------- */
const UBICACION = '14.6611,-90.8197'; // Chimaltenango, Guatemala
const URL_MAPA = `https://www.google.com/maps?q=${UBICACION}&z=15&output=embed`;
const URL_RUTA = `https://www.google.com/maps/dir/?api=1&destination=${UBICACION}`;

/* ---------- Copiar al portapapeles ---------- */
const copiado = ref('');
let temporizadorCopia = null;
async function copiar(d) {
  try {
    await navigator.clipboard.writeText(d.valor);
  } catch {
    const t = document.createElement('textarea');
    t.value = d.valor;
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); } catch { /* sin soporte */ }
    t.remove();
  }
  copiado.value = d.clave;
  clearTimeout(temporizadorCopia);
  temporizadorCopia = setTimeout(() => (copiado.value = ''), 1600);
}

/* ---------- Formulario y validaciones ---------- */
const MIN_MENSAJE = 30;
const MAX_MENSAJE = 1000;
const EMAIL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

const form = reactive({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
const tocados = reactive({ nombre: false, email: false, telefono: false, asunto: false, mensaje: false });
const enviando = ref(false);
const enviado = ref(false);
const errorEnvio = ref('');
const nombreEnviado = ref('');
const correoEnviado = ref('');

function validarNombre(v) {
  const t = v.trim();
  if (!t) return 'Escribe tu nombre completo.';
  const p = t.split(/\s+/);
  if (p.length < 2) return 'Escribe al menos nombre y apellido (mínimo 2 palabras).';
  if (p.length > 4) return 'Máximo 4 palabras.';
  if (p.some((w) => w.length < 2)) return 'Cada palabra debe tener al menos 2 letras.';
  if (p.some((w) => w.length > 10)) return 'Cada palabra puede tener máximo 10 letras.';
  if (p.some((w) => !/^\p{L}+$/u.test(w))) return 'Solo se permiten letras.';
  return '';
}
function validarCorreo(v) {
  const t = v.trim();
  if (!t) return 'Escribe tu correo electrónico.';
  if (!t.includes('@')) return 'Falta el símbolo @ en el correo.';
  if (t.includes('..') || !EMAIL_RE.test(t)) return 'Escribe un correo válido, por ejemplo: nombre@dominio.com';
  return '';
}
function validarTelefono(v) {
  const t = v.trim();
  if (!t) return 'Escribe tu teléfono.';
  const digitos = t.replace(/\D/g, '');
  if (!/^[\d\s+()-]+$/.test(t) || digitos.length < 7 || digitos.length > 15) {
    return 'Escribe un teléfono válido de 7 a 15 dígitos.';
  }
  return '';
}
function validarAsunto(v) {
  const t = v.trim();
  if (!t) return 'Escribe el asunto.';
  if (t.length < 3) return 'El asunto es demasiado corto.';
  if (t.length > 120) return 'El asunto admite máximo 120 caracteres.';
  return '';
}
function validarMensaje(v) {
  const t = v.trim();
  if (!t) return 'Escribe tu mensaje.';
  if (t.length < MIN_MENSAJE) return `El mensaje es muy corto: faltan ${MIN_MENSAJE - t.length} caracteres.`;
  if (t.split(/\s+/).length < 5) return 'Escribe al menos 5 palabras para que podamos ayudarte.';
  return '';
}

const errores = computed(() => ({
  nombre: validarNombre(form.nombre),
  email: validarCorreo(form.email),
  telefono: validarTelefono(form.telefono),
  asunto: validarAsunto(form.asunto),
  mensaje: validarMensaje(form.mensaje)
}));
const ver = (campo) => tocados[campo] && !!errores.value[campo];
const tocar = (campo) => (tocados[campo] = true);

// Mientras escribe: el nombre solo admite letras y espacios; el correo no admite espacios.
function alNombre(e) {
  const limpio = e.target.value.replace(/[^\p{L}\s]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
  form.nombre = limpio;
  e.target.value = limpio;
}
function alCorreo(e) {
  const limpio = e.target.value.replace(/\s/g, '');
  form.email = limpio;
  e.target.value = limpio;
}
function alTelefono(e) {
  const limpio = e.target.value.replace(/[^\d\s+()-]/g, '');
  form.telefono = limpio;
  e.target.value = limpio;
}

async function enviar() {
  errorEnvio.value = '';
  Object.keys(tocados).forEach((k) => (tocados[k] = true));
  const primero = ['nombre', 'email', 'telefono', 'asunto', 'mensaje'].find((k) => errores.value[k]);
  if (primero) {
    document.getElementById(`cm-${primero}`)?.focus();
    return;
  }
  enviando.value = true;
  const carga = {
    nombre: form.nombre.trim(),
    email: form.email.trim().toLowerCase(),
    telefono: form.telefono.trim(),
    asunto: form.asunto.trim(),
    mensaje: form.mensaje.trim()
  };
  try {
    await postContacto(carga);
  } catch (e) {
    errorEnvio.value = e.message || 'No se pudo enviar el mensaje. Intenta de nuevo.';
    enviando.value = false;
    return;
  }
  await new Promise((r) => setTimeout(r, 700)); // breve pausa para que se perciba el envío
  nombreEnviado.value = carga.nombre.split(' ')[0];
  correoEnviado.value = carga.email;
  enviando.value = false;
  enviado.value = true;
  Object.assign(form, { nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
  Object.keys(tocados).forEach((k) => (tocados[k] = false));
}

function otroMensaje() {
  enviado.value = false;
  nextTick(() => document.getElementById('cm-nombre')?.focus());
}

/* ---------- Accesibilidad: foco, Esc, Tab atrapado, pestañas con flechas ---------- */
const dialogo = ref(null);
const botonCerrar = ref(null);
const botonesPestana = ref([]);
let elementoPrevio = null;

function alTeclado(e) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    cerrarContacto();
    return;
  }
  if (e.key === 'Tab' && dialogo.value) {
    const focales = [...dialogo.value.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, iframe, [tabindex="0"]')].filter(
      (el) => el.offsetParent !== null
    );
    if (!focales.length) return;
    const primero = focales[0];
    const ultimo = focales[focales.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }
  const enPestana = e.target?.getAttribute?.('role') === 'tab';
  if (enPestana && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    const i = PESTANAS.findIndex((p) => p.id === contactoPestana.value);
    const paso = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    const nueva = PESTANAS[(i + paso + PESTANAS.length) % PESTANAS.length];
    contactoPestana.value = nueva.id;
    nextTick(() => document.getElementById(`cm-tab-${nueva.id}`)?.focus());
  }
}

watch(contactoAbierto, async (abierta) => {
  if (abierta) {
    elementoPrevio = document.activeElement;
    document.documentElement.style.overflow = 'hidden'; // el fondo no se desplaza
    errorEnvio.value = '';
    cargarDatos();
    await nextTick();
    botonCerrar.value?.focus();
  } else {
    document.documentElement.style.overflow = '';
    elementoPrevio?.focus?.();
  }
});

onUnmounted(() => {
  document.documentElement.style.overflow = '';
  clearTimeout(temporizadorCopia);
});
</script>

<style>
/* ===== Fondo ===== */
.cm-fondo {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.5rem, 3vw, 2rem);
  box-sizing: border-box;
  background: rgba(8, 28, 44, 0.62);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-family: sans-serif;
}

/* ===== Ventana ===== */
.cm-ventana {
  position: relative;
  display: grid;
  grid-template-columns: 300px 1fr;
  width: min(1040px, 100%);
  height: min(700px, 100%);
  overflow: hidden;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
  color: #24323b;
}

/* ===== Lateral ===== */
.cm-lateral {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: 2rem 1.5rem 1.5rem;
  color: #fff;
  background: linear-gradient(160deg, #0f3d5e 0%, #1a5c8a 55%, #1f7a8f 100%);
  overflow: hidden;
}
.cm-lateral::before,
.cm-lateral::after {
  content: '';
  position: absolute;
  width: 220px;
  height: 220px;
  opacity: 0.07;
  pointer-events: none;
  background:
    linear-gradient(#fff, #fff) center / 64px 220px no-repeat,
    linear-gradient(#fff, #fff) center / 220px 64px no-repeat;
}
.cm-lateral::before { top: -70px; right: -80px; }
.cm-lateral::after { bottom: -90px; left: -90px; }
.cm-lateral > * { position: relative; z-index: 1; }

.cm-marca { display: flex; align-items: center; gap: 0.8rem; }
.cm-marca h2 { margin: 0; font-size: 1.6rem; letter-spacing: 0.04em; }
.cm-lema { margin: 0.1rem 0 0; font-size: 0.85rem; opacity: 0.85; }

.cm-pestanas { display: flex; flex-direction: column; gap: 0.6rem; }
.cm-pestana {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.85rem 1rem;
  font: inherit;
  text-align: left;
  color: #fff;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.25s, transform 0.25s, border-color 0.25s, box-shadow 0.25s;
}
.cm-pestana:hover { background: rgba(255, 255, 255, 0.16); transform: translateX(4px); }
.cm-pestana.activa {
  background: #fff;
  color: var(--azul-oscuro, #0f3d5e);
  border-color: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  transform: translateX(6px);
}
.cm-pestana:focus-visible { outline: 3px solid #5eeaea; outline-offset: 2px; }
.cm-pestana-icono { display: flex; flex: none; }
.cm-pestana-texto { display: flex; flex-direction: column; line-height: 1.25; }
.cm-pestana-texto small { font-size: 0.76rem; opacity: 0.75; }
.cm-nota { margin: auto 0 0; font-size: 0.8rem; line-height: 1.5; opacity: 0.8; }

/* ===== Contenido ===== */
.cm-contenido { position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; background: linear-gradient(180deg, #fff, #f6fafc); }
.cm-scroll { flex: 1; min-height: 0; overflow-x: hidden; overflow-y: auto; }
.cm-panel { box-sizing: border-box; min-height: 100%; padding: 2.25rem clamp(1.25rem, 3.5vw, 2.5rem) 2rem; padding-right: clamp(1.25rem, 3.5vw, 2.5rem); }
.cm-cerrar {
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #4b6475;
  background: #eef4f7;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.3s;
}
.cm-cerrar:hover { color: #fff; background: #d94a4f; transform: rotate(90deg); }
.cm-cerrar:focus-visible { outline: 3px solid var(--turquesa, #2a9d9a); outline-offset: 2px; }

.cm-subtitulo { margin: 0; font-size: clamp(1.35rem, 2.4vw, 1.75rem); color: var(--azul-oscuro, #0f3d5e); }
.cm-subtitulo::after { content: ''; display: block; width: 48px; height: 4px; margin-top: 0.5rem; border-radius: 2px; background: var(--turquesa, #2a9d9a); }
.cm-intro { margin: 0.9rem 0 1.5rem; color: #4b6475; line-height: 1.55; }
.cm-req { color: #d94a4f; }

/* ===== Información ===== */
.cm-info-rejilla { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 1.5rem; align-items: stretch; }
.cm-datos { display: flex; flex-direction: column; gap: 0.85rem; margin: 0; padding: 0; list-style: none; }
.cm-dato {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.9rem 1rem;
  background: #fff;
  border: 1px solid rgba(26, 92, 138, 0.12);
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(15, 61, 94, 0.06);
  transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
}
.cm-dato:hover { transform: translateY(-3px); border-color: rgba(42, 157, 154, 0.5); box-shadow: 0 10px 22px rgba(15, 61, 94, 0.12); }
.cm-dato-icono {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  color: #fff;
  background: linear-gradient(135deg, var(--azul, #1a5c8a), var(--turquesa, #2a9d9a));
  border-radius: 14px;
}
.cm-dato-texto { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.cm-dato-etiqueta { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #6b8596; }
.cm-dato-valor { font-size: 0.97rem; color: #24323b; text-decoration: none; overflow-wrap: anywhere; }
a.cm-dato-valor:hover { color: var(--azul, #1a5c8a); text-decoration: underline; }
.cm-copiar {
  flex: none;
  padding: 0.3rem 0.7rem;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--azul, #1a5c8a);
  background: rgba(26, 92, 138, 0.08);
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.cm-copiar:hover { background: rgba(26, 92, 138, 0.18); }
.cm-copiar.copiado { color: #fff; background: #2a9d6a; }

.cm-mapa { position: relative; min-height: 300px; overflow: hidden; background: #dfeaf0; border-radius: 18px; border: 1px solid rgba(26, 92, 138, 0.15); box-shadow: 0 8px 22px rgba(15, 61, 94, 0.12); }
.cm-mapa iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.cm-mapa-enlace {
  position: absolute;
  left: 0.8rem;
  bottom: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  text-decoration: none;
  background: var(--azul-oscuro, #0f3d5e);
  border-radius: 999px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s, background 0.2s;
}
.cm-mapa-enlace:hover { transform: translateY(-2px); background: var(--azul, #1a5c8a); }

/* ===== Formulario ===== */
.cm-fila { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1.25rem; }
.cm-campo { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; min-width: 0; }
.cm-campo label { font-size: 0.88rem; font-weight: 600; color: var(--azul-oscuro, #0f3d5e); }
.cm-campo input,
.cm-campo select,
.cm-campo textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 0.9rem;
  font: inherit;
  color: #24323b;
  background: #fff;
  border: 2px solid #d6e3ea;
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.cm-campo textarea { resize: vertical; min-height: 120px; max-height: 280px; line-height: 1.5; }
.cm-campo input:focus,
.cm-campo select:focus,
.cm-campo textarea:focus { outline: none; border-color: var(--turquesa, #2a9d9a); box-shadow: 0 0 0 4px rgba(42, 157, 154, 0.18); }
.cm-campo.invalido input,
.cm-campo.invalido textarea { border-color: #d94a4f; background: #fff7f7; }
.cm-campo.invalido input:focus,
.cm-campo.invalido textarea:focus { box-shadow: 0 0 0 4px rgba(217, 74, 79, 0.15); }
.cm-campo small { font-size: 0.78rem; color: #6b8596; line-height: 1.4; }
.cm-campo small.error { color: #c53a3f; font-weight: 600; }
.cm-pie-campo { display: flex; justify-content: space-between; gap: 1rem; }
.cm-contador { flex: none; font-variant-numeric: tabular-nums; }
.cm-campo small.cm-contador.listo { color: #2a9d6a; }

.cm-error {
  margin: 0.25rem 0 0.75rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid #eab6b8;
  border-radius: 10px;
  background: #fff5f5;
  color: #a72f34;
  font-size: 0.88rem;
  font-weight: 600;
}

.cm-acciones { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; }
.cm-boton,
.cm-boton-secundario {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.6rem;
  font: inherit;
  font-weight: 700;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s, opacity 0.2s;
}
.cm-boton { color: #fff; background: linear-gradient(135deg, var(--azul, #1a5c8a), var(--turquesa, #2a9d9a)); border: 0; box-shadow: 0 8px 20px rgba(26, 92, 138, 0.35); }
.cm-boton:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(26, 92, 138, 0.45); }
.cm-boton:disabled { opacity: 0.75; cursor: progress; }
.cm-boton-secundario { color: var(--azul, #1a5c8a); background: transparent; border: 2px solid rgba(26, 92, 138, 0.3); }
.cm-boton-secundario:hover:not(:disabled) { background: rgba(26, 92, 138, 0.08); transform: translateY(-2px); }
.cm-boton:focus-visible,
.cm-boton-secundario:focus-visible { outline: 3px solid var(--turquesa, #2a9d9a); outline-offset: 3px; }
.cm-spinner { width: 16px; height: 16px; border: 2.5px solid rgba(255, 255, 255, 0.4); border-top-color: #fff; border-radius: 50%; animation: cm-giro 0.7s linear infinite; }

/* ===== Éxito ===== */
.cm-exito { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 420px; text-align: center; }
.cm-exito-icono { color: #2a9d6a; animation: cm-pop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1); }
.cm-exito h3 { margin: 1rem 0 0.5rem; font-size: 1.6rem; color: var(--azul-oscuro, #0f3d5e); }
.cm-exito p { max-width: 460px; margin: 0 0 1.5rem; line-height: 1.6; color: #4b6475; }
.cm-exito-acciones { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }

/* ===== Animaciones ===== */
.cm-enter-active, .cm-leave-active { transition: opacity 0.25s ease; }
.cm-enter-active .cm-ventana, .cm-leave-active .cm-ventana { transition: transform 0.3s cubic-bezier(0.22, 0.8, 0.3, 1), opacity 0.25s; }
.cm-enter-from, .cm-leave-to { opacity: 0; }
.cm-enter-from .cm-ventana, .cm-leave-to .cm-ventana { transform: translateY(24px) scale(0.96); opacity: 0; }
.cm-cambio-enter-active, .cm-cambio-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.cm-cambio-enter-from { opacity: 0; transform: translateX(24px); }
.cm-cambio-leave-to { opacity: 0; transform: translateX(-24px); }
@keyframes cm-giro { to { transform: rotate(360deg); } }
@keyframes cm-pop { from { transform: scale(0.3); opacity: 0; } }

/* ===== Pantallas medianas ===== */
@media (max-width: 960px) {
  .cm-ventana { grid-template-columns: 240px 1fr; }
  .cm-info-rejilla { grid-template-columns: 1fr; }
  .cm-mapa { min-height: 280px; }
}

/* ===== Pantallas angostas: encabezado arriba, pestañas en segmentos ===== */
@media (max-width: 720px) {
  .cm-fondo { padding: 0; }
  .cm-ventana { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); width: 100%; height: 100%; border-radius: 0; }
  .cm-lateral { gap: 0.9rem; padding: 1rem 1rem 0.9rem; }
  .cm-lateral::before, .cm-lateral::after { display: none; }
  .cm-marca { padding-right: 3rem; }
  .cm-marca svg { width: 36px; height: 36px; }
  .cm-marca h2 { font-size: 1.3rem; }
  .cm-pestanas { flex-direction: row; gap: 0.4rem; padding: 0.3rem; background: rgba(0, 0, 0, 0.22); border-radius: 999px; }
  .cm-pestana { flex: 1; justify-content: center; gap: 0.4rem; padding: 0.55rem 0.5rem; background: transparent; border: 0; border-radius: 999px; }
  .cm-pestana:hover, .cm-pestana.activa { transform: none; }
  .cm-pestana-icono svg { width: 18px; height: 18px; }
  .cm-pestana-texto small, .cm-nota { display: none; }
  .cm-pestana-texto strong { font-size: 0.88rem; }
  .cm-contenido { position: static; }
  .cm-cerrar { top: 0.85rem; right: 0.85rem; z-index: 10; color: #fff; background: rgba(255, 255, 255, 0.18); }
  .cm-panel { padding: 1.5rem 1.1rem 2rem; }
  .cm-fila { grid-template-columns: 1fr; }
  .cm-dato { flex-wrap: wrap; }
  .cm-exito { min-height: 340px; }
}

@media (prefers-reduced-motion: reduce) {
  .cm-enter-active, .cm-leave-active, .cm-enter-active .cm-ventana, .cm-leave-active .cm-ventana,
  .cm-cambio-enter-active, .cm-cambio-leave-active,
  .cm-pestana, .cm-dato, .cm-cerrar, .cm-boton, .cm-boton-secundario, .cm-mapa-enlace { transition: none; }
  .cm-spinner, .cm-exito-icono { animation: none; }
}
</style>
