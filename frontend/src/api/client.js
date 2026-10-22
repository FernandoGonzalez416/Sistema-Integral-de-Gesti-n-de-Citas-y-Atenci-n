// Cliente HTTP mínimo hacia la API REST del backend.
// Usa VITE_API_URL o localhost:3000 por defecto.
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getHealth() {
  const res = await fetch(`${baseUrl}/api/health`);
  if (!res.ok) throw new Error(`API respondió ${res.status}`);
  return res.json();
}

export async function getContenido(clave) {
  const res = await fetch(`${baseUrl}/api/contenido/${clave}`);
  if (!res.ok) throw new Error('Contenido no disponible');
  const datos = await res.json();
  return datos.contenido;
}

export async function getServicios() {
  const res = await fetch(`${baseUrl}/api/servicios`);
  if (!res.ok) throw new Error('Servicios no disponibles');
  return (await res.json()).servicios;
}

export async function getHorarios() {
  const res = await fetch(`${baseUrl}/api/horarios`);
  if (!res.ok) throw new Error('Horarios no disponibles');
  return (await res.json()).horarios;
}

export async function getContacto() {
  const res = await fetch(`${baseUrl}/api/contenido`);
  if (!res.ok) throw new Error('Contacto no disponible');
  return (await res.json()).contenidos;
}

export async function postContacto(datos) {
  const res = await fetch(`${baseUrl}/api/contacto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  const r = await res.json();
  if (!res.ok) throw new Error(r.message || 'No se pudo enviar');
  return r;
}

export async function postSolicitud(datos) {
  const res = await fetch(`${baseUrl}/api/solicitudes-cita`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  const r = await res.json();
  if (!res.ok) throw new Error(r.message || 'No se pudo enviar');
  return r;
}

export async function getPublicaciones(tipo) {
  const res = await fetch(`${baseUrl}/api/publicaciones?tipo=${tipo}`);
  if (!res.ok) throw new Error('Publicaciones no disponibles');
  return (await res.json()).publicaciones;
}

async function authFetch(token, ruta, opciones = {}) {
  const res = await fetch(`${baseUrl}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opciones.headers || {}) }
  });
  const datos = await res.json();
  if (!res.ok) throw new Error(datos.message || `Error ${res.status}`);
  return datos;
}

export const getPacientes = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/pacientes${qs ? '?' + qs : ''}`);
};
export const createPaciente = (token, datos) => authFetch(token, '/api/pacientes', { method: 'POST', body: JSON.stringify(datos) });
export const updatePaciente = (token, id, datos) => authFetch(token, `/api/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
export const patchEstadoPaciente = (token, id, activo) => authFetch(token, `/api/pacientes/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ activo }) });

export const getResponsables = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/responsables${qs ? '?' + qs : ''}`);
};
export const createResponsable = (token, datos) => authFetch(token, '/api/responsables', { method: 'POST', body: JSON.stringify(datos) });
export const updateResponsable = (token, id, datos) => authFetch(token, `/api/responsables/${id}`, { method: 'PUT', body: JSON.stringify(datos) });

export const getRelaciones = (token, pacienteId) => authFetch(token, `/api/pacientes/${pacienteId}/responsables`);
export const asociarResponsable = (token, pacienteId, responsableId) => authFetch(token, `/api/pacientes/${pacienteId}/responsables`, { method: 'POST', body: JSON.stringify({ responsableId }) });
export const desasociarResponsable = (token, pacienteId, relacionId) => authFetch(token, `/api/pacientes/${pacienteId}/responsables/${relacionId}/desasociar`, { method: 'PATCH' });

export const getPaciente = (token, id) => authFetch(token, `/api/pacientes/${id}`);

export const getMateriales = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/materiales${qs ? '?' + qs : ''}`);
};
export const createMaterial = (token, datos) => authFetch(token, '/api/materiales', { method: 'POST', body: JSON.stringify(datos) });
export const updateMaterial = (token, id, datos) => authFetch(token, `/api/materiales/${id}`, { method: 'PUT', body: JSON.stringify(datos) });

export const getMaterialesPaciente = (token, pacienteId) => authFetch(token, `/api/pacientes/${pacienteId}/materiales`);
export const asignarMaterial = (token, pacienteId, materialId, notas = '') => authFetch(token, `/api/pacientes/${pacienteId}/materiales`, { method: 'POST', body: JSON.stringify({ materialId, notas }) });
export const desasignarMaterial = (token, pacienteId, relacionId) => authFetch(token, `/api/pacientes/${pacienteId}/materiales/${relacionId}/desasignar`, { method: 'PATCH' });

export const getPagos = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/pagos${qs ? '?' + qs : ''}`);
};
export const getSaldoCita = (token, citaId) => authFetch(token, `/api/citas/${citaId}/saldo`);
export const getPagosCita = (token, citaId) => authFetch(token, `/api/citas/${citaId}/pagos`);
export const createPago = (token, datos) => authFetch(token, '/api/pagos', { method: 'POST', body: JSON.stringify(datos) });
export const anularPago = (token, id, motivoAnulacion) => authFetch(token, `/api/pagos/${id}/anular`, { method: 'PATCH', body: JSON.stringify({ motivoAnulacion }) });

export const getCajaActual = (token) => authFetch(token, '/api/cajas/actual');
export const getCajas = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/cajas${qs ? '?' + qs : ''}`);
};
export const abrirCaja = (token, datos) => authFetch(token, '/api/cajas/abrir', { method: 'POST', body: JSON.stringify(datos) });
export const cerrarCaja = (token, id, datos) => authFetch(token, `/api/cajas/${id}/cerrar`, { method: 'POST', body: JSON.stringify(datos) });
export const getMovimientosCaja = (token, id, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/cajas/${id}/movimientos${qs ? '?' + qs : ''}`);
};

export const getCitas = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/citas${qs ? '?' + qs : ''}`);
};
export const getCita = (token, id) => authFetch(token, `/api/citas/${id}`);
export const createCita = (token, datos) => authFetch(token, '/api/citas', { method: 'POST', body: JSON.stringify(datos) });
export const updateCita = (token, id, datos) => authFetch(token, `/api/citas/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
export const patchEstadoCita = (token, id, estado) => authFetch(token, `/api/citas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
export const atenderSolicitud = (token, id, datos) => authFetch(token, `/api/citas/solicitudes/${id}/atender`, { method: 'POST', body: JSON.stringify(datos) });

export const getSolicitudes = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/solicitudes-cita${qs ? '?' + qs : ''}`);
};
export const rechazarSolicitud = (token, id, motivoRechazo) =>
  authFetch(token, `/api/solicitudes-cita/${id}/rechazar`, { method: 'PATCH', body: JSON.stringify({ motivoRechazo }) });
export const patchEstadoSolicitud = (token, id, estado) =>
  authFetch(token, `/api/solicitudes-cita/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });

export const getProfesionales = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/profesionales${qs ? '?' + qs : ''}`);
};
export const createProfesional = (token, datos) => authFetch(token, '/api/profesionales', { method: 'POST', body: JSON.stringify(datos) });
export const updateProfesional = (token, id, datos) => authFetch(token, `/api/profesionales/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
export const desactivarProfesional = (token, id) => authFetch(token, `/api/profesionales/${id}/desactivar`, { method: 'PATCH' });

// Petición con errores tipados: error.red = true si no hubo conexión; error.status = código HTTP.
async function peticion(ruta, opciones = {}, mensajePorDefecto = 'No se pudo completar la solicitud') {
  let res;
  try {
    res = await fetch(`${baseUrl}${ruta}`, opciones);
  } catch {
    const e = new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
    e.red = true;
    throw e;
  }
  let datos = {};
  try { datos = await res.json(); } catch { /* respuesta sin cuerpo */ }
  if (!res.ok) {
    const e = new Error(datos.message || mensajePorDefecto);
    e.status = res.status;
    throw e;
  }
  return datos;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const conToken = (token) => ({ ...JSON_HEADERS, Authorization: `Bearer ${token}` });

export const postLogin = (email, password) =>
  peticion('/api/auth/login', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email, password }) }, 'No se pudo iniciar sesión');

// Registro público de clientes: { nombre, email, password, foto? }
export const postRegistro = (datos) =>
  peticion('/api/auth/register', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(datos) }, 'No se pudo crear la cuenta');

export const getMe = (token) =>
  peticion('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }, 'Sesión inválida');

// Cambio parcial del propio perfil: { nombre?, foto?, perfil?: {...} }
export const patchPerfil = (token, cambios) =>
  peticion('/api/auth/perfil', { method: 'PATCH', headers: conToken(token), body: JSON.stringify(cambios) }, 'No se pudo guardar el perfil');

export const patchPassword = (token, actual, nueva) =>
  peticion('/api/auth/password', { method: 'PATCH', headers: conToken(token), body: JSON.stringify({ actual, nueva }) }, 'No se pudo cambiar la contraseña');

async function conAuth(token, ruta, opciones = {}) {
  const res = await fetch(`${baseUrl}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opciones.headers || {}) }
  });
  const datos = await res.json();
  if (!res.ok) throw new Error(datos.message || `Error ${res.status}`);
  return datos;
}

export const getUsuarios = (token) => conAuth(token, '/api/usuarios');
export const createUsuario = (token, datos) =>
  conAuth(token, '/api/usuarios', { method: 'POST', body: JSON.stringify(datos) });
export const updateUsuario = (token, id, datos) =>
  conAuth(token, `/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
export const restablecerPasswordUsuario = (token, id, passwordNueva) =>
  conAuth(token, `/api/usuarios/${id}/restablecer-password`, {
    method: 'PATCH',
    body: JSON.stringify({ passwordNueva })
  });
export const getServiciosTodos = (token) => conAuth(token, '/api/servicios/admin/todos');
export const createServicio = (token, datos) =>
  conAuth(token, '/api/servicios', { method: 'POST', body: JSON.stringify(datos) });
export const updateServicio = (token, id, datos) =>
  conAuth(token, `/api/servicios/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
export const getContenidosTodos = (token) => conAuth(token, '/api/contenido/admin/todos');
export const updateContenido = (token, id, datos) =>
  conAuth(token, `/api/contenido/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
export const getSchedulesTodos = (token) => conAuth(token, '/api/horarios/admin/todos');
export const createSchedule = (token, datos) =>
  conAuth(token, '/api/horarios', { method: 'POST', body: JSON.stringify(datos) });
export const patchSchedule = (token, id, datos) =>
  conAuth(token, `/api/horarios/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
export const getPublicationsTodas = (token) => conAuth(token, '/api/publicaciones/admin/todas');
export const createPublication = (token, datos) =>
  conAuth(token, '/api/publicaciones', { method: 'POST', body: JSON.stringify(datos) });
export const updatePublication = (token, id, datos) =>
  conAuth(token, `/api/publicaciones/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
export const patchPublication = (token, id, datos) =>
  conAuth(token, `/api/publicaciones/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });

// Configuración pública del sitio y carrusel (B6).
export const getSitioConfig = () =>
  peticion('/api/contenido/sitio', {}, 'No se pudo cargar la configuración del sitio').then((r) => r.sitio);
export const getCarrusel = () =>
  peticion('/api/contenido/carrusel', {}, 'No se pudo cargar el carrusel').then((r) => r.diapositivas);
export const updateSitioConfig = (token, datos) =>
  conAuth(token, '/api/contenido/sitio', { method: 'PUT', body: JSON.stringify(datos) });
export const getCarruselTodos = (token) => conAuth(token, '/api/contenido/carrusel/admin/todos');
export const createCarrusel = (token, datos) =>
  conAuth(token, '/api/contenido/carrusel', { method: 'POST', body: JSON.stringify(datos) });
export const updateCarrusel = (token, id, datos) =>
  conAuth(token, `/api/contenido/carrusel/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
export const deleteCarrusel = (token, id) =>
  conAuth(token, `/api/contenido/carrusel/${id}`, { method: 'DELETE' });

// Bandeja de contacto (solo ADMINISTRADOR).
export const getMensajes = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return conAuth(token, `/api/contacto${qs ? '?' + qs : ''}`);
};
export const getMensajesNoLeidos = (token) => conAuth(token, '/api/contacto/contador');
export const patchMensaje = (token, id, leido) =>
  conAuth(token, `/api/contacto/${id}`, { method: 'PATCH', body: JSON.stringify({ leido }) });