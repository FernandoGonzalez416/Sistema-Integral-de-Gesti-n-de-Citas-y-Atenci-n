import { defineStore } from 'pinia';
import { getHealth } from '../api/client.js';

// Guarda el estado de conexión con el backend.
export const useHealthStore = defineStore('health', {
  state: () => ({
    estado: 'pendiente', // pendiente | ok | error
    datos: null,
    error: null
  }),
  actions: {
    async verificar() {
      this.estado = 'pendiente';
      this.error = null;
      try {
        this.datos = await getHealth();
        this.estado = 'ok';
      } catch (e) {
        this.estado = 'error';
        this.error = e.message;
      }
    }
  }
});
