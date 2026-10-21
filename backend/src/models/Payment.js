import mongoose from 'mongoose';

// Pagos asociados a una cita y a la caja en la que se registran (RF-10/RF-11).
// El monto se guarda en centavos (entero) para evitar errores de punto flotante.
// Los pagos no se borran: se anulan (histórico) y guardan quién anuló.
const paymentSchema = new mongoose.Schema(
  {
    cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    // Caja abierta del usuario que registra el pago (RN-20/RN-22). Null solo en
    // registros históricos previos a B2 (ver scripts/asignarCajasPagos.js).
    caja: { type: mongoose.Schema.Types.ObjectId, ref: 'CashSession', default: null },
    montoCentavos: { type: Number, required: true, min: 1, validate: Number.isInteger },
    metodo: {
      type: String,
      required: true,
      enum: ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']
    },
    fecha: { type: Date, default: Date.now },
    // RF-10: número de comprobante interno (1:1 con Receipt; se copia al emitirlo).
    numeroComprobante: { type: String, default: null, trim: true },
    estado: { type: String, enum: ['REGISTRADO', 'ANULADO'], default: 'REGISTRADO' },
    motivoAnulacion: { type: String, default: '', trim: true },
    anuladoEn: { type: Date, default: null },
    anuladoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notas: { type: String, default: '', trim: true },
    registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

paymentSchema.index({ cita: 1, estado: 1 });
paymentSchema.index({ caja: 1, estado: 1 });
paymentSchema.index({ paciente: 1, fecha: -1 });
paymentSchema.index({ fecha: -1 });
paymentSchema.index(
  { numeroComprobante: 1 },
  { unique: true, partialFilterExpression: { numeroComprobante: { $type: 'string' } } }
);

export const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'];
export const ESTADOS_PAGO = ['REGISTRADO', 'ANULADO'];

export default mongoose.model('Payment', paymentSchema);
