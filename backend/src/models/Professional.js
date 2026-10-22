import mongoose from 'mongoose';

// Profesionales (médicos, odontólogos, psicólogos, etc.)
const professionalSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    especialidad: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    dni: { type: String, required: true, unique: true, trim: true },
    matricula: { type: String, required: true, unique: true, trim: true },
    // RF-02/PENDIENTES 3: vínculo con el usuario del sistema que inicia sesión.
    // Nulo solo en registros históricos (ver scripts/completarRelaciones.js).
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

professionalSchema.index({ nombre: 1, apellido: 1 });
professionalSchema.index({ especialidad: 1 });
// Un usuario del sistema no puede representar a dos profesionales.
professionalSchema.index(
  { usuario: 1 },
  { unique: true, partialFilterExpression: { usuario: { $type: 'objectId' } } }
);

export default mongoose.model('Professional', professionalSchema);