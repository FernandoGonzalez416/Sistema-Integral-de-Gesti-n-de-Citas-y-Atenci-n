<template>
  <h1>Contenido institucional</h1>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <p v-if="aviso" class="ok" role="status">{{ aviso }}</p>

  <Card titulo="Identidad y contenido principal">
    <form @submit.prevent="guardarConfig">
      <div class="rejilla">
        <FormField etiqueta="Nombre del centro" v-model="config.nombre" placeholder="Centro de Salud SIGSA" />
        <FormField etiqueta="Logotipo (URL)" v-model="config.logoUrl" placeholder="/logo-sigsa.svg o https://..." />
      </div>
      <div v-if="config.logoUrl" class="vista-logo">
        <img :src="config.logoUrl" alt="Vista previa del logotipo" @error="$event.target.style.display = 'none'" />
        <small>Vista previa del logotipo</small>
      </div>
      <label class="campo">
        <span>Misión</span>
        <textarea v-model="config.mision" rows="4" maxlength="5000"></textarea>
      </label>
      <label class="campo">
        <span>Visión</span>
        <textarea v-model="config.vision" rows="4" maxlength="5000"></textarea>
      </label>
      <label class="campo">
        <span>Información principal</span>
        <textarea v-model="config.informacionPrincipal" rows="4" maxlength="5000"></textarea>
      </label>
      <div class="rejilla tres">
        <FormField etiqueta="Correo de contacto" type="email" v-model="config.contacto.email" />
        <FormField etiqueta="Teléfono" v-model="config.contacto.telefono" />
        <FormField etiqueta="Dirección" v-model="config.contacto.direccion" />
      </div>
      <button type="submit">Guardar configuración</button>
    </form>
  </Card>

  <Card titulo="Carrusel de portada">
    <p class="ayuda">Solo las diapositivas activas se muestran en el portal, ordenadas de menor a mayor.</p>
    <form class="form-carrusel" @submit.prevent="guardarDiapositiva">
      <div class="rejilla">
        <FormField etiqueta="Imagen URL" v-model="slideForm.imagenUrl" placeholder="/carrusel-1.svg o https://..." />
        <FormField etiqueta="Título" v-model="slideForm.titulo" placeholder="Atención integral" />
        <FormField etiqueta="Orden" type="number" v-model="slideForm.orden" />
        <FormField etiqueta="Activa" type="checkbox" v-model="slideForm.activo" />
      </div>
      <button type="submit">{{ slideEditando ? 'Guardar diapositiva' : 'Agregar diapositiva' }}</button>
      <button v-if="slideEditando" type="button" @click="cancelarDiapositiva">Cancelar</button>
    </form>

    <div class="tabla-scroll">
      <table>
        <thead>
          <tr><th>Vista</th><th>Título</th><th>Orden</th><th>Activa</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="d in carrusel" :key="d._id">
            <td>
              <img v-if="d.imagenUrl" class="miniatura" :src="d.imagenUrl" alt="" loading="lazy" @error="$event.target.style.visibility = 'hidden'" />
            </td>
            <td>{{ d.titulo }}</td>
            <td>{{ d.orden }}</td>
            <td>{{ d.activo ? 'Sí' : 'No' }}</td>
            <td class="acciones">
              <button type="button" @click="editarDiapositiva(d)">Editar</button>
              <button type="button" @click="toggleDiapositiva(d)">{{ d.activo ? 'Desactivar' : 'Activar' }}</button>
              <button type="button" class="peligro" @click="eliminarDiapositiva(d)">Eliminar</button>
            </td>
          </tr>
          <tr v-if="!carrusel.length">
            <td colspan="5" class="vacio">No hay diapositivas. Agrega la primera.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </Card>

  <Card titulo="Horarios de atención">
    <p class="ayuda">Los cambios se reflejan en el portal público y en la agenda de citas.</p>
    <div class="tabla-scroll">
      <table>
        <thead>
          <tr><th>Día</th><th>Inicio</th><th>Fin</th><th>Activo</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="h in horarios" :key="h._id">
            <td>{{ DIAS[h.dia] }}</td>
            <td><input v-model="h.horaInicio" size="6" /></td>
            <td><input v-model="h.horaFin" size="6" /></td>
            <td>{{ h.activo ? 'Sí' : 'No' }}</td>
            <td class="acciones">
              <button type="button" @click="guardarHorario(h)">Guardar</button>
              <button type="button" @click="toggleHorario(h)">{{ h.activo ? 'Desactivar' : 'Activar' }}</button>
            </td>
          </tr>
          <tr v-if="!horarios.length">
            <td colspan="5" class="vacio">No hay horarios configurados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </Card>

  <Card titulo="Publicaciones">
    <form @submit.prevent="guardarPublicacion">
      <div class="rejilla">
        <FormField etiqueta="Título" v-model="pub.titulo" />
        <FormField etiqueta="Fecha" type="date" v-model="pub.fecha" />
      </div>
      <label class="campo">
        <span>Descripción</span>
        <textarea v-model="pub.descripcion" rows="4" maxlength="5000"></textarea>
      </label>
      <div class="rejilla tres">
        <label class="campo">
          <span>Tipo</span>
          <select v-model="pub.tipo">
            <option value="EDUCATIVO">EDUCATIVO</option>
            <option value="CORPORATIVO">CORPORATIVO</option>
          </select>
        </label>
        <FormField etiqueta="Imagen URL (opcional)" v-model="pub.imagenUrl" placeholder="https://..." />
        <FormField etiqueta="Enlace (opcional)" v-model="pub.enlace" placeholder="https://... o mailto:..." />
      </div>
      <FormField etiqueta="Visible en el portal" type="checkbox" v-model="pub.activo" />
      <div class="acciones">
        <button type="submit">{{ pubEditando ? 'Guardar publicación' : 'Publicar' }}</button>
        <button v-if="pubEditando" type="button" @click="cancelarPublicacion">Cancelar</button>
      </div>
    </form>

    <div class="tabla-scroll">
      <table>
        <thead>
          <tr><th>Título</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="p in publicaciones" :key="p._id">
            <td>{{ p.titulo }}</td>
            <td>{{ p.tipo }}</td>
            <td>{{ fechaCorta(p.fecha) }}</td>
            <td>{{ p.activo ? 'Visible' : 'Oculta' }}</td>
            <td class="acciones">
              <button type="button" @click="editarPublicacion(p)">Editar</button>
              <button type="button" @click="togglePublicacion(p)">{{ p.activo ? 'Ocultar' : 'Mostrar' }}</button>
            </td>
          </tr>
          <tr v-if="!publicaciones.length">
            <td colspan="5" class="vacio">No hay publicaciones.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </Card>

  <Card titulo="Bloques de texto avanzados">
    <div v-for="c in contenidos" :key="c._id" class="bloque">
      <strong>{{ c.titulo }} ({{ c.clave }})</strong>
      <textarea v-model="c.cuerpo" rows="3"></textarea>
      <div class="acciones">
        <button type="button" @click="guardarBloque(c)">Guardar</button>
        <button type="button" @click="toggleBloque(c)">{{ c.activo ? 'Desactivar' : 'Activar' }}</button>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getContenidosTodos,
  updateContenido,
  getSchedulesTodos,
  patchSchedule,
  getPublicationsTodas,
  createPublication,
  updatePublication,
  patchPublication,
  getSitioConfig,
  updateSitioConfig,
  getCarruselTodos,
  createCarrusel,
  updateCarrusel,
  deleteCarrusel
} from '../api/client.js';
import { aplicarSitio } from '../composables/sitio.js';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const auth = useAuthStore();
const contenidos = ref([]);
const horarios = ref([]);
const publicaciones = ref([]);
const carrusel = ref([]);
const error = ref('');
const aviso = ref('');

const config = reactive({
  nombre: '',
  logoUrl: '/logo-sigsa.svg',
  mision: '',
  vision: '',
  informacionPrincipal: '',
  contacto: { email: '', telefono: '', direccion: '' }
});

const slideForm = reactive({ imagenUrl: '', titulo: '', orden: 0, activo: true });
const slideEditando = ref(null);

const pub = reactive({
  titulo: '',
  descripcion: '',
  tipo: 'EDUCATIVO',
  fecha: '',
  imagenUrl: '',
  enlace: '',
  activo: true
});
const pubEditando = ref(null);

function limpiarAvisos() {
  error.value = '';
  aviso.value = '';
}
function exito(texto) {
  error.value = '';
  aviso.value = texto;
}
function fallo(e) {
  aviso.value = '';
  error.value = e.message || 'No se pudo completar la operación.';
}

async function cargar() {
  limpiarAvisos();
  try {
    const [sitioCfg, cont, hor, pubs, slides] = await Promise.all([
      getSitioConfig(),
      getContenidosTodos(auth.token),
      getSchedulesTodos(auth.token),
      getPublicationsTodas(auth.token),
      getCarruselTodos(auth.token)
    ]);
    aplicarSitio(sitioCfg);
    Object.assign(config, sitioCfg);
    config.contacto = { ...config.contacto, ...(sitioCfg.contacto || {}) };
    contenidos.value = cont.contenidos;
    horarios.value = hor.horarios;
    publicaciones.value = pubs.publicaciones;
    carrusel.value = slides.diapositivas;
  } catch (e) {
    fallo(e);
  }
}

async function guardarConfig() {
  limpiarAvisos();
  try {
    const datos = {
      nombre: config.nombre,
      logoUrl: config.logoUrl,
      mision: config.mision,
      vision: config.vision,
      informacionPrincipal: config.informacionPrincipal,
      email: config.contacto.email,
      telefono: config.contacto.telefono,
      direccion: config.contacto.direccion
    };
    const respuesta = await updateSitioConfig(auth.token, datos);
    aplicarSitio(respuesta.sitio);
    Object.assign(config, respuesta.sitio);
    config.contacto = { ...config.contacto, ...(respuesta.sitio.contacto || {}) };
    contenidos.value = (await getContenidosTodos(auth.token)).contenidos;
    exito('Configuración guardada correctamente.');
  } catch (e) {
    fallo(e);
  }
}

function limpiarDiapositiva() {
  slideEditando.value = null;
  Object.assign(slideForm, { imagenUrl: '', titulo: '', orden: 0, activo: true });
}
function editarDiapositiva(d) {
  limpiarAvisos();
  slideEditando.value = d._id;
  Object.assign(slideForm, {
    imagenUrl: d.imagenUrl,
    titulo: d.titulo,
    orden: d.orden,
    activo: d.activo
  });
}
function cancelarDiapositiva() {
  limpiarDiapositiva();
}
async function recargarCarrusel() {
  carrusel.value = (await getCarruselTodos(auth.token)).diapositivas;
}
async function guardarDiapositiva() {
  limpiarAvisos();
  try {
    const datos = {
      imagenUrl: slideForm.imagenUrl,
      titulo: slideForm.titulo,
      orden: Number(slideForm.orden),
      activo: slideForm.activo
    };
    if (slideEditando.value) await updateCarrusel(auth.token, slideEditando.value, datos);
    else await createCarrusel(auth.token, datos);
    limpiarDiapositiva();
    await recargarCarrusel();
    exito('Carrusel actualizado.');
  } catch (e) {
    fallo(e);
  }
}
async function toggleDiapositiva(d) {
  limpiarAvisos();
  try {
    await updateCarrusel(auth.token, d._id, { activo: !d.activo });
    await recargarCarrusel();
    exito('Estado de la diapositiva actualizado.');
  } catch (e) {
    fallo(e);
  }
}
async function eliminarDiapositiva(d) {
  if (!window.confirm(`¿Eliminar la diapositiva "${d.titulo}"?`)) return;
  limpiarAvisos();
  try {
    await deleteCarrusel(auth.token, d._id);
    if (slideEditando.value === d._id) limpiarDiapositiva();
    await recargarCarrusel();
    exito('Diapositiva eliminada.');
  } catch (e) {
    fallo(e);
  }
}

async function guardarHorario(h) {
  limpiarAvisos();
  try {
    await patchSchedule(auth.token, h._id, { horaInicio: h.horaInicio, horaFin: h.horaFin });
    await cargar();
    exito('Horario actualizado.');
  } catch (e) {
    fallo(e);
  }
}

async function toggleHorario(h) {
  limpiarAvisos();
  try {
    await patchSchedule(auth.token, h._id, { activo: !h.activo });
    await cargar();
    exito('Estado del horario actualizado.');
  } catch (e) {
    fallo(e);
  }
}

function limpiarPublicacion() {
  pubEditando.value = null;
  Object.assign(pub, {
    titulo: '',
    descripcion: '',
    tipo: 'EDUCATIVO',
    fecha: '',
    imagenUrl: '',
    enlace: '',
    activo: true
  });
}
function editarPublicacion(p) {
  limpiarAvisos();
  pubEditando.value = p._id;
  const fecha = p.fecha ? new Date(p.fecha) : null;
  Object.assign(pub, {
    titulo: p.titulo,
    descripcion: p.descripcion,
    tipo: p.tipo,
    fecha: fecha && !Number.isNaN(fecha.getTime()) ? fecha.toISOString().slice(0, 10) : '',
    imagenUrl: p.imagenUrl || '',
    enlace: p.enlace || '',
    activo: p.activo !== false
  });
}
function cancelarPublicacion() {
  limpiarPublicacion();
}
function fechaISO(valor) {
  if (!valor) return '';
  const d = new Date(`${valor}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}
function fechaCorta(valor) {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
async function recargarPublicaciones() {
  publicaciones.value = (await getPublicationsTodas(auth.token)).publicaciones;
}
async function guardarPublicacion() {
  limpiarAvisos();
  try {
    const datos = {
      titulo: pub.titulo,
      descripcion: pub.descripcion,
      tipo: pub.tipo,
      fecha: fechaISO(pub.fecha),
      imagenUrl: pub.imagenUrl,
      enlace: pub.enlace,
      activo: pub.activo
    };
    if (pubEditando.value) await updatePublication(auth.token, pubEditando.value, datos);
    else await createPublication(auth.token, datos);
    limpiarPublicacion();
    await recargarPublicaciones();
    exito('Publicación guardada.');
  } catch (e) {
    fallo(e);
  }
}
async function togglePublicacion(p) {
  limpiarAvisos();
  try {
    await patchPublication(auth.token, p._id, { activo: !p.activo });
    await recargarPublicaciones();
    exito('Estado de la publicación actualizado.');
  } catch (e) {
    fallo(e);
  }
}

async function guardarBloque(c) {
  limpiarAvisos();
  try {
    await updateContenido(auth.token, c._id, { titulo: c.titulo, cuerpo: c.cuerpo });
    exito('Bloque guardado.');
  } catch (e) {
    fallo(e);
  }
}
async function toggleBloque(c) {
  limpiarAvisos();
  try {
    await updateContenido(auth.token, c._id, { activo: !c.activo });
    await cargar();
    exito('Estado del bloque actualizado.');
  } catch (e) {
    fallo(e);
  }
}

onMounted(cargar);
</script>

<style scoped>
.error { color: #b42318; font-weight: 600; }
.ok { color: #1f7a4d; font-weight: 600; }
.ayuda { margin: 0 0 1rem; color: #5a7a8c; font-size: 0.88rem; }
.rejilla { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
.rejilla.tres { grid-template-columns: repeat(3, 1fr); }
.campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
.campo textarea, .bloque textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.55rem;
  font: inherit;
  border: 1px solid #b9c9d2;
  border-radius: 6px;
}
.vista-logo { display: flex; align-items: center; gap: 0.75rem; margin: 0 0 0.9rem; }
.vista-logo img { width: 54px; height: 54px; object-fit: contain; border: 1px solid #d8e4ea; border-radius: 10px; background: #fff; padding: 0.25rem; }
.vista-logo small { color: #5a7a8c; }
.bloque { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.tabla-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #ddd; padding: 0.5rem; text-align: left; vertical-align: middle; }
.miniatura { width: 76px; height: 44px; object-fit: cover; border-radius: 6px; background: #eef3f5; }
.acciones { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.acciones button { padding: 0.35rem 0.55rem; cursor: pointer; }
.acciones button.peligro { color: #a72f34; }
.vacio { text-align: center; color: #6b8596; }
@media (max-width: 760px) {
  .rejilla, .rejilla.tres { grid-template-columns: 1fr; }
}
</style>
