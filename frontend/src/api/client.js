// Cliente HTTP mínimo hacia la API REST del backend.
// Usa VITE_API_URL o localhost:3000 por defecto.
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getHealth() {
  const res = await fetch(`${baseUrl}/api/health`);
  if (!res.ok) throw new Error(`API respondió ${res.status}`);
  return res.json();
}

export async function getContenido(clave) {
  const res = await fetch(`${baseUrl}/api/contenidos/${clave}`);
  if (!res.ok) throw new Error('Contenido no disponible');
  const datos = await res.json();
  return datos.contenido;
}

export async function getServicios() {
  const res = await fetch(`${baseUrl}/api/services`);
  if (!res.ok) throw new Error('Servicios no disponibles');
  return (await res.json()).servicios;
}

export async function getHorarios() {
  const res = await fetch(`${baseUrl}/api/horarios`);
  if (!res.ok) throw new Error('Horarios no disponibles');
  return (await res.json()).horarios;
}

export async function getContacto() {
  const res = await fetch(`${baseUrl}/api/contenidos`);
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
  const res = await fetch(`${baseUrl}/api/solicitudes`, {
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
export const updatePaciente = (token, id, datos) => authFetch(token, `/api/pacientes/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
export const desactivarPaciente = (token, id) => authFetch(token, `/api/pacientes/${id}/desactivar`, { method: 'PATCH' });

export const getResponsables = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/responsables${qs ? '?' + qs : ''}`);
};
export const createResponsable = (token, datos) => authFetch(token, '/api/responsables', { method: 'POST', body: JSON.stringify(datos) });
export const updateResponsable = (token, id, datos) => authFetch(token, `/api/responsables/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
export const desactivarResponsable = (token, id) => authFetch(token, `/api/responsables/${id}/desactivar`, { method: 'PATCH' });

export const getRelaciones = (token, pacienteId) => authFetch(token, `/api/pacientes/${pacienteId}/responsables`);
export const asociarResponsable = (token, pacienteId, responsableId) => authFetch(token, `/api/pacientes/${pacienteId}/responsables`, { method: 'POST', body: JSON.stringify({ responsableId }) });
export const desasociarResponsable = (token, pacienteId, relacionId) => authFetch(token, `/api/pacientes/${pacienteId}/responsables/${relacionId}/desasociar`, { method: 'PATCH' });

export const getPaciente = (token, id) => authFetch(token, `/api/pacientes/${id}`);

export const getMateriales = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/materiales${qs ? '?' + qs : ''}`);
};
export const createMaterial = (token, datos) => authFetch(token, '/api/materiales', { method: 'POST', body: JSON.stringify(datos) });
export const updateMaterial = (token, id, datos) => authFetch(token, `/api/materiales/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
export const desactivarMaterial = (token, id) => authFetch(token, `/api/materiales/${id}/desactivar`, { method: 'PATCH' });

export const getMaterialesPaciente = (token, pacienteId) => authFetch(token, `/api/pacientes/${pacienteId}/materiales`);
export const asignarMaterial = (token, pacienteId, materialId, notas = '') => authFetch(token, `/api/pacientes/${pacienteId}/materiales`, { method: 'POST', body: JSON.stringify({ materialId, notas }) });
export const desasignarMaterial = (token, pacienteId, relacionId) => authFetch(token, `/api/pacientes/${pacienteId}/materiales/${relacionId}/desasignar`, { method: 'PATCH' });

export const getPagos = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/pagos${qs ? '?' + qs : ''}`);
};
export const getSaldoCita = (token, citaId) => authFetch(token, `/api/pagos/citas/${citaId}/saldo`);
export const createPago = (token, datos) => authFetch(token, '/api/pagos', { method: 'POST', body: JSON.stringify(datos) });
export const anularPago = (token, id, motivoAnulacion) => authFetch(token, `/api/pagos/${id}/anular`, { method: 'PATCH', body: JSON.stringify({ motivoAnulacion }) });

export const getCajaAbierta = (token) => authFetch(token, '/api/caja/abierta');
export const getCajas = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/caja${qs ? '?' + qs : ''}`);
};
export const abrirCaja = (token, datos) => authFetch(token, '/api/caja/abrir', { method: 'POST', body: JSON.stringify(datos) });
export const cerrarCaja = (token, id, datos) => authFetch(token, `/api/caja/${id}/cerrar`, { method: 'POST', body: JSON.stringify(datos) });

export const getCitas = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/citas${qs ? '?' + qs : ''}`);
};
export const getCita = (token, id) => authFetch(token, `/api/citas/${id}`);

export const getProfesionales = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return authFetch(token, `/api/profesionales${qs ? '?' + qs : ''}`);
};

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

export const getUsers = (token) => conAuth(token, '/api/users');
export const createUser = (token, datos) =>
  conAuth(token, '/api/users', { method: 'POST', body: JSON.stringify(datos) });
export const patchUser = (token, id, datos) =>
  conAuth(token, `/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
export const getServicesTodos = (token) => conAuth(token, '/api/services/admin/todos');
export const createService = (token, datos) =>
  conAuth(token, '/api/services', { method: 'POST', body: JSON.stringify(datos) });
export const patchService = (token, id, datos) =>
  conAuth(token, `/api/services/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
export const getContentsTodos = (token) => conAuth(token, '/api/contenidos/admin/todos');
export const patchContent = (token, id, datos) =>
  conAuth(token, `/api/contenidos/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
export const getSchedulesTodos = (token) => conAuth(token, '/api/horarios/admin/todos');
export const createSchedule = (token, datos) =>
  conAuth(token, '/api/horarios', { method: 'POST', body: JSON.stringify(datos) });
export const patchSchedule = (token, id, datos) =>
  conAuth(token, `/api/horarios/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
export const getPublicationsTodas = (token) => conAuth(token, '/api/publicaciones/admin/todas');
export const createPublication = (token, datos) =>
  conAuth(token, '/api/publicaciones', { method: 'POST', body: JSON.stringify(datos) });
export const patchPublication = (token, id, datos) =>
  conAuth(token, `/api/publicaciones/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });