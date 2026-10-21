import { ref } from 'vue';

// Estado compartido de la ventana de contacto: el menú la abre, el layout la dibuja.
export const contactoAbierto = ref(false);
export const contactoPestana = ref('info'); // 'info' | 'mensaje'

export function abrirContacto(pestana = 'info') {
  contactoPestana.value = pestana;
  contactoAbierto.value = true;
}

export function cerrarContacto() {
  contactoAbierto.value = false;
}
