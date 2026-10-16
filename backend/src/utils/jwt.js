import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Genera el token de sesión. Solo guarda id y rol, nada sensible.
export function firmarToken(usuario) {
  return jwt.sign({ id: usuario._id, rol: usuario.rol }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

export function verificarToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
