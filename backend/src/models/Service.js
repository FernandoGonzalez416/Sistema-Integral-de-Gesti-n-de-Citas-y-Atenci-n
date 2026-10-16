import mongoose from 'mongoose';

// Precio en centavos enteros (ej. 25000 = $250.00) para evitar errores de decimales.
// La duración se guarda en minutos y servirá para calcular la hora de fin de la cita (Fase 7).
const serviceSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, default: '', trim: true },
    precioCentavos: { type: Number, required: true, min: 0, validate: Number.isInteger },
    duracionMinutos: { type: Number, required: true, min: 1, validate: Number.isInteger },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);
