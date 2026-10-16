import mongoose from 'mongoose';

// Pacientes. Edad se calcula virtualmente desde fechaNacimiento.
const patientSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    fechaNacimiento: { type: Date, required: true },
    sexo: { type: String, required: true, enum: ['M', 'F', 'Otro'] },
    telefono: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    direccion: { type: String, default: '', trim: true },
    fotoUrl: { type: String, default: '', trim: true },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Virtual para calcular la edad en años.
patientSchema.virtual('edad').get(function () {
  if (!this.fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(this.fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
});

patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

// Índices para búsquedas frecuentes.
patientSchema.index({ nombre: 1, apellido: 1 });
patientSchema.index({ telefono: 1 });

export default mongoose.model('Patient', patientSchema);