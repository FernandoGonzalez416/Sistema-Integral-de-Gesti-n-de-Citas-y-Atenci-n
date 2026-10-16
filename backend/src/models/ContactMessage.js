import mongoose from 'mongoose';

// Mensajes del formulario de contacto del portal. Los lee el administrador.
const contactMessageSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, match: /.+@.+\..+/ },
    mensaje: { type: String, required: true, minlength: 10 },
    leido: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', contactMessageSchema);
