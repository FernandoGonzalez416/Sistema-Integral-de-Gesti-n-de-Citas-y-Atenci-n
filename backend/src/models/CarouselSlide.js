import mongoose from 'mongoose';

// Diapositivas del carrusel del portal. Solo las activas se publican y se
// ordenan por `orden`. La imagen se referencia por URL (no se suben archivos).
const carouselSlideSchema = new mongoose.Schema(
  {
    imagenUrl: { type: String, required: true, trim: true, maxlength: 1000 },
    titulo: { type: String, required: true, trim: true, maxlength: 120 },
    orden: { type: Number, default: 0, min: 0, max: 9999, validate: Number.isInteger },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('CarouselSlide', carouselSlideSchema);
