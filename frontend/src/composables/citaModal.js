import { ref } from 'vue';

// Estado compartido de la ventana "Solicitar cita": la pantalla de Servicios
// (y el botón flotante) la abren; el layout público la dibuja.
export const citaAbierta = ref(false);
export const citaServicioInicial = ref('');

export function abrirCita(servicioId = '') {
  citaServicioInicial.value = servicioId || '';
  citaAbierta.value = true;
}

export function cerrarCita() {
  citaAbierta.value = false;
}
