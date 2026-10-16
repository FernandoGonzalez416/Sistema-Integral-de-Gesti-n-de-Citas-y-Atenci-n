import User from '../models/User.js';
import { firmarToken } from '../utils/jwt.js';

export function publico(usuario) {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo
  };
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email y password requeridos' });
    }
    const usuario = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }
    const coincide = await usuario.compararPassword(password);
    if (!coincide) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }
    res.json({ ok: true, token: firmarToken(usuario), usuario: publico(usuario) });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res) {
  res.json({ ok: true, usuario: publico(req.usuario) });
}
