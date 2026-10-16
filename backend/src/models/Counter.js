import mongoose from 'mongoose';

// Contadores atómicos de secuencias (p. ej. numeración de comprobantes).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

export default mongoose.model('Counter', counterSchema);
