import mongoose from 'mongoose';

// Pagos asociados a una cita. El monto se guarda en centavos (entero) para evitar
// errores de punto flotante. Los pagos no se borran: se anulan (histórico).
const paymentSchema = new mongoose.Schema(
  {
    cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    montoCentavos: { type: Number, required: true, min: 1, validate: Number.isInteger },
    metodo: {
      type: String,
      required: true,
      enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO']
    },
    fecha: { type: Date, default: Date.now },
    estado: { type: String, enum: ['ACTIVO', 'ANULADO'], default: 'ACTIVO' },
    motivoAnulacion: { type: String, default: '', trim: true },
    anuladoEn: { type: Date, default: null },
    notas: { type: String, default: '', trim: true },
    registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

paymentSchema.index({ cita: 1, estado: 1 });
paymentSchema.index({ paciente: 1, fecha: -1 });
paymentSchema.index({ fecha: -1 });

export const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'];
export const ESTADOS_PAGO = ['ACTIVO', 'ANULADO'];

export default mongoose.model('Payment', paymentSchema);
