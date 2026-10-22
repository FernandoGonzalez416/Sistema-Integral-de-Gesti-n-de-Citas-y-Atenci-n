import mongoose from 'mongoose';

// Mensajes del formulario de contacto del portal. Los lee el administrador.
const contactMessageSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ },
    // RF-01 (Contacto): teléfono y asunto forman parte del formulario.
    telefono: { type: String, required: true, trim: true },
    asunto: { type: String, required: true, trim: true },
    mensaje: { type: String, required: true, minlength: 10 },
    leido: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', contactMessageSchema);
