<template>
  <Teleport to="body">
    <Transition name="ct">
      <div v-if="citaAbierta" class="ct-fondo" @mousedown.self="pedirCerrar">
        <div
          ref="dialogo"
          class="ct-ventana"
          :class="{ sacudir }"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ct-titulo"
          @keydown="alTeclado"
        >
          <!-- ================= Panel lateral ================= -->
          <aside class="ct-lateral">
            <div class="ct-marca">
              <svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true">
                <defs>
                  <linearGradient id="ct-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#35c4bf" />
                    <stop offset="1" stop-color="#1a5c8a" />
                  </linearGradient>
                </defs>
                <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="url(#ct-grad)" />
                <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" />
                <path d="M17 9h6v8h8v6h-8v8h-6v-8H9v-6h8z" fill="#fff" />
                <path d="M7 24h7l2.5-5 4 10 2.5-5H33" fill="none" stroke="#0f3d5e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div>
                <h2 id="ct-titulo">Solicitar cita</h2>
                <p class="ct-lema">Tu salud, con calma y a tiempo</p>
              </div>
            </div>

            <!-- Progreso (móvil): barra compacta -->
            <div class="ct-progreso-movil" aria-hidden="true">
              <span>Paso {{ paso + 1 }} de {{ PASOS.length }} · {{ PASOS[paso].titulo }}</span>
              <div class="ct-barra"><i :style="{ width: `${((paso + (enviado ? 1 : 0.5)) / PASOS.length) * 100}%` }"></i></div>
            </div>

            <!-- Pasos (escritorio) -->
            <ol class="ct-pasos" aria-label="Progreso de la solicitud">
              <li
                v-for="(p, i) in PASOS"
                :key="p.id"
                :class="{ activo: i === paso && !enviado, hecho: i < paso || enviado }"
                :aria-current="i === paso && !enviado ? 'step' : undefined"
              >
                <button type="button" class="ct-paso-btn" :disabled="enviado || i > maxPaso || enviando" @click="irAPaso(i)">
                  <span class="ct-paso-num">
                    <svg v-if="i < paso || enviado" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    <template v-else>{{ i + 1 }}</template>
                  </span>
                  <span class="ct-paso-texto">
                    <strong>{{ p.titulo }}</strong>
                    <small>{{ p.subtitulo }}</small>
                  </span>
                </button>
              </li>
            </ol>

            <!-- Resumen del servicio elegido -->
            <div class="ct-resumen" aria-live="polite">
              <template v-if="servicioElegido">
                <span class="ct-resumen-etiqueta">Servicio elegido</span>
                <div class="ct-resumen-servicio">
                  <span class="ct-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" v-html="iconoDe(servicioElegido.icono)"></svg>
                  </span>
                  <div>
                    <strong>{{ servicioElegido.nombre }}</strong>
                    <small>{{ formatoDuracion(servicioElegido.duracionMinutos) }} · {{ formatoMoneda(servicioElegido.precioCentavos) }}</small>
                  </div>
                </div>
              </template>
              <p v-else class="ct-resumen-vacio">Elige un servicio para ver aquí su duración y precio.</p>
            </div>

            <p class="ct-nota">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.3 8-8 9-4.7-1-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>
              Solicitar tu cita no tiene costo. Nuestro equipo la confirmará contigo.
            </p>
            <svg class="ct-ecg" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 22h80l10-14 14 30 12-22 8 6h176" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </aside>

          <!-- ================= Contenido ================= -->
          <section class="ct-contenido">
            <button ref="botonCerrar" type="button" class="ct-cerrar" aria-label="Cerrar ventana de solicitud de cita" @click="pedirCerrar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>

            <!-- Confirmación de salida -->
            <Transition name="ct-cambio">
              <div v-if="confirmandoSalida" class="ct-salida" role="alertdialog" aria-labelledby="ct-salida-t" aria-describedby="ct-salida-d">
                <div class="ct-salida-caja">
                  <h3 id="ct-salida-t">¿Descartar la solicitud?</h3>
                  <p id="ct-salida-d">Has avanzado en el formulario. Si sales ahora se perderán los datos que escribiste.</p>
                  <div class="ct-salida-acciones">
                    <button ref="botonSeguir" type="button" class="ct-boton" @click="confirmandoSalida = false">Seguir editando</button>
                    <button type="button" class="ct-boton-secundario ct-peligro" @click="cerrarSinPreguntar">Descartar y salir</button>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- ======== Éxito ======== -->
            <div v-if="enviado" class="ct-cuerpo ct-exito" role="status">
              <div class="ct-exito-icono" aria-hidden="true">
                <svg viewBox="0 0 52 52" width="76" height="76"><circle class="ct-exito-circulo" cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="3" /><path class="ct-exito-marca" d="M15 27l8 8 14-17" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </div>
              <h3 ref="tituloPaso" tabindex="-1">¡Solicitud enviada, {{ primerNombre }}!</h3>
              <p class="ct-exito-texto">
                Recibimos tu solicitud para <strong>{{ resumen.servicio }}</strong>. Te llamaremos al <strong>{{ resumen.telefono }}</strong> para confirmar el día y la hora definitivos.
              </p>
              <div class="ct-ticket">
                <span>Tu número de referencia</span>
                <strong>{{ referencia }}</strong>
                <small>Guárdalo por si necesitas consultarnos sobre tu solicitud.</small>
              </div>
              <dl class="ct-datos-lista">
                <div><dt>Fecha preferida</dt><dd>{{ resumen.fecha }}</dd></div>
                <div><dt>Horario preferido</dt><dd>{{ resumen.franja }}</dd></div>
              </dl>
              <div class="ct-acciones centrado">
                <button type="button" class="ct-boton" @click="cerrarCita">Listo</button>
                <button type="button" class="ct-boton-secundario" @click="otraSolicitud">Solicitar otra cita</button>
              </div>
            </div>

            <!-- ======== Formulario por pasos ======== -->
            <form v-else class="ct-form" novalidate @submit.prevent="siguiente">
              <div class="ct-scroll" ref="zonaScroll">
                <Transition name="ct-cambio" mode="out-in">
                  <!-- ---- Paso 1: Servicio ---- -->
                  <div v-if="paso === 0" key="p0" class="ct-cuerpo">
                    <h3 ref="tituloPaso" tabindex="-1" class="ct-subtitulo">¿Qué servicio necesitas?</h3>
                    <p class="ct-intro">Elige el servicio que mejor se ajuste. Si no estás seguro, la <em>consulta de medicina general</em> es un buen punto de partida: el médico te orientará.</p>

                    <div class="ct-buscar">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                      <input v-model="busqueda" type="search" placeholder="Buscar servicio…" aria-label="Buscar servicio" autocomplete="off" />
                    </div>

                    <div class="ct-chips" role="group" aria-label="Filtrar por categoría">
                      <button type="button" class="ct-chip" :class="{ on: !filtroCat }" :aria-pressed="!filtroCat" @click="filtroCat = ''">Todos</button>
                      <button
                        v-for="c in categorias"
                        :key="c"
                        type="button"
                        class="ct-chip"
                        :class="{ on: filtroCat === c }"
                        :aria-pressed="filtroCat === c"
                        @click="filtroCat = c"
                      >{{ c }}</button>
                    </div>

                    <p v-if="catalogoEstado === 'cargando' || catalogoEstado === 'inicial'" class="ct-estado">Cargando servicios…</p>
                    <div v-else-if="catalogoEstado === 'error'" class="ct-estado ct-estado-error" role="alert">
                      No pudimos cargar los servicios. Revisa tu conexión e inténtalo de nuevo.
                      <button type="button" class="ct-enlace" @click="cargarCatalogo(true)">Reintentar</button>
                    </div>
                    <p v-else-if="!servicios.length" class="ct-estado">Por ahora no hay servicios disponibles para agendar.</p>
                    <p v-else-if="!gruposFiltrados.length" class="ct-estado">Ningún servicio coincide con tu búsqueda.</p>

                    <div class="ct-lista" role="radiogroup" aria-label="Servicios disponibles" aria-describedby="ct-ayuda-servicio">
                      <template v-for="g in gruposFiltrados" :key="g.categoria">
                        <h4 class="ct-grupo">{{ g.categoria }}</h4>
                        <label v-for="s in g.items" :key="s._id" class="ct-servicio" :class="{ on: form.servicio === s._id }">
                          <input v-model="form.servicio" type="radio" name="ct-servicio" :value="s._id" @change="tocados.servicio = true" />
                          <span class="ct-ico" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" v-html="iconoDe(s.icono)"></svg>
                          </span>
                          <span class="ct-servicio-texto">
                            <strong>{{ s.nombre }}</strong>
                            <small>{{ formatoDuracion(s.duracionMinutos) }}</small>
                          </span>
                          <span class="ct-precio">{{ formatoMoneda(s.precioCentavos) }}</span>
                          <span class="ct-radio" aria-hidden="true"></span>
                        </label>
                      </template>
                    </div>
                    <small id="ct-ayuda-servicio" class="ct-ayuda" :class="{ error: ver('servicio') }">{{ ver('servicio') ? errores.servicio : 'Los precios son referenciales y se confirman en la clínica.' }}</small>
                  </div>

                  <!-- ---- Paso 2: Datos ---- -->
                  <div v-else-if="paso === 1" key="p1" class="ct-cuerpo">
                    <h3 ref="tituloPaso" tabindex="-1" class="ct-subtitulo">Datos del paciente</h3>
                    <p class="ct-intro">Indícanos los datos de quien recibirá la atención. Los campos con <span class="ct-req">*</span> son obligatorios.</p>

                    <div class="ct-campo" :class="{ invalido: ver('nombre') }">
                      <label for="ct-nombre">Nombre completo del paciente <span class="ct-req">*</span></label>
                      <input id="ct-nombre" :value="form.nombre" type="text" autocomplete="name" maxlength="70" placeholder="Ej. María Fernanda López" :aria-invalid="ver('nombre')" aria-describedby="ct-ayuda-nombre" @input="alNombre" @blur="alSalirNombre" />
                      <small id="ct-ayuda-nombre" :class="{ error: ver('nombre') }">{{ ver('nombre') ? errores.nombre : 'Nombre y apellido: de 2 a 4 palabras, solo letras.' }}</small>
                    </div>

                    <div class="ct-fila">
                      <div class="ct-campo" :class="{ invalido: ver('telefono') }">
                        <label for="ct-telefono">Teléfono <span class="ct-req">*</span></label>
                        <div class="ct-prefijo">
                          <span aria-hidden="true">+502</span>
                          <input id="ct-telefono" :value="form.telefono" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="9" placeholder="0000-0000" :aria-invalid="ver('telefono')" aria-describedby="ct-ayuda-telefono" @input="alTelefono" @blur="tocar('telefono')" />
                        </div>
                        <small id="ct-ayuda-telefono" :class="{ error: ver('telefono') }">{{ ver('telefono') ? errores.telefono : 'Número de Guatemala de 8 dígitos.' }}</small>
                      </div>

                      <div class="ct-campo" :class="{ invalido: ver('email') }">
                        <label for="ct-email">Correo electrónico <span class="ct-req">*</span></label>
                        <input id="ct-email" :value="form.email" type="email" inputmode="email" autocomplete="email" maxlength="120" placeholder="tucorreo@ejemplo.com" :aria-invalid="ver('email')" aria-describedby="ct-ayuda-email" @input="alCorreo" @blur="tocar('email')" />
                        <small id="ct-ayuda-email" :class="{ error: ver('email') }">{{ ver('email') ? errores.email : 'Para enviarte recordatorios.' }}</small>
                      </div>
                    </div>

                    <fieldset class="ct-segmento-grupo">
                      <legend>¿Es la primera vez que visitas nuestro centro?</legend>
                      <div class="ct-segmento">
                        <label :class="{ on: form.primeraVez === true }"><input v-model="form.primeraVez" type="radio" name="ct-primera" :value="true" /> Sí, es mi primera vez</label>
                        <label :class="{ on: form.primeraVez === false }"><input v-model="form.primeraVez" type="radio" name="ct-primera" :value="false" /> Ya soy paciente</label>
                      </div>
                      <small class="ct-ayuda">{{ form.primeraVez ? 'Llega 10 minutos antes para registrar tu expediente.' : 'Ten a mano tu nombre completo al llegar.' }}</small>
                    </fieldset>
                  </div>

                  <!-- ---- Paso 3: Fecha ---- -->
                  <div v-else-if="paso === 2" key="p2" class="ct-cuerpo">
                    <h3 ref="tituloPaso" tabindex="-1" class="ct-subtitulo">¿Cuándo te viene bien?</h3>
                    <p class="ct-intro">Atendemos <strong>{{ resumenHorario }}</strong>. La fecha es una preferencia: confirmaremos la hora exacta contigo.</p>

                    <div class="ct-campo" :class="{ invalido: ver('fecha') }">
                      <span class="ct-etiqueta-falsa" id="ct-rapidas-t">Próximos días disponibles</span>
                      <div class="ct-dias" role="group" aria-labelledby="ct-rapidas-t">
                        <button v-for="d in diasRapidos" :key="d.valor" type="button" class="ct-dia" :class="{ on: form.fecha === d.valor }" :aria-pressed="form.fecha === d.valor" @click="elegirDia(d.valor)">
                          <small>{{ d.dia }}</small>
                          <strong>{{ d.numero }}</strong>
                          <small>{{ d.mes }}</small>
                        </button>
                      </div>

                      <label for="ct-fecha" class="ct-otra">O elige otra fecha <span class="ct-req">*</span></label>
                      <input id="ct-fecha" v-model="form.fecha" type="date" :min="fechaMin" :max="fechaMax" :aria-invalid="ver('fecha')" aria-describedby="ct-ayuda-fecha" @change="tocar('fecha')" @blur="tocar('fecha')" />
                      <small id="ct-ayuda-fecha" :class="{ error: ver('fecha') }">{{ ver('fecha') ? errores.fecha : `Desde mañana y hasta dentro de ${MAX_DIAS} días, en días de atención.` }}</small>
                    </div>

                    <fieldset class="ct-segmento-grupo" :disabled="!form.fecha || !!errores.fecha">
                      <legend>Horario preferido</legend>
                      <div class="ct-franjas">
                        <label v-for="f in franjasDisponibles" :key="f.id" class="ct-franja" :class="{ on: form.franja === f.id }">
                          <input v-model="form.franja" type="radio" name="ct-franja" :value="f.id" />
                          <strong>{{ f.titulo }}</strong>
                          <small>{{ f.horas }}</small>
                        </label>
                      </div>
                    </fieldset>

                    <div class="ct-campo" :class="{ invalido: ver('mensaje') }">
                      <label for="ct-mensaje">Motivo o comentarios <span class="ct-opc">(opcional)</span></label>
                      <textarea id="ct-mensaje" v-model="form.mensaje" rows="3" :maxlength="MAX_MENSAJE" placeholder="Cuéntanos brevemente qué sientes o qué necesitas…" :aria-invalid="ver('mensaje')" aria-describedby="ct-ayuda-mensaje" @blur="tocar('mensaje')"></textarea>
                      <div class="ct-pie-campo">
                        <small id="ct-ayuda-mensaje" :class="{ error: ver('mensaje') }">{{ ver('mensaje') ? errores.mensaje : 'No incluyas datos muy sensibles; los hablaremos en la consulta.' }}</small>
                        <small class="ct-contador">{{ form.mensaje.length }}/{{ MAX_MENSAJE }}</small>
                      </div>
                    </div>
                  </div>

                  <!-- ---- Paso 4: Confirmar ---- -->
                  <div v-else key="p3" class="ct-cuerpo">
                    <h3 ref="tituloPaso" tabindex="-1" class="ct-subtitulo">Revisa y confirma</h3>
                    <p class="ct-intro">Verifica que todo esté correcto antes de enviar tu solicitud.</p>

                    <dl class="ct-revision">
                      <div v-for="r in filasRevision" :key="r.etiqueta">
                        <dt>{{ r.etiqueta }}</dt>
                        <dd>{{ r.valor }}</dd>
                        <button type="button" class="ct-enlace" :aria-label="`Editar ${r.etiqueta.toLowerCase()}`" @click="irAPaso(r.paso)">Editar</button>
                      </div>
                    </dl>

                    <div class="ct-campo" :class="{ invalido: ver('acepta') }">
                      <label class="ct-check">
                        <input v-model="form.acepta" type="checkbox" :aria-invalid="ver('acepta')" aria-describedby="ct-ayuda-acepta" @change="tocar('acepta')" />
                        <span class="ct-check-caja" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                        <span>Autorizo el uso de mis datos para gestionar esta solicitud y que me contacten para confirmar mi cita. <span class="ct-req">*</span></span>
                      </label>
                      <small id="ct-ayuda-acepta" :class="{ error: ver('acepta') }">{{ ver('acepta') ? errores.acepta : 'Usaremos tus datos solo para atender tu solicitud.' }}</small>
                    </div>

                    <p v-if="errorEnvio" class="ct-error-envio" role="alert">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16h.01" /></svg>
                      {{ errorEnvio }}
                    </p>
                  </div>
                </Transition>
              </div>

              <!-- Barra de acciones -->
              <div class="ct-acciones">
                <button v-if="paso > 0" type="button" class="ct-boton-secundario" :disabled="enviando" @click="atras">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                  Atrás
                </button>
                <span v-else class="ct-relleno"></span>
                <button type="submit" class="ct-boton" :disabled="enviando">
                  <span v-if="enviando" class="ct-spinner" aria-hidden="true"></span>
                  {{ enviando ? 'Enviando…' : paso === PASOS.length - 1 ? 'Enviar solicitud' : 'Continuar' }}
                  <svg v-if="!enviando && paso < PASOS.length - 1" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, reactive, ref, watch } from 'vue';
import { postSolicitud } from '../api/client.js';
import { cerrarCita, citaAbierta, citaServicioInicial } from '../composables/citaModal.js';
import { cargarCatalogo, catalogoEstado, categorias, formatoDuracion, formatoMoneda, horarios, resumenHorario, servicios } from '../composables/catalogo.js';
import { iconoDe } from './iconosServicios.js';

/* ---------- Pasos ---------- */
const PASOS = [
  { id: 'servicio', titulo: 'Servicio', subtitulo: 'Qué necesitas' },
  { id: 'datos', titulo: 'Tus datos', subtitulo: 'Quién asistirá' },
  { id: 'fecha', titulo: 'Fecha', subtitulo: 'Cuándo prefieres' },
  { id: 'confirmar', titulo: 'Confirmar', subtitulo: 'Revisa y envía' }
];
const paso = ref(0);
const maxPaso = ref(0); // paso más lejano alcanzado (para volver con el menú lateral)

/* ---------- Reglas ---------- */
const MAX_DIAS = 60; // hasta cuántos días adelante se puede pedir cita
const MAX_MENSAJE = 500;
const EMAIL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

const form = reactive({
  servicio: '',
  nombre: '',
  telefono: '',
  email: '',
  primeraVez: true,
  fecha: '',
  franja: '',
  mensaje: '',
  acepta: false
});
const tocados = reactive({ servicio: false, nombre: false, telefono: false, email: false, fecha: false, mensaje: false, acepta: false });

const busqueda = ref('');
const filtroCat = ref('');
const enviando = ref(false);
const enviado = ref(false);
const errorEnvio = ref('');
const referencia = ref('');
const resumen = reactive({ nombre: '', servicio: '', telefono: '', fecha: '', franja: '' });
const confirmandoSalida = ref(false);
const sacudir = ref(false);

/* ---------- Fechas (siempre en hora local) ---------- */
const pad = (n) => String(n).padStart(2, '0');
const aTexto = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const deTexto = (t) => {
  const [a, m, d] = t.split('-').map(Number);
  return new Date(a, m - 1, d);
};
function sumarDias(base, n) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + n);
  return d;
}
const fechaMin = computed(() => aTexto(sumarDias(new Date(), 1)));
const fechaMax = computed(() => aTexto(sumarDias(new Date(), MAX_DIAS)));

// Días de la semana con atención. Si aún no cargan los horarios: lunes a viernes.
const diasAtencion = computed(() => {
  const act = horarios.value.filter((h) => h.activo !== false).map((h) => h.dia);
  return act.length ? act : [1, 2, 3, 4, 5];
});
const hayAtencion = (fecha) => diasAtencion.value.includes(fecha.getDay());

const diasRapidos = computed(() => {
  const lista = [];
  const fmtDia = new Intl.DateTimeFormat('es', { weekday: 'short' });
  const fmtMes = new Intl.DateTimeFormat('es', { month: 'short' });
  for (let i = 1; i <= MAX_DIAS && lista.length < 6; i++) {
    const d = sumarDias(new Date(), i);
    if (!hayAtencion(d)) continue;
    lista.push({
      valor: aTexto(d),
      dia: fmtDia.format(d).replace('.', ''),
      numero: d.getDate(),
      mes: fmtMes.format(d).replace('.', '')
    });
  }
  return lista;
});

function elegirDia(valor) {
  form.fecha = valor;
  tocados.fecha = true;
}

// Franjas según el horario real del día elegido.
const franjasDisponibles = computed(() => {
  const base = [{ id: '', titulo: 'Sin preferencia', horas: 'Cualquier hora' }];
  if (!form.fecha || errores.value.fecha) return base;
  const h = horarios.value.find((x) => x.dia === deTexto(form.fecha).getDay() && x.activo !== false);
  const ini = h?.horaInicio || '08:00';
  const fin = h?.horaFin || '17:00';
  const out = [];
  if (ini < '12:00') out.push({ id: 'MANANA', titulo: 'Mañana', horas: `${ini} – ${fin < '12:00' ? fin : '12:00'}` });
  if (fin > '12:00') out.push({ id: 'TARDE', titulo: 'Tarde', horas: `${ini > '12:00' ? ini : '12:00'} – ${fin}` });
  return [...out, ...base];
});

/* ---------- Validaciones ---------- */
function validarNombre(v) {
  const t = v.trim();
  if (!t) return 'Escribe el nombre completo del paciente.';
  const p = t.split(/\s+/);
  if (p.length < 2) return 'Escribe al menos nombre y apellido (mínimo 2 palabras).';
  if (p.length > 4) return 'Máximo 4 palabras.';
  if (p.some((w) => w.length < 2)) return 'Cada palabra debe tener al menos 2 letras.';
  if (p.some((w) => w.length > 20)) return 'Cada palabra puede tener máximo 20 letras.';
  return '';
}
function validarTelefono(v) {
  const d = v.replace(/\D/g, '');
  if (!d) return 'Escribe un número de teléfono.';
  if (d.length < 8) return `Faltan ${8 - d.length} dígito${8 - d.length > 1 ? 's' : ''} (deben ser 8).`;
  if (!/^[2-7]/.test(d)) return 'El número debe empezar con 2, 3, 4, 5, 6 o 7.';
  return '';
}
function validarCorreo(v) {
  const t = v.trim();
  if (!t) return 'Escribe tu correo electrónico.';
  if (!t.includes('@')) return 'Falta el símbolo @ en el correo.';
  if (t.includes('..') || !EMAIL_RE.test(t)) return 'Escribe un correo válido, por ejemplo: nombre@dominio.com';
  return '';
}
function validarFecha(v) {
  if (!v) return 'Elige una fecha para tu cita.';
  const d = deTexto(v);
  if (isNaN(d)) return 'La fecha no es válida.';
  if (v < fechaMin.value) return 'La fecha debe ser a partir de mañana.';
  if (v > fechaMax.value) return `Solo puedes pedir cita dentro de los próximos ${MAX_DIAS} días.`;
  if (!hayAtencion(d)) return `Ese día no atendemos. Atendemos ${resumenHorario.value.split(' · ')[0].toLowerCase()}.`;
  return '';
}

const errores = computed(() => ({
  servicio: form.servicio ? '' : 'Selecciona un servicio para continuar.',
  nombre: validarNombre(form.nombre),
  telefono: validarTelefono(form.telefono),
  email: validarCorreo(form.email),
  fecha: validarFecha(form.fecha),
  mensaje: form.mensaje.length > MAX_MENSAJE ? `Máximo ${MAX_MENSAJE} caracteres.` : '',
  acepta: form.acepta ? '' : 'Debes aceptar para poder enviar tu solicitud.'
}));
const CAMPOS_PASO = [['servicio'], ['nombre', 'telefono', 'email'], ['fecha', 'mensaje'], ['acepta']];
const ver = (c) => tocados[c] && !!errores.value[c];
const tocar = (c) => (tocados[c] = true);

// Si la fecha cambia a un día sin la franja elegida, se vuelve a "sin preferencia".
watch(franjasDisponibles, (lista) => {
  if (!lista.some((f) => f.id === form.franja)) form.franja = '';
});

/* ---------- Entradas con filtro mientras se escribe ---------- */
const capitalizar = (t) => t.replace(/\p{L}+/gu, (w) => w.charAt(0).toLocaleUpperCase('es') + w.slice(1).toLocaleLowerCase('es'));
function alNombre(e) {
  const limpio = e.target.value.replace(/[^\p{L}\s]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
  form.nombre = limpio;
  e.target.value = limpio;
}
function alSalirNombre() {
  form.nombre = capitalizar(form.nombre.trim());
  tocar('nombre');
}
function alTelefono(e) {
  let d = e.target.value.replace(/\D/g, '');
  if (d.startsWith('502') && d.length > 8) d = d.slice(3); // pegado con el prefijo del país
  d = d.slice(0, 8);
  const f = d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
  form.telefono = f;
  e.target.value = f;
}
function alCorreo(e) {
  const limpio = e.target.value.replace(/\s/g, '');
  form.email = limpio;
  e.target.value = limpio;
}

/* ---------- Catálogo ---------- */
const servicioElegido = computed(() => servicios.value.find((s) => s._id === form.servicio) || null);
const gruposFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  const mapa = new Map();
  for (const s of servicios.value) {
    const c = s.categoria || 'General';
    if (filtroCat.value && c !== filtroCat.value) continue;
    if (q && !`${s.nombre} ${s.descripcion || ''} ${c}`.toLowerCase().includes(q)) continue;
    if (!mapa.has(c)) mapa.set(c, []);
    mapa.get(c).push(s);
  }
  return [...mapa].map(([categoria, items]) => ({ categoria, items }));
});

/* ---------- Revisión ---------- */
const fmtLargo = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fechaLarga = (t) => {
  const s = fmtLargo.format(deTexto(t));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const franjaTexto = () => franjasDisponibles.value.find((f) => f.id === form.franja);
const textoFranja = () => {
  const f = franjaTexto();
  return f && f.id ? `${f.titulo} (${f.horas})` : 'Sin preferencia';
};
const primerNombre = computed(() => (resumen.nombre || form.nombre).split(' ')[0]);

const filasRevision = computed(() => [
  { etiqueta: 'Servicio', valor: servicioElegido.value ? `${servicioElegido.value.nombre} · ${formatoDuracion(servicioElegido.value.duracionMinutos)} · ${formatoMoneda(servicioElegido.value.precioCentavos)}` : '—', paso: 0 },
  { etiqueta: 'Paciente', valor: form.nombre, paso: 1 },
  { etiqueta: 'Teléfono', valor: `+502 ${form.telefono}`, paso: 1 },
  { etiqueta: 'Correo', valor: form.email || 'No indicado', paso: 1 },
  { etiqueta: 'Primera visita', valor: form.primeraVez ? 'Sí' : 'No, ya es paciente', paso: 1 },
  { etiqueta: 'Fecha preferida', valor: form.fecha ? fechaLarga(form.fecha) : '—', paso: 2 },
  { etiqueta: 'Horario preferido', valor: textoFranja(), paso: 2 },
  { etiqueta: 'Motivo', valor: form.mensaje.trim() || 'No indicado', paso: 2 }
]);

/* ---------- Navegación entre pasos ---------- */
const tituloPaso = ref(null);
const zonaScroll = ref(null);

function enfocarPaso() {
  nextTick(() => {
    if (zonaScroll.value) zonaScroll.value.scrollTop = 0;
    tituloPaso.value?.focus?.({ preventScroll: true });
  });
}

function pasoValido(i) {
  CAMPOS_PASO[i].forEach(tocar);
  const primero = CAMPOS_PASO[i].find((c) => errores.value[c]);
  if (primero) {
    nextTick(() => {
      const id = { servicio: 'ct-ayuda-servicio', nombre: 'ct-nombre', telefono: 'ct-telefono', email: 'ct-email', fecha: 'ct-fecha', mensaje: 'ct-mensaje', acepta: 'ct-ayuda-acepta' }[primero];
      const el = document.getElementById(id);
      el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      if (el && primero !== 'servicio' && primero !== 'acepta') el.focus({ preventScroll: true });
    });
    return false;
  }
  return true;
}

function irAPaso(i) {
  if (i === paso.value || enviando.value) return;
  if (i > paso.value) {
    // Solo se puede avanzar si todos los pasos intermedios son válidos.
    for (let k = paso.value; k < i; k++) if (!pasoValido(k)) return;
  }
  paso.value = i;
  maxPaso.value = Math.max(maxPaso.value, i);
  enfocarPaso();
}

function atras() {
  irAPaso(paso.value - 1);
}

async function siguiente() {
  if (enviando.value) return;
  if (!pasoValido(paso.value)) return;
  if (paso.value < PASOS.length - 1) {
    irAPaso(paso.value + 1);
    return;
  }
  await enviar();
}

/* ---------- Envío ---------- */
async function enviar() {
  errorEnvio.value = '';
  // Se revalida todo por si el usuario saltó pasos.
  for (let i = 0; i < PASOS.length; i++) {
    if (!pasoValido(i)) {
      paso.value = i;
      enfocarPaso();
      return;
    }
  }
  enviando.value = true;
  const carga = {
    nombre: capitalizar(form.nombre.trim()),
    telefono: `+502 ${form.telefono}`,
    servicio: form.servicio,
    fechaPreferida: form.fecha,
    franja: form.franja,
    primeraVez: form.primeraVez,
    mensaje: form.mensaje.trim(),
    email: form.email.trim().toLowerCase()
  };
  try {
    const r = await postSolicitud(carga);
    Object.assign(resumen, {
      nombre: carga.nombre,
      servicio: servicioElegido.value?.nombre || '',
      telefono: carga.telefono,
      fecha: fechaLarga(form.fecha),
      franja: textoFranja()
    });
    referencia.value = r.referencia || 'SOL-PENDIENTE';
    enviado.value = true;
    enfocarPaso();
  } catch (e) {
    errorEnvio.value =
      e instanceof TypeError
        ? 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
        : e.message || 'No se pudo enviar la solicitud. Inténtalo de nuevo.';
  } finally {
    enviando.value = false;
  }
}

function reiniciar(servicioId = '') {
  Object.assign(form, { servicio: servicioId, nombre: '', telefono: '', email: '', primeraVez: true, fecha: '', franja: '', mensaje: '', acepta: false });
  Object.keys(tocados).forEach((k) => (tocados[k] = false));
  busqueda.value = '';
  filtroCat.value = '';
  // Si ya llega un servicio elegido (desde el catálogo), se empieza en "Tus datos".
  paso.value = servicioId ? 1 : 0;
  maxPaso.value = paso.value;
  enviado.value = false;
  enviando.value = false;
  errorEnvio.value = '';
  confirmandoSalida.value = false;
  resumen.nombre = '';
}

function otraSolicitud() {
  reiniciar();
  enfocarPaso();
}

/* ---------- Cerrar con protección contra pérdida de datos ---------- */
const sucio = computed(
  () => !enviado.value && !!(form.nombre || form.telefono || form.email || form.fecha || form.mensaje || form.acepta)
);

function pedirCerrar() {
  if (sucio.value && !enviando.value) {
    confirmandoSalida.value = true;
    sacudir.value = true;
    setTimeout(() => (sacudir.value = false), 450);
    nextTick(() => botonSeguir.value?.focus());
    return;
  }
  cerrarCita();
}
function cerrarSinPreguntar() {
  confirmandoSalida.value = false;
  cerrarCita();
}

/* ---------- Accesibilidad: foco atrapado y Esc ---------- */
const dialogo = ref(null);
const botonCerrar = ref(null);
const botonSeguir = ref(null);
let elementoPrevio = null;

function alTeclado(e) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    if (confirmandoSalida.value) confirmandoSalida.value = false;
    else pedirCerrar();
    return;
  }
  if (e.key === 'Tab' && dialogo.value) {
    const foco = [...dialogo.value.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex="0"]')].filter((el) => el.offsetParent !== null);
    const lista = confirmandoSalida.value ? foco.filter((el) => el.closest('.ct-salida')) : foco;
    if (!lista.length) return;
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];
    if (e.shiftKey && (document.activeElement === primero || !lista.includes(document.activeElement))) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }
}

watch(citaAbierta, async (abierta) => {
  if (abierta) {
    elementoPrevio = document.activeElement;
    reiniciar(citaServicioInicial.value);
    document.documentElement.style.overflow = 'hidden';
    cargarCatalogo();
    await nextTick();
    tituloPaso.value?.focus?.({ preventScroll: true });
  } else {
    document.documentElement.style.overflow = '';
    elementoPrevio?.focus?.();
  }
});

onUnmounted(() => {
  document.documentElement.style.overflow = '';
});
</script>

<style>
/* ===== Fondo ===== */
.ct-fondo {
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
.ct-ventana {
  position: relative;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  width: min(960px, 100%);
  height: min(700px, 100%);
  overflow: hidden;
  border-radius: 22px;
  background: #f4fafb;
  color: #17384e;
  box-shadow: 0 30px 80px rgba(4, 20, 34, 0.55);
}
.ct-ventana.sacudir { animation: ct-sacudir 0.45s ease; }

/* ===== Panel lateral ===== */
.ct-lateral {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.6rem 1.3rem 1.2rem;
  overflow-y: auto;
  color: #fff;
  background: linear-gradient(165deg, #0f3d5e 0%, #1a5c8a 60%, #1f7a8f 100%);
}
.ct-marca { display: flex; align-items: center; gap: 0.75rem; }
.ct-marca h2 { margin: 0; font-size: 1.3rem; line-height: 1.1; }
.ct-lema { margin: 0.2rem 0 0; font-size: 0.8rem; opacity: 0.8; }
.ct-progreso-movil { display: none; }

.ct-pasos { list-style: none; margin: 0.4rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.1rem; position: relative; }
.ct-pasos li { position: relative; }
.ct-pasos li:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 20px;
  top: 44px;
  bottom: -4px;
  width: 2px;
  background: rgba(255, 255, 255, 0.2);
}
.ct-pasos li.hecho:not(:last-child)::after { background: #5eeaea; }
.ct-paso-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.45rem 0.5rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}
.ct-paso-btn:disabled { cursor: default; }
.ct-paso-btn:not(:disabled):hover { background: rgba(255, 255, 255, 0.1); }
.ct-paso-btn:focus-visible { outline: 3px solid #5eeaea; outline-offset: 1px; }
.ct-paso-num {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.9rem;
  border: 2px solid rgba(255, 255, 255, 0.35);
  color: rgba(255, 255, 255, 0.75);
  transition: all 0.3s;
}
.ct-pasos li.activo .ct-paso-num { background: #fff; color: #0f3d5e; border-color: #fff; box-shadow: 0 0 0 5px rgba(94, 234, 234, 0.3); }
.ct-pasos li.hecho .ct-paso-num { background: #35c4bf; border-color: #35c4bf; color: #06323f; }
.ct-paso-texto { display: flex; flex-direction: column; line-height: 1.2; }
.ct-paso-texto strong { font-size: 0.95rem; }
.ct-paso-texto small { font-size: 0.76rem; opacity: 0.7; }
.ct-pasos li:not(.activo):not(.hecho) .ct-paso-texto { opacity: 0.7; }

.ct-resumen { margin-top: auto; padding: 0.85rem; border-radius: 14px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.16); }
.ct-resumen-etiqueta { display: block; margin-bottom: 0.5rem; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.75; }
.ct-resumen-servicio { display: flex; align-items: center; gap: 0.65rem; animation: ct-aparece 0.35s ease; }
.ct-resumen-servicio strong { display: block; font-size: 0.92rem; line-height: 1.2; }
.ct-resumen-servicio small { font-size: 0.78rem; opacity: 0.8; }
.ct-resumen-vacio { margin: 0; font-size: 0.82rem; opacity: 0.75; line-height: 1.4; }
.ct-resumen .ct-ico { background: rgba(255, 255, 255, 0.16); color: #fff; }
.ct-nota { display: flex; gap: 0.5rem; align-items: flex-start; margin: 0; font-size: 0.78rem; line-height: 1.4; opacity: 0.85; }
.ct-nota svg { flex: none; margin-top: 1px; color: #5eeaea; }
.ct-ecg { height: 28px; width: 100%; color: rgba(94, 234, 234, 0.55); flex: none; }
.ct-ecg path { stroke-dasharray: 520; animation: ct-ecg 3.6s linear infinite; }

/* ===== Contenido ===== */
.ct-contenido { position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; background: #f4fafb; }
.ct-cerrar {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  color: #2c5670;
  background: #e3f0f4;
  cursor: pointer;
  transition: background 0.2s, transform 0.25s;
}
.ct-cerrar:hover { background: #cde4ec; transform: rotate(90deg); }
.ct-cerrar:focus-visible { outline: 3px solid #2a9d9a; outline-offset: 2px; }

.ct-form { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.ct-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 1.6rem 1.8rem 1rem; }
.ct-cuerpo { max-width: 600px; margin: 0 auto; }
.ct-subtitulo { margin: 0 2.5rem 0.35rem 0; font-size: 1.45rem; color: #0f3d5e; outline: none; }
.ct-intro { margin: 0 0 1.1rem; font-size: 0.93rem; line-height: 1.5; color: #4a6a7d; }
.ct-req { color: #d6336c; font-weight: 700; }
.ct-opc { font-weight: 400; color: #6b8797; font-size: 0.82em; }

/* ----- Campos ----- */
.ct-campo { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; min-width: 0; }
.ct-campo label, .ct-etiqueta-falsa, .ct-segmento-grupo legend { font-size: 0.86rem; font-weight: 600; color: #1d4560; }
.ct-campo input:not([type='checkbox']):not([type='radio']), .ct-campo textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 0.7rem 0.85rem;
  font: inherit;
  font-size: 0.97rem;
  color: #17384e;
  background: #fff;
  border: 1.5px solid #c5dbe4;
  border-radius: 11px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.ct-campo textarea { resize: vertical; min-height: 78px; }
.ct-campo input:focus, .ct-campo textarea:focus { outline: none; border-color: #2a9d9a; box-shadow: 0 0 0 4px rgba(42, 157, 154, 0.18); }
.ct-campo.invalido input:not([type='checkbox']), .ct-campo.invalido textarea { border-color: #d6336c; background: #fff7fa; }
.ct-campo.invalido input:focus, .ct-campo.invalido textarea:focus { box-shadow: 0 0 0 4px rgba(214, 51, 108, 0.15); }
.ct-campo small, .ct-ayuda { font-size: 0.78rem; color: #6b8797; line-height: 1.35; }
.ct-campo small.error, .ct-ayuda.error { color: #c2255c; font-weight: 600; }
.ct-fila { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
.ct-pie-campo { display: flex; justify-content: space-between; gap: 1rem; }
.ct-contador { white-space: nowrap; }
.ct-prefijo { display: flex; align-items: stretch; }
.ct-prefijo > span { display: grid; place-items: center; padding: 0 0.7rem; font-weight: 700; font-size: 0.9rem; color: #1a5c8a; background: #e3f0f4; border: 1.5px solid #c5dbe4; border-right: 0; border-radius: 11px 0 0 11px; }
.ct-campo .ct-prefijo input { border-radius: 0 11px 11px 0; }

/* ----- Segmentos / franjas ----- */
.ct-segmento-grupo { margin: 0 0 1rem; padding: 0; border: 0; min-width: 0; }
.ct-segmento-grupo legend { padding: 0; margin-bottom: 0.45rem; }
.ct-segmento-grupo:disabled { opacity: 0.5; }
.ct-segmento { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.ct-segmento label, .ct-franja {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.7rem 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  color: #35586d;
  background: #fff;
  border: 1.5px solid #c5dbe4;
  border-radius: 11px;
  cursor: pointer;
  transition: all 0.2s;
}
.ct-segmento label:hover, .ct-franja:hover { border-color: #2a9d9a; }
.ct-segmento label.on, .ct-franja.on { color: #0f3d5e; background: #e3f6f5; border-color: #2a9d9a; box-shadow: 0 0 0 3px rgba(42, 157, 154, 0.15); }
.ct-segmento input, .ct-franja input, .ct-servicio input { position: absolute; opacity: 0; pointer-events: none; }
.ct-segmento label:focus-within, .ct-franja:focus-within, .ct-servicio:focus-within { outline: 3px solid #2a9d9a; outline-offset: 2px; }
.ct-franjas { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; }
.ct-franja { flex-direction: column; gap: 0.1rem; }
.ct-franja small { font-weight: 500; color: #5f7f90; font-size: 0.78rem; }

/* ----- Días rápidos ----- */
.ct-dias { display: grid; grid-template-columns: repeat(auto-fit, minmax(76px, 1fr)); gap: 0.5rem; margin-bottom: 0.6rem; }
.ct-dia {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.2rem;
  font: inherit;
  color: #35586d;
  background: #fff;
  border: 1.5px solid #c5dbe4;
  border-radius: 14px;
  cursor: pointer;
  text-transform: capitalize;
  transition: transform 0.2s, border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.ct-dia small { font-size: 0.7rem; letter-spacing: 0.05em; color: #6b8797; }
.ct-dia strong { font-size: 1.4rem; line-height: 1.15; color: #0f3d5e; }
.ct-dia:hover { transform: translateY(-3px); border-color: #2a9d9a; box-shadow: 0 6px 14px rgba(15, 61, 94, 0.12); }
.ct-dia.on { background: linear-gradient(160deg, #1f8fa0, #1a5c8a); border-color: transparent; box-shadow: 0 8px 18px rgba(26, 92, 138, 0.35); }
.ct-dia.on small, .ct-dia.on strong { color: #fff; }
.ct-dia:focus-visible { outline: 3px solid #2a9d9a; outline-offset: 2px; }
.ct-otra { margin-top: 0.3rem; }

/* ----- Buscador y filtros del paso 1 ----- */
.ct-buscar { position: relative; margin-bottom: 0.7rem; }
.ct-buscar svg { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #6b8797; pointer-events: none; }
.ct-buscar input { box-sizing: border-box; width: 100%; padding: 0.7rem 0.85rem 0.7rem 2.5rem; font: inherit; font-size: 0.95rem; color: #17384e; background: #fff; border: 1.5px solid #c5dbe4; border-radius: 11px; }
.ct-buscar input:focus { outline: none; border-color: #2a9d9a; box-shadow: 0 0 0 4px rgba(42, 157, 154, 0.18); }
.ct-chips { display: flex; gap: 0.4rem; margin-bottom: 0.9rem; overflow-x: auto; padding-bottom: 2px; }
.ct-chip { flex: none; padding: 0.4rem 0.85rem; font: inherit; font-size: 0.82rem; font-weight: 600; color: #35586d; background: #e3f0f4; border: 0; border-radius: 999px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.ct-chip:hover { background: #d2e7ee; }
.ct-chip.on { color: #fff; background: #1a5c8a; }
.ct-chip:focus-visible { outline: 3px solid #2a9d9a; outline-offset: 2px; }
.ct-grupo { margin: 0.9rem 0 0.4rem; font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: #5f7f90; }
.ct-lista { display: flex; flex-direction: column; gap: 0.45rem; }
.ct-servicio {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.8rem;
  background: #fff;
  border: 1.5px solid #d6e6ed;
  border-radius: 13px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;
}
.ct-servicio:hover { border-color: #2a9d9a; transform: translateX(3px); }
.ct-servicio.on { background: #e3f6f5; border-color: #2a9d9a; box-shadow: 0 0 0 3px rgba(42, 157, 154, 0.15); }
.ct-ico { flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; color: #1a5c8a; background: #e3f0f4; transition: all 0.25s; }
.ct-servicio.on .ct-ico { color: #fff; background: linear-gradient(135deg, #35c4bf, #1a5c8a); }
.ct-servicio-texto { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
.ct-servicio-texto strong { font-size: 0.93rem; color: #0f3d5e; }
.ct-servicio-texto small { font-size: 0.78rem; color: #6b8797; }
.ct-precio { font-weight: 700; font-size: 0.9rem; color: #1a5c8a; }
.ct-radio { flex: none; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #b4cfda; transition: all 0.2s; }
.ct-servicio.on .ct-radio { border: 6px solid #2a9d9a; background: #fff; }
.ct-estado { margin: 0.5rem 0; padding: 0.8rem 1rem; font-size: 0.9rem; color: #4a6a7d; background: #e9f3f6; border-radius: 11px; }
.ct-estado-error { color: #8a1c42; background: #fdecf2; }
.ct-enlace { padding: 0; margin-left: 0.4rem; font: inherit; font-size: 0.85rem; font-weight: 700; color: #1a5c8a; background: none; border: 0; text-decoration: underline; cursor: pointer; }
.ct-enlace:focus-visible { outline: 3px solid #2a9d9a; outline-offset: 2px; border-radius: 4px; }

/* ----- Revisión ----- */
.ct-revision { margin: 0 0 1.1rem; padding: 0.3rem 1rem; background: #fff; border: 1.5px solid #d6e6ed; border-radius: 14px; }
.ct-revision > div { display: grid; grid-template-columns: 130px minmax(0, 1fr) auto; gap: 0.7rem; align-items: baseline; padding: 0.65rem 0; }
.ct-revision > div + div { border-top: 1px solid #e3eef3; }
.ct-revision dt { font-size: 0.8rem; font-weight: 600; color: #6b8797; }
.ct-revision dd { margin: 0; font-size: 0.93rem; font-weight: 600; color: #0f3d5e; overflow-wrap: anywhere; }
.ct-check { display: flex; align-items: flex-start; gap: 0.65rem; cursor: pointer; font-size: 0.88rem; font-weight: 500 !important; line-height: 1.4; color: #35586d !important; }
.ct-check input { position: absolute; opacity: 0; }
.ct-check-caja { flex: none; display: grid; place-items: center; width: 22px; height: 22px; margin-top: 1px; color: transparent; background: #fff; border: 2px solid #9fbfcd; border-radius: 7px; transition: all 0.2s; }
.ct-check input:checked + .ct-check-caja { color: #fff; background: #2a9d9a; border-color: #2a9d9a; }
.ct-check input:focus-visible + .ct-check-caja { outline: 3px solid #2a9d9a; outline-offset: 2px; }
.ct-campo.invalido .ct-check-caja { border-color: #d6336c; }
.ct-error-envio { display: flex; gap: 0.5rem; align-items: flex-start; margin: 0; padding: 0.75rem 0.9rem; font-size: 0.9rem; font-weight: 600; color: #8a1c42; background: #fdecf2; border: 1px solid #f5bcd0; border-radius: 11px; }
.ct-error-envio svg { flex: none; margin-top: 1px; }

/* ----- Acciones ----- */
.ct-acciones { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; padding: 0.9rem 1.8rem 1.1rem; background: #f4fafb; border-top: 1px solid #dcebf1; }
.ct-acciones.centrado { justify-content: center; border: 0; padding: 1.2rem 0 0; flex-wrap: wrap; background: none; }
.ct-relleno { flex: 1; }
.ct-boton, .ct-boton-secundario {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.4rem;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s, opacity 0.2s;
}
.ct-boton { color: #fff; border: 0; background: linear-gradient(135deg, #2a9d9a, #1a5c8a); box-shadow: 0 6px 16px rgba(26, 92, 138, 0.35); }
.ct-boton:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(26, 92, 138, 0.45); }
.ct-boton:active:not(:disabled) { transform: translateY(0); }
.ct-boton-secundario { color: #1a5c8a; background: #fff; border: 1.5px solid #b9d3de; }
.ct-boton-secundario:hover:not(:disabled) { background: #e3f0f4; }
.ct-peligro { color: #a61e4d; border-color: #f0b6ca; }
.ct-peligro:hover:not(:disabled) { background: #fdecf2 !important; }
.ct-boton:disabled, .ct-boton-secundario:disabled { opacity: 0.6; cursor: not-allowed; }
.ct-boton:focus-visible, .ct-boton-secundario:focus-visible { outline: 3px solid #2a9d9a; outline-offset: 2px; }
.ct-spinner { width: 16px; height: 16px; border: 2.5px solid rgba(255, 255, 255, 0.4); border-top-color: #fff; border-radius: 50%; animation: ct-giro 0.7s linear infinite; }

/* ----- Salida ----- */
.ct-salida { position: absolute; inset: 0; z-index: 4; display: grid; place-items: center; padding: 1rem; background: rgba(244, 250, 251, 0.88); backdrop-filter: blur(3px); }
.ct-salida-caja { max-width: 380px; padding: 1.5rem; text-align: center; background: #fff; border-radius: 18px; box-shadow: 0 18px 40px rgba(15, 61, 94, 0.25); }
.ct-salida-caja h3 { margin: 0 0 0.4rem; color: #0f3d5e; }
.ct-salida-caja p { margin: 0 0 1.1rem; font-size: 0.92rem; line-height: 1.45; color: #4a6a7d; }
.ct-salida-acciones { display: flex; flex-direction: column; gap: 0.5rem; }

/* ----- Éxito ----- */
.ct-exito { padding: 2rem 1.8rem; text-align: center; overflow-y: auto; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto; }
.ct-exito-icono { color: #2a9d9a; }
.ct-exito-circulo { stroke-dasharray: 160; stroke-dashoffset: 160; animation: ct-trazo 0.7s ease forwards; }
.ct-exito-marca { stroke-dasharray: 40; stroke-dashoffset: 40; animation: ct-trazo 0.5s 0.5s ease forwards; }
.ct-exito h3 { margin: 0.7rem 0 0.4rem; font-size: 1.55rem; color: #0f3d5e; outline: none; }
.ct-exito-texto { max-width: 460px; margin: 0 0 1rem; line-height: 1.55; color: #4a6a7d; }
.ct-ticket { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.9rem 1.8rem; background: #fff; border: 2px dashed #7fc8c5; border-radius: 16px; }
.ct-ticket span { font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: #6b8797; }
.ct-ticket strong { font-size: 1.7rem; letter-spacing: 0.1em; color: #1a5c8a; }
.ct-ticket small { color: #6b8797; font-size: 0.78rem; }
.ct-datos-lista { display: flex; gap: 1.8rem; flex-wrap: wrap; justify-content: center; margin: 1.1rem 0 0; }
.ct-datos-lista dt { font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; color: #6b8797; }
.ct-datos-lista dd { margin: 0.15rem 0 0; font-weight: 700; color: #0f3d5e; }

/* ----- Transiciones ----- */
.ct-enter-active, .ct-leave-active { transition: opacity 0.25s ease; }
.ct-enter-active .ct-ventana, .ct-leave-active .ct-ventana { transition: transform 0.3s cubic-bezier(0.22, 0.9, 0.3, 1.1), opacity 0.25s; }
.ct-enter-from, .ct-leave-to { opacity: 0; }
.ct-enter-from .ct-ventana, .ct-leave-to .ct-ventana { transform: translateY(24px) scale(0.96); opacity: 0; }
.ct-cambio-enter-active, .ct-cambio-leave-active { transition: opacity 0.18s ease, transform 0.22s ease; }
.ct-cambio-enter-from { opacity: 0; transform: translateX(18px); }
.ct-cambio-leave-to { opacity: 0; transform: translateX(-18px); }

@keyframes ct-giro { to { transform: rotate(360deg); } }
@keyframes ct-trazo { to { stroke-dashoffset: 0; } }
@keyframes ct-ecg { from { stroke-dashoffset: 520; } to { stroke-dashoffset: 0; } }
@keyframes ct-aparece { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes ct-sacudir { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }

/* ===== Responsivo ===== */
@media (max-width: 820px) {
  .ct-fondo { padding: 0; align-items: flex-end; }
  .ct-ventana { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); width: 100%; height: 100%; max-height: 100dvh; border-radius: 0; }
  .ct-lateral { flex-direction: column; gap: 0.6rem; padding: 0.8rem 1rem 0.9rem; overflow: visible; }
  .ct-marca svg { width: 34px; height: 34px; }
  .ct-marca h2 { font-size: 1.1rem; }
  .ct-lema, .ct-pasos, .ct-resumen, .ct-nota, .ct-ecg { display: none; }
  .ct-progreso-movil { display: block; font-size: 0.8rem; font-weight: 600; }
  .ct-barra { height: 5px; margin-top: 0.4rem; border-radius: 3px; background: rgba(255, 255, 255, 0.2); overflow: hidden; }
  .ct-barra i { display: block; height: 100%; border-radius: 3px; background: #5eeaea; transition: width 0.4s ease; }
  .ct-contenido { position: static; }
  .ct-cerrar { top: 0.7rem; right: 0.8rem; color: #fff; background: rgba(255, 255, 255, 0.18); }
  .ct-cerrar:hover { background: rgba(255, 255, 255, 0.3); }
  .ct-scroll { padding: 1.1rem 1rem 0.6rem; }
  .ct-subtitulo { margin-right: 0; font-size: 1.25rem; }
  .ct-acciones { padding: 0.7rem 1rem calc(0.8rem + env(safe-area-inset-bottom, 0px)); }
  .ct-boton, .ct-boton-secundario { padding: 0.75rem 1.1rem; }
}
@media (max-width: 560px) {
  .ct-fila { grid-template-columns: 1fr; }
  .ct-revision > div { grid-template-columns: 1fr auto; gap: 0.1rem 0.7rem; }
  .ct-revision dt { grid-column: 1 / -1; }
  .ct-servicio { padding: 0.6rem; gap: 0.6rem; }
  .ct-precio { font-size: 0.82rem; }
}
@media (prefers-reduced-motion: reduce) {
  .ct-ventana, .ct-ventana *, .ct-ecg path { animation: none !important; transition: none !important; }
  .ct-exito-circulo, .ct-exito-marca { stroke-dashoffset: 0; }
}
</style>
