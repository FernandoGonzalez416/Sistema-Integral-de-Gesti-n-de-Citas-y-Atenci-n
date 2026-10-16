import mongoose from 'mongoose';

// Responsables (tutores legales, padres, etc.).
const responsibleSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    parentesco: { type: String, required: true, trim: true }, // ej. "Padre", "Madre", "Tutor"
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

responsibleSchema.index({ nombre: 1, apellido: 1 });
responsibleSchema.index({ telefono: 1 });

export default mongoose.model('Responsible', responsibleSchema);