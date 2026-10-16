import mongoose from 'mongoose';

// Contenido institucional de texto libre (misión, visión, info del centro, etc.).
// La clave identifica cada bloque (ej. "mision") y es la que usa el portal para mostrarlo.
// Horarios, publicaciones y mensajes usan modelos propios por necesitar estructura.
const contenidoSchema = new mongoose.Schema(
  {
    clave: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/
    },
    titulo: { type: String, required: true, trim: true },
    cuerpo: { type: String, required: true },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('InstitutionalContent', contenidoSchema);
