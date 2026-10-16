import mongoose from 'mongoose';

// Citas confirmadas (derivadas de solicitudes o creadas directo).
// Precio y duración se copian aquí como valores históricos al momento de crear la cita.
const appointmentSchema = new mongoose.Schema(
  {
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    profesional: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
    servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    inicio: { type: Date, required: true },
    fin: { type: Date, required: true },
    precioCentavos: { type: Number, required: true, min: 0, validate: Number.isInteger },
    duracionMinutos: { type: Number, required: true, min: 1, validate: Number.isInteger },
    estado: {
      type: String,
      enum: ['PROGRAMADA', 'CONFIRMADA', 'REPROGRAMADA', 'CANCELADA', 'COMPLETADA', 'NO_ASISTIO'],
      default: 'PROGRAMADA'
    },
    observaciones: { type: String, default: '', trim: true },
    solicitudOrigen: { type: mongoose.Schema.Types.ObjectId, ref: 'AppointmentRequest', default: null }
  },
  { timestamps: true }
);

appointmentSchema.index({ profesional: 1, inicio: 1 });
appointmentSchema.index({ paciente: 1, inicio: 1 });
appointmentSchema.index({ estado: 1 });

export const ESTADOS_CITA = ['PROGRAMADA', 'CONFIRMADA', 'REPROGRAMADA', 'CANCELADA', 'COMPLETADA', 'NO_ASISTIO'];

// Transiciones permitidas
export const TRANSICIONES_CITA = {
  PROGRAMADA: ['CONFIRMADA', 'REPROGRAMADA', 'CANCELADA'],
  CONFIRMADA: ['REPROGRAMADA', 'CANCELADA', 'COMPLETADA', 'NO_ASISTIO'],
  REPROGRAMADA: ['CONFIRMADA', 'CANCELADA'],
  CANCELADA: [],
  COMPLETADA: [],
  NO_ASISTIO: []
};

export default mongoose.model('Appointment', appointmentSchema);