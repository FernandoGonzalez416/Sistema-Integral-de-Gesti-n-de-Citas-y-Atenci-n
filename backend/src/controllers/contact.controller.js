import ContactMessage from '../models/ContactMessage.js';
import mongoose from 'mongoose';

// POST /api/contacto — público. Guarda el mensaje del portal.
export async function crear(req, res, next) {
  try {
    const { nombre, email, mensaje } = req.body || {};
    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ ok: false, message: 'Nombre, email y mensaje requeridos' });
    }
    // Sin coerción: un tipo inválido (objeto, número…) no se convierte a "[object Object]".
    if (typeof nombre !== 'string' || typeof email !== 'string' || typeof mensaje !== 'string') {
      return res.status(400).json({ ok: false, message: 'Nombre, email y mensaje deben ser texto' });
    }
    if (!/.+@.+\..+/.test(email)) {
      return res.status(400).json({ ok: false, message: 'Email inválido' });
    }
    if (mensaje.trim().length < 10) {
      return res.status(400).json({ ok: false, message: 'Mensaje mínimo de 10 caracteres' });
    }
    const msg = new ContactMessage({ nombre: nombre.trim(), email, mensaje });
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
