import mongoose from 'mongoose';

// Cubre contenido educativo y corporativo (capacitaciones, escuela para padres, etc.)
// según el campo tipo. Imagen y enlace son opcionales.
const publicationSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true },
    tipo: { type: String, required: true, enum: ['EDUCATIVO', 'CORPORATIVO'] },
    fecha: { type: Date, default: Date.now },
    imagenUrl: { type: String, default: '', trim: true },
    enlace: { type: String, default: '', trim: true },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const TIPOS_PUBLICACION = ['EDUCATIVO', 'CORPORATIVO'];

export default mongoose.model('Publication', publicationSchema);
