import mongoose from 'mongoose';

// Solicitudes del portal. Una solicitud PENDIENTE se convierte en cita con un
// paciente registrado; ATENDIDA conserva la referencia a la cita generada (B4).
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
    estado: { type: String, enum: ['PENDIENTE', 'ATENDIDA', 'RECHAZADA'], default: 'PENDIENTE' },
    // RF-06: la solicitud atendida conserva la cita generada y quién la atendió.
    citaGenerada: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    atendidaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fechaAtencion: { type: Date, default: null },
    motivoRechazo: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

export const ESTADOS_SOLICITUD = ['PENDIENTE', 'ATENDIDA', 'RECHAZADA'];

export default mongoose.model('AppointmentRequest', requestSchema);
