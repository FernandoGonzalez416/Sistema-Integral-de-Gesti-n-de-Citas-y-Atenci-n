import mongoose from 'mongoose';

// Un registro por día de semana (0 = domingo … 6 = sábado).
// La Fase 7 usará estos bloques para validar que las citas caigan en horario de atención.
const scheduleSchema = new mongoose.Schema(
  {
    dia: { type: Number, required: true, unique: true, min: 0, max: 6, validate: Number.isInteger },
    horaInicio: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    horaFin: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default mongoose.model('Schedule', scheduleSchema);
