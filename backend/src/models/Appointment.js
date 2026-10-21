import mongoose from 'mongoose';

// Citas confirmadas (derivadas de solicitudes o creadas directamente).
// Precio y duración se copian aquí como valores históricos al momento de crear
// la cita: si el servicio cambia después, la cita conserva su costo original.
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
      enum: ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA'],
      default: 'PENDIENTE'
    },
    observaciones: { type: String, default: '', trim: true },
    solicitudOrigen: { type: mongoose.Schema.Types.ObjectId, ref: 'AppointmentRequest', default: null }
  },
  { timestamps: true }
);

appointmentSchema.index({ profesional: 1, inicio: 1 });
appointmentSchema.index({ paciente: 1, inicio: 1 });
appointmentSchema.index({ estado: 1 });

// Estados exigidos por RF-07. El estado financiero (PENDIENTE/PARCIAL/PAGADO)
// es independiente y se calcula a partir de los pagos válidos.
export const ESTADOS_CITA = ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA'];

// Transiciones permitidas (RN-05, RN-06).
// Reprogramar NO cambia el estado: se edita la cita con PUT /api/citas/:id.
export const TRANSICIONES_CITA = {
  PENDIENTE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['COMPLETADA', 'CANCELADA'],
  COMPLETADA: [],
  CANCELADA: []
};

// Estados que ocupan un horario. CANCELADA y COMPLETADA no bloquean (RN-13).
export const ESTADOS_CITA_ACTIVOS = ['PENDIENTE', 'CONFIRMADA'];

export default mongoose.model('Appointment', appointmentSchema);
