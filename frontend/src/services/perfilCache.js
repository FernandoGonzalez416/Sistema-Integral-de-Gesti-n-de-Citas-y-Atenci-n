// Caché del navegador (localStorage) para la sesión y el perfil del usuario.
//
// Idea: el perfil de UNA persona son pocos datos, así que se guarda aquí para que la app
// aparezca al instante (foto del menú, nombre, datos de salud) sin esperar a la red.
// La fuente de la verdad sigue siendo MongoDB: el store (stores/auth.js) refresca esta caché
// desde el backend y envía allí cada cambio. Si no hay conexión, los cambios se quedan en
// "pendientes" y se reenvían solos cuando vuelva (ver auth.sincronizar()).
const K_USUARIO = 'sigca_usuario';
const K_PENDIENTE = 'sigca_perfil_pendiente';
const VERSION = 1;

function leer(clave) {
  try {
    const bruto = localStorage.getItem(clave);
    if (!bruto) return null;
    const dato = JSON.parse(bruto);
    return dato && dato.v === VERSION ? dato.datos : null;
  } catch {
    return null;
  }
}

function escribir(clave, datos) {
  try {
    localStorage.setItem(clave, JSON.stringify({ v: VERSION, guardadoEn: Date.now(), datos }));
    return true;
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): la app sigue funcionando con la API.
    return false;
  }
}

export const perfilCache = {
  leerUsuario: () => leer(K_USUARIO),
  guardarUsuario: (usuario) => escribir(K_USUARIO, usuario),

  // Cambios hechos sin conexión, a la espera de enviarse a la base de datos.
  leerPendiente: () => leer(K_PENDIENTE),
  // Une los cambios nuevos con los pendientes anteriores (el campo "perfil" se mezcla por dentro).
  agregarPendiente(cambios) {
    const previo = leer(K_PENDIENTE) || {};
    const union = { ...previo, ...cambios };
    if (previo.perfil || cambios.perfil) union.perfil = { ...(previo.perfil || {}), ...(cambios.perfil || {}) };
    escribir(K_PENDIENTE, union);
    return union;
  },
  borrarPendiente() {
    try { localStorage.removeItem(K_PENDIENTE); } catch { /* nada */ }
  },

  limpiarSesion() {
    try {
      localStorage.removeItem(K_USUARIO);
      localStorage.removeItem(K_PENDIENTE);
    } catch { /* nada */ }
  }
};
