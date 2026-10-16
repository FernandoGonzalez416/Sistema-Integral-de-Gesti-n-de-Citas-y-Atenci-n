import { verificarToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Exige JWT válido y usuario activo. Deja el usuario en req.usuario.
export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, message: 'Falta token' });

    const payload = verificarToken(token);
    const usuario = await User.findById(payload.id);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ ok: false, message: 'Usuario no autorizado' });
    }
    req.usuario = usuario;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: 'Token inválido' });
  }
}
