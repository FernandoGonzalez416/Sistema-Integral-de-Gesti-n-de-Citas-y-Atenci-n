import mongoose from 'mongoose';

// Solicitudes del portal. La Fase 7 las convertirá en citas con pacientes registrados.
const requestSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
    fechaPreferida: { type: Date, default: null },
    // Franja preferida dentro del horario de atención ('' = sin preferencia).
    franja: { type: String, enum: ['', 'MANANA', 'TARDE'], default: '' },
    primeraVez: { type: Boolean, default: false },
    mensaje: { type: String, default: '' },
    estado: { type: String, enum: ['PENDIENTE', 'ATENDIDA', 'CANCELADA'], default: 'PENDIENTE' }
  },
  { timestamps: true }
);

export const ESTADOS_SOLICITUD = ['PENDIENTE', 'ATENDIDA', 'CANCELADA'];

export default mongoose.model('AppointmentRequest', requestSchema);