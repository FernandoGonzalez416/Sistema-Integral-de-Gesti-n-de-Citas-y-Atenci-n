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
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

professionalSchema.index({ nombre: 1, apellido: 1 });
professionalSchema.index({ especialidad: 1 });

export default mongoose.model('Professional', professionalSchema);