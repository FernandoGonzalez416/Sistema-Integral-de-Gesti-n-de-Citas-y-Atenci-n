import { reactive } from 'vue';
import { getSitioConfig } from '../api/client.js';

// Configuración pública compartida por Navbar, Footer, Home y modales.
// Los valores por defecto permiten que el portal se vea aun sin conexión.
export const sitio = reactive({
  listo: false,
  nombre: 'Centro de Salud SIGSA',
  logoUrl: '/logo-sigsa.svg',
  mision:
    'Brindar atención integral en salud a cada persona y a su familia, con profesionales calificados, trato humano y servicios accesibles.',
  vision:
    'Ser el centro de referencia en atención integral y educación en salud de nuestra comunidad.',
  informacionPrincipal:
    'Somos un centro comprometido con la salud de las familias. Ofrecemos atención cercana, servicios de calidad y educación para el bienestar de nuestra comunidad.',
  contacto: {
    email: 'contacto@sigsa.com.gt',
    telefono: '+502 7839-4521',
    direccion: '4a. Avenida 5-20, Zona 1, Chimaltenango, Guatemala'
  }
});

let promesa = null;

export function cargarSitio(forzar = false) {
  if (promesa && !forzar) return promesa;
  promesa = getSitioConfig()
    .then((datos) => {
      if (!datos) return;
      Object.assign(sitio, datos);
      if (!sitio.logoUrl) sitio.logoUrl = '/logo-sigsa.svg';
      sitio.contacto = { ...sitio.contacto, ...(datos.contacto || {}) };
      sitio.listo = true;
    })
    .catch(() => {
      // Sin servidor: se conservan los valores por defecto y se permite reintentar.
      promesa = null;
      sitio.listo = true;
    });
  return promesa;
}

// Aplica en caliente la respuesta del PUT del administrador.
export function aplicarSitio(datos) {
  if (!datos) return;
  Object.assign(sitio, datos);
  if (!sitio.logoUrl) sitio.logoUrl = '/logo-sigsa.svg';
  sitio.contacto = { ...sitio.contacto, ...(datos.contacto || {}) };
  sitio.listo = true;
}
