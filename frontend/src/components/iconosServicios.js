// Iconos de línea (viewBox 24x24, trazo currentColor) para los servicios y categorías.
// Se usan con v-html dentro de un <svg>; el contenido es propio, no viene del usuario.
export const ICONOS_SERVICIO = {
  estetoscopio: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M4 3h4M12 3h4"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',
  corazon: '<path d="M12 20s-7.5-4.6-9-9.5C2.1 7.2 4 4.5 7 4.5c1.9 0 3.4 1 5 3 1.6-2 3.1-3 5-3 3 0 4.9 2.7 4 6C19.5 15.4 12 20 12 20z"/><path d="M6 12h3l1.5-2.5 2.5 5 1.5-2.5H18"/>',
  actividad: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  maternidad: '<circle cx="12" cy="5" r="2.5"/><path d="M12 8c-3 0-4.5 2.5-4.5 5.5 0 2 1 3.5 2.5 4.5V21h4v-3c1.5-1 2.5-2.5 2.5-4.5C16.5 10.5 15 8 12 8z"/>',
  bebe: '<circle cx="12" cy="12" r="8.5"/><path d="M9 10.5h.01M15 10.5h.01"/><path d="M9.5 14.5c.8 1 1.6 1.5 2.5 1.5s1.7-.5 2.5-1.5"/><path d="M12 3.5c1.5 0 2.5 1 2 2"/>',
  escudo: '<path d="M12 3l8 3v6c0 4.5-3.3 8-8 9-4.7-1-8-4.5-8-9V6l8-3z"/><path d="M12 9v6M9 12h6"/>',
  piel: '<path d="M12 3c3 4 6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 9 7 12 3z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>',
  ojo: '<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/>',
  mente: '<path d="M9 4a3.5 3.5 0 0 0-3.5 3.5A3.5 3.5 0 0 0 4 11c0 1.3.6 2.4 1.6 3.1A3.5 3.5 0 0 0 9 19h.5V4H9z"/><path d="M15 4a3.5 3.5 0 0 1 3.5 3.5A3.5 3.5 0 0 1 20 11c0 1.3-.6 2.4-1.6 3.1A3.5 3.5 0 0 1 15 19h-.5V4h.5z"/><path d="M12 4v15"/>',
  manzana: '<path d="M12 7c-1-1.5-3-2-4.5-1.5C5 6.3 4 8.5 4 11c0 4.5 3 9 5.5 9 1 0 1.7-.5 2.5-.5s1.5.5 2.5.5C16.5 20 20 15.5 20 11c0-2.5-1-4.7-3.5-5.5C15 5 13 5.5 12 7z"/><path d="M12 7c0-2 .8-3.5 2.5-4"/>',
  diente: '<path d="M7 3.5c-2.2 0-3.5 1.8-3.5 4 0 2 .8 3.2 1.5 5 .8 2 .8 4.5 1.5 7 .3 1 1.5 1.2 2 .2.8-1.5.8-4 2.5-4s1.7 2.5 2.5 4c.5 1 1.7.8 2-.2.7-2.5.7-5 1.5-7 .7-1.8 1.5-3 1.5-5 0-2.2-1.3-4-3.5-4-1.7 0-2.3 1-4 1S8.7 3.5 7 3.5z"/>',
  laboratorio: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>',
  ecografia: '<path d="M3 8a9 9 0 0 1 18 0"/><path d="M6.5 8a5.5 5.5 0 0 1 11 0"/><path d="M10 8a2 2 0 0 1 4 0"/><path d="M12 11v10M8 21h8"/>',
  rayosx: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7v10M8.5 9h7M9 12h6M9.5 15h5"/>',
  vacuna: '<path d="M18 2l4 4M20 4l-2 2M14.5 5.5l4 4"/><path d="M16.5 7.5L7 17l-1 3 3-1 9.5-9.5"/><path d="M11 13l-2-2M8 16l-3 3"/>',
  cruz: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
  calendario: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/><path d="M12 12.8v4.6M9.7 15.1h4.6"/>'
};

// Icono de cada categoría (para las pestañas del catálogo).
export const ICONO_CATEGORIA = {
  'Atención primaria': 'estetoscopio',
  'Mujer y niñez': 'maternidad',
  Especialidades: 'corazon',
  Diagnóstico: 'laboratorio',
  Prevención: 'escudo'
};

export function iconoDe(clave) {
  return ICONOS_SERVICIO[clave] || ICONOS_SERVICIO.cruz;
}
