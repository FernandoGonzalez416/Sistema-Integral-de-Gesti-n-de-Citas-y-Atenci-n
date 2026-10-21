import mongoose from 'mongoose';

// Responsables (tutores legales, padres, etc.).
const responsibleSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    // RF-04: correo y dirección son obligatorios para el responsable.
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    },
    direccion: { type: String, required: true, trim: true },
    fotoUrl: { type: String, default: '', trim: true },
    parentesco: { type: String, required: true, trim: true }, // ej. "Padre", "Madre", "Tutor"
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

responsibleSchema.index({ nombre: 1, apellido: 1 });
responsibleSchema.index({ telefono: 1 });

export default mongoose.model('Responsible', responsibleSchema);