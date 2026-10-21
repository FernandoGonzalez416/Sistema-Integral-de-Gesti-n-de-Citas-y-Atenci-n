import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// CLIENTE = usuario que se registra desde el portal (paciente). El resto son personal interno.
const ROLES = ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL', 'CLIENTE'];
export const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const SEXOS = ['FEMENINO', 'MASCULINO'];

// Datos del perfil. Los de salud solo los edita/usa el CLIENTE; el resto de roles usa únicamente "telefono".
const perfilSchema = new mongoose.Schema(
  {
    telefono: { type: String, default: '', trim: true, maxlength: 20 },
    fechaNacimiento: { type: Date, default: null },
    sexo: { type: String, enum: [...SEXOS, ''], default: '' },
    pesoKg: { type: Number, default: null, min: 1, max: 500 },
    estaturaCm: { type: Number, default: null, min: 30, max: 260 },
    tipoSangre: { type: String, enum: [...TIPOS_SANGRE, ''], default: '' },
    alergias: { type: [String], default: [] },
    condiciones: { type: [String], default: [] },
    contactoEmergencia: {
      nombre: { type: String, default: '', trim: true, maxlength: 80 },
      telefono: { type: String, default: '', trim: true, maxlength: 20 }
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    rol: { type: String, required: true, enum: ROLES },
    activo: { type: Boolean, default: true },
    // Foto de perfil como data URL (JPEG ya recortado y comprimido por el frontend, ~20-60 KB).
    // Si el sitio crece mucho conviene moverla a almacenamiento de archivos y guardar solo la URL.
    foto: { type: String, default: '', maxlength: 300000 },
    perfil: { type: perfilSchema, default: () => ({}) }
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