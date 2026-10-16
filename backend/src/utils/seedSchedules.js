import Schedule from '../models/Schedule.js';

// Horario base Lun–Vie 08:00–17:00. Solo crea los días que falten.
const BASE = [1, 2, 3, 4, 5].map((dia) => ({ dia, horaInicio: '08:00', horaFin: '17:00' }));

export async function seedHorarios() {
  for (const item of BASE) {
    const existe = await Schedule.findOne({ dia: item.dia });
    if (!existe) await new Schedule(item).save();
  }
  console.log('Horarios base verificados');
}
