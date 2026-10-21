import { computed, ref } from 'vue';
import { getHorarios, getServicios } from '../api/client.js';

// Catálogo público compartido: la pantalla de Servicios y la ventana de cita
// usan la misma lista, así se pide una sola vez al servidor.
export const servicios = ref([]);
export const horarios = ref([]);
export const catalogoEstado = ref('inicial'); // inicial | cargando | listo | error

let promesa = null;

export function cargarCatalogo(forzar = false) {
  if (promesa && !forzar) return promesa;
  catalogoEstado.value = 'cargando';
  promesa = Promise.all([
    getServicios().catch(() => null),
    getHorarios().catch(() => [])
  ]).then(([lista, hs]) => {
    horarios.value = hs || [];
    if (lista === null) {
      servicios.value = [];
      catalogoEstado.value = 'error';
      promesa = null; // permite reintentar
    } else {
      servicios.value = lista;
      catalogoEstado.value = 'listo';
    }
  });
  return promesa;
}

export const categorias = computed(() => {
  const orden = [];
  for (const s of servicios.value) {
    const c = s.categoria || 'General';
    if (!orden.includes(c)) orden.push(c);
  }
  return orden;
});

export function formatoMoneda(centavos) {
  // Quetzales (GTQ): Q1,250.00
  const monto = (Number(centavos || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Q${monto}`;
}

export function formatoDuracion(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Resumen legible del horario, p. ej. "Lunes a viernes · 08:00 – 17:00".
export const resumenHorario = computed(() => {
  const act = horarios.value.filter((h) => h.activo !== false).sort((a, b) => a.dia - b.dia);
  if (!act.length) return 'Lunes a viernes · 08:00 – 17:00';
  const mismo = act.every((h) => h.horaInicio === act[0].horaInicio && h.horaFin === act[0].horaFin);
  const dias = act.map((h) => h.dia);
  const continuo = dias.every((d, i) => i === 0 || d === dias[i - 1] + 1);
  const nombreDias =
    continuo && dias.length > 1
      ? `${DIAS_SEMANA[dias[0]]} a ${DIAS_SEMANA[dias[dias.length - 1]].toLowerCase()}`
      : dias.map((d) => DIAS_SEMANA[d]).join(', ');
  return mismo ? `${nombreDias} · ${act[0].horaInicio} – ${act[0].horaFin}` : nombreDias;
});