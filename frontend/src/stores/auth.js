import { defineStore } from 'pinia';
import { postLogin, postRegistro, getMe, patchPerfil, patchPassword } from '../api/client.js';
import { perfilCache } from '../services/perfilCache.js';

// Sesión + perfil del usuario (cliente o personal interno).
//
//  · token   → localStorage ('sigca_token'). La autorización real la hace SIEMPRE el backend.
//  · usuario → se lee de la caché del navegador al arrancar (aparece al instante) y se refresca
//              desde MongoDB en segundo plano (cargar()).
//  · Cada cambio de perfil se aplica primero en pantalla/caché (respuesta inmediata) y luego se
//    envía a MongoDB. Si no hay conexión queda "pendiente" y se reintenta (sincronizar()).
const ROLES_PERSONAL = ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'];

const clonar = (o) => JSON.parse(JSON.stringify(o));

function aplicarCambios(usuario, cambios) {
  const nuevo = clonar(usuario);
  if (cambios.nombre !== undefined) nuevo.nombre = cambios.nombre;
  if (cambios.foto !== undefined) nuevo.foto = cambios.foto;
  if (cambios.perfil) nuevo.perfil = { ...(nuevo.perfil || {}), ...cambios.perfil };
  return nuevo;
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const token = localStorage.getItem('sigca_token') || null;
    return {
      token,
      // Sin token no hay sesión: se ignora cualquier caché huérfana.
      usuario: token ? perfilCache.leerUsuario() : null,
      error: null,
      pendiente: !!perfilCache.leerPendiente(),
      sincronizando: false
    };
  },
  getters: {
    autenticado: (state) => !!state.token,
    esCliente: (state) => state.usuario?.rol === 'CLIENTE',
    esPersonal: (state) => ROLES_PERSONAL.includes(state.usuario?.rol),
    esAdmin: (state) => state.usuario?.rol === 'ADMINISTRADOR',
    // Pantalla de inicio según el rol.
    rutaInicio() {
      return this.esPersonal ? '/admin' : '/perfil';
    }
  },
  actions: {
    _establecer(token, usuario) {
      this.token = token;
      this.usuario = usuario;
      this.error = null;
      localStorage.setItem('sigca_token', token);
      perfilCache.borrarPendiente();
      perfilCache.guardarUsuario(usuario);
      this.pendiente = false;
    },

    async login(email, password) {
      this.error = null;
      const datos = await postLogin(String(email).trim(), password);
      this._establecer(datos.token, datos.usuario);
    },

    // Registro de cliente: crea la cuenta e inicia sesión de inmediato.
    async registrar({ nombre, email, password, foto }) {
      this.error = null;
      const datos = await postRegistro({ nombre, email: String(email).trim(), password, foto: foto || '' });
      this._establecer(datos.token, datos.usuario);
    },

    // Refresca el usuario desde MongoDB. Sin conexión conserva lo que hay en la caché.
    async cargar() {
      if (!this.token) return;
      await this.sincronizar();
      try {
        const datos = await getMe(this.token);
        if (!this.pendiente) {
          this.usuario = datos.usuario;
          perfilCache.guardarUsuario(datos.usuario);
        }
      } catch (e) {
        if (e.status === 401 || e.status === 403) {
          this.logout();
        } else if (!e.red) {
          throw e;
        }
        // e.red → sin conexión: se sigue trabajando con la caché.
      }
    },

    // Guarda cambios parciales del perfil: { nombre?, foto?, perfil?: {...} }.
    // Devuelve { sincronizado }. Lanza error solo si el servidor RECHAZA los datos.
    async guardarPerfil(cambios) {
      if (!this.usuario) throw new Error('No hay sesión activa');
      const anterior = clonar(this.usuario);

      // 1) Respuesta inmediata: pantalla + caché.
      this.usuario = aplicarCambios(this.usuario, cambios);
      perfilCache.guardarUsuario(this.usuario);

      // 2) Persistencia en MongoDB.
      try {
        const datos = await patchPerfil(this.token, cambios);
        this.usuario = datos.usuario;
        perfilCache.guardarUsuario(datos.usuario);
        perfilCache.borrarPendiente();
        this.pendiente = false;
        return { sincronizado: true };
      } catch (e) {
        if (e.red || e.status >= 500) {
          perfilCache.agregarPendiente(cambios);
          this.pendiente = true;
          return { sincronizado: false };
        }
        // Datos rechazados (400) o sesión vencida (401): se deshace el cambio local.
        this.usuario = anterior;
        perfilCache.guardarUsuario(anterior);
        if (e.status === 401 || e.status === 403) this.logout();
        throw e;
      }
    },

    // Reenvía a MongoDB lo que se guardó sin conexión.
    async sincronizar() {
      const pendiente = perfilCache.leerPendiente();
      if (!this.token || !pendiente || this.sincronizando) return false;
      this.sincronizando = true;
      try {
        const datos = await patchPerfil(this.token, pendiente);
        this.usuario = datos.usuario;
        perfilCache.guardarUsuario(datos.usuario);
        perfilCache.borrarPendiente();
        this.pendiente = false;
        return true;
      } catch (e) {
        if (!e.red && e.status < 500) {
          // El servidor no acepta esos datos: se descartan para no bloquear la cuenta.
          perfilCache.borrarPendiente();
          this.pendiente = false;
        }
        return false;
      } finally {
        this.sincronizando = false;
      }
    },

    async cambiarPassword(actual, nueva) {
      return patchPassword(this.token, actual, nueva);
    },

    // Arranque de la app: refresca el perfil y reintenta pendientes al volver la conexión.
    iniciar() {
      window.addEventListener('online', () => this.sincronizar());
      return this.cargar().catch(() => {});
    },

    logout() {
      // Último intento (sin esperar) de no perder cambios hechos sin conexión.
      const pendiente = perfilCache.leerPendiente();
      if (this.token && pendiente) patchPerfil(this.token, pendiente).catch(() => {});
      this.token = null;
      this.usuario = null;
      this.pendiente = false;
      localStorage.removeItem('sigca_token');
      perfilCache.limpiarSesion(); // en un equipo compartido no debe quedar nada de la persona
    }
  }
});