import mongoose from 'mongoose';

// Caja diaria: una sesión de caja. En B1 se mantiene la unicidad global de caja
// abierta; B2 la cambia a una caja abierta por usuario y liga cada pago a su caja.
// Al cerrar se guarda un snapshot de los totales por método y la diferencia de arqueo.
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
    totalEsperadoCentavos: { type: Number, default: 0 },
    totalRealCentavos: { type: Number, default: 0 },
    diferenciaCentavos: { type: Number, default: 0 },
    observacionesCierre: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

cashSessionSchema.index({ estado: 1 });
cashSessionSchema.index({ fechaApertura: -1 });

export const ESTADOS_CAJA = ['ABIERTA', 'CERRADA'];

export default mongoose.model('CashSession', cashSessionSchema);
