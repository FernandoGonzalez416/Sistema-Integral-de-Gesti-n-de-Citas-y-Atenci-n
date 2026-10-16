import mongoose from 'mongoose';

// Materiales educativos (documentos, videos, enlaces, etc.)
const materialSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true },
    tipo: { type: String, required: true, enum: ['DOCUMENTO', 'VIDEO', 'ENLACE', 'OTRO'] },
    url: { type: String, default: '', trim: true }, // URL del archivo o video
    archivoNombre: { type: String, default: '', trim: true }, // nombre original si se sube
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

materialSchema.index({ titulo: 1 });
materialSchema.index({ tipo: 1 });

export const TIPOS_MATERIAL = ['DOCUMENTO', 'VIDEO', 'ENLACE', 'OTRO'];

export default mongoose.model('EducationalMaterial', materialSchema);