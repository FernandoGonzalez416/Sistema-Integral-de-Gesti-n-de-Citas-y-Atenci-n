import mongoose from 'mongoose';

// Pagos asociados a una cita. El monto se guarda en centavos (entero) para evitar
// errores de punto flotante. Los pagos no se borran: se anulan (histórico).
//
// En B2 se añade la referencia explícita a la caja (`caja`) y el usuario que
// anula (`anuladoPor`); en B1 solo se alinean estados y métodos al requisito.
const paymentSchema = new mongoose.Schema(
  {
    cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    montoCentavos: { type: Number, required: true, min: 1, validate: Number.isInteger },
    metodo: {
      type: String,
      required: true,
      enum: ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']
    },
    fecha: { type: Date, default: Date.now },
    estado: { type: String, enum: ['REGISTRADO', 'ANULADO'], default: 'REGISTRADO' },
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

export const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'];
export const ESTADOS_PAGO = ['REGISTRADO', 'ANULADO'];

export default mongoose.model('Payment', paymentSchema);
