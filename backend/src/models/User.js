import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'];

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    rol: { type: String, required: true, enum: ROLES },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Convierte la contraseña a hash antes de guardar. No guarda texto plano.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.compararPassword = function (plana) {
  return bcrypt.compare(plana, this.password);
};

export const ROLES_USUARIO = ROLES;
export default mongoose.model('User', userSchema);
