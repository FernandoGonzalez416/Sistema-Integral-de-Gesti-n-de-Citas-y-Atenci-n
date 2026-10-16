import mongoose from 'mongoose';

// Comprobante/recibo de un pago. Relación 1:1 con Payment y número único.
const receiptSchema = new mongoose.Schema(
  {
    numero: { type: String, required: true, unique: true, trim: true },
    pago: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, unique: true },
    cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
    montoCentavos: { type: Number, required: true },
    metodo: { type: String, required: true },
    fecha: { type: Date, default: null },
    estado: { type: String, enum: ['EMITIDO', 'ANULADO'], default: 'EMITIDO' }
  },
  { timestamps: true }
);

receiptSchema.index({ fecha: -1 });

export const ESTADOS_COMPROBANTE = ['EMITIDO', 'ANULADO'];

export default mongoose.model('Receipt', receiptSchema);
