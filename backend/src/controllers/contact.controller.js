import ContactMessage from '../models/ContactMessage.js';
import mongoose from 'mongoose';

// POST /api/contacto — público. Guarda el mensaje del portal.
export async function crear(req, res, next) {
  try {
    const { nombre, email, telefono, asunto, mensaje } = req.body || {};
    if (!nombre || !email || !telefono || !asunto || !mensaje) {
      return res.status(400).json({ ok: false, message: 'Nombre, email, teléfono, asunto y mensaje requeridos' });
    }
    // Sin coerción: un tipo inválido (objeto, número…) no se convierte a "[object Object]".
    if (typeof nombre !== 'string' || typeof email !== 'string' || typeof telefono !== 'string'
      || typeof asunto !== 'string' || typeof mensaje !== 'string') {
      return res.status(400).json({ ok: false, message: 'Los campos del formulario deben ser texto' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return res.status(400).json({ ok: false, message: 'Email inválido' });
    }
    const digitos = telefono.replace(/\D/g, '');
    if (!/^[\d\s+()-]+$/.test(telefono.trim()) || digitos.length < 7 || digitos.length > 15) {
      return res.status(400).json({ ok: false, message: 'Teléfono inválido' });
    }
    if (asunto.trim().length < 3 || asunto.trim().length > 120) {
      return res.status(400).json({ ok: false, message: 'El asunto debe tener entre 3 y 120 caracteres' });
    }
    if (mensaje.trim().length < 10) {
      return res.status(400).json({ ok: false, message: 'Mensaje mínimo de 10 caracteres' });
    }
    if (mensaje.length > 2000) {
      return res.status(400).json({ ok: false, message: 'Mensaje máximo de 2000 caracteres' });
    }
    const msg = new ContactMessage({
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      asunto: asunto.trim(),
      mensaje: mensaje.trim()
    });
    await msg.save();
    res.status(201).json({ ok: true, mensaje: 'Mensaje recibido. Te contactaremos pronto.' });
  } catch (e) {
    next(e);
  }
}

// GET /api/contacto — solo ADMINISTRADOR. Incluye leídos y no leídos.
export async function listar(req, res, next) {
  try {
    const mensajes = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ ok: true, mensajes });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/contacto/:id — marcar leído/no leído. Solo ADMINISTRADOR.
export async function marcar(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Mensaje no encontrado' });
    }
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ ok: false, message: 'Mensaje no encontrado' });
    }
    if (req.body?.leido !== undefined) msg.leido = !!req.body.leido;
    await msg.save();
    res.json({ ok: true, mensaje: msg });
  } catch (e) {
    next(e);
  }
}
