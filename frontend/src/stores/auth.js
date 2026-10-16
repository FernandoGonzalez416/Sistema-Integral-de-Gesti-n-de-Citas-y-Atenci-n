import { defineStore } from 'pinia';
import { postLogin, getMe } from '../api/client.js';

// Sesión del usuario. El token vive en localStorage; la autorización real la hace el backend.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('sigca_token') || null,
    usuario: null,
    error: null
  }),
  getters: {
    autenticado: (state) => !!state.token
  },
  actions: {
    async login(email, password) {
      this.error = null;
      const datos = await postLogin(email, password);
      this.token = datos.token;
      this.usuario = datos.usuario;
      localStorage.setItem('sigca_token', datos.token);
    },
    async cargar() {
      if (!this.token) return;
      try {
        const datos = await getMe(this.token);
        this.usuario = datos.usuario;
      } catch (e) {
        this.logout();
        throw e;
      }
    },
    logout() {
      this.token = null;
      this.usuario = null;
      localStorage.removeItem('sigca_token');
    }
  }
});
