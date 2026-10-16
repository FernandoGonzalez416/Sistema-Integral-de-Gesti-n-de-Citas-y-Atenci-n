import User from '../models/User.js';
import { env } from '../config/env.js';

// Crea el administrador inicial solo si no existe. No borra ni duplica.
export async function seedAdmin() {
  const existente = await User.findOne({ email: env.adminEmail.toLowerCase() });
  if (existente) {
    console.log('Admin ya existe, seed omitido');
    return existente;
  }
  const admin = new User({
    nombre: 'Administrador',
    email: env.adminEmail.toLowerCase(),
    password: env.adminPassword,
    rol: 'ADMINISTRADOR',
    activo: true
  });
  await admin.save(); // el hook pre-save genera el hash
  console.log(`Admin creado: ${admin.email}`);
  return admin;
}
