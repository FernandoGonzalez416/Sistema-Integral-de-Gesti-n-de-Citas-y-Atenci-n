import { defineStore } from 'pinia';
import { getMensajesNoLeidos } from '../api/client.js';

// Contador de mensajes sin leer compartido por el menú y la bandeja.
export const useMensajesStore = defineStore('mensajes', {
  state: () => ({
    noLeidos: 0,
    cargando: false,
    cargado: false,
    ultimoToken: ''
  }),
  actions: {
    async cargar(token, forzar = false) {
      if (!token) return;
      if (this.ultimoToken !== token) {
        this.ultimoToken = token;
        this.cargado = false;
      }
      if (this.cargado && !forzar) return;
      this.cargando = true;
      try {
        const datos = await getMensajesNoLeidos(token);
        this.noLeidos = Number(datos.noLeidos) || 0;
        this.cargado = true;
      } catch {
        // Sin conexión: se conserva el último contador conocido.
      } finally {
        this.cargando = false;
      }
    },
    setNoLeidos(valor) {
      this.noLeidos = Math.max(0, Number(valor) || 0);
      this.cargado = true;
    }
  }
});
