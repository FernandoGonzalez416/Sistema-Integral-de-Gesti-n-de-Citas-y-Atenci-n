import User, { ROLES_USUARIO } from '../models/User.js';
import { publico } from './auth.controller.js';
import mongoose from 'mongoose';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

// GET /api/users — lista todos (sin passwords). Solo ADMINISTRADOR.
export async function listar(req, res, next) {
  try {
    const usuarios = await User.find().sort({ createdAt: -1 });
    res.json({ ok: true, usuarios: usuarios.map(publico) });
  } catch (e) {
    next(e);
  }
}

// POST /api/users — registra un usuario. Solo ADMINISTRADOR.
// El hook pre-save del modelo genera el hash; la respuesta nunca incluye password.
export async function crear(req, res, next) {
  try {
    const { nombre, email, password, rol } = req.body || {};
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ ok: false, message: 'Nombre, email, password y rol requeridos' });
    }
    if (typeof nombre !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ ok: false, message: 'Nombre, email y password deben ser texto' });
    }
    if (!ROLES_USUARIO.includes(rol)) {
      return res.status(400).json({ ok: false, message: `Rol inválido. Válidos: ${ROLES_USUARIO.join(', ')}` });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: 'Password mínimo de 6 caracteres' });
    }
    const usuario = new User({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password,
      rol
    });
    await usuario.save();
    res.status(201).json({ ok: true, usuario: publico(usuario) });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'Email ya registrado' });
    }
    next(e);
  }
}

// GET /api/users/:id — consulta uno (sin password). Solo ADMINISTRADOR.
export async function obtener(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }
    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }
    res.json({ ok: true, usuario: publico(usuario) });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/users/:id — actualiza nombre, rol o activo. Solo ADMINISTRADOR.
// No permite cambiar password por aquí ni desactivarse a sí mismo.
export async function actualizar(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }
    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }
    const { nombre, rol, activo } = req.body || {};
    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ ok: false, message: 'nombre debe ser texto no vacío' });
      }
      usuario.nombre = nombre.trim();
    }
    if (rol !== undefined) {
      if (!ROLES_USUARIO.includes(rol)) {
        return res.status(400).json({ ok: false, message: `Rol inválido. Válidos: ${ROLES_USUARIO.join(', ')}` });
      }
      usuario.rol = rol;
    }
    if (activo !== undefined) {
      if (String(usuario._id) === String(req.usuario._id) && activo === false) {
        return res.status(400).json({ ok: false, message: 'No puedes desactivar tu propia cuenta' });
      }
      usuario.activo = !!activo;
    }
    await usuario.save();
    res.json({ ok: true, usuario: publico(usuario) });
  } catch (e) {
    next(e);
  }
}
