import mongoose from 'mongoose';

// Caja diaria (RF-11). Cada usuario autorizado tiene como máximo UNA caja
// ABIERTA (RN-22): se garantiza con un índice único parcial sobre `abiertaPor`.
// Los pagos se asocian explícitamente a la caja (Payment.caja) y los totales se
// calculan desde esos pagos, no desde una ventana de fechas.
// El efectivo esperado es monto inicial + ingresos en EFECTIVO (RN-23).
const cashSessionSchema = new mongoose.Schema(
  {
    estado: { type: String, enum: ['ABIERTA', 'CERRADA'], default: 'ABIERTA' },
    abiertaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fechaApertura: { type: Date, default: Date.now },
    montoInicialCentavos: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    observacionesApertura: { type: String, default: '', trim: true },

    cerradaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fechaCierre: { type: Date, default: null },
    totalesPorMetodo: {
      EFECTIVO: { type: Number, default: 0 },
      TARJETA: { type: Number, default: 0 },
      TRANSFERENCIA: { type: Number, default: 0 }
    },
    // Suma de pagos REGISTRADO de todos los métodos (RF-11: total de ingresos).
    totalIngresosCentavos: { type: Number, default: 0 },
    // Monto inicial + EFECTIVO (RF-11: efectivo esperado).
    totalEsperadoCentavos: { type: Number, default: 0 },
    // Efectivo contado al cierre.
    totalRealCentavos: { type: Number, default: 0 },
    diferenciaCentavos: { type: Number, default: 0 },
    observacionesCierre: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

cashSessionSchema.index({ estado: 1 });
cashSessionSchema.index({ fechaApertura: -1 });
// RN-22: una sola caja ABIERTA por usuario.
cashSessionSchema.index(
  { abiertaPor: 1 },
  { unique: true, partialFilterExpression: { estado: 'ABIERTA' } }
);

export const ESTADOS_CAJA = ['ABIERTA', 'CERRADA'];

export default mongoose.model('CashSession', cashSessionSchema);
